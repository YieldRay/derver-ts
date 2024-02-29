import type {
    Middleware,
    MiddlewareReq,
    MiddlewareRes,
    Middlewares,
    Options,
    OptionsParsed,
} from './types'
import { mwInjectLiveReload, mwLiveReload } from './liveReload'
import { version } from '../../package.json'
import type { PathLike } from 'node:fs'
import process from 'node:process'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import zlib from 'node:zlib'
import table from './table'
import mime from './mime'
import c from './colors'
import os from 'node:os'

export function startHTTPServer(options: OptionsParsed) {
    const production =
        options.watch === false && options.cache && options.compress

    return new Promise(async (resolve, reject) => {
        const clearSID = await saveSID(options)

        const server = http.createServer((req, res) => {
            const middlewares: (Middleware | null)[] = [
                mwURLParse(options),
                mwSend(options),
                mwServer(options),
            ]

            middlewares.push(...options.middlewares.list())

            if (options.dir) {
                middlewares.push(
                    mwLiveReload(options),
                    mwFile(options),
                    mwStatic(options),
                    mwInjectLiveReload(options),
                )
            }

            middlewares.push(mwEncode(options), mwCache(options))

            runMiddlewares(
                middlewares,
                req as MiddlewareReq,
                res as MiddlewareRes,
            )
        })

        server.on('listening', () => {
            resolve(server)
            if (options.banner) {
                table()
                    .line(
                        production
                            ? 'Derver server started'
                            : 'Development server started',
                        'bold',
                    )
                    .line('on')
                    .line(`http://${options.host}:${options.port}`, 'cyan')
                    .print(5, 'blue')
            }
        })

        server.on('error', (e) => {
            const errString = e.toString()
            console.log(c.bold('\n\nServer starting error:'))
            console.log(`  ${c.red(errString)}\n\n`)
            reject(errString)
        })

        server.listen(options.port, options.host)

        const onclose = async () => {
            await clearSID()
            server.close()
        }

        process.on('SIGTERM', onclose)
        process.on('exit', onclose)
    })
}

export function createMiddlewaresList() {
    const middlewares: Middleware[] = []

    function addMiddleware(obj: {
        method: any
        pattern: string
        exact: boolean
        middlewares: Middleware[]
    }) {
        for (let mw of obj.middlewares) {
            middlewares.push((req, res, next) => {
                if (obj.method && obj.method !== req.method) return next()

                if (obj.pattern && obj.pattern !== '') {
                    const match = getRouteMatch(obj.pattern, req.URL.pathname)
                    if (!match || (obj.exact && !match.exact)) return next()
                    req.params = match.params
                }
                mw(req, res, next)
            })
        }
    }

    function parseArguments(iArgs: IArguments, key: string, pattern = '') {
        const args = Array.from(iArgs)
        let subPattern =
            args.length > 0 && typeof args[0] == 'string' ? args.shift() : null
        if (subPattern && !subPattern.startsWith('/'))
            subPattern = '/' + subPattern
        return {
            method: key == 'use' ? null : key.toUpperCase(),
            pattern: pattern + (subPattern || ''),
            exact: !(pattern && !subPattern),
            middlewares: args.filter((fn) => typeof fn == 'function'),
        }
    }

    function getMethods(pattern = '') {
        const methods = new Proxy<Middlewares>({} as Middlewares, {
            get(_, key: string) {
                if (key == 'list') return () => middlewares
                if (key == 'sub')
                    return () => {
                        let args = Array.from(arguments)
                        let parentPattern = pattern + args.shift()
                        args.forEach((fn) => fn(getMethods(parentPattern)))
                    }
                return (() => {
                    addMiddleware(parseArguments(arguments, key, pattern))
                    return methods
                }) as any
            },
        })
        return methods
    }

    return getMethods()
}

function runMiddlewares(
    mwArray: (Middleware | null)[],
    req: MiddlewareReq,
    res: MiddlewareRes,
) {
    mwArray.push((_, res) => res.end(res.body || ''))

    const next = () => {
        let mw
        while (!mw && mwArray.length > 0) {
            mw = mwArray.shift()
        }
        mw && mw(req, res, next)
    }

    next()
}

function mwURLParse(options: Options) {
    const mw: Middleware = (req, res, next) => {
        const url = new URL(
            req.url || '/',
            'http://' + (req.headers.host || 'derver.tld'),
        )
        req.URL = url
        req.query = Array.from(url.searchParams).reduce(
            (obj, [name, value]) => ((obj[name] = value), obj),
            {} as Record<string, string>,
        )
        next()
    }
    return mw
}

function mwFile(options: OptionsParsed) {
    const mw: Middleware = async (req, res, next) => {
        req.file = path.join(options.dir, req.URL.pathname)
        req.extname = path.extname(req.file)

        if (req.extname === '') {
            req.file = path.join(req.file, options.index)
            req.extname = path.extname(req.file)
        }

        req.exists = await isExists(req.file)

        if (
            options.spa &&
            !req.exists &&
            req.extname === path.extname(options.index)
        ) {
            console.log()
            let dir = path.dirname(req.file)
            do {
                dir = path.dirname(dir)
                req.file = path.join(dir, options.index)
                if ((req.exists = await isExists(req.file))) break
            } while (dir !== '.')
        }

        next()
    }

    return mw
}

function mwSend(options: OptionsParsed) {
    const mw: Middleware = (req, res, next) => {
        res.send = (message) => {
            let mime = 'text/plain'
            if (typeof message == 'object') {
                message = JSON.stringify(message)
                mime = 'application/json'
            }
            res.writeHead(200, { 'Content-Type': mime })
            res.end(message)
        }
        next()
    }
    return mw
}

function mwServer(options: OptionsParsed) {
    const mw: Middleware = (req, res, next) => {
        res.setHeader('Server', 'Derver/' + version)
        next()
    }

    return mw
}

function mwStatic(options: OptionsParsed) {
    const mw: Middleware = async (req, res, next) => {
        if (!req.exists) {
            options.log &&
                console.log(
                    c.gray('  [web] ') +
                        req.url +
                        ' - ' +
                        c.red('404 Not Found'),
                )
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            return res.end('Not found')
        }

        if (mime[req.extname]) res.setHeader('Content-Type', mime[req.extname])

        res.body = await fs.readFile(req.file)
        options.log &&
            console.log(
                c.gray('  [web] ') + req.url + ' - ' + c.green('200 OK'),
            )
        next()
    }

    return mw
}

function mwEncode(options: OptionsParsed) {
    if (!options.compress) return null

    const mw: Middleware = (req, res, next) => {
        if (req.headers['accept-encoding']) {
            if (req.headers['accept-encoding'].includes('br')) {
                res.setHeader('Content-Encoding', 'br')
                res.body = zlib.brotliCompressSync(res.body)
            } else if (req.headers['accept-encoding'].includes('gzip')) {
                res.setHeader('Content-Encoding', 'gzip')
                res.body = zlib.gzipSync(res.body)
            }
        }
        next()
    }

    return mw
}

function mwCache(options: OptionsParsed) {
    if (!options.cache) return null

    const mw: Middleware = (req, res, next) => {
        if (typeof options.cache !== 'number') options.cache = 31536000
        res.setHeader('Cache-Control', 'max-age=' + options.cache)
        next()
    }

    return mw
}

export function getRouteMatch(pattern: string, path: string) {
    pattern = pattern.endsWith('/') ? pattern : pattern + '/'
    path = path.endsWith('/') ? path : path + '/'
    const keys: string[] = []
    const params: Record<string, string> = {}
    const rx = pattern
        .split('/')
        .map((s) =>
            s.startsWith(':') ? (keys.push(s.slice(1)), '([^\\/]+)') : s,
        )
        .join('\\/')
    let exact = true

    let match = path.match(new RegExp(`^${rx}$`))
    if (!match) {
        exact = false
        match = path.match(new RegExp(`^${rx}`))
        return null
    }

    keys.forEach((key, i) => (params[key] = match![i + 1]))

    return {
        exact,
        params,
        part: match[0].slice(0, -1),
    }
}

async function saveSID(options: OptionsParsed) {
    const tmp = os.tmpdir()
    if (typeof options.remote !== 'string') return () => {}
    const file = path.join(tmp, 'derver_' + options.remote)
    await fs.writeFile(
        file,
        JSON.stringify({ host: options.host, port: options.port }),
    )
    return () => fs.unlink(file)
}

async function isExists(file: PathLike) {
    try {
        await fs.stat(file)
        return true
    } catch {
        return false
    }
}
