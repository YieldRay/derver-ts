import { Options } from '../lib/types'
import { derver as server } from './../index'

export function derver(options: Options) {
    let first = true
    return {
        name: 'rollup-plugin-derver',
        generateBundle() {
            if (!first) return
            first = !first
            server(options)
        },
    }
}
