/** localStorage that never throws (private mode, blocked storage, SSR). */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage unavailable: the feature just won't remember.
    }
  },
}

/**
 * The first of the visitor's browser languages that we offer, unless their top
 * preference is already the page's language. Matches "fr-CA" to "fr-CA", then "fr".
 */
export function matchBrowserLanguage<T extends { code: string }>(
  languages: readonly T[],
  pageLanguage: string,
  browserLanguages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages,
  toCode: (code: string) => string = code => code,
): T | undefined {
  const byCode = new Map(languages.map(lang => [toCode(lang.code).toLowerCase(), lang]))
  const page = toCode(pageLanguage).toLowerCase()
  for (const preferred of browserLanguages) {
    const full = toCode(preferred).toLowerCase()
    const base = toCode(full.split('-')[0])
    if (full === page || base === page.split('-')[0]) return undefined
    const match = byCode.get(full) ?? byCode.get(base)
    if (match) return match
  }
  return undefined
}
