import {
  computed,
  ref,
  shallowReactive,
  shallowRef,
  toValue,
  watchEffect,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { clearGoogtrans, clearGoogtransHash, readGoogtrans, writeGoogtrans } from '../core/cookies'
import { DEFAULT_LANGUAGES, toGoogleCode, type Language } from '../core/languages'
import { findCombo, loadGoogleTranslate } from '../core/loader'
import {
  findRestoreButton,
  injectBrandingStyles,
  isPageTranslated,
  reloadPage,
  waitForTranslationState,
} from '../core/page'

export type { Language } from '../core/languages'

export type TranslateStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * - `live`: translate in place, no page reload (default)
 * - `reload`: write the cookie and reload, the 1.0 behaviour
 */
export type TranslateMode = 'live' | 'reload'

export interface UseGoogleTranslateOptions {
  /** The language the page is written in. Default: `'en'`. */
  defaultLanguage?: string
  /** The languages to offer. Default: the built-in list. Reactive. */
  languages?: MaybeRefOrGetter<Language[] | undefined>
  /** Only offer these codes (from `languages`). Reactive. */
  includedLanguages?: MaybeRefOrGetter<string[] | undefined>
  /** Let Google show its own "translate this page?" prompt. Default: `false`. */
  autoDisplay?: boolean
  /** Default: `'live'`. */
  mode?: TranslateMode
  /** Reload instead of restoring the original text in place. Default: `false`. */
  reloadOnRestore?: boolean
  /** Hide Google's banner, tooltips and highlight, and undo its body offset. Default: `true`. */
  hideBranding?: boolean
  /** Override Google's script URL, e.g. to go through a proxy. */
  scriptSrc?: string
  /** CSP nonce for the injected <script> and <style>. */
  nonce?: string
  /** How long to wait for Google's script, in ms. Default: `10000`. */
  timeout?: number
}

export interface UseGoogleTranslateReturn {
  /** The Google language code the page is currently shown in. Shared by every instance. */
  currentLanguage: Ref<string>
  isChangingLanguage: Ref<boolean>
  /** The languages to offer. Updates when the `languages`/`includedLanguages` options change. */
  languages: Language[]
  status: Ref<TranslateStatus>
  error: Ref<Error | null>
  isReady: ComputedRef<boolean>
  /** Resolves once Google has applied the change. Rejects (and sets `error`) if it can't. */
  changeLanguage: (lang: string) => Promise<void>
  /** Shows the page in its original language. */
  restoreOriginal: () => Promise<void>
  /** Loads Google's script. Never rejects: check `status` and `error`. */
  initializeTranslate: () => Promise<void>
  getCurrentLanguage: () => string
}

// The translation is page-wide, so its state is too: every component and
// composable on the page sees the same language and loading status.
const currentLanguage = ref('')
const isChangingLanguage = ref(false)
const status = ref<TranslateStatus>('idle')
const error = shallowRef<Error | null>(null)

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)))

/** Test helper: reset the shared state. */
export function resetTranslateState(): void {
  currentLanguage.value = ''
  isChangingLanguage.value = false
  status.value = 'idle'
  error.value = null
}

export function useGoogleTranslate(options: UseGoogleTranslateOptions = {}): UseGoogleTranslateReturn {
  const {
    defaultLanguage = 'en',
    autoDisplay = false,
    mode = 'live',
    reloadOnRestore = false,
    hideBranding = true,
    scriptSrc,
    nonce,
    timeout,
  } = options

  const getCurrentLanguage = (): string => readGoogtrans()?.target ?? defaultLanguage

  if (!currentLanguage.value) {
    currentLanguage.value = getCurrentLanguage()
  }

  const languages = shallowReactive<Language[]>([])
  watchEffect(() => {
    const list = toValue(options.languages) ?? DEFAULT_LANGUAGES
    const included = toValue(options.includedLanguages)?.map(toGoogleCode)
    const next = included ? list.filter(lang => included.includes(toGoogleCode(lang.code))) : list
    languages.splice(0, languages.length, ...next)
  })

  const load = async (): Promise<HTMLSelectElement> => {
    if (status.value !== 'ready') status.value = 'loading'
    try {
      const combo = await loadGoogleTranslate({ pageLanguage: defaultLanguage, autoDisplay, scriptSrc, nonce, timeout })
      status.value = 'ready'
      error.value = null
      return combo
    } catch (cause) {
      status.value = 'error'
      error.value = toError(cause)
      throw error.value
    }
  }

  const initializeTranslate = async (): Promise<void> => {
    if (typeof window === 'undefined') return
    currentLanguage.value = getCurrentLanguage()
    if (hideBranding) injectBrandingStyles(nonce)

    let combo: HTMLSelectElement
    try {
      combo = await load()
    } catch {
      return
    }

    // Google normally applies a saved googtrans cookie by itself; this covers
    // the case where it hasn't by the time its <select> exists.
    const saved = getCurrentLanguage()
    if (saved !== defaultLanguage && !isPageTranslated() && combo.value !== saved) {
      combo.value = saved
      combo.dispatchEvent(new Event('change'))
    }
  }

  const restoreOriginal = async (): Promise<void> => {
    if (typeof window === 'undefined' || isChangingLanguage.value) return

    clearGoogtrans()
    clearGoogtransHash()
    currentLanguage.value = defaultLanguage
    if (!isPageTranslated()) return

    isChangingLanguage.value = true
    const button = reloadOnRestore ? null : findRestoreButton()
    if (!button) {
      reloadPage()
      return
    }

    try {
      button.click()
      if (!(await waitForTranslationState(false))) {
        reloadPage()
        return
      }
      const combo = findCombo()
      if (combo) combo.value = ''
      // Google clears only the host cookie; remove the parent-domain copies too.
      clearGoogtrans()
    } finally {
      isChangingLanguage.value = false
    }
  }

  const changeLanguage = async (lang: string): Promise<void> => {
    if (typeof window === 'undefined' || isChangingLanguage.value) return

    const target = toGoogleCode(lang)
    if (target === toGoogleCode(defaultLanguage)) return restoreOriginal()

    const previous = currentLanguage.value
    isChangingLanguage.value = true
    error.value = null
    currentLanguage.value = target

    if (mode === 'reload') {
      // A #googtrans hash overrides the cookie, so drop it or the old choice wins.
      clearGoogtransHash()
      writeGoogtrans(defaultLanguage, target)
      reloadPage()
      return
    }

    try {
      const combo = await load()
      if (!Array.from(combo.options).some(option => option.value === target)) {
        throw new Error(`Google Translate does not support the language code "${lang}".`)
      }
      clearGoogtransHash()
      writeGoogtrans(defaultLanguage, target)
      combo.value = target
      combo.dispatchEvent(new Event('change'))
      await waitForTranslationState(true)
    } catch (cause) {
      currentLanguage.value = previous
      error.value = toError(cause)
      throw error.value
    } finally {
      isChangingLanguage.value = false
    }
  }

  return {
    currentLanguage,
    isChangingLanguage,
    languages,
    status,
    error,
    isReady: computed(() => status.value === 'ready'),
    changeLanguage,
    restoreOriginal,
    initializeTranslate,
    getCurrentLanguage,
  }
}
