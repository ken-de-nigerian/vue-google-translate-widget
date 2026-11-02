// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DEFAULT_LANGUAGES } from '../src/core/languages'

describe('docs', () => {
  it('lists exactly the built-in languages in docs/languages.md', () => {
    const doc = readFileSync('docs/languages.md', 'utf8')
    const block = doc.split('<!-- generated:languages:start -->')[1].split('<!-- generated:languages:end -->')[0]
    const rows = [...block.matchAll(/^\| (.+?) \| (.+?) \| `(.+?)` \|$/gm)].map(([, name, native, code]) => ({
      name,
      native,
      code,
    }))
    expect(rows).toEqual(DEFAULT_LANGUAGES.map(l => ({ name: l.name, native: l.nativeName, code: l.code })))
  })

  it('states the real number of built-in languages', () => {
    const doc = readFileSync('docs/languages.md', 'utf8')
    expect(doc).toContain(`the built-in list covers ${DEFAULT_LANGUAGES.length}`)
  })
})
