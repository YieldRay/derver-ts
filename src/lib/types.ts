import http from 'node:http'

export interface MiddlewareReq extends http.IncomingMessage {
    file: string
    extname: string
    exists: boolean
    URL: URL
    query: Record<string, string>
    params: Record<string, string>
}

export interface MiddlewareRes extends http.ServerResponse {
    body: any
    send: (message: string | object) => void
}

export interface Middleware {
    (req: MiddlewareReq, res: MiddlewareRes, next: VoidFunction): void
}

export interface Middlewares {
    list: () => Middleware[]
    sub: VoidFunction
    [METHOD: string]: () => void
}

export interface Options {
    /**
     * Directory which contains files for serving.
     *
     * If nothing set in watch option, it will be watching for changes also.
     *
     * When it is `false` - no files would be serving, only middlewares will work.
     *
     * @default "public"
     */
    dir?: string | boolean
    /**
     * Interface, where bind the server.
     *
     * Use 0.0.0.0 inside docker or when need network connections to your site.
     *
     * @default "localhost"
     */
    host?: string
    /**
     * Port, where bind the server.
     *
     * @default 7000
     */
    port?: number
    /**
     * Name of the root file of web directory.
     *
     * Webserver will lookup this file when no file specified in the requested URL.
     *
     * @default "index.html"
     */
    index?: string
    /**
     * Will return files compressed by gzip or brotli, if client supports it.
     *
     * @default false
     */
    compress?: boolean
    /**
     * Add Cache-control header to the response with max-age equal 31536000 (~1 year). You can specify number of seconds.
     *
     * @default false
     */
    cache?: boolean | number
    /**
     * Enables SPA (Single-Page Application) mode.
     *
     * All requested pages will be respond with index page in the application root, which is specified in `index` option.
     */
    spa?: boolean
    /**
     * Specify the directories for watching file changes.
     *
     * Each time when files modified in these directories, website will be reloaded and onWatch callback will be run.
     *
     * By default will be watched directory defined in dir option.
     */
    watch?: string | string[] | false
    /**
     * Enables remote control listener. See [Remote control](TODO)
     */
    remote?: boolean | string
    /**
     * Restore scroll position on every reload.
     *
     * Number value is equal timeout before scroll restoration.
     *
     * @default false
     */
    preserveScroll?: boolean | number
    /**
     * Show or not the banner in console when server starts.
     *
     * @default true
     */
    banner?: boolean
    /**
     * Whether show the requested file in console
     *
     * @default true
     */
    log?: boolean
    /**
     * This function will be called when any file changes in watched directories.
     *
     * @param watchItem It is a string with directory name where were fired file change event.
     * It is same string as you specified in `watch` option (or in `dir` option, when `watch` is not set).
     */
    onWatch?: (
        liveReload: {
            /**
             * Will stop scheduled live-reload action for this watch event.
             */
            prevent: VoidFunction
            /**
             * Run each time you want to reload page in the browser.
             */
            reload: VoidFunction
            /**
             * Send message to the browser console.
             */
            consoleLog(message: string): void
            /**
             * Show error modal on client.
             */
            error(message: string, header?: string): void
        },
        watchItem: string,
        name: string,
        ev: 'update' | 'remove',
    ) => Promise<void>
}

type _OptionsParsed = {
    dir: string
    watch: string[] | false
    middlewares: Middlewares
}

export type OptionsParsed = Required<
    Omit<Options, keyof _OptionsParsed> & _OptionsParsed
>
