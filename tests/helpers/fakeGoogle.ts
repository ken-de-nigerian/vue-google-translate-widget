import { vi } from 'vitest'

export interface FakeGoogle {
  /** Options each TranslateElement was constructed with. */
  constructed: Record<string, unknown>[]
  /** Clicks on Google's "Show original" button. */
  restoreClicks: number
}

/**
 * Mimics what the real Website Translator does (as observed in a browser on
 * 2026-11-02): renders `select.goog-te-combo` into the host element, marks
 * <html> as translated when the select changes, writes the googtrans cookie,
 * and puts a "Show original" button in a same-origin iframe.
 */
export function installFakeGoogle({ languages = ['fr', 'de', 'ar', 'iw', 'jw', 'yo'] } = {}): FakeGoogle {
  const fake: FakeGoogle = { constructed: [], restoreClicks: 0 }

  class TranslateElement {
    constructor(options: Record<string, unknown>, elementId: string) {
      fake.constructed.push(options)
      const host = document.getElementById(elementId)!
      const select = document.createElement('select')
      select.className = 'goog-te-combo'
      for (const code of ['', ...languages]) {
        const option = document.createElement('option')
        option.value = code
        select.appendChild(option)
      }
      select.addEventListener('change', () => {
        const rtl = ['ar', 'iw', 'fa', 'ur', 'yi'].includes(select.value)
        document.documentElement.className = select.value ? (rtl ? 'translated-rtl' : 'translated-ltr') : ''
        document.cookie = `googtrans=/en/${select.value}; path=/`
      })
      host.appendChild(select)

      const banner = document.createElement('iframe')
      banner.className = 'skiptranslate'
      document.body.appendChild(banner)
      const restore = banner.contentDocument!.createElement('button')
      restore.id = ':1.restore'
      restore.addEventListener('click', () => {
        fake.restoreClicks++
        document.documentElement.className = ''
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      })
      banner.contentDocument!.body.appendChild(restore)
    }
  }

  vi.stubGlobal('google', { translate: { TranslateElement } })
  return fake
}

/** Runs Google's script callback, as the real script does once it has loaded. */
export function fireGoogleCallback(): void {
  const callback = (window as unknown as Record<string, () => void>).__gtwGoogleTranslateInit
  if (!callback) throw new Error('The loader has not registered its callback yet')
  callback()
}
