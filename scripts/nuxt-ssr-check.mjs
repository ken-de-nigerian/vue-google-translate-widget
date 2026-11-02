// Builds playground-nuxt (a real Nuxt app that installs this package through
// node_modules, like a user would) and checks its server-rendered HTML.
// Run `npm run build` first.
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, rmSync, symlinkSync } from 'node:fs'
import assert from 'node:assert/strict'

const link = 'playground-nuxt/node_modules/@ken_de_nigerian/vue-google-translate-widget'
mkdirSync('playground-nuxt/node_modules/@ken_de_nigerian', { recursive: true })
rmSync(link, { force: true })
symlinkSync('../../..', link)

execSync('npx nuxi build playground-nuxt', { stdio: 'inherit' })

const port = 3990
const server = spawn('node', ['playground-nuxt/.output/server/index.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'inherit',
})

const get = async (path, cookie) => {
  const response = await fetch(`http://localhost:${port}${path}`, { headers: cookie ? { cookie } : {} })
  assert.equal(response.status, 200, `${path} responded ${response.status}`)
  return response.text()
}
const current = html => html.match(/class="current">Current: ([^<]*)</)?.[1]

try {
  for (let i = 0; ; i++) {
    try {
      await get('/')
      break
    } catch (error) {
      if (i > 60) throw error
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const plain = await get('/')
  assert.equal(current(plain), 'en', 'renders the page language by default')
  assert.match(
    plain,
    /class="brand" translate="no"/,
    'v-no-translate renders translate="no" (and no class) on the server',
  )
  assert.match(plain, /gtw-float-button/, 'renders GoogleTranslateWidget (auto-imported)')
  assert.match(plain, /<span class="label">English<\/span>/, 'renders GoogleTranslateButton (auto-imported)')
  assert.match(plain, /--_gtw-primary/, 'includes the stylesheet')

  assert.equal(current(await get('/', 'googtrans=/en/fr')), 'fr', 'renders the language from the cookie')
  assert.equal(current(await get('/?lang=de', 'googtrans=/en/fr')), 'de', '?lang= wins over the cookie')

  const [fr, de, en] = await Promise.all([get('/', 'googtrans=/en/fr'), get('/', 'googtrans=/en/de'), get('/')])
  assert.deepEqual([current(fr), current(de), current(en)], ['fr', 'de', 'en'], 'concurrent requests stay isolated')

  console.log('Nuxt SSR checks passed.')
} finally {
  server.kill()
}
