import { createMiddlewaresList, startHTTPServer } from './lib/http'
import type { Options, OptionsParsed } from './lib/types'
import { startWatchers } from './lib/watch'
import process from 'node:process'

export { createRemote } from './lib/liveReload'

const defaultOptions: Options = {
    port: 7000,
    host: 'localhost',
    index: 'index.html',
    dir: 'public',
    compress: false,
    cache: false,
    spa: false,
    watch: undefined,
    onWatch: undefined,
    remote: false,
    preserveScroll: false,
    banner: true,
    log: true,
}

export function derver(options: Options) {
    const opt = Object.assign(defaultOptions, options, {
        middlewares: createMiddlewaresList(),
    }) as OptionsParsed

    ;(async () => {
        if (opt.dir && opt.watch !== false) opt.watch = [opt.dir]

        try {
            await startHTTPServer(opt)
        } catch (err) {
            console.log((err as Error).message)
            process.exit(1)
        }

        startWatchers(opt)
    })()

    return opt.middlewares
}
