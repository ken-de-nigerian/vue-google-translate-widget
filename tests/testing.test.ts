import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_LANGUAGES, useGoogleTranslate } from '../src'
import { installFakeGoogleTranslate, resetGoogleTranslate } from '../src/testing'

const combo = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo')!

describe('/testing: installFakeGoogleTranslate', () => {
  it('offers every built-in language by default', async () => {
    installFakeGoogleTranslate()
    await useGoogleTranslate().initializeTranslate()
    expect(Array.from(combo().options).map(o => o.value)).toEqual(['', ...DEFAULT_LANGUAGES.map(l => l.code)])
  })

  it('translates, restores in place, and reports what happened', async () => {
    const fake = installFakeGoogleTranslate()
    const { changeLanguage, currentLanguage } = useGoogleTranslate()

    await changeLanguage('ar')
    expect(document.documentElement.classList.contains('translated-rtl')).toBe(true)
    expect(document.cookie).toContain('googtrans=/en/ar')

    await changeLanguage('en')
    expect(fake.restoreClicks).toBe(1)
    expect(currentLanguage.value).toBe('en')
    expect(fake.constructed).toEqual([{ pageLanguage: 'en', autoDisplay: false }])
  })

  it('rejects languages it was not given', async () => {
    installFakeGoogleTranslate({ languages: ['fr'] })
    await expect(useGoogleTranslate().changeLanguage('de')).rejects.toThrow('does not support')
  })

  it('puts back the previous window.google on uninstall', () => {
    const maps = { maps: { Map: class {} } }
    window.google = maps
    const fake = installFakeGoogleTranslate()
    expect(window.google.maps).toBe(maps.maps)
    fake.uninstall()
    expect(window.google).toBe(maps)
  })

  it('falls back to a reload when iframes have no document (happy-dom default)', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
    const contentDocument = vi.spyOn(HTMLIFrameElement.prototype, 'contentDocument', 'get').mockReturnValue(null)
    installFakeGoogleTranslate()
    const { changeLanguage } = useGoogleTranslate()

    await changeLanguage('fr')
    await changeLanguage('en')

    expect(reload).toHaveBeenCalledOnce()
    contentDocument.mockRestore()
  })
})

describe('/testing: resetGoogleTranslate', () => {
  it('lets the next test start from scratch', async () => {
    installFakeGoogleTranslate()
    const first = useGoogleTranslate()
    await first.changeLanguage('fr')

    resetGoogleTranslate()

    expect(document.cookie).not.toContain('googtrans=/')
    expect(document.documentElement.className).toBe('')
    expect(document.getElementById('gtw-google-translate-host')).toBeNull()
    expect(document.getElementById('gtw-hide-branding')).toBeNull()
    const second = useGoogleTranslate()
    expect(second.currentLanguage.value).toBe('en')
    expect(second.status.value).toBe('idle')
  })
})
