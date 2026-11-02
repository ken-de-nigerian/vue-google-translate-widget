import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { GoogleTranslateButton, GoogleTranslateWidget } from '../src'
import { stubReload } from './setup'

describe('GoogleTranslateWidget', () => {
  it('renders only the floating button until opened', () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget)

    expect(wrapper.find('.gtw-float-button').exists()).toBe(true)
    expect(wrapper.find('.gtw-modal').exists()).toBe(false)
  })

  it('loads the Google script on mount', () => {
    vi.useFakeTimers()
    mount(GoogleTranslateWidget)

    expect(document.getElementById('google-translate-script')).not.toBeNull()
  })

  it('opens the modal with the title and the language list', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget, {
      props: { title: 'Pick a language', includedLanguages: ['en', 'fr', 'yo'] },
    })

    await wrapper.find('.gtw-float-button').trigger('click')

    expect(wrapper.find('.gtw-modal-title').text()).toBe('Pick a language')
    expect(wrapper.findAll('.gtw-language-item')).toHaveLength(3)
  })

  it('filters by English name, native name or code', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget, { props: { includedLanguages: ['en', 'fr', 'de', 'yo'] } })
    await wrapper.find('.gtw-float-button').trigger('click')
    const search = wrapper.find('.gtw-search-input')

    await search.setValue('deutsch')
    expect(wrapper.findAll('.gtw-language-native').map(n => n.text())).toEqual(['Deutsch'])

    await search.setValue('yo')
    expect(wrapper.findAll('.gtw-language-name').map(n => n.text())).toEqual(['Yoruba'])
  })

  it('shows the empty state when nothing matches', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget)
    await wrapper.find('.gtw-float-button').trigger('click')

    await wrapper.find('.gtw-search-input').setValue('klingon')

    expect(wrapper.find('.gtw-no-results').exists()).toBe(true)
  })

  it('hides flags when showFlags is false', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget, { props: { showFlags: false } })
    await wrapper.find('.gtw-float-button').trigger('click')

    expect(wrapper.find('.gtw-flag').exists()).toBe(false)
  })

  it('changes language when an item is clicked', async () => {
    vi.useFakeTimers()
    const reload = stubReload()
    const wrapper = mount(GoogleTranslateWidget, { props: { includedLanguages: ['en', 'fr'] } })
    await wrapper.find('.gtw-float-button').trigger('click')

    const french = wrapper.findAll('.gtw-language-item').find(item => item.text().includes('Français'))
    await french!.trigger('click')

    expect(document.cookie).toContain('googtrans=/en/fr')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('closes when the overlay is clicked', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateWidget)
    await wrapper.find('.gtw-float-button').trigger('click')

    await wrapper.find('.gtw-modal-overlay').trigger('click')

    expect(wrapper.find('.gtw-modal-overlay').exists()).toBe(false)
  })
})

describe('GoogleTranslateButton', () => {
  it('renders the button text', () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateButton, { props: { buttonText: 'Language' } })

    expect(wrapper.find('.gtb-button').text()).toContain('Language')
  })

  it('applies a custom button class', () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateButton, { props: { buttonClass: 'my-btn' } })

    expect(wrapper.find('.gtb-button').classes()).toContain('my-btn')
  })

  it('toggles the dropdown', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateButton, { props: { includedLanguages: ['en', 'fr'] } })

    await wrapper.find('.gtb-button').trigger('click')
    expect(wrapper.findAll('.gtb-dropdown-item')).toHaveLength(2)

    await wrapper.find('.gtb-button').trigger('click')
    expect(wrapper.find('.gtb-dropdown').exists()).toBe(false)
  })

  it('emits languageChanged and closes when a language is picked', async () => {
    vi.useFakeTimers()
    stubReload()
    const wrapper = mount(GoogleTranslateButton, { props: { includedLanguages: ['en', 'fr'] } })
    await wrapper.find('.gtb-button').trigger('click')

    const french = wrapper.findAll('.gtb-dropdown-item').find(item => item.text().includes('Français'))
    await french!.trigger('click')

    expect(wrapper.emitted('languageChanged')).toEqual([['fr']])
    expect(wrapper.find('.gtb-dropdown').exists()).toBe(false)
  })

  it('closes the dropdown on an outside click', async () => {
    vi.useFakeTimers()
    const wrapper = mount(GoogleTranslateButton)
    await wrapper.find('.gtb-button').trigger('click')

    document.body.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.gtb-dropdown').exists()).toBe(false)
  })
})
