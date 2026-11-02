import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createGoogleTranslate, GoogleTranslateButton, useGoogleTranslate, type TranslateEvent } from '../src'
import { installFakeGoogle } from './helpers/fakeGoogle'
import { stubReload } from './setup'

const combo = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo')!

/** Mounts a component that calls useGoogleTranslate(options) inside an app using the plugin. */
function withPlugin(config: Parameters<typeof createGoogleTranslate>[0], options = {}) {
  let api!: ReturnType<typeof useGoogleTranslate>
  const Probe = defineComponent({
    setup() {
      api = useGoogleTranslate(options)
      return () => h('div')
    },
  })
  mount(Probe, { global: { plugins: [createGoogleTranslate(config)] } })
  return api
}

describe('createGoogleTranslate (plugin)', () => {
  it('provides defaults to useGoogleTranslate', () => {
    const api = withPlugin({ defaultLanguage: 'fr', includedLanguages: ['de', 'yo'] })
    expect(api.pageLanguage).toBe('fr')
    expect(api.currentLanguage.value).toBe('fr')
    expect(api.languages.map(l => l.code)).toEqual(['de', 'yo'])
  })

  it('lets composable options override the plugin', () => {
    const api = withPlugin({ includedLanguages: ['de'] }, { includedLanguages: ['fr'] })
    expect(api.languages.map(l => l.code)).toEqual(['fr'])
  })

  it('applies to components, with props still winning', async () => {
    installFakeGoogle()
    const plugin = createGoogleTranslate({ includedLanguages: ['de', 'fr'], mode: 'reload' })
    const reload = stubReload()
    const fromPlugin = mount(GoogleTranslateButton, { global: { plugins: [plugin] }, attachTo: document.body })
    const withProp = mount(GoogleTranslateButton, {
      props: { includedLanguages: ['yo'] },
      global: { plugins: [plugin] },
      attachTo: document.body,
    })
    await flushPromises()

    await fromPlugin.find('button').trigger('click')
    await flushPromises()
    expect(fromPlugin.findAll('[role="option"]')).toHaveLength(2)
    await withProp.find('button').trigger('click')
    await flushPromises()
    expect(withProp.findAll('[role="option"]').map(o => o.text())).toEqual(['Yorùbá'])

    await withProp.find('[role="option"]').trigger('click')
    await flushPromises()
    expect(reload).toHaveBeenCalledOnce() // mode: 'reload' came from the plugin
  })

  it('a component prop of false beats a plugin value of true', async () => {
    installFakeGoogle()
    mount(GoogleTranslateButton, {
      props: { hideBranding: false },
      global: { plugins: [createGoogleTranslate({ hideBranding: true })] },
    })
    await flushPromises()
    expect(document.getElementById('gtw-hide-branding')).toBeNull()
  })
})

describe('onTranslate', () => {
  it('reports every change and restore with the engine name', async () => {
    installFakeGoogle()
    const events: TranslateEvent[] = []
    const api = withPlugin({ onTranslate: event => events.push(event) })

    await api.changeLanguage('fr')
    await api.changeLanguage('de')
    await api.changeLanguage('en')

    expect(events).toEqual([
      { from: 'en', to: 'fr', engine: 'google-widget', trigger: 'user' },
      { from: 'fr', to: 'de', engine: 'google-widget', trigger: 'user' },
      { from: 'de', to: 'en', engine: 'google-widget', trigger: 'user' },
    ])
  })

  it('is not called when a change fails, and a throwing handler doesn’t break the change', async () => {
    installFakeGoogle({ languages: ['fr'] })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onTranslate = vi.fn(() => {
      throw new Error('analytics down')
    })
    const api = useGoogleTranslate({ onTranslate })

    await expect(api.changeLanguage('tlh')).rejects.toThrow()
    expect(onTranslate).not.toHaveBeenCalled()

    await api.changeLanguage('fr')
    expect(onTranslate).toHaveBeenCalledOnce()
    expect(combo().value).toBe('fr')
  })
})

describe('autoTranslate', () => {
  it('translates into the browser language on the first visit only', async () => {
    installFakeGoogle()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE', 'en'])
    const events: TranslateEvent[] = []
    const api = useGoogleTranslate({ autoTranslate: true, onTranslate: e => events.push(e) })

    await api.initializeTranslate()
    expect(combo().value).toBe('de')
    expect(events[0]).toMatchObject({ to: 'de', trigger: 'auto' })

    await api.restoreOriginal()
    await api.initializeTranslate()
    expect(api.currentLanguage.value).toBe('en')
  })

  it('does nothing when the visitor prefers the page language, or when off', async () => {
    installFakeGoogle()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB', 'fr'])
    const api = useGoogleTranslate({ autoTranslate: true })
    await api.initializeTranslate()
    expect(api.currentLanguage.value).toBe('en')

    window.localStorage.clear()
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr'])
    const off = useGoogleTranslate()
    await off.initializeTranslate()
    expect(off.currentLanguage.value).toBe('en')
  })
})

describe('queryParameter', () => {
  it('reads ?lang= before the cookie', () => {
    document.cookie = 'googtrans=/en/de; path=/'
    window.history.replaceState(null, '', '/page?lang=fr&x=1')
    expect(useGoogleTranslate({ queryParameter: 'lang' }).getCurrentLanguage()).toBe('fr')
    expect(useGoogleTranslate().getCurrentLanguage()).toBe('de') // off by default
  })

  it('accepts modern codes and ignores junk', () => {
    window.history.replaceState(null, '', '/?lang=he')
    expect(useGoogleTranslate({ queryParameter: 'lang' }).getCurrentLanguage()).toBe('iw')
    window.history.replaceState(null, '', '/?lang=<script>')
    expect(useGoogleTranslate({ queryParameter: 'lang' }).getCurrentLanguage()).toBe('en')
  })

  it('keeps the URL in sync without adding history entries', async () => {
    installFakeGoogle()
    window.history.replaceState(null, '', '/page?x=1')
    const length = window.history.length
    const api = useGoogleTranslate({ queryParameter: 'lang' })

    await api.changeLanguage('fr')
    expect(window.location.search).toBe('?x=1&lang=fr')
    await api.changeLanguage('de')
    expect(window.location.search).toBe('?x=1&lang=de')
    await api.changeLanguage('en')
    expect(window.location.search).toBe('?x=1')
    expect(window.history.length).toBe(length)
  })

  it('updates the URL before reloading in reload mode', async () => {
    stubReload()
    window.history.replaceState(null, '', '/?lang=fr')
    await useGoogleTranslate({ queryParameter: 'lang', mode: 'reload' }).changeLanguage('de')
    expect(window.location.search).toBe('?lang=de')
  })

  it('applies a ?lang= link on load', async () => {
    installFakeGoogle()
    window.history.replaceState(null, '', '/?lang=yo')
    await useGoogleTranslate({ queryParameter: 'lang' }).initializeTranslate()
    expect(combo().value).toBe('yo')
  })
})
