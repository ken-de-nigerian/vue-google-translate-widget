import {
  computed,
  getCurrentInstance,
  inject,
  ref,
  shallowReactive,
  shallowRef,
  toValue,
  watchEffect,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { matchBrowserLanguage, safeStorage } from '../core/browser'
import {
  clearGoogtrans,
  clearGoogtransHash,
  readGoogtrans,
  readQueryLanguage,
  writeGoogtrans,
  writeQueryLanguage,
} from '../core/cookies'
import {
  createDomTranslator,
  localStorageCache,
  type DomTranslator,
  type TranslationCache,
} from '../core/domTranslator'
import { DEFAULT_LANGUAGES, toGoogleCode, type Language } from '../core/languages'
import { findCombo, loadGoogleTranslate } from '../core/loader'
import {
  findRestoreButton,
  injectBrandingStyles,
  isPageTranslated,
  reloadPage,
  startDirectionSync,
  waitForTranslationState,
} from '../core/page'
import type { TranslationProvider } from '../core/providers'

export type { Language } from '../core/languages'

export type TranslateStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * - `live`: translate in place, no page reload (default)
 * - `reload`: write the cookie and reload, the 1.0 behaviour
 */
export type TranslateMode = 'live' | 'reload'

export interface TranslateEvent {
  /** The language the page was shown in. */
  from: string
  /** The language it is shown in now (the page language when restoring). */
  to: string
  /** `'google-widget'`, or the provider's name. */
  engine: string
  /** `'auto'` when chosen by `autoTranslate`, otherwise `'user'`. */
  trigger: 'user' | 'auto'
}

/** Options shared by `app.use(createGoogleTranslate(...))`, the components and the composable. */
export interface GoogleTranslateConfig {
  /** The language the page is written in. Default: `'en'`. */
  defaultLanguage?: string
  /** The languages to offer. Default: the built-in list. */
  languages?: Language[]
  /** Only offer these codes. */
  includedLanguages?: string[]
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
  /** Set `<html dir="rtl">` while the page is shown in a right-to-left language. Default: `true`. */
  syncDocumentDir?: boolean
  /**
   * Translate with this provider (DeepL, Google Cloud, Azure, LibreTranslate, your own endpoint) instead of
   * Google's free widget. See `endpointProvider` and `libreTranslate`.
   */
  provider?: TranslationProvider
  /** Where provider translations are cached. Default: `localStorageCache()`. */
  cache?: TranslationCache
  /** Attributes the provider engine translates besides text. Default: placeholder, title, alt, aria-label. */
  translateAttributes?: string[]
  /** Called after every successful change, e.g. to send an analytics event. */
  onTranslate?: (event: TranslateEvent) => void
  /** Translate into the visitor's browser language on their first visit. Default: `false`. */
  autoTranslate?: boolean
  /** The language to render on the server (the Nuxt module sets it from the cookie). */
  initialLanguage?: string
  /**
   * Read and keep the language in this URL query parameter, e.g. `'lang'` for shareable `?lang=fr` links.
   * Default: off.
   */
  queryParameter?: string
}

export interface UseGoogleTranslateOptions extends Omit<GoogleTranslateConfig, 'languages' | 'includedLanguages'> {
  /** The languages to offer. Reactive. */
  languages?: MaybeRefOrGetter<Language[] | undefined>
  /** Only offer these codes (from `languages`). Reactive. */
  includedLanguages?: MaybeRefOrGetter<string[] | undefined>
}

export interface UseGoogleTranslateReturn {
  /** The language the page is written in (a Google code), after plugin config and options are applied. */
  pageLanguage: string
  /** The Google language code the page is currently shown in. Shared by every instance. */
  currentLanguage: Ref<string>
  isChangingLanguage: Ref<boolean>
  /** The languages to offer. Updates when the `languages`/`includedLanguages` options change. */
  languages: Language[]
  status: Ref<TranslateStatus>
  error: Ref<Error | null>
  isReady: ComputedRef<boolean>
  /** Resolves once the change is applied. Rejects (and sets `error`) if it can't be. */
  changeLanguage: (lang: string) => Promise<void>
  /** Shows the page in its original language. */
  restoreOriginal: () => Promise<void>
  /** Loads the engine and applies a saved language. Never rejects: check `status` and `error`. */
  initializeTranslate: () => Promise<void>
  getCurrentLanguage: () => string
}

export const GOOGLE_TRANSLATE_CONFIG: InjectionKey<GoogleTranslateConfig> = Symbol('google-translate-config')

const AUTO_TRANSLATED_KEY = 'gtw-auto-translated'

// The translation is page-wide, so in the browser its state is too: every
// component and composable on the page sees the same language and status.
// On the server each call gets its own refs, so requests can't leak into each other.
const currentLanguage = ref('')
const isChangingLanguage = ref(false)
const status = ref<TranslateStatus>('idle')
const error = shallowRef<Error | null>(null)

let domEngine: { provider: TranslationProvider; translator: DomTranslator } | null = null

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)))

const withoutUndefined = <T extends object>(value: T): Partial<T> =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>

/** Test helper: reset the shared state. */
export function resetTranslateState(): void {
  currentLanguage.value = ''
  isChangingLanguage.value = false
  status.value = 'idle'
  error.value = null
  domEngine?.translator.destroy()
  domEngine = null
}

interface Engine {
  name: string
  load(): Promise<void>
  apply(target: string, requested: string): Promise<void>
  /** Resolves `true` if it restored in place, `false` if it had to reload. */
  restore(): Promise<boolean>
  /** Re-applies a saved language after load, if the engine hasn't already. */
  applySaved(target: string): Promise<void>
}

export function useGoogleTranslate(options: UseGoogleTranslateOptions = {}): UseGoogleTranslateReturn {
  const injected = getCurrentInstance() ? inject(GOOGLE_TRANSLATE_CONFIG, {}) : {}
  const config: UseGoogleTranslateOptions = { ...injected, ...withoutUndefined(options) }
  const {
    defaultLanguage = 'en',
    autoDisplay = false,
    mode = 'live',
    reloadOnRestore = false,
    hideBranding = true,
    scriptSrc,
    nonce,
    timeout,
    syncDocumentDir = true,
    provider,
    onTranslate,
    autoTranslate = false,
    queryParameter,
  } = config
  const pageLanguage = toGoogleCode(defaultLanguage)
  const isServer = typeof window === 'undefined'

  const state = isServer
    ? {
        currentLanguage: ref(toGoogleCode(config.initialLanguage ?? defaultLanguage)),
        isChangingLanguage: ref(false),
        status: ref<TranslateStatus>('idle'),
        error: shallowRef<Error | null>(null),
      }
    : { currentLanguage, isChangingLanguage, status, error }

  const getCurrentLanguage = (): string => {
    if (isServer) return pageLanguage
    const hash = readGoogtrans()
    // A #googtrans hash still wins (Google applies it itself); then ?lang=; then the cookie.
    if (hash && /googtrans/.test(window.location.hash)) return hash.target
    const query = queryParameter ? readQueryLanguage(window.location.search, queryParameter) : null
    return query ? toGoogleCode(query) : (hash?.target ?? pageLanguage)
  }

  const syncQuery = (language: string) => {
    if (queryParameter) writeQueryLanguage(queryParameter, language === pageLanguage ? null : language)
  }

  if (!isServer && !currentLanguage.value) currentLanguage.value = getCurrentLanguage()

  const languages = shallowReactive<Language[]>([])
  watchEffect(() => {
    const list = toValue(options.languages) ?? injected.languages ?? DEFAULT_LANGUAGES
    const included = (toValue(options.includedLanguages) ?? injected.includedLanguages)?.map(toGoogleCode)
    const next = included ? list.filter(lang => included.includes(toGoogleCode(lang.code))) : list
    languages.splice(0, languages.length, ...next)
  })

  const widgetEngine: Engine = {
    name: 'google-widget',
    async load() {
      await loadGoogleTranslate({ pageLanguage, autoDisplay, scriptSrc, nonce, timeout })
    },
    async apply(target, requested) {
      const combo = findCombo()!
      if (!Array.from(combo.options).some(option => option.value === target)) {
        throw new Error(`Google Translate does not support the language code "${requested}".`)
      }
      combo.value = target
      combo.dispatchEvent(new Event('change'))
      await waitForTranslationState(true)
    },
    async restore() {
      const button = reloadOnRestore ? null : findRestoreButton()
      if (!button) return false
      button.click()
      if (!(await waitForTranslationState(false))) return false
      const combo = findCombo()
      if (combo) combo.value = ''
      return true
    },
    async applySaved(target) {
      // Google normally applies a saved googtrans cookie itself; this covers
      // the case where it hasn't by the time its <select> exists.
      const combo = findCombo()
      if (combo && !isPageTranslated() && combo.value !== target) {
        combo.value = target
        combo.dispatchEvent(new Event('change'))
      }
    },
  }

  const providerEngine = (translationProvider: TranslationProvider): Engine => {
    const translator = () => {
      if (!domEngine) {
        domEngine = {
          provider: translationProvider,
          translator: createDomTranslator({
            provider: translationProvider,
            cache: config.cache ?? localStorageCache(),
            attributes: config.translateAttributes,
          }),
        }
      } else if (domEngine.provider !== translationProvider) {
        console.warn('[vue-google-translate-widget] A translation provider is already active on this page; using it.')
      }
      return domEngine.translator
    }
    return {
      name: translationProvider.name,
      async load() {},
      apply: target => translator().translate(pageLanguage, target),
      async restore() {
        translator().restore()
        return true
      },
      applySaved: target => translator().translate(pageLanguage, target),
    }
  }

  const engine = provider ? providerEngine(provider) : widgetEngine

  const load = async (): Promise<void> => {
    if (state.status.value !== 'ready') state.status.value = 'loading'
    try {
      await engine.load()
      if (syncDocumentDir) startDirectionSync()
      state.status.value = 'ready'
      state.error.value = null
    } catch (cause) {
      state.status.value = 'error'
      state.error.value = toError(cause)
      throw state.error.value
    }
  }

  const report = (from: string, to: string, trigger: TranslateEvent['trigger']) => {
    try {
      onTranslate?.({ from, to, engine: engine.name, trigger })
    } catch (cause) {
      console.error('[vue-google-translate-widget] onTranslate threw:', cause)
    }
  }

  const restoreOriginal = async (): Promise<void> => {
    if (isServer || state.isChangingLanguage.value) return

    const from = state.currentLanguage.value
    clearGoogtrans()
    clearGoogtransHash()
    syncQuery(pageLanguage)
    state.currentLanguage.value = pageLanguage
    if (!isPageTranslated()) return

    state.isChangingLanguage.value = true
    let restored = false
    try {
      restored = await engine.restore()
      // Google clears only the host cookie; remove the parent-domain copies too.
      clearGoogtrans()
    } finally {
      if (restored) state.isChangingLanguage.value = false
    }
    if (!restored) {
      reloadPage()
      return
    }
    if (from !== pageLanguage) report(from, pageLanguage, 'user')
  }

  const change = async (lang: string, trigger: TranslateEvent['trigger']): Promise<void> => {
    if (isServer || state.isChangingLanguage.value) return

    const target = toGoogleCode(lang)
    if (target === pageLanguage) return restoreOriginal()

    const previous = state.currentLanguage.value
    state.isChangingLanguage.value = true
    state.error.value = null
    state.currentLanguage.value = target

    if (mode === 'reload') {
      // A #googtrans hash overrides the cookie, so drop it or the old choice wins.
      clearGoogtransHash()
      writeGoogtrans(pageLanguage, target)
      syncQuery(target)
      report(previous, target, trigger)
      reloadPage()
      return
    }

    try {
      await load()
      clearGoogtransHash()
      await engine.apply(target, lang)
      writeGoogtrans(pageLanguage, target)
      syncQuery(target)
    } catch (cause) {
      // Whatever the engine left on screen is the truth now.
      state.currentLanguage.value = isPageTranslated() ? previous : pageLanguage
      if (!isPageTranslated() && previous !== pageLanguage) clearGoogtrans()
      state.error.value = toError(cause)
      throw state.error.value
    } finally {
      state.isChangingLanguage.value = false
    }
    report(previous, target, trigger)
  }

  const changeLanguage = (lang: string) => change(lang, 'user')

  const initializeTranslate = async (): Promise<void> => {
    if (isServer) return
    state.currentLanguage.value = getCurrentLanguage()
    if (hideBranding && !provider) injectBrandingStyles(nonce)

    try {
      await load()
    } catch {
      return
    }

    const saved = getCurrentLanguage()
    if (saved !== pageLanguage) {
      try {
        await engine.applySaved(saved)
      } catch (cause) {
        state.error.value = toError(cause)
        state.currentLanguage.value = pageLanguage
      }
      return
    }

    // Only on a first visit: once the visitor has been auto-translated (and maybe
    // switched back), we never do it again.
    if (autoTranslate && safeStorage.get(AUTO_TRANSLATED_KEY) !== '1') {
      const match = matchBrowserLanguage(languages, pageLanguage, undefined, toGoogleCode)
      safeStorage.set(AUTO_TRANSLATED_KEY, '1')
      if (match) await change(match.code, 'auto').catch(() => {})
    }
  }

  return {
    ...state,
    pageLanguage,
    languages,
    isReady: computed(() => state.status.value === 'ready'),
    changeLanguage,
    restoreOriginal,
    initializeTranslate,
    getCurrentLanguage,
  }
}
