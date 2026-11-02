import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createDomTranslator as create,
  localStorageCache,
  memoryCache,
  type DomTranslator,
  type DomTranslatorOptions,
} from '../src/core/domTranslator'
import type { TranslationProvider } from '../src/core/providers'

/** Upper-cases and tags every string, and records each request. */
function fakeProvider(name = 'fake') {
  const calls: string[][] = []
  const provider: TranslationProvider = {
    name,
    translate: vi.fn(async (texts: string[], _source: string, target: string) => {
      calls.push(texts)
      return texts.map(text => `[${target}] ${text.toUpperCase()}`)
    }),
  }
  return { provider, calls }
}

// Every translator observes document.body; destroy them so tests don't translate each other's DOM.
const created: DomTranslator[] = []
const createDomTranslator = (options: DomTranslatorOptions) => {
  const translator = create(options)
  created.push(translator)
  return translator
}
afterEach(() => created.splice(0).forEach(translator => translator.destroy()))

const settle = () => new Promise(resolve => setTimeout(resolve, 80))

describe('createDomTranslator', () => {
  it('translates text nodes and keeps surrounding whitespace', async () => {
    document.body.innerHTML = '<h1>  Hello  </h1><p>Good <b>morning</b></p>'
    const { provider } = fakeProvider()
    await createDomTranslator({ provider }).translate('en', 'fr')

    expect(document.querySelector('h1')!.textContent).toBe('  [fr] HELLO  ')
    expect(document.querySelector('p')!.innerHTML).toBe('[fr] GOOD <b>[fr] MORNING</b>')
  })

  it('translates placeholder, title, alt and aria-label', async () => {
    document.body.innerHTML =
      '<input placeholder="Search"><img alt="Logo" title="Home"><button aria-label="Close">×</button>'
    await createDomTranslator({ provider: fakeProvider().provider }).translate('en', 'de')

    expect(document.querySelector('input')!.placeholder).toBe('[de] SEARCH')
    expect(document.querySelector('img')!.alt).toBe('[de] LOGO')
    expect(document.querySelector('img')!.title).toBe('[de] HOME')
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe('[de] CLOSE')
    expect(document.querySelector('button')!.textContent).toBe('×')
  })

  it('skips notranslate, translate="no", code, scripts and strings without letters', async () => {
    document.body.innerHTML = `
      <p class="notranslate">PayZephyr</p><p translate="no"><i>Acme</i></p>
      <code>npm install</code><pre>x = 1</pre><script>var a = "b"</script>
      <p>42 %</p><p>Translate me</p>`
    const { provider, calls } = fakeProvider()
    await createDomTranslator({ provider }).translate('en', 'fr')

    expect(calls).toEqual([['Translate me']])
  })

  it('sends each distinct string once, in batches', async () => {
    document.body.innerHTML = Array.from({ length: 5 }, (_, i) => `<p>Item ${i % 3}</p>`).join('')
    const { provider, calls } = fakeProvider()
    await createDomTranslator({ provider, batchSize: 2 }).translate('en', 'fr')

    expect(calls).toEqual([['Item 0', 'Item 1'], ['Item 2']])
    expect([...document.querySelectorAll('p')].map(p => p.textContent)).toEqual([
      '[fr] ITEM 0',
      '[fr] ITEM 1',
      '[fr] ITEM 2',
      '[fr] ITEM 0',
      '[fr] ITEM 1',
    ])
  })

  it('uses the cache instead of asking again', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const { provider, calls } = fakeProvider()
    const cache = memoryCache()
    const first = createDomTranslator({ provider, cache })
    await first.translate('en', 'fr')
    first.restore()
    await createDomTranslator({ provider, cache }).translate('en', 'fr')

    expect(calls).toHaveLength(1)
    expect(document.querySelector('p')!.textContent).toBe('[fr] HELLO')
  })

  it('keys the cache by provider and language pair', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const cache = memoryCache()
    const a = fakeProvider('a')
    const b = fakeProvider('b')
    const translator = createDomTranslator({ provider: a.provider, cache })
    await translator.translate('en', 'fr')
    await translator.translate('en', 'de')
    translator.restore()
    await createDomTranslator({ provider: b.provider, cache }).translate('en', 'fr')

    expect(a.calls).toEqual([['Hello'], ['Hello']])
    expect(b.calls).toEqual([['Hello']])
  })

  it('switches language from the originals, not from the previous translation', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const { provider, calls } = fakeProvider()
    const translator = createDomTranslator({ provider })
    await translator.translate('en', 'fr')
    await translator.translate('en', 'de')

    expect(calls).toEqual([['Hello'], ['Hello']])
    expect(document.querySelector('p')!.textContent).toBe('[de] HELLO')
  })

  it('restores the original text and attributes instantly', async () => {
    document.body.innerHTML = '<p>Hello</p><input placeholder="Search">'
    const translator = createDomTranslator({ provider: fakeProvider().provider })
    await translator.translate('en', 'fr')
    translator.restore()

    expect(document.querySelector('p')!.textContent).toBe('Hello')
    expect(document.querySelector('input')!.placeholder).toBe('Search')
    expect(translator.target).toBeNull()
  })

  it('marks <html> like Google does, so dir/lang handling works for every engine', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const translator = createDomTranslator({ provider: fakeProvider().provider })
    await translator.translate('en', 'ar')
    expect(document.documentElement.className).toBe('translated-rtl')
    expect(document.documentElement.lang).toBe('ar')

    await translator.translate('en', 'fr')
    expect(document.documentElement.className).toBe('translated-ltr')

    translator.restore()
    expect(document.documentElement.className).toBe('')
    expect(document.documentElement.lang).toBe('en')
  })

  it('translates content added later', async () => {
    document.body.innerHTML = '<main><p>Hello</p></main>'
    const translator = createDomTranslator({ provider: fakeProvider().provider })
    await translator.translate('en', 'fr')

    const p = document.createElement('p')
    p.textContent = 'Later'
    document.querySelector('main')!.appendChild(p)
    await settle()

    expect(p.textContent).toBe('[fr] LATER')
  })

  it('treats text the app changes as a new original', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const { provider } = fakeProvider()
    const translator = createDomTranslator({ provider })
    await translator.translate('en', 'fr')

    const text = document.querySelector('p')!.firstChild as Text
    text.data = 'Goodbye' // what Vue does when reactive text changes
    await settle()
    expect(text.data).toBe('[fr] GOODBYE')

    translator.restore()
    expect(text.data).toBe('Goodbye')
  })

  it('does not loop on its own writes', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const { provider, calls } = fakeProvider()
    await createDomTranslator({ provider }).translate('en', 'fr')
    await settle()
    await settle()

    expect(calls).toHaveLength(1)
  })

  it('stops following changes after restore', async () => {
    document.body.innerHTML = '<main></main>'
    const translator = createDomTranslator({ provider: fakeProvider().provider })
    await translator.translate('en', 'fr')
    translator.restore()

    const p = document.createElement('p')
    p.textContent = 'Later'
    document.querySelector('main')!.appendChild(p)
    await settle()
    expect(p.textContent).toBe('Later')
  })

  it('restores the page and rethrows when the provider fails', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const provider: TranslationProvider = {
      name: 'broken',
      translate: async () => {
        throw new Error('quota exceeded')
      },
    }
    const translator = createDomTranslator({ provider })

    await expect(translator.translate('en', 'fr')).rejects.toThrow('quota exceeded')
    expect(document.querySelector('p')!.textContent).toBe('Hello')
    expect(document.documentElement.className).toBe('')
    expect(translator.target).toBeNull()
  })

  it('drops a slow response if the visitor has already switched again', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    let release!: () => void
    const provider: TranslationProvider = {
      name: 'slow',
      translate: async (texts, _s, target) => {
        if (target === 'fr') await new Promise<void>(resolve => (release = resolve))
        return texts.map(t => `[${target}] ${t}`)
      },
    }
    const translator = createDomTranslator({ provider })
    const slow = translator.translate('en', 'fr')
    await translator.translate('en', 'de')
    release()
    await slow

    expect(document.querySelector('p')!.textContent).toBe('[de] Hello')
  })
})

describe('localStorageCache', () => {
  it('persists across instances', () => {
    localStorageCache().set('k', 'v')
    expect(localStorageCache().get('k')).toBe('v')
  })

  it('falls back to memory when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const cache = localStorageCache()
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
  })
})
