import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { GoogleTranslateButton, GoogleTranslateWidget } from '../src'
import { installFakeGoogle } from './helpers/fakeGoogle'

// Slot render functions receive typed props; the helpers just pass them through.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Slots = Record<string, (...args: any[]) => unknown>

const combo = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo')!

async function openWidget(props: Record<string, unknown> = {}, slots: Slots = {}) {
  installFakeGoogle()
  const wrapper = mount(GoogleTranslateWidget, { props, slots, attachTo: document.body })
  await flushPromises()
  await wrapper.find('.gtw-float-button').trigger('click')
  await flushPromises()
  return wrapper
}

async function openButton(props: Record<string, unknown> = {}, slots: Slots = {}) {
  installFakeGoogle()
  const wrapper = mount(GoogleTranslateButton, { props, slots, attachTo: document.body })
  await flushPromises()
  await wrapper.find('button').trigger('click')
  await flushPromises()
  return wrapper
}

const nativeNames = (wrapper: ReturnType<typeof mount>, selector: string) =>
  wrapper.findAll(selector).map(n => n.text())

describe('theme and styling', () => {
  it('defaults to the auto theme with styles on (2.0)', async () => {
    const widget = await openWidget()
    expect(widget.classes()).toEqual(expect.arrayContaining(['gtw-theme-auto', 'gtw-styled']))
    const button = await openButton()
    expect(button.classes()).toEqual(expect.arrayContaining(['gtw-theme-auto', 'gtb-styled']))
  })

  it.each(['dark', 'light'])('applies theme="%s"', async theme => {
    expect((await openWidget({ theme })).classes()).toContain(`gtw-theme-${theme}`)
    expect((await openButton({ theme })).classes()).toContain(`gtw-theme-${theme}`)
  })

  it('drops its styles with unstyled', async () => {
    expect((await openWidget({ unstyled: true })).classes()).not.toContain('gtw-styled')
    expect((await openButton({ unstyled: true })).classes()).not.toContain('gtb-styled')
  })

  it.each(['bottom-left', 'bottom-right', 'top-left', 'top-right'])('positions the button at %s', async position => {
    const wrapper = await openWidget({ position })
    expect(wrapper.find('.gtw-float-button').classes()).toContain(`gtw-pos-${position}`)
  })

  it('sets the offset as a CSS custom property', async () => {
    const wrapper = await openWidget({ offset: '3rem' })
    expect((wrapper.element as HTMLElement).style.getPropertyValue('--gtw-offset')).toBe('3rem')
  })
})

describe('language display', () => {
  it('shows native and English names in the Widget by default', async () => {
    const wrapper = await openWidget({ includedLanguages: ['de'] })
    expect(wrapper.find('.gtw-language-native').text()).toBe('Deutsch')
    expect(wrapper.find('.gtw-language-name').text()).toBe('German')
  })

  it('shows only the native name in the Button by default', async () => {
    const wrapper = await openButton({ includedLanguages: ['de'] })
    expect(wrapper.find('.gtb-language-name').text()).toBe('Deutsch')
    expect(wrapper.find('.gtb-language-english').exists()).toBe(false)
  })

  it.each([
    ['native', ['Deutsch'], []],
    ['english', [], ['German']],
    ['both', ['Deutsch'], ['German']],
  ])('display="%s"', async (display, native, english) => {
    const widget = await openWidget({ includedLanguages: ['de'], display })
    expect(nativeNames(widget, '.gtw-language-native')).toEqual(native)
    expect(nativeNames(widget, '.gtw-language-name')).toEqual(english)

    const button = await openButton({ includedLanguages: ['de'], display })
    expect(nativeNames(button, '.gtb-language-name')).toEqual(native)
    expect(nativeNames(button, '.gtb-language-english')).toEqual(english)
  })

  it('lists pinned languages first, in order, accepting modern codes', async () => {
    const widget = await openWidget({ includedLanguages: ['af', 'de', 'fr', 'he'], pinned: ['he', 'fr'] })
    expect(nativeNames(widget, '.gtw-language-native')).toEqual(['עברית', 'Français', 'Afrikaans', 'Deutsch'])

    const button = await openButton({ includedLanguages: ['af', 'de', 'fr'], pinned: ['fr'] })
    expect(nativeNames(button, '.gtb-language-name')[0]).toBe('Français')
  })

  it('remembers recent choices and lists them first', async () => {
    window.localStorage.clear()
    const first = await openWidget({ includedLanguages: ['af', 'de', 'fr'], rememberRecent: true })
    await first
      .findAll('[role="option"]')
      .find(o => o.text().includes('Français'))!
      .trigger('click')
    await flushPromises()
    expect(JSON.parse(window.localStorage.getItem('gtw-recent-languages')!)).toEqual(['fr'])
    first.unmount()

    const button = await openButton({ includedLanguages: ['af', 'de', 'fr'], rememberRecent: 2 })
    expect(nativeNames(button, '.gtb-language-name')[0]).toBe('Français')
  })

  it('does not touch storage unless rememberRecent is on', async () => {
    window.localStorage.clear()
    const wrapper = await openWidget({ includedLanguages: ['fr'] })
    await wrapper.find('[role="option"]').trigger('click')
    await flushPromises()
    expect(window.localStorage.getItem('gtw-recent-languages')).toBeNull()
  })
})

describe('flags', () => {
  it('shows no flags unless asked (2.0)', async () => {
    expect((await openWidget({ includedLanguages: ['fr'] })).find('.gtw-flag').exists()).toBe(false)
    expect((await openButton({ includedLanguages: ['fr'] })).find('.gtb-flag').exists()).toBe(false)
  })

  it('renders emoji flags, falling back to a code badge', async () => {
    const wrapper = await openWidget({ includedLanguages: ['fr', 'eu', 'cy'], showFlags: true, flagStyle: 'emoji' })
    expect(wrapper.findAll('.gtw-flag-emoji').map(e => e.text())).toEqual([
      '🇫🇷',
      '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
    ])
    expect(wrapper.find('.gtw-flag-code').text()).toBe('eu')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('renders emoji flags in the Button', async () => {
    const wrapper = await openButton({ includedLanguages: ['fr'], showFlags: true, flagStyle: 'emoji' })
    expect(wrapper.find('.gtb-flag.gtb-flag-emoji').text()).toBe('🇫🇷')
  })
})

describe('labels', () => {
  it('overrides any text, keeping the defaults for the rest', async () => {
    const wrapper = await openWidget({
      labels: { open: 'Langue', close: 'Fermer', noResults: 'Rien', results: (n: number) => `${n} langues` },
    })
    expect(wrapper.find('.gtw-float-button').attributes('aria-label')).toBe('Langue')
    expect(wrapper.find('.gtw-close-button').attributes('aria-label')).toBe('Fermer')

    await wrapper.find('input').setValue('zzz')
    expect(wrapper.find('.gtw-no-results-text').text()).toBe('Rien')
    expect(wrapper.find('.gtw-no-results-hint').text()).toBe('Try a different search term')
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('0 langues')
  })
})

describe('slots', () => {
  it('Widget: trigger, header, item, empty and footer', async () => {
    const wrapper = await openWidget(
      { includedLanguages: ['fr', 'de'] },
      {
        trigger: ({ currentLanguage }: { currentLanguage: string }) =>
          h('span', { class: 'my-trigger' }, currentLanguage),
        header: ({ titleId }: { titleId: string }) => h('h2', { id: titleId, class: 'my-title' }, 'Langues'),
        item: ({ language, selected }: { language: { code: string }; selected: boolean }) =>
          h('span', { class: 'my-item' }, `${language.code}:${selected}`),
        empty: ({ query }: { query: string }) => h('p', { class: 'my-empty' }, `nothing for ${query}`),
        footer: () => h('a', { class: 'my-footer', href: '#' }, 'Powered by Google'),
      },
    )
    expect(wrapper.find('.my-trigger').text()).toBe('en')
    const dialog = wrapper.find('[role="dialog"]')
    expect(document.getElementById(dialog.attributes('aria-labelledby')!)!.textContent).toBe('Langues')
    expect(wrapper.findAll('.my-item').map(i => i.text())).toEqual(['fr:false', 'de:false'])
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
    expect(wrapper.find('.my-footer').exists()).toBe(true)

    await wrapper.find('input').setValue('xyz')
    expect(wrapper.find('.my-empty').text()).toBe('nothing for xyz')
  })

  it('Button: default slot with the current language, and item', async () => {
    document.cookie = 'googtrans=/en/fr; path=/'
    const wrapper = await openButton(
      { includedLanguages: ['fr', 'de'] },
      {
        default: ({ current, isOpen }: { current?: { nativeName: string }; isOpen: boolean }) =>
          h('span', { class: 'my-label' }, `${current?.nativeName}:${isOpen}`),
        item: ({ language, selected }: { language: { name: string }; selected: boolean }) =>
          h('span', { class: 'my-item' }, `${language.name}${selected ? ' ✓' : ''}`),
      },
    )
    expect(wrapper.find('.my-label').text()).toBe('Français:true')
    expect(wrapper.findAll('.my-item').map(i => i.text())).toEqual(['French ✓', 'German'])
  })
})

describe('item slot select()', () => {
  it('lets custom item content choose its language', async () => {
    const wrapper = await openButton(
      { includedLanguages: ['fr'] },
      {
        item: ({ select }: { select: () => void }) =>
          h('button', { class: 'my-pick', onClick: (e: Event) => (e.stopPropagation(), select()) }, 'pick'),
      },
    )
    await wrapper.find('.my-pick').trigger('click')
    await flushPromises()
    expect(combo().value).toBe('fr')
    expect(wrapper.emitted('change')).toEqual([['fr']])
  })
})

describe('browser-language suggestion', () => {
  const mountWithBrowserLanguages = async (languages: string[], props: Record<string, unknown> = {}) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)
    installFakeGoogle()
    const wrapper = mount(GoogleTranslateWidget, {
      props: { suggestBrowserLanguage: true, ...props },
      attachTo: document.body,
    })
    await flushPromises()
    return wrapper
  }

  it('offers the visitor’s language and translates on accept', async () => {
    window.localStorage.clear()
    const wrapper = await mountWithBrowserLanguages(['fr-FR', 'en'])

    const prompt = wrapper.find('.gtw-suggestion')
    expect(prompt.text()).toContain('View this page in Français?')
    expect(prompt.attributes('translate')).toBe('no')

    await prompt.find('.gtw-suggestion-accept').trigger('click')
    await flushPromises()
    expect(combo().value).toBe('fr')
    expect(wrapper.emitted('change')).toEqual([['fr']])
    expect(wrapper.find('.gtw-suggestion').exists()).toBe(false)
  })

  it('remembers a dismissal', async () => {
    window.localStorage.clear()
    const first = await mountWithBrowserLanguages(['de'])
    await first.find('.gtw-suggestion-dismiss').trigger('click')
    expect(first.find('.gtw-suggestion').exists()).toBe(false)
    first.unmount()

    const second = await mountWithBrowserLanguages(['de'])
    expect(second.find('.gtw-suggestion').exists()).toBe(false)
  })

  it('stays quiet when the visitor prefers the page language, the page is translated, or it is off', async () => {
    window.localStorage.clear()
    expect((await mountWithBrowserLanguages(['en-US', 'fr'])).find('.gtw-suggestion').exists()).toBe(false)
    expect(
      (await mountWithBrowserLanguages(['fr'], { suggestBrowserLanguage: false })).find('.gtw-suggestion').exists(),
    ).toBe(false)
    document.cookie = 'googtrans=/en/de; path=/'
    expect((await mountWithBrowserLanguages(['fr'])).find('.gtw-suggestion').exists()).toBe(false)
  })

  it('uses custom suggestion labels', async () => {
    window.localStorage.clear()
    const wrapper = await mountWithBrowserLanguages(['de'], {
      labels: { suggestion: (l: { name: string }) => `Read in ${l.name}?`, accept: 'Yes', dismiss: 'No' },
    })
    expect(wrapper.find('.gtw-suggestion-text').text()).toBe('Read in German?')
    expect(wrapper.find('.gtw-suggestion-accept').text()).toBe('Yes')
  })
})

describe('lazy loading', () => {
  const scriptCount = () => document.querySelectorAll('script[src*="cb=__gtwGoogleTranslateInit"]').length

  it('Widget loads Google only when first opened', async () => {
    const wrapper = mount(GoogleTranslateWidget, { props: { lazy: true }, attachTo: document.body })
    await flushPromises()
    expect(scriptCount()).toBe(0)

    await wrapper.find('.gtw-float-button').trigger('click')
    expect(scriptCount()).toBe(1)
  })

  it('Button loads Google only when first opened', async () => {
    const wrapper = mount(GoogleTranslateButton, { props: { lazy: true }, attachTo: document.body })
    await flushPromises()
    expect(scriptCount()).toBe(0)

    await wrapper.find('button').trigger('click')
    expect(scriptCount()).toBe(1)
  })

  it('still loads immediately when a saved translation must be applied', async () => {
    document.cookie = 'googtrans=/en/fr; path=/'
    mount(GoogleTranslateWidget, { props: { lazy: true }, attachTo: document.body })
    await flushPromises()
    expect(scriptCount()).toBe(1)
  })
})

describe('syncDocumentDir', () => {
  it('sets dir="rtl" for Arabic by default', async () => {
    const wrapper = await openWidget({ includedLanguages: ['ar', 'fr'] })
    await wrapper.findAll('[role="option"]')[0].trigger('click')
    await flushPromises()
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('leaves dir alone with syncDocumentDir: false', async () => {
    const wrapper = await openWidget({ includedLanguages: ['ar', 'fr'], syncDocumentDir: false })
    await wrapper.findAll('[role="option"]')[0].trigger('click')
    await flushPromises()
    expect(document.documentElement.className).toBe('translated-rtl')
    expect(document.documentElement.hasAttribute('dir')).toBe(false)
  })
})
