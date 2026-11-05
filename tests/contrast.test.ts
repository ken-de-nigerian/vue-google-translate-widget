// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Reads the real token defaults and checks every text/background pair the components use against WCAG AA:
// 4.5:1 for text, 3:1 for icons and other non-text graphics.
const css = readFileSync('src/styles/tokens.css', 'utf8')

const block = (selector: string) => {
  const start = css.indexOf(selector)
  return css.slice(start, css.indexOf('}', start))
}
const tokens = (text: string) =>
  Object.fromEntries(
    [...text.matchAll(/--_gtw-([\w-]+): var\(--gtw-[\w-]+, ([^)]+(?:\)[^;]*)?)\);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  )

const light = tokens(block('.google-translate-widget,'))
const dark = { ...light, ...tokens(block('.gtw-theme-dark,')) }
const autoDark = { ...light, ...tokens(block('html:not(.light) .gtw-theme-auto')) }

const rgb = (color: string): [number, number, number, number] => {
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)).concat(1) as never
  const rgba = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)!
  return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])]
}
const over = (top: string, base: string): [number, number, number] => {
  const [r, g, b, a] = rgb(top)
  const [br, bg, bb] = rgb(base)
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)]
}
const luminance = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contrast = (fg: string, bg: string, base: string) => {
  const [a, b] = [luminance(over(fg, base)), luminance(over(bg, base))].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

// [foreground, background, minimum]
const pairs: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text', 'surface-strong', 4.5], // language-code badges
  ['primary-text', 'active-bg', 4.5], // the current language
  ['error-text', 'error-bg', 4.5],
  ['on-primary', 'primary', 4.5], // "Translate" in the browser-language prompt
  ['on-primary', 'primary-hover', 3], // floating button icon on hover
]

describe.each([
  ['light', light],
  ['dark', dark],
  ['auto (dark OS)', autoDark],
])('default %s theme contrast', (_name, theme) => {
  it.each(pairs)('%s on %s ≥ %d:1', (fg, bg, minimum) => {
    expect(contrast(theme[fg], theme[bg], theme.bg)).toBeGreaterThanOrEqual(minimum)
  })
})
