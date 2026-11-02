import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { GoogleTranslateButton, GoogleTranslateWidget } from '../src'
import { expectNoA11yViolations } from './helpers/a11y'
import { installFakeGoogle } from './helpers/fakeGoogle'
import { stubReload } from './setup'

const combo = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo')!
const press = (wrapper: Pick<VueWrapper, 'trigger'>, key: string, init: KeyboardEventInit = {}) =>
  wrapper.trigger('keydown', { key, ...init })

async function mountWidget(props: Record<string, unknown> = {}) {
  installFakeGoogle()
  const wrapper = mount(GoogleTranslateWidget, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}

async function openWidget(wrapper: VueWrapper) {
  await wrapper.find('.gtw-float-button').trigger('click')
  await flushPromises()
}

async function mountButton(props: Record<string, unknown> = {}) {
  installFakeGoogle()
  const wrapper = mount(GoogleTranslateButton, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('GoogleTranslateWidget', () => {
  it('renders only the floating button until opened', async () => {
    const wrapper = await mountWidget()
    const trigger = wrapper.find('.gtw-float-button')

    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('emits ready once Google has loaded', async () => {
    const wrapper = await mountWidget()
    expect(wrapper.emitted('ready')).toHaveLength(1)
  })

  it('opens an accessible modal dialog and focuses the search box (B11, B12)', async () => {
    const wrapper = await mountWidget({ title: 'Pick a language', includedLanguages: ['en', 'fr', 'yo'] })
    await openWidget(wrapper)

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(document.getElementById(dialog.attributes('aria-labelledby')!)!.textContent).toBe('Pick a language')
    expect(wrapper.find('.gtw-float-button').attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(wrapper.find('input').element)
    expect(wrapper.findAll('[role="option"]')).toHaveLength(3)
    expect(wrapper.emitted('open')).toHaveLength(1)
  })

  it('has no axe violations when open', async () => {
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr', 'eo'] })
    await openWidget(wrapper)
    await expectNoA11yViolations(wrapper.element)
  })

  it('starts the active option on the current language and moves with the arrow keys', async () => {
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr', 'de'] })
    await openWidget(wrapper)
    const input = wrapper.find('input')
    const active = () => document.getElementById(input.attributes('aria-activedescendant')!)?.textContent

    expect(active()).toContain('English')
    await press(input, 'ArrowDown')
    expect(active()).toContain('Français')
    await press(input, 'End')
    expect(active()).toContain('Deutsch')
    await press(input, 'ArrowDown')
    expect(active()).toContain('English')
    await press(input, 'ArrowUp')
    expect(active()).toContain('Deutsch')
  })

  it('selects with Enter: translates in place, emits, closes and returns focus (B3, B10)', async () => {
    const reload = stubReload()
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr'] })
    await openWidget(wrapper)
    const input = wrapper.find('input')

    await press(input, 'ArrowDown')
    await press(input, 'Enter')
    await flushPromises()

    expect(reload).not.toHaveBeenCalled()
    expect(combo().value).toBe('fr')
    expect(wrapper.emitted('change')).toEqual([['fr']])
    expect(wrapper.emitted('update:language')).toEqual([['fr']])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.gtw-float-button').element)
  })

  it('selects with a click', async () => {
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr'] })
    await openWidget(wrapper)

    const french = wrapper.findAll('[role="option"]').find(option => option.text().includes('Français'))!
    await french.trigger('click')
    await flushPromises()

    expect(combo().value).toBe('fr')
    expect(wrapper.find('[role="option"][aria-selected="true"]').exists()).toBe(false)
  })

  it('marks the current language as selected', async () => {
    document.cookie = 'googtrans=/en/fr; path=/'
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr'] })
    await openWidget(wrapper)

    expect(wrapper.find('[aria-selected="true"]').text()).toContain('Français')
  })

  it('filters by English name, native name or code, and announces the count', async () => {
    const wrapper = await mountWidget({ includedLanguages: ['en', 'fr', 'de', 'yo'] })
    await openWidget(wrapper)
    const search = wrapper.find('input')

    await search.setValue('deutsch')
    expect(wrapper.findAll('.gtw-language-native').map(n => n.text())).toEqual(['Deutsch'])
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('1 language')

    await search.setValue('yo')
    expect(wrapper.findAll('.gtw-language-name').map(n => n.text())).toEqual(['Yoruba'])
  })

  it('shows the empty state when nothing matches', async () => {
    const wrapper = await mountWidget()
    await openWidget(wrapper)
    await wrapper.find('input').setValue('klingon')

    expect(wrapper.find('.gtw-no-results').exists()).toBe(true)
    expect(wrapper.find('[aria-live="polite"]').text()).toBe('0 languages')
  })

  it('closes on Escape and returns focus to the button', async () => {
    const wrapper = await mountWidget()
    await openWidget(wrapper)

    await press(wrapper.find('input'), 'Escape')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('.gtw-float-button').element)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when the overlay or close button is clicked', async () => {
    const wrapper = await mountWidget()
    await openWidget(wrapper)
    await wrapper.find('.gtw-modal-overlay').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await openWidget(wrapper)
    await wrapper.find('.gtw-close-button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('keeps Tab focus inside the dialog (B11)', async () => {
    const wrapper = await mountWidget()
    await openWidget(wrapper)
    const close = wrapper.find('.gtw-close-button')
    const input = wrapper.find('input')

    input.element.focus()
    await press(wrapper.find('[role="dialog"]'), 'Tab')
    expect(document.activeElement).toBe(close.element)

    await press(wrapper.find('[role="dialog"]'), 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(input.element)
  })

  it('locks page scroll while open, and unlocks on close or unmount (B15)', async () => {
    const wrapper = await mountWidget()
    await openWidget(wrapper)
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.find('.gtw-close-button').trigger('click')
    expect(document.body.style.overflow).toBe('')

    await openWidget(wrapper)
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('shows an error and emits it when Google can’t load (B7)', async () => {
    const wrapper = mount(GoogleTranslateWidget, { props: { errorText: 'Offline' }, attachTo: document.body })
    document.querySelector('script')!.dispatchEvent(new Event('error'))
    await flushPromises()
    await openWidget(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toBe('Offline')
    expect(wrapper.emitted('error')![0][0]).toBeInstanceOf(Error)
  })

  it('keeps native language names untranslated (B19)', async () => {
    const wrapper = await mountWidget({ includedLanguages: ['de'] })
    await openWidget(wrapper)

    const native = wrapper.find('.gtw-language-native')
    expect(native.attributes('translate')).toBe('no')
    expect(native.classes()).toContain('notranslate')
  })

  it('renders flags from flagUrl, a code badge when there is no flag, or nothing (B16)', async () => {
    const wrapper = await mountWidget({
      includedLanguages: ['fr', 'eo'],
      showFlags: true,
      flagUrl: (f: string) => `/flags/${f}.svg`,
    })
    await openWidget(wrapper)

    expect(wrapper.find('img.gtw-flag').attributes('src')).toBe('/flags/fr.svg')
    expect(wrapper.find('.gtw-flag-code').text()).toBe('eo')

    await wrapper.setProps({ showFlags: false })
    expect(wrapper.find('.gtw-flag').exists()).toBe(false)
  })

  describe('v-model:language', () => {
    it('changes the language when the bound value changes', async () => {
      const wrapper = await mountWidget({ language: 'en' })
      await wrapper.setProps({ language: 'de' })
      await flushPromises()

      expect(combo().value).toBe('de')
      expect(wrapper.emitted('update:language')).toEqual([['de']])
    })

    it('reports the page’s saved language on load', async () => {
      document.cookie = 'googtrans=/en/fr; path=/'
      const wrapper = await mountWidget({ language: 'en' })

      expect(wrapper.emitted('update:language')).toEqual([['fr']])
    })
  })
})

describe('GoogleTranslateButton', () => {
  it('renders the button text and custom class', async () => {
    const wrapper = await mountButton({ buttonText: 'Language', buttonClass: 'my-btn' })
    const button = wrapper.find('button')

    expect(button.text()).toContain('Language')
    expect(button.classes()).toContain('my-btn')
    expect(button.attributes('aria-haspopup')).toBe('listbox')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('toggles a listbox on click', async () => {
    const wrapper = await mountButton({ includedLanguages: ['en', 'fr'] })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
    expect(document.activeElement).toBe(wrapper.find('[role="listbox"]').element)

    await wrapper.find('button').trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('has no axe violations when open', async () => {
    const wrapper = await mountButton({ includedLanguages: ['en', 'fr', 'eo'] })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await expectNoA11yViolations(wrapper.element)
  })

  it('opens with ArrowDown and is fully keyboard operable (B11)', async () => {
    const wrapper = await mountButton({ includedLanguages: ['en', 'fr', 'de'] })
    await press(wrapper.find('button'), 'ArrowDown')
    await flushPromises()
    const list = wrapper.find('[role="listbox"]')
    const active = () => document.getElementById(list.attributes('aria-activedescendant')!)?.textContent

    expect(document.activeElement).toBe(list.element)
    expect(active()).toContain('English')
    await press(list, 'ArrowDown')
    await press(list, 'ArrowDown')
    expect(active()).toContain('Deutsch')
    await press(list, 'Home')
    expect(active()).toContain('English')

    await press(list, 'End')
    await press(list, ' ')
    await flushPromises()
    expect(combo().value).toBe('de')
  })

  it('emits change and update:language after the change is applied (B10)', async () => {
    const wrapper = await mountButton({ includedLanguages: ['en', 'fr'] })
    let comboValueAtEmit = ''
    wrapper.vm.$.vnode.props = {
      ...wrapper.vm.$.vnode.props,
      onChange: () => (comboValueAtEmit = combo().value),
    }
    await wrapper.find('button').trigger('click')
    await flushPromises()

    const french = wrapper.findAll('[role="option"]').find(option => option.text().includes('Français'))!
    await french.trigger('click')
    await flushPromises()

    expect(comboValueAtEmit).toBe('fr')
    expect(wrapper.emitted('change')).toEqual([['fr']])
    expect(wrapper.emitted('languageChanged')).toBeUndefined() // removed in 2.0
    expect(wrapper.emitted('update:language')).toEqual([['fr']])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('returns focus to the button after choosing (aria-disabled, not disabled)', async () => {
    const wrapper = await mountButton({ includedLanguages: ['en', 'fr'] })
    await press(wrapper.find('button'), 'ArrowDown')
    await flushPromises()
    const list = wrapper.find('[role="listbox"]')

    await press(list, 'ArrowDown')
    await press(list, 'Enter')
    expect(wrapper.find('button').attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.find('button').element)
    expect(wrapper.find('button').attributes('aria-disabled')).toBeUndefined()
  })

  it('closes on Escape (focus back to the button) and on Tab', async () => {
    const wrapper = await mountButton()
    await press(wrapper.find('button'), 'ArrowDown')
    await flushPromises()
    await press(wrapper.find('[role="listbox"]'), 'Escape')
    await flushPromises()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('button').element)

    await press(wrapper.find('button'), 'ArrowDown')
    await flushPromises()
    await press(wrapper.find('[role="listbox"]'), 'Tab')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('closes on an outside click', async () => {
    const wrapper = await mountButton()
    await wrapper.find('button').trigger('click')

    document.body.click()
    await flushPromises()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('closes when another GoogleTranslateButton is opened (B17)', async () => {
    const first = await mountButton()
    const second = mount(GoogleTranslateButton, { attachTo: document.body })
    await flushPromises()

    await first.find('button').trigger('click')
    await second.find('button').trigger('click')
    await flushPromises()

    expect(first.find('[role="listbox"]').exists()).toBe(false)
    expect(second.find('[role="listbox"]').exists()).toBe(true)
  })

  it('removes its document listener when unmounted (B1)', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = await mountButton()
    wrapper.unmount()

    expect(remove).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('emits error when the change fails', async () => {
    const wrapper = await mountButton({
      languages: [{ name: 'Klingon', nativeName: 'tlhIngan Hol', code: 'tlh', flag: '' }],
    })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    await wrapper.find('[role="option"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('error')![0][0]).toBeInstanceOf(Error)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('keeps native language names untranslated (B19)', async () => {
    const wrapper = await mountButton({ includedLanguages: ['de'] })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.gtb-language-name').attributes('translate')).toBe('no')
  })
})

describe('Widget and Button together', () => {
  it('share one Google script, one host element and one language (B2)', async () => {
    installFakeGoogle()
    const widget = mount(GoogleTranslateWidget, { attachTo: document.body })
    const button = mount(GoogleTranslateButton, { attachTo: document.body })
    await flushPromises()

    expect(document.querySelectorAll('#gtw-google-translate-host')).toHaveLength(1)
    expect(document.querySelectorAll('select.goog-te-combo')).toHaveLength(1)

    await button.find('button').trigger('click')
    await flushPromises()
    const french = button.findAll('[role="option"]').find(option => option.text().includes('Français'))!
    await french.trigger('click')
    await flushPromises()

    await openWidget(widget)
    expect(widget.find('[aria-selected="true"]').text()).toContain('Français')
  })
})
