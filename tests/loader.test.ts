import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SCRIPT_SRC, HOST_ELEMENT_ID, loadGoogleTranslate } from '../src/core/loader'
import { fireGoogleCallback, installFakeGoogle } from './helpers/fakeGoogle'

const scripts = () => document.querySelectorAll<HTMLScriptElement>('script[src*="cb=__gtwGoogleTranslateInit"]')

describe('loadGoogleTranslate', () => {
  it('injects one https script and one hidden host element, however often it is called (B2, B13)', async () => {
    const first = loadGoogleTranslate({ pageLanguage: 'en' })
    const second = loadGoogleTranslate({ pageLanguage: 'en' })

    expect(second).toBe(first)
    expect(scripts()).toHaveLength(1)
    expect(scripts()[0].src).toBe(`${DEFAULT_SCRIPT_SRC}?cb=__gtwGoogleTranslateInit`)
    const hosts = document.querySelectorAll(`#${HOST_ELEMENT_ID}`)
    expect(hosts).toHaveLength(1)
    expect((hosts[0] as HTMLElement).style.display).toBe('none')

    installFakeGoogle()
    fireGoogleCallback()
    await expect(first).resolves.toBeInstanceOf(HTMLSelectElement)
  })

  it('creates exactly one TranslateElement, with the default layout and no includedLanguages', async () => {
    const promise = loadGoogleTranslate({ pageLanguage: 'fr', autoDisplay: true })
    const fake = installFakeGoogle()
    fireGoogleCallback()
    await promise
    await loadGoogleTranslate({ pageLanguage: 'fr' })

    expect(fake.constructed).toEqual([{ pageLanguage: 'fr', autoDisplay: true }])
  })

  it('resolves with Google’s language select', async () => {
    installFakeGoogle({ languages: ['fr', 'de'] })
    const combo = await loadGoogleTranslate({ pageLanguage: 'en' })

    expect(combo.className).toBe('goog-te-combo')
    expect(Array.from(combo.options).map(o => o.value)).toEqual(['', 'fr', 'de'])
  })

  it('reuses a Google script that is already on the page', async () => {
    installFakeGoogle()
    await loadGoogleTranslate({ pageLanguage: 'en' })

    expect(scripts()).toHaveLength(0)
  })

  it('waits for the select if Google renders it later (B8)', async () => {
    const promise = loadGoogleTranslate({ pageLanguage: 'en' })
    vi.stubGlobal('google', {
      translate: {
        TranslateElement: class {
          constructor(_: unknown, id: string) {
            setTimeout(() => {
              const select = document.createElement('select')
              select.className = 'goog-te-combo'
              document.getElementById(id)!.appendChild(select)
            }, 20)
          }
        },
      },
    })
    fireGoogleCallback()

    await expect(promise).resolves.toBeInstanceOf(HTMLSelectElement)
  })

  it('supports a custom script URL and CSP nonce', () => {
    loadGoogleTranslate({ pageLanguage: 'en', scriptSrc: 'https://proxy.example.com/gt.js?v=2', nonce: 'abc123' })

    expect(scripts()[0].src).toBe('https://proxy.example.com/gt.js?v=2&cb=__gtwGoogleTranslateInit')
    expect(scripts()[0].nonce).toBe('abc123')
  })

  it('rejects when the script fails to load, and lets a later call retry (B7)', async () => {
    const promise = loadGoogleTranslate({ pageLanguage: 'en' })
    scripts()[0].dispatchEvent(new Event('error'))

    await expect(promise).rejects.toThrow(/Failed to load Google Translate/)
    expect(scripts()).toHaveLength(0)

    const retry = loadGoogleTranslate({ pageLanguage: 'en' })
    expect(retry).not.toBe(promise)
    expect(scripts()).toHaveLength(1)
    installFakeGoogle()
    fireGoogleCallback()
    await expect(retry).resolves.toBeInstanceOf(HTMLSelectElement)
  })

  it('rejects after the timeout and leaves no timers or observers behind (B7, B8)', async () => {
    vi.useFakeTimers()
    const promise = loadGoogleTranslate({ pageLanguage: 'en', timeout: 2000 })
    const assertion = expect(promise).rejects.toThrow(/did not load within 2000ms/)

    await vi.advanceTimersByTimeAsync(2000)
    await assertion
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects if Google’s script loads without TranslateElement', async () => {
    const promise = loadGoogleTranslate({ pageLanguage: 'en' })
    vi.stubGlobal('google', {})
    fireGoogleCallback()

    await expect(promise).rejects.toThrow(/without google.translate.TranslateElement/)
  })

  it('warns when a second caller asks for a different page language', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    loadGoogleTranslate({ pageLanguage: 'en' })
    loadGoogleTranslate({ pageLanguage: 'en' })
    expect(warn).not.toHaveBeenCalled()

    loadGoogleTranslate({ pageLanguage: 'fr' })
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('pageLanguage "en"')
  })
})
