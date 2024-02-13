const color = (str: string, begin: number, end: number) =>
    `\u001b[${begin}m${str}\u001b[${end}m`

export default {
    blue: (str: string) => color(str, 34, 39),
    red: (str: string) => color(str, 31, 39),
    green: (str: string) => color(str, 32, 39),
    yellow: (str: string) => color(str, 33, 39),
    magenta: (str: string) => color(str, 35, 39),
    cyan: (str: string) => color(str, 36, 39),
    gray: (str: string) => color(str, 90, 39),

    bold: (str: string) => color(str, 1, 22),
    italic: (str: string) => color(str, 3, 23),
} as const
