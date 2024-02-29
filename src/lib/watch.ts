import watch, { type Watcher } from 'node-watch'
import type { OptionsParsed } from './types'
import { liveReload } from './liveReload'
import process from 'node:process'
import c from './colors'

export function startWatchers(options: OptionsParsed) {
    if (typeof options.watch === 'string') options.watch = [options.watch]

    if (options.watch) {
        console.log(c.yellow('       Waiting for changes...\n\n'))

        const watchers: Watcher[] = []

        process.on('SIGTERM', () => watchers.forEach((w) => w.close()))
        process.on('exit', () => watchers.forEach((w) => w.close()))

        const coolDown = new Set<string>()

        const debounce = (key: string, fn: CallableFunction) => {
            if (coolDown.has(key)) return
            coolDown.add(key)
            setTimeout(() => coolDown.delete(key), 100)
            fn()
        }

        for (let watchItem of options.watch) {
            watchers.push(
                watch(
                    watchItem,
                    { recursive: true },
                    async function (evt, name) {
                        debounce(watchItem, () =>
                            console.log(
                                `${c.gray('[watch]')} Changes in ${c.blue(
                                    watchItem,
                                )}`,
                            ),
                        )

                        let lrFlag = true
                        if (typeof options.onWatch === 'function') {
                            await options.onWatch(
                                {
                                    prevent: () => (lrFlag = false),
                                    reload: () => liveReload('reload'),
                                    consoleLog: (str) =>
                                        liveReload('console', str),
                                    error: (str, header) =>
                                        liveReload('error', str, header),
                                },
                                watchItem,
                                name,
                                evt,
                            )
                        }
                        if (lrFlag) liveReload('reload')
                    },
                ),
            )
        }
    }
}
