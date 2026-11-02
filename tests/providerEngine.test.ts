import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import {
  createGoogleTranslate,
  GoogleTranslateWidget,
  memoryCache,
  useGoogleTranslate,
  type TranslationProvider,
} from '../src'
import { stubReload } from './setup'

function fakeProvider() {
  const provider: TranslationProvider = {
    name: 'fake',
    translate: vi.fn(async (texts: string[], _s: string, target: string) => texts.map(t => `${t} (${target})`)),
  }
  return provider
}

const scripts = () => document.querySelectorAll('script').length

describe('provider engine via useGoogleTranslate', () => {
  it('translates the page without loading Google', async () => {
    document.body.innerHTML = '<h1>Hello</h1>'
    const provider = fakeProvider()
    const api = useGoogleTranslate({ provider, cache: memoryCache() })

    await api.initializeTranslate()
    expect(api.status.value).toBe('ready')
    await api.changeLanguage('fr')

    expect(document.querySelector('h1')!.textContent).toBe('Hello (fr)')
    expect(api.currentLanguage.value).toBe('fr')
    expect(document.cookie).toContain('googtrans=/en/fr')
    expect(scripts()).toBe(0)
    expect(document.getElementById('gtw-hide-branding')).toBeNull()
  })

  it('restores in place and clears the saved choice', async () => {
    document.body.innerHTML = '<h1>Hello</h1>'
    const reload = stubReload()
    const api = useGoogleTranslate({ provider: fakeProvider(), cache: memoryCache() })
    await api.changeLanguage('de')
    await api.changeLanguage('en')

    expect(document.querySelector('h1')!.textContent).toBe('Hello')
    expect(reload).not.toHaveBeenCalled()
    expect(document.cookie).not.toContain('googtrans=/')
  })

  it('re-applies the saved language on load', async () => {
    document.body.innerHTML = '<h1>Hello</h1>'
    document.cookie = 'googtrans=/en/yo; path=/'
    const api = useGoogleTranslate({ provider: fakeProvider(), cache: memoryCache() })
    await api.initializeTranslate()

    expect(document.querySelector('h1')!.textContent).toBe('Hello (yo)')
    expect(api.currentLanguage.value).toBe('yo')
  })

  it('sets dir="rtl" for right-to-left targets', async () => {
    document.body.innerHTML = '<h1>Hello</h1>'
    await useGoogleTranslate({ provider: fakeProvider(), cache: memoryCache() }).changeLanguage('ar')
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('rolls back to the original when the provider fails', async () => {
    document.body.innerHTML = '<h1>Hello</h1>'
    const provider: TranslationProvider = {
      name: 'down',
      translate: async () => {
        throw new Error('503 Service Unavailable')
      },
    }
    const api = useGoogleTranslate({ provider, cache: memoryCache() })

    await expect(api.changeLanguage('fr')).rejects.toThrow('503')
    expect(api.currentLanguage.value).toBe('en')
    expect(api.error.value?.message).toContain('503')
    expect(api.isChangingLanguage.value).toBe(false)
    expect(document.querySelector('h1')!.textContent).toBe('Hello')
    expect(document.cookie).not.toContain('googtrans=/')
  })

  it('works end to end through the Widget and the plugin', async () => {
    document.body.innerHTML = '<main><h1>Hello</h1></main>'
    const provider = fakeProvider()
    const wrapper = mount(GoogleTranslateWidget, {
      props: { includedLanguages: ['fr', 'de'] },
      global: { plugins: [createGoogleTranslate({ provider, cache: memoryCache() })] },
      attachTo: document.body,
    })
    await flushPromises()
    await wrapper.find('.gtw-float-button').trigger('click')
    await flushPromises()

    await wrapper
      .findAll('[role="option"]')
      .find(o => o.text().includes('Deutsch'))!
      .trigger('click')
    await flushPromises()

    expect(document.querySelector('h1')!.textContent).toBe('Hello (de)')
    expect(wrapper.emitted('change')).toEqual([['de']])
    expect(scripts()).toBe(0)
    // The widget's own native names are never sent to the provider.
    const sent = (provider.translate as ReturnType<typeof vi.fn>).mock.calls.flatMap(call => call[0] as string[])
    expect(sent).not.toContain('Deutsch')
    expect(sent).not.toContain('Français')
  })
})
