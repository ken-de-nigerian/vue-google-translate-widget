export const DEFAULT_SCRIPT_SRC = 'https://translate.google.com/translate_a/element.js'
export const DEFAULT_TIMEOUT = 10_000
export const HOST_ELEMENT_ID = 'gtw-google-translate-host'
const SCRIPT_ID = 'gtw-google-translate-script'
const CALLBACK_NAME = '__gtwGoogleTranslateInit'

export interface LoaderOptions {
  pageLanguage: string
  autoDisplay?: boolean
  scriptSrc?: string
  nonce?: string
  timeout?: number
}

interface TranslateElementConstructor {
  new (options: Record<string, unknown>, elementId: string): unknown
}

declare global {
  interface Window {
    // Kept as `any` on purpose: a narrower type here would conflict with other
    // libraries that also declare `window.google` (e.g. @types/google.maps).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any
    [CALLBACK_NAME]?: () => void
  }
}

let pending: Promise<HTMLSelectElement> | null = null
let activeOptions: LoaderOptions | null = null

export const findCombo = (): HTMLSelectElement | null =>
  document.querySelector<HTMLSelectElement>(`#${HOST_ELEMENT_ID} select.goog-te-combo`)

const getTranslateElement = (): TranslateElementConstructor | undefined => window.google?.translate?.TranslateElement

function ensureHostElement(): HTMLElement {
  let host = document.getElementById(HOST_ELEMENT_ID)
  if (!host) {
    host = document.createElement('div')
    host.id = HOST_ELEMENT_ID
    host.style.display = 'none'
    host.setAttribute('aria-hidden', 'true')
    document.body.appendChild(host)
  }
  return host
}

function warnOnConflict(options: LoaderOptions): void {
  if (activeOptions && activeOptions.pageLanguage !== options.pageLanguage) {
    console.warn(
      `[vue-google-translate-widget] Google Translate is already loaded with pageLanguage "${activeOptions.pageLanguage}"; ` +
        `ignoring "${options.pageLanguage}". Use the same defaultLanguage everywhere on the page.`,
    )
  }
}

/**
 * Loads Google's Website Translator once per page and resolves with its hidden
 * language <select>. Every component and composable shares this promise:
 * Google only renders the first TranslateElement on a page, so a second
 * script, host element or callback would silently do nothing.
 *
 * The default (non-SIMPLE) layout is used on purpose. It is the only layout
 * that renders `select.goog-te-combo`, which is what lets us switch languages
 * without reloading the page. The host element is hidden, so its look is
 * irrelevant.
 */
export function loadGoogleTranslate(options: LoaderOptions): Promise<HTMLSelectElement> {
  if (pending) {
    warnOnConflict(options)
    return pending
  }

  activeOptions = options
  const {
    pageLanguage,
    autoDisplay = false,
    scriptSrc = DEFAULT_SCRIPT_SRC,
    nonce,
    timeout = DEFAULT_TIMEOUT,
  } = options

  pending = new Promise<HTMLSelectElement>((resolve, reject) => {
    const host = ensureHostElement()
    let observer: MutationObserver | undefined
    let settled = false

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      observer?.disconnect()
      if (!error) {
        resolve(findCombo()!)
        return
      }
      // Allow a later call to retry from scratch.
      document.getElementById(SCRIPT_ID)?.remove()
      pending = null
      activeOptions = null
      reject(error)
    }

    const timer = setTimeout(
      () =>
        finish(
          new Error(
            `Google Translate did not load within ${timeout}ms. It may be blocked by an ad blocker or a Content Security Policy.`,
          ),
        ),
      timeout,
    )

    const waitForCombo = () => {
      if (findCombo()) return finish()
      observer = new MutationObserver(() => {
        if (findCombo()) finish()
      })
      observer.observe(host, { childList: true, subtree: true })
    }

    window[CALLBACK_NAME] = () => {
      try {
        const TranslateElement = getTranslateElement()
        if (!TranslateElement) throw new Error('Google Translate loaded without google.translate.TranslateElement.')
        new TranslateElement({ pageLanguage, autoDisplay }, HOST_ELEMENT_ID)
        waitForCombo()
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Someone else already loaded Google's script (e.g. a plain <script> tag).
    if (getTranslateElement()) {
      window[CALLBACK_NAME]()
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = `${scriptSrc}${scriptSrc.includes('?') ? '&' : '?'}cb=${CALLBACK_NAME}`
    script.async = true
    if (nonce) script.nonce = nonce
    script.onerror = () =>
      finish(
        new Error(
          `Failed to load Google Translate from ${scriptSrc}. It may be blocked by an ad blocker or a Content Security Policy.`,
        ),
      )
    document.head.appendChild(script)
  })

  return pending
}

/** Test helper: forget the loaded state so the next call starts from scratch. */
export function resetLoader(): void {
  pending = null
  activeOptions = null
  document.getElementById(SCRIPT_ID)?.remove()
  document.getElementById(HOST_ELEMENT_ID)?.remove()
  delete window[CALLBACK_NAME]
}
