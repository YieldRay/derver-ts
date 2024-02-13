import { build } from 'esbuild'
import process from 'node:process'
import pkg from './package.json' assert { type: 'json' }

const DEV = process.argv.includes('--dev')

// ES-module
await build({
    entryPoints: ['./src/index.ts'],
    platform: 'node',
    format: 'esm',
    outfile: pkg.module,
    minify: !DEV,
    bundle: true,
})

// Node-module
await build({
    entryPoints: ['./src/index.ts'],
    platform: 'node',
    format: 'cjs',
    outfile: pkg.main,
    minify: !DEV,
    bundle: true,
})

// Bin
await build({
    entryPoints: ['./src/bin.ts'],
    platform: 'node',
    format: 'cjs',
    outfile: pkg.bin.derver,
    minify: !DEV,
    bundle: true,
    external: [pkg.main],
})

// Rollup plugin
await build({
    entryPoints: ['./src/plugins/rollup.ts'],
    platform: 'node',
    format: 'cjs',
    outfile: pkg.exports['./rollup-plugin'],
    minify: !DEV,
    bundle: true,
    external: ['.'],
})
