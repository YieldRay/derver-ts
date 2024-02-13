import c from './colors'

type Color = keyof typeof c

export default function table() {
    let width = 2
    let lines: [text: string, len: number][] = []

    const t = {
        line: (text = '', color1?: Color, color2?: Color) => {
            const len = text.length
            if (len + 2 > width) width = len + 2

            if (color1) text = c[color1](text)
            if (color2) text = c[color2](text)

            lines.push([text, len])
            return t
        },
        print: (ident = 0, color: Color) => {
            const margin = ' '.repeat(ident)
            const Px = 2
            const padding = ' '.repeat(Px)

            let top = `${margin}╭${'─'.repeat(width + 2 * Px)}╮`
            let left = `${margin}│${padding}`
            let right = `${padding}│`
            let bottom = `${margin}╰${'─'.repeat(width + 2 * Px)}╯`

            if (color) {
                top = c[color](top)
                bottom = c[color](bottom)
                left = c[color](left)
                right = c[color](right)
            }

            console.log(top)

            for (let [text, len] of lines) {
                const l = Math.floor((width - len) / 2)
                const r = width - len - l
                console.log(
                    `${left}${' '.repeat(l)}${text}${' '.repeat(r)}${right}`,
                )
            }

            console.log(bottom)
            return t
        },
    }

    return t
}
