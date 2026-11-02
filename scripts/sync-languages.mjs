// Loads Google's real Website Translator in headless Chromium, reads the
// languages it offers, and compares them with tests/fixtures/google-languages.json
// and with the codes in src/core/languages.ts.
//
//   npm run sync:languages            check; exit 1 on any difference
//   npm run sync:languages -- --write update the snapshot
//
// Needs a Chromium: `npx playwright-core install chromium` (CI does this).
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { chromium } from 'playwright-core'

const FIXTURE = 'tests/fixtures/google-languages.json'
const write = process.argv.includes('--write')

const page = `<!doctype html><html lang="en"><body>
<div id="host"></div>
<script>window.init = () => new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'host')</script>
<script src="https://translate.google.com/translate_a/element.js?cb=init"></script>
</body></html>`

const server = createServer((_, res) => res.writeHead(200, { 'content-type': 'text/html' }).end(page))
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const browser = await chromium.launch()

let live
try {
  const tab = await browser.newPage()
  await tab.goto(`http://127.0.0.1:${server.address().port}/`)
  await tab.waitForFunction(() => document.querySelectorAll('select.goog-te-combo option').length > 100, null, {
    timeout: 60_000,
  })
  live = await tab.$$eval('select.goog-te-combo option', options =>
    options.filter(o => o.value).map(o => ({ code: o.value, name: o.textContent })),
  )
} finally {
  await browser.close()
  server.close()
}

const snapshot = JSON.parse(readFileSync(FIXTURE, 'utf8'))
const liveCodes = new Set(live.map(l => l.code))
const snapshotCodes = new Set(snapshot.languages.map(l => l.code))
const builtIn = [...readFileSync('src/core/languages.ts', 'utf8').matchAll(/code: '([^']+)'/g)].map(m => m[1])

const added = live.filter(l => !snapshotCodes.has(l.code))
const removed = snapshot.languages.filter(l => !liveCodes.has(l.code))
const brokenBuiltIn = builtIn.filter(code => code !== 'en' && !liveCodes.has(code))

console.log(`Google offers ${live.length} languages (snapshot: ${snapshot.languages.length}).`)
if (added.length) console.log('Added:', added.map(l => `${l.code} (${l.name})`).join(', '))
if (removed.length) console.log('Removed:', removed.map(l => `${l.code} (${l.name})`).join(', '))
if (brokenBuiltIn.length) console.log('Built-in codes Google no longer accepts:', brokenBuiltIn.join(', '))

if (write) {
  const today = new Date().toISOString().slice(0, 10)
  writeFileSync(FIXTURE, JSON.stringify({ ...snapshot, capturedAt: today, languages: live }, null, 2) + '\n')
  console.log(`Wrote ${FIXTURE}.`)
} else if (added.length || removed.length || brokenBuiltIn.length) {
  console.log('Run `npm run sync:languages -- --write`, review the diff, and fix src/core/languages.ts if needed.')
  process.exit(1)
} else {
  console.log('No changes.')
}
