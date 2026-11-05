/**
 * Test helpers for apps that use this package. Import from
 * `@ken_de_nigerian/vue-google-translate-widget/testing` in your tests only.
 *
 * ```ts
 * import { installFakeGoogleTranslate, resetGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget/testing'
 *
 * beforeEach(() => installFakeGoogleTranslate())
 * afterEach(() => resetGoogleTranslate())
 * ```
 */
import { resetTranslateState } from '../composables/useGoogleTranslate'
import { clearGoogtrans } from '../core/cookies'
import { RTL_LANGUAGES } from '../core/domTranslator'
import { DEFAULT_LANGUAGES } from '../core/languages'
import { resetLoader } from '../core/loader'
import { stopDirectionSync } from '../core/page'

export interface FakeGoogleTranslateOptions {
  /**
   * Language codes the fake offers. Default: every built-in language. A code that isn't listed behaves like one
   * Google doesn't support: `changeLanguage()` rejects.
   */
  languages?: string[]
}

export interface FakeGoogleTranslate {
  /** The options each `TranslateElement` was created with (there should only ever be one per page). */
  readonly constructed: Record<string, unknown>[]
  /** How many times Google's "Show original" button was clicked. */
  readonly restoreClicks: number
  /** Puts back whatever `window.google` was before. */
  uninstall(): void
}

/**
 * Replaces Google's Website Translator with an in-memory fake that behaves like the real one: it renders the
 * hidden language `<select>`, marks `<html>` as `translated-ltr` / `translated-rtl` when the language changes,
 * writes the `googtrans` cookie, and provides the "Show original" button. No network requests are made, and page
 * text isn't actually translated.
 *
 * "Show original" lives in a same-origin iframe, as in the real widget. In environments that don't create iframe
 * documents (happy-dom's default), restoring the original falls back to reloading the page.
 */
export function installFakeGoogleTranslate(options: FakeGoogleTranslateOptions = {}): FakeGoogleTranslate {
  const languages = options.languages ?? DEFAULT_LANGUAGES.map(language => language.code)
  const state = { constructed: [] as Record<string, unknown>[], restoreClicks: 0 }
  const previous = window.google

  class TranslateElement {
    constructor(elementOptions: Record<string, unknown>, elementId: string) {
      state.constructed.push(elementOptions)
      const host = document.getElementById(elementId)
      if (!host) throw new Error(`[fake Google Translate] No element with id "${elementId}"`)

      const select = document.createElement('select')
      select.className = 'goog-te-combo'
      for (const code of ['', ...languages]) {
        const option = document.createElement('option')
        option.value = code
        select.appendChild(option)
      }
      select.addEventListener('change', () => {
        const root = document.documentElement
        root.classList.remove('translated-ltr', 'translated-rtl')
        if (select.value) root.classList.add(RTL_LANGUAGES.has(select.value) ? 'translated-rtl' : 'translated-ltr')
        document.cookie = `googtrans=/${String(elementOptions.pageLanguage ?? 'en')}/${select.value}; path=/`
      })
      host.appendChild(select)

      const banner = document.createElement('iframe')
      banner.className = 'skiptranslate'
      document.body.appendChild(banner)
      const frame = banner.contentDocument
      if (!frame?.body) return
      const restore = frame.createElement('button')
      restore.id = ':1.restore'
      restore.addEventListener('click', () => {
        state.restoreClicks++
        document.documentElement.classList.remove('translated-ltr', 'translated-rtl')
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
      })
      frame.body.appendChild(restore)
    }
  }

  window.google = { ...previous, translate: { TranslateElement } }

  return {
    get constructed() {
      return state.constructed
    },
    get restoreClicks() {
      return state.restoreClicks
    },
    uninstall() {
      window.google = previous
    },
  }
}

/**
 * Forgets everything the package keeps per page, so the next test starts clean: the loaded script and hidden
 * element, the shared language state, the `dir` observer, the provider engine and the `googtrans` cookie. Call it
 * after each test.
 */
export function resetGoogleTranslate(): void {
  resetTranslateState()
  resetLoader()
  stopDirectionSync()
  clearGoogtrans()
  const root = document.documentElement
  root.classList.remove('translated-ltr', 'translated-rtl')
  document.getElementById('gtw-hide-branding')?.remove()
}
