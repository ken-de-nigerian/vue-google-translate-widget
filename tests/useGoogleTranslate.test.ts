import { describe, expect, it, vi } from 'vitest'
import { useGoogleTranslate } from '../src'
import { stubReload } from './setup'

describe('useGoogleTranslate', () => {
  describe('language list', () => {
    it('ships 100+ languages with unique codes', () => {
      const { languages } = useGoogleTranslate()
      const codes = languages.map(lang => lang.code)

      expect(languages.length).toBeGreaterThanOrEqual(100)
      expect(new Set(codes).size).toBe(codes.length)
    })

    it('gives every language a name, native name and flag', () => {
      const { languages } = useGoogleTranslate()

      for (const lang of languages) {
        expect(lang.name, lang.code).toBeTruthy()
        expect(lang.nativeName, lang.code).toBeTruthy()
        expect(lang.flag, lang.code).toBeTruthy()
      }
    })

    it('filters to includedLanguages', () => {
      const { languages } = useGoogleTranslate({ includedLanguages: ['fr', 'yo', 'de'] })

      expect(languages.map(lang => lang.code).sort()).toEqual(['de', 'fr', 'yo'])
    })

    it('uses a custom language list', () => {
      const custom = [{ name: 'Igbo', nativeName: 'Igbo', code: 'ig', flag: 'ng' }]
      const { languages } = useGoogleTranslate({ languages: custom })

      expect(languages).toEqual(custom)
    })
  })

  describe('getCurrentLanguage', () => {
    it('falls back to defaultLanguage when nothing is stored', () => {
      const { getCurrentLanguage } = useGoogleTranslate({ defaultLanguage: 'en' })

      expect(getCurrentLanguage()).toBe('en')
    })

    it('reads the target language from the googtrans cookie', () => {
      document.cookie = 'googtrans=/en/fr; path=/'
      const { getCurrentLanguage } = useGoogleTranslate()

      expect(getCurrentLanguage()).toBe('fr')
    })

    it('reads the target language from a #googtrans(en|de) hash', () => {
      window.location.hash = '#googtrans(en|de)'
      const { getCurrentLanguage } = useGoogleTranslate()

      expect(getCurrentLanguage()).toBe('de')
    })

    it('prefers the hash over the cookie', () => {
      document.cookie = 'googtrans=/en/fr; path=/'
      window.location.hash = '#googtrans(en|de)'
      const { getCurrentLanguage } = useGoogleTranslate()

      expect(getCurrentLanguage()).toBe('de')
    })
  })

  describe('initializeTranslate', () => {
    it('injects the Google script once', () => {
      vi.useFakeTimers()
      const first = useGoogleTranslate()
      const second = useGoogleTranslate()

      first.initializeTranslate()
      second.initializeTranslate()

      const scripts = document.querySelectorAll('script#google-translate-script')
      expect(scripts).toHaveLength(1)
      expect(scripts[0].getAttribute('src')).toContain('translate.google.com/translate_a/element.js')
    })

    it('syncs currentLanguage from the cookie', () => {
      vi.useFakeTimers()
      document.cookie = 'googtrans=/en/es; path=/'
      const { currentLanguage, initializeTranslate } = useGoogleTranslate()

      initializeTranslate()

      expect(currentLanguage.value).toBe('es')
    })

    it('stops polling for the Google combo box after 5 seconds', () => {
      vi.useFakeTimers()
      const { initializeTranslate } = useGoogleTranslate()

      initializeTranslate()
      vi.advanceTimersByTime(5000)

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('changeLanguage', () => {
    it('writes the googtrans cookie and reloads', () => {
      const reload = stubReload()
      const { changeLanguage, currentLanguage, isChangingLanguage } = useGoogleTranslate()

      changeLanguage('fr')

      expect(document.cookie).toContain('googtrans=/en/fr')
      expect(currentLanguage.value).toBe('fr')
      expect(isChangingLanguage.value).toBe(true)
      expect(reload).toHaveBeenCalledOnce()
    })

    it('clears the cookie and reloads when switching back to the default language', () => {
      const reload = stubReload()
      document.cookie = 'googtrans=/en/fr; path=/'
      const { changeLanguage, currentLanguage } = useGoogleTranslate()

      changeLanguage('en')

      expect(document.cookie).not.toContain('googtrans=/en/fr')
      expect(currentLanguage.value).toBe('en')
      expect(reload).toHaveBeenCalledOnce()
    })

    it('ignores calls while a change is in progress', () => {
      const reload = stubReload()
      const { changeLanguage } = useGoogleTranslate()

      changeLanguage('fr')
      changeLanguage('de')

      expect(document.cookie).toContain('googtrans=/en/fr')
      expect(reload).toHaveBeenCalledOnce()
    })

    it('drives the Google combo box when it exists', () => {
      vi.useFakeTimers()
      const reload = stubReload()
      const combo = document.createElement('select')
      combo.className = 'goog-te-combo'
      combo.innerHTML = '<option value=""></option><option value="fr">fr</option>'
      const onChange = vi.fn()
      combo.addEventListener('change', onChange)
      document.body.appendChild(combo)
      const { changeLanguage } = useGoogleTranslate()

      changeLanguage('fr')

      expect(combo.value).toBe('fr')
      expect(onChange).toHaveBeenCalledOnce()
      expect(reload).not.toHaveBeenCalled()
      vi.advanceTimersByTime(300)
      expect(reload).toHaveBeenCalledOnce()
    })
  })
})
