// Packs the package exactly as npm would publish it, installs the tarball into an empty project, and uses
// every entry point the way an app would. The unit tests import src/; this checks what users actually get.
// Run `npm run build` first.
import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve('.')
const work = mkdtempSync(join(tmpdir(), 'gtw-smoke-'))
const run = (command, cwd = work) => {
  try {
    return execSync(command, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()
  } catch (error) {
    // Show what the command printed (tsc writes its errors to stdout).
    process.stderr.write(error.stdout?.toString() ?? '')
    throw error
  }
}

try {
  const tarball = run(`npm pack --pack-destination ${work} --silent`, root).trim().split('\n').pop()
  writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'smoke', private: true, type: 'module' }))
  run(`npm install --no-audit --no-fund ${join(work, tarball)} vue@3 happy-dom@${process.env.HAPPY_DOM ?? '21'}`)

  writeFileSync(
    join(work, 'esm.mjs'),
    `
import { Window } from 'happy-dom'
const window = new Window({ url: 'https://lagoseats.example/' })
for (const key of ['window', 'document', 'navigator', 'location', 'history', 'MutationObserver', 'Node', 'NodeFilter',
  'HTMLElement', 'HTMLSelectElement', 'HTMLIFrameElement', 'Element', 'Event', 'KeyboardEvent', 'MouseEvent',
  'SVGElement', 'getComputedStyle', 'requestAnimationFrame', 'localStorage']) {
  // Node 21+ has its own read-only navigator, so define rather than assign.
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true })
}
const assert = (await import('node:assert/strict')).default
const { createApp, h, nextTick } = await import('vue')
const pkg = await import('@ken_de_nigerian/vue-google-translate-widget')
const testing = await import('@ken_de_nigerian/vue-google-translate-widget/testing')
const server = await import('@ken_de_nigerian/vue-google-translate-widget/server')
await import('@ken_de_nigerian/vue-google-translate-widget/package.json', { with: { type: 'json' } })

for (const name of ['GoogleTranslateWidget', 'GoogleTranslateButton', 'useGoogleTranslate', 'createGoogleTranslate',
  'vNoTranslate', 'endpointProvider', 'libreTranslate', 'DEFAULT_LANGUAGES', 'toGoogleCode']) {
  assert.ok(pkg[name], 'main entry exports ' + name)
}
assert.equal(typeof server.createTranslateHandler, 'function', '/server exports createTranslateHandler')

// Mount the real component from the tarball against the shipped fake.
testing.installFakeGoogleTranslate()
const el = document.createElement('div')
document.body.appendChild(el)
let api
const app = createApp({ setup() { api = pkg.useGoogleTranslate(); return () => h(pkg.GoogleTranslateButton) } })
app.use(pkg.createGoogleTranslate({ includedLanguages: ['en', 'fr', 'yo'] }))
app.mount(el)
await new Promise(r => setTimeout(r, 50))
assert.ok(el.querySelector('.gtb-button'), 'GoogleTranslateButton renders')
assert.equal(api.status.value, 'ready', 'the fake from /testing loads')

await api.changeLanguage('fr')
assert.equal(api.currentLanguage.value, 'fr', 'changeLanguage works with the fake')

// /testing must share state with the main entry, or resetGoogleTranslate() would silently do nothing.
testing.resetGoogleTranslate()
assert.equal(api.currentLanguage.value, '', '/testing resets the same state the components use')
app.unmount()

// The server handler round-trips with a backend.
const handler = server.createTranslateHandler({ backend: { name: 'echo', translate: async t => t.map(s => s + '!') } })
const response = await handler(new Request('https://x.test/', { method: 'POST', body: JSON.stringify({ texts: ['hi'], source: 'en', target: 'fr' }) }))
assert.deepEqual(await response.json(), { translations: ['hi!'] })
await window.happyDOM.close()
console.log('ESM: ok')
`,
  )

  writeFileSync(
    join(work, 'cjs.cjs'),
    `
const assert = require('node:assert/strict')
const pkg = require('@ken_de_nigerian/vue-google-translate-widget')
const server = require('@ken_de_nigerian/vue-google-translate-widget/server')
const testing = require('@ken_de_nigerian/vue-google-translate-widget/testing')
assert.equal(typeof pkg.useGoogleTranslate, 'function')
assert.equal(typeof server.deepl, 'function')
assert.equal(typeof testing.installFakeGoogleTranslate, 'function')
console.log('CJS: ok')
`,
  )

  writeFileSync(
    join(work, 'types.ts'),
    `
import { useGoogleTranslate, type GoogleTranslateConfig } from '@ken_de_nigerian/vue-google-translate-widget'
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'
import { installFakeGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget/testing'
const config: GoogleTranslateConfig = { defaultLanguage: 'en', queryParameter: 'lang' }
export const handler: (request: Request) => Promise<Response> = createTranslateHandler({ backend: deepl({ apiKey: 'k' }) })
export { config, useGoogleTranslate, installFakeGoogleTranslate }
`,
  )

  writeFileSync(
    join(work, 'nuxt-types.ts'),
    `
import type { ModuleOptions } from '@ken_de_nigerian/vue-google-translate-widget/nuxt'
export const options: ModuleOptions = { css: true, includedLanguages: ['fr'], queryParameter: 'lang' }
// Fails to compile if ModuleOptions silently became \`any\` (e.g. a broken import in the declarations).
// @ts-expect-error includedLanguages must be strings
export const invalid: ModuleOptions = { includedLanguages: [42] }
`,
  )

  console.log(run('node esm.mjs').trim())
  console.log(run('node cjs.cjs').trim())
  run(`npm install --no-audit --no-fund typescript@5 @nuxt/kit@4 @nuxt/schema@4`)
  run(
    'npx tsc --noEmit --strict --skipLibCheck false --module nodenext --moduleResolution nodenext --target es2022 --lib es2022,dom types.ts',
  )
  // Nuxt's own declarations need its whole toolchain installed, so check this file with skipLibCheck.
  run(
    'npx tsc --noEmit --strict --skipLibCheck --module nodenext --moduleResolution nodenext --target es2022 --lib es2022,dom nuxt-types.ts',
  )
  console.log('Types: ok')
  console.log('Package smoke test passed.')
} finally {
  rmSync(work, { recursive: true, force: true })
}
