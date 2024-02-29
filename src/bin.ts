#!/usr/bin/env node
import { getUsageText, retrieveParams } from './lib/bin'
import { Options } from './lib/types'
import process from 'node:process'
import { derver } from './index'

const input = retrieveParams()

if (!input || input.params.help) {
    console.log(getUsageText())
    process.exit(0)
}

const options: Options = {}

if (input.dir) options.dir = input.dir
if (input.params.index) options.index = input.params.index
if (input.params.watch) options.index = input.params.watch
if (input.params['no-watch']) options.watch = false
if (input.params.spa) options.spa = true
if (input.params.compress) options.compress = true
if (input.params.cache)
    options.cache =
        input.params.cache === true ? true : Number(input.params.cache)
if (input.params.scroll)
    options.preserveScroll =
        input.params.scroll === true ? 10 : Number(input.params.scroll)
if (input.params.production) {
    options.compress = true
    options.cache = true
    options.watch = false
    options.host = '0.0.0.0'
}
if (input.params.host) options.host = input.params.host
if (input.params.port) options.port = Number(input.params.port)

derver(options)
