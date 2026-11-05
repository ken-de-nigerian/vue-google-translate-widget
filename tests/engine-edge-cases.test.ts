// Edge cases found by mutation testing: each test pins down behaviour that a deliberate code change survived.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createDomTranslator,
  localStorageCache,
  type DomTranslator,
  type TranslationCache,
} from '../src/core/domTranslator'
import type { TranslationProvider } from '../src/core/providers'
import { useGoogleTranslate, type TranslateEvent } from '../src'
import { installFakeGoogle } from './helpers/fakeGoogle'
import { stubReload } from './setup'

const created: DomTranslator[] = []
afterEach(() => created.splice(0).forEach(t => t.destroy()))
const make = (options: Parameters<typeof createDomTranslator>[0]) => {
  const translator = createDomTranslator(options)
  created.push(translator)
  return translator
}
const upper: TranslationProvider = {
  name: 'upper',
  translate: vi.fn(async (texts: string[], _s: string, target: string) =>
    texts.map(t => `${t.toUpperCase()}@${target}`),
  ),
}
const settle = () => new Promise(resolve => setTimeout(resolve, 80))

describe('DOM engine: attributes', () => {
  it('translates attributes on the root element itself', async () => {
    document.body.innerHTML = '<main title="Recipes"><p>Hi</p></main>'
    await make({ provider: upper, root: () => document.querySelector('main')! }).translate('en', 'fr')
    expect(document.querySelector('main')!.title).toBe('RECIPES@fr')
  })

  it('skips attributes that are empty or have no letters, and trims the rest', async () => {
    const provider = { name: 'spy', translate: vi.fn(async (t: string[]) => t) }
    document.body.innerHTML = '<input placeholder="  "><img alt="42"><img alt="  Logo  ">'
    await make({ provider }).translate('en', 'fr')
    expect(provider.translate).toHaveBeenCalledWith(['Logo'], 'en', 'fr', expect.anything())
  })

  it('translates an attribute the app changes later, and restores the new value', async () => {
    document.body.innerHTML = '<input placeholder="Search">'
    const translator = make({ provider: upper })
    await translator.translate('en', 'de')
    const input = document.querySelector('input')!
    input.setAttribute('placeholder', 'Find a recipe')
    await settle()
    expect(input.placeholder).toBe('FIND A RECIPE@de')

    translator.restore()
    expect(input.placeholder).toBe('Find a recipe')
  })

  it('does not overwrite text the app changed after it was translated, when restoring', async () => {
    document.body.innerHTML = '<p>Hello</p>'
    const translator = make({ provider: upper, observe: false })
    await translator.translate('en', 'fr')
    const text = document.querySelector('p')!.firstChild as Text
    text.data = 'Changed by the app'
    translator.restore()
    expect(text.data).toBe('Changed by the app')
  })
})

describe('DOM engine: observing', () => {
  it('keeps observing after it has written translations more than once', async () => {
    document.body.innerHTML = '<main></main>'
    await make({ provider: upper }).translate('en', 'fr')
    const main = document.querySelector('main')!
    for (const word of ['first', 'second', 'third']) {
      const p = document.createElement('p')
      p.textContent = word
      main.appendChild(p)
      await settle()
      expect(p.textContent).toBe(`${word.toUpperCase()}@fr`)
    }
  })

  it('ignores nodes removed before the batch runs', async () => {
    const provider = { name: 'spy', translate: vi.fn(async (t: string[]) => t) }
    document.body.innerHTML = '<main></main>'
    await make({ provider }).translate('en', 'fr')
    provider.translate.mockClear()
    const p = document.createElement('p')
    p.textContent = 'Gone'
    document.querySelector('main')!.appendChild(p)
    p.remove()
    await settle()
    expect(provider.translate).not.toHaveBeenCalled()
  })

  it('does not observe with observe: false', async () => {
    document.body.innerHTML = '<main></main>'
    await make({ provider: upper, observe: false }).translate('en', 'fr')
    const p = document.createElement('p')
    p.textContent = 'later'
    document.querySelector('main')!.appendChild(p)
    await settle()
    expect(p.textContent).toBe('later')
  })
})

describe('localStorageCache', () => {
  it('uses the gtw-cache: prefix by default and serves repeat reads from memory', () => {
    const cache = localStorageCache()
    cache.set('k', 'v')
    expect(window.localStorage.getItem('gtw-cache:k')).toBe('v')
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    expect(cache.get('k')).toBe('v')
    expect(getItem).not.toHaveBeenCalled()
  })

  it('loads a stored value into memory on first read', () => {
    window.localStorage.setItem('gtw-cache:stored', 'value')
    const cache = localStorageCache()
    expect(cache.get('stored')).toBe('value')
    window.localStorage.removeItem('gtw-cache:stored')
    expect(cache.get('stored')).toBe('value')
    expect(cache.get('missing')).toBeUndefined()
  })
})

describe('useGoogleTranslate: provider options', () => {
  it('uses the cache you pass', async () => {
    document.body.innerHTML = '<p>Hi</p>'
    const cache: TranslationCache = { get: vi.fn(() => undefined), set: vi.fn() }
    await useGoogleTranslate({ provider: upper, cache }).changeLanguage('fr')
    expect(cache.set).toHaveBeenCalledWith(expect.stringContaining('upper|en|fr|'), 'HI@fr')
  })

  it('translates the attributes you list', async () => {
    document.body.innerHTML = '<span data-tip="Tip">x</span>'
    await useGoogleTranslate({ provider: upper, translateAttributes: ['data-tip'] }).changeLanguage('fr')
    expect(document.querySelector('span')!.dataset.tip).toBe('TIP@fr')
  })

  it('warns when a second, different provider is passed on the same page', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    document.body.innerHTML = '<p>Hi</p>'
    await useGoogleTranslate({ provider: upper }).changeLanguage('fr')
    await useGoogleTranslate({ provider: upper }).changeLanguage('de')
    expect(warn).not.toHaveBeenCalled()
    const other: TranslationProvider = { name: 'other', translate: async t => t }
    await useGoogleTranslate({ provider: other }).changeLanguage('yo')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already active'))
  })
})

describe('useGoogleTranslate: state transitions', () => {
  it('reports loading while the engine loads, then ready', async () => {
    installFakeGoogle()
    const api = useGoogleTranslate()
    const pending = api.initializeTranslate()
    expect(api.status.value).toBe('loading')
    await pending
    expect(api.status.value).toBe('ready')
  })

  it('does not report a restore when the page was not translated', async () => {
    installFakeGoogle()
    const events: TranslateEvent[] = []
    await useGoogleTranslate({ onTranslate: e => events.push(e) }).restoreOriginal()
    expect(events).toEqual([])
  })

  it('logs a throwing onTranslate with a clear message', async () => {
    installFakeGoogle()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    await useGoogleTranslate({
      onTranslate: () => {
        throw new Error('analytics down')
      },
    }).changeLanguage('fr')
    expect(error).toHaveBeenCalledWith('[vue-google-translate-widget] onTranslate threw:', expect.any(Error))
  })

  it('stays "changing" while a reload-on-restore is in progress', async () => {
    stubReload()
    installFakeGoogle()
    const api = useGoogleTranslate({ reloadOnRestore: true })
    await api.changeLanguage('fr')
    await api.changeLanguage('en')
    expect(api.isChangingLanguage.value).toBe(true)
  })

  it('is no longer "changing" after an in-place restore', async () => {
    installFakeGoogle()
    const api = useGoogleTranslate()
    await api.changeLanguage('fr')
    await api.changeLanguage('en')
    expect(api.isChangingLanguage.value).toBe(false)
  })

  it('keeps the cookie of the previous translation when a change to an unsupported code fails', async () => {
    installFakeGoogle({ languages: ['fr'] })
    const api = useGoogleTranslate()
    await api.changeLanguage('fr')
    await expect(api.changeLanguage('xx')).rejects.toThrow()
    expect(api.currentLanguage.value).toBe('fr')
    expect(document.cookie).toContain('googtrans=/en/fr')
  })

  it('does not re-apply a saved language Google has already applied', async () => {
    installFakeGoogle()
    document.cookie = 'googtrans=/en/de; path=/'
    document.documentElement.className = 'translated-ltr'
    const api = useGoogleTranslate()
    await api.initializeTranslate()
    expect(document.querySelector<HTMLSelectElement>('select.goog-te-combo')!.value).toBe('')
  })
})
