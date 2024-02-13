import PARAMS from './params.json'

export function retrieveParams() {
    const result = {
        dir: '.',
        params: {} as Record<string, any>,
    }

    let cli = process.argv.slice(2)

    if (cli.length == 0) return result
    if (!cli[cli.length - 1].startsWith('-')) result.dir = cli.pop()!

    for (let part of cli) {
        const pair = part.split('=')

        const name = pair[0].replace(/^\-{1,2}/, '')
        const value = pair[1] || true
        const exists = name in result.params

        const param = PARAMS.params.find((e) => e.name == name)
        if (!param) continue

        if (param.multiple) {
            if (!exists) result.params[name] = []
            result.params[name].push(value)
        } else {
            if (exists) continue
            result.params[name] = value
        }
    }

    return result
}

export function getUsageText() {
    return `${PARAMS.description}

Usage:
    ${PARAMS.name} ${PARAMS.usage}

Parameters:
${PARAMS.params.map((p) => `  ${p.name.padEnd(15)} ${p.help}`).join('\n')}

Examples:
${PARAMS.examples.map((ex) => `  ${PARAMS.name} ${ex}`).join('\n')}
`
}
