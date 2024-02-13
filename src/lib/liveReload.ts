import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { Options, Middleware, OptionsParsed } from './types'
import { lrClient } from './liveReloadClient'

const LR_URL = '/derver-livereload-events'
const LR_REMOTE_URL = '/derver-livereload-remote'

const listeners = new Set<Record<string, { (p1?: any, p2?: any): void }>>()

export function liveReload(event: string, p1?: any, p2?: any) {
    listeners.forEach((listener) => {
        if (typeof listener[event] == 'function') listener[event](p1, p2)
    })
}

export function createRemote(options: Options) {
    const remoteID = typeof options == 'string' ? options : false

    let host = 'localhost'
    let port = 7000

    if (!remoteID) {
        options && options.host && (host = options.host)
        options && options.port && (port = options.port)
    }

    function sendCommand(command: string, data?: any) {
        return new Promise((resolve) => {
            let hostname: string
            const config = remoteID ? getRemoteConfig(remoteID) : undefined
            config && config.host && (hostname = config.host)
            config && config.port && (port = config.port)

            const req = http.request(
                {
                    hostname: (config && config.host) || host,
                    port: (config && config.port) || port,
                    path: LR_REMOTE_URL,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
                (res) => {
                    res.on('data', (chunk) => {
                        if (chunk.toString() === 'REMOTE OK') {
                            resolve('OK')
                        } else {
                            console.log(
                                '[Derver remote]: Warning: wrong command ' +
                                    command,
                            )
                            resolve('WARNING')
                        }
                    })
                },
            )
            req.on('error', (e) => {
                console.log('[Derver remote]: Warning:' + e.message)
                resolve('WARNING')
            })
            req.write(JSON.stringify({ command, data: data || {} }))
            req.end()
        })
    }

    return {
        reload() {
            return sendCommand('reload')
        },
        console(text: string) {
            return sendCommand('console', { text })
        },
        error(text: string, header?: string) {
            return sendCommand('error', { text, header })
        },
    }
}

export function mwLiveReload(options: OptionsParsed) {
    if (!options.watch && !options.remote) return null

    const mw: Middleware = (req, res, next) => {
        if (req.url == LR_URL) {
            const write = (ev: string, data?: any) =>
                res.write(
                    `event: ${ev}\ndata: ${JSON.stringify(data || {})}\n\n`,
                )

            const listener = {
                reload: () => write('refresh'),
                console: (text: string) => write('console', { text }),
                error: (text: string, header: string) =>
                    write('srverror', { text, header: header || 'Error' }),
            }

            listeners.add(listener)

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            })

            res.on('close', function () {
                listeners.delete(listener)
            })

            res.write('data: connected\n\n')
        } else if (options.remote && req.url == LR_REMOTE_URL) {
            if (req.method == 'POST') {
                let json = ''

                req.on('data', (chunk) => {
                    json += chunk.toString()
                })

                req.on('end', () => {
                    const request = JSON.parse(json || '{}')

                    if (request.command == 'reload') liveReload('reload')
                    else if (request.command == 'console')
                        liveReload('console', request.data.text)
                    else if (request.command == 'error')
                        liveReload(
                            'error',
                            request.data.text,
                            request.data.header,
                        )
                    else return res.end('REMOTE WRONG COMMAND')

                    res.end('REMOTE OK')
                })
            } else next()
        } else next()
    }
    return mw
}

export function mwInjectLiveReload(options: Options) {
    if (!options.watch && !options.remote) return null
    const mw: Middleware = (req, res, next) => {
        if (['.html', '.htm'].includes(req.extname)) {
            res.body = Buffer.from(
                res.body
                    .toString('utf-8')
                    .replace(
                        /(<\/body>)/,
                        `<script>(${lrClient(options)})('${LR_URL}',${
                            options.preserveScroll === true
                                ? 10
                                : Number(options.preserveScroll)
                        })</script>\n$1`,
                    ),
            )
        }

        next()
    }

    return mw
}

function getRemoteConfig(name: string) {
    const tmp = os.tmpdir()
    const file = path.join(tmp, 'derver_' + name)
    if (!fs.existsSync(file)) return false
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
}
