import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useGoogleTranslate } from '../src'
import { installFakeGoogle } from './helpers/fakeGoogle'
import { stubReload } from './setup'

const combo = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo')!
const htmlClass = () => document.documentElement.className

describe('useGoogleTranslate', () => {
  describe('languages', () => {
    it('ships 100+ languages', () => {
      expect(useGoogleTranslate().languages.length).toBeGreaterThanOrEqual(100)
    })

    it('filters to includedLanguages, accepting modern aliases', () => {
      const { languages } = useGoogleTranslate({ includedLanguages: ['fr', 'he', 'jv'] })
      expect(languages.map(lang => lang.code).sort()).toEqual(['fr', 'iw', 'jw'])
    })

    it('uses a custom language list', () => {
      const custom = [{ name: 'Igbo', nativeName: 'Igbo', code: 'ig', flag: 'ng' }]
      expect([...useGoogleTranslate({ languages: custom }).languages]).toEqual(custom)
    })

    it('updates when includedLanguages changes (B5)', async () => {
      const included = ref(['fr'])
      const { languages } = useGoogleTranslate({ includedLanguages: included })
      expect(languages.map(lang => lang.code)).toEqual(['fr'])

      included.value = ['de', 'yo']
      await nextTick()
      expect(languages.map(lang => lang.code)).toEqual(['de', 'yo'])
    })

    it('updates when a languages getter changes (B5)', async () => {
      const list = ref([{ name: 'Igbo', nativeName: 'Igbo', code: 'ig', flag: 'ng' }])
      const { languages } = useGoogleTranslate({ languages: () => list.value })

      list.value = [...list.value, { name: 'Hausa', nativeName: 'Hausa', code: 'ha', flag: 'ng' }]
      await nextTick()
      expect(languages.map(lang => lang.code)).toEqual(['ig', 'ha'])
    })
  })

  describe('current language', () => {
    it('starts at defaultLanguage, not a hard-coded "en" (B6)', () => {
      expect(useGoogleTranslate({ defaultLanguage: 'fr' }).currentLanguage.value).toBe('fr')
    })

    it('starts at the saved language before Google loads (B6)', () => {
      document.cookie = 'googtrans=/en/de; path=/'
      expect(useGoogleTranslate().currentLanguage.value).toBe('de')
    })

    it('reads #googtrans(en|fr) from the URL', () => {
      window.location.hash = '#googtrans(en|fr)'
      expect(useGoogleTranslate().getCurrentLanguage()).toBe('fr')
    })

    it('is shared by every instance on the page', async () => {
      installFakeGoogle()
      const a = useGoogleTranslate()
      const b = useGoogleTranslate()

      await a.changeLanguage('fr')
      expect(b.currentLanguage.value).toBe('fr')
    })
  })

  describe('initializeTranslate', () => {
    it('goes idle → loading → ready (B7)', async () => {
      const { status, isReady, initializeTranslate } = useGoogleTranslate()
      expect(status.value).toBe('idle')

      installFakeGoogle()
      const done = initializeTranslate()
      expect(status.value).toBe('loading')
      await done

      expect(status.value).toBe('ready')
      expect(isReady.value).toBe(true)
    })

    it('reports a blocked script through status and error, without rejecting (B7)', async () => {
      const { status, error, initializeTranslate } = useGoogleTranslate()
      const done = initializeTranslate()
      document.querySelector('script')!.dispatchEvent(new Event('error'))

      await expect(done).resolves.toBeUndefined()
      expect(status.value).toBe('error')
      expect(error.value?.message).toMatch(/Failed to load Google Translate/)
    })

    it('hides Google’s branding by default (B14)', async () => {
      installFakeGoogle()
      await useGoogleTranslate({ nonce: 'n0nce' }).initializeTranslate()

      const style = document.getElementById('gtw-hide-branding') as HTMLStyleElement
      expect(style.textContent).toContain('body { top: 0 !important; }')
      expect(style.textContent).toContain('iframe.skiptranslate')
      expect(style.nonce).toBe('n0nce')
    })

    it('leaves Google’s branding alone with hideBranding: false', async () => {
      installFakeGoogle()
      await useGoogleTranslate({ hideBranding: false }).initializeTranslate()

      expect(document.getElementById('gtw-hide-branding')).toBeNull()
    })

    it('applies a saved language if Google hasn’t yet', async () => {
      installFakeGoogle()
      document.cookie = 'googtrans=/en/de; path=/'
      await useGoogleTranslate().initializeTranslate()

      expect(combo().value).toBe('de')
      expect(htmlClass()).toBe('translated-ltr')
    })
  })

  describe('changeLanguage (live mode, the default)', () => {
    it('translates in place without reloading (B3)', async () => {
      const reload = stubReload()
      installFakeGoogle()
      const { changeLanguage, currentLanguage, isChangingLanguage } = useGoogleTranslate()

      const pending = changeLanguage('fr')
      expect(isChangingLanguage.value).toBe(true)
      await pending

      expect(reload).not.toHaveBeenCalled()
      expect(combo().value).toBe('fr')
      expect(htmlClass()).toBe('translated-ltr')
      expect(document.cookie).toContain('googtrans=/en/fr')
      expect(currentLanguage.value).toBe('fr')
      expect(isChangingLanguage.value).toBe(false)
    })

    it('loads Google first if needed', async () => {
      const { changeLanguage, status } = useGoogleTranslate()
      installFakeGoogle()
      await changeLanguage('de')

      expect(status.value).toBe('ready')
      expect(combo().value).toBe('de')
    })

    it('waits until Google has applied the change', async () => {
      installFakeGoogle()
      const { changeLanguage, initializeTranslate } = useGoogleTranslate()
      await initializeTranslate()
      // Delay Google's reaction like the real widget does.
      combo().addEventListener('change', e => e.stopImmediatePropagation(), { capture: true, once: true })
      setTimeout(() => (document.documentElement.className = 'translated-ltr'), 50)

      let settled = false
      const pending = changeLanguage('fr').then(() => (settled = true))
      await new Promise(r => setTimeout(r, 20))
      expect(settled).toBe(false)
      await pending
      expect(settled).toBe(true)
    })

    it('translates modern codes to Google’s (B9)', async () => {
      installFakeGoogle()
      const { changeLanguage, currentLanguage } = useGoogleTranslate()
      await changeLanguage('he')

      expect(combo().value).toBe('iw')
      expect(currentLanguage.value).toBe('iw')
      expect(htmlClass()).toBe('translated-rtl')
    })

    it('rejects an unsupported code and rolls back', async () => {
      installFakeGoogle({ languages: ['fr'] })
      const { changeLanguage, currentLanguage, isChangingLanguage, error } = useGoogleTranslate()

      await expect(changeLanguage('tlh')).rejects.toThrow('does not support the language code "tlh"')
      expect(currentLanguage.value).toBe('en')
      expect(isChangingLanguage.value).toBe(false)
      expect(error.value?.message).toContain('"tlh"')
      expect(combo().value).toBe('')
    })

    it('rejects when Google can’t be loaded', async () => {
      const { changeLanguage, status } = useGoogleTranslate()
      const pending = changeLanguage('fr')
      document.querySelector('script')!.dispatchEvent(new Event('error'))

      await expect(pending).rejects.toThrow(/Failed to load/)
      expect(status.value).toBe('error')
    })

    it('ignores a second call while one is in progress', async () => {
      installFakeGoogle()
      const { changeLanguage } = useGoogleTranslate()

      const first = changeLanguage('fr')
      await changeLanguage('de')
      await first

      expect(combo().value).toBe('fr')
    })

    it('drops a #googtrans hash so it can’t override the new choice', async () => {
      installFakeGoogle()
      window.history.replaceState(null, '', '/#googtrans(en|de)')
      await useGoogleTranslate().changeLanguage('fr')

      expect(window.location.hash).toBe('')
    })
  })

  describe('changeLanguage (reload mode)', () => {
    it('writes the cookie and reloads, without loading Google', async () => {
      const reload = stubReload()
      window.history.replaceState(null, '', '/#googtrans(en|de)')
      const { changeLanguage, currentLanguage, isChangingLanguage } = useGoogleTranslate({ mode: 'reload' })

      await changeLanguage('fr')

      expect(reload).toHaveBeenCalledOnce()
      expect(document.cookie).toContain('googtrans=/en/fr')
      expect(window.location.hash).toBe('')
      expect(currentLanguage.value).toBe('fr')
      expect(isChangingLanguage.value).toBe(true)
      expect(document.querySelector('script')).toBeNull()
    })
  })

  describe('restoring the original language', () => {
    it('clicks Google’s "Show original" instead of reloading', async () => {
      const reload = stubReload()
      const fake = installFakeGoogle()
      const { changeLanguage, currentLanguage } = useGoogleTranslate()
      await changeLanguage('fr')

      await changeLanguage('en')

      expect(fake.restoreClicks).toBe(1)
      expect(reload).not.toHaveBeenCalled()
      expect(htmlClass()).toBe('')
      expect(combo().value).toBe('')
      expect(document.cookie).not.toContain('googtrans=/')
      expect(currentLanguage.value).toBe('en')
    })

    it('restoreOriginal() does the same', async () => {
      const fake = installFakeGoogle()
      const { changeLanguage, restoreOriginal } = useGoogleTranslate()
      await changeLanguage('de')
      await restoreOriginal()

      expect(fake.restoreClicks).toBe(1)
      expect(htmlClass()).toBe('')
    })

    it('reloads with reloadOnRestore: true', async () => {
      const reload = stubReload()
      const fake = installFakeGoogle()
      const { changeLanguage } = useGoogleTranslate({ reloadOnRestore: true })
      await changeLanguage('fr')
      await changeLanguage('en')

      expect(fake.restoreClicks).toBe(0)
      expect(reload).toHaveBeenCalledOnce()
      expect(document.cookie).not.toContain('googtrans=/')
    })

    it('falls back to a reload when the "Show original" button is missing', async () => {
      const reload = stubReload()
      installFakeGoogle()
      const { changeLanguage } = useGoogleTranslate()
      await changeLanguage('fr')
      document.querySelectorAll('iframe').forEach(frame => frame.remove())

      await changeLanguage('en')
      expect(reload).toHaveBeenCalledOnce()
    })

    it('falls back to a reload when "Show original" does nothing', async () => {
      const reload = stubReload()
      installFakeGoogle()
      const { changeLanguage } = useGoogleTranslate()
      await changeLanguage('fr')
      const restore = document.querySelector('iframe')!.contentDocument!.querySelector('[id$=".restore"]')!
      restore.addEventListener('click', e => e.stopImmediatePropagation(), { capture: true })

      vi.useFakeTimers()
      const pending = changeLanguage('en')
      await vi.advanceTimersByTimeAsync(3000)
      await pending

      expect(reload).toHaveBeenCalledOnce()
    })

    it('does nothing visible when the page isn’t translated', async () => {
      const reload = stubReload()
      const fake = installFakeGoogle()
      document.cookie = 'googtrans=/en/fr; path=/'
      const { restoreOriginal, currentLanguage } = useGoogleTranslate()

      await restoreOriginal()

      expect(reload).not.toHaveBeenCalled()
      expect(fake.restoreClicks).toBe(0)
      expect(currentLanguage.value).toBe('en')
      expect(document.cookie).not.toContain('googtrans=/')
    })
  })
})
