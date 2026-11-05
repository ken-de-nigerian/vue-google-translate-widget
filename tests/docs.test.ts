// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
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

  it('only uses language codes Google supports in its examples', () => {
    const google = new Set(
      (JSON.parse(readFileSync('tests/fixtures/google-languages.json', 'utf8')).languages as { code: string }[]).map(
        l => l.code,
      ),
    )
    const doc = readFileSync('docs/languages.md', 'utf8')
    const examples = [...doc.matchAll(/code: '([^']+)'/g)].map(match => match[1])
    expect(examples.filter(code => !google.has(code))).toEqual([])
  })

  it('states the real number of built-in languages', () => {
    const doc = readFileSync('docs/languages.md', 'utf8')
    expect(doc).toContain(`The built-in list has ${DEFAULT_LANGUAGES.length} languages`)
  })

  it('links only to headings that exist', () => {
    // VitePress's heading slug algorithm (vitepress/dist/node, `slugify`); headings can also set {#id} explicitly.
    const slugify = (text: string) =>
      text
        .normalize('NFKD')
        .replace(/[\u0300-\u036F]/g, '')
        .replace(/[\u0000-\u001f]/g, '')
        .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/^(\d)/, '_$1')
        .toLowerCase()

    const files = [
      ...readdirSync('docs')
        .filter(f => f.endsWith('.md'))
        .map(f => join('docs', f)),
      ...readdirSync('docs/architecture/adr').map(f => join('docs/architecture/adr', f)),
    ]
    const anchors = new Map<string, Set<string>>()
    for (const file of files) {
      const ids = new Set<string>()
      for (const [, heading] of readFileSync(file, 'utf8')
        .replace(/```[\s\S]*?```/g, '')
        .matchAll(/^#{1,6} (.+)$/gm)) {
        const explicit = heading.match(/\{#([\w-]+)\}\s*$/)
        ids.add(explicit ? explicit[1] : slugify(heading.replace(/`/g, '')))
      }
      anchors.set(normalize(file), ids)
    }

    const broken: string[] = []
    for (const file of files) {
      const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '')
      for (const [, target, anchor] of text.matchAll(/\]\(([^)#\s]*\.md)?#([^)\s]+)\)/g)) {
        const targetFile = normalize(target ? join(dirname(file), target) : file)
        if (!anchors.get(targetFile)?.has(anchor)) broken.push(`${file} → ${target ?? ''}#${anchor}`)
      }
    }
    expect(broken).toEqual([])
  })
})
