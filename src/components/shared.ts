import { nextTick, ref, type Ref } from 'vue'
import type { Language } from '../core/languages'

let idCounter = 0
/** A page-unique id prefix (Vue 3.3 has no useId). */
export const createId = (prefix: string): string => `${prefix}-${++idCounter}`

export const DEFAULT_FLAG_URL = (flag: string): string => `https://flagcdn.com/${flag}.svg`

export const DEFAULT_ERROR_TEXT = 'Translation is unavailable right now. Please try again later.'

let scrollLocks = 0
let savedBodyStyle: { overflow: string; paddingRight: string } | null = null

/** Stops the page behind a modal from scrolling, without the layout jumping. */
export function lockScroll(): void {
  if (scrollLocks++ > 0) return
  const { style } = document.body
  savedBodyStyle = { overflow: style.overflow, paddingRight: style.paddingRight }
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  style.overflow = 'hidden'
  if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`
}

export function unlockScroll(): void {
  if (scrollLocks === 0 || --scrollLocks > 0) return
  if (savedBodyStyle) Object.assign(document.body.style, savedBodyStyle)
  savedBodyStyle = null
}

interface ListNavigationOptions {
  count: () => number
  optionId: (index: number) => string
  onSelect: (index: number) => void
  onClose: () => void
  /** Space selects (listbox focus) or types (search input focus). */
  spaceSelects: boolean
}

/** Arrow/Home/End/Enter/Escape handling for a list driven by aria-activedescendant. */
export function useListNavigation(options: ListNavigationOptions): {
  activeIndex: Ref<number>
  setActive: (index: number) => void
  onKeydown: (event: KeyboardEvent) => void
} {
  const activeIndex = ref(-1)

  const setActive = (index: number) => {
    activeIndex.value = index
    nextTick(() => {
      if (index < 0) return
      document.getElementById(options.optionId(index))?.scrollIntoView?.({ block: 'nearest' })
    })
  }

  const move = (delta: number) => {
    const count = options.count()
    if (!count) return
    const current = activeIndex.value
    setActive(current < 0 ? (delta > 0 ? 0 : count - 1) : (current + delta + count) % count)
  }

  const onKeydown = (event: KeyboardEvent) => {
    const count = options.count()
    switch (event.key) {
      case 'ArrowDown':
        move(1)
        break
      case 'ArrowUp':
        move(-1)
        break
      case 'Home':
        if (count) setActive(0)
        break
      case 'End':
        if (count) setActive(count - 1)
        break
      case 'Enter':
        if (activeIndex.value >= 0 && activeIndex.value < count) options.onSelect(activeIndex.value)
        break
      case ' ':
        if (!options.spaceSelects) return
        if (activeIndex.value >= 0 && activeIndex.value < count) options.onSelect(activeIndex.value)
        break
      case 'Escape':
        options.onClose()
        break
      default:
        return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  return { activeIndex, setActive, onKeydown }
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/** Keeps Tab / Shift+Tab inside `container`. */
export function trapFocus(event: KeyboardEvent, container: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const regionalIndicator = (letter: string) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)
const tag = (char: string) => String.fromCodePoint(0xe0000 + char.charCodeAt(0))

/**
 * The emoji for a flagcdn code: "fr" → 🇫🇷, "gb-wls" → 🏴󠁧󠁢󠁷󠁬󠁳󠁿. Returns '' when no emoji
 * exists (e.g. "es-ct"), so callers fall back to a code badge.
 */
export function flagEmoji(flag: string): string {
  if (/^gb-(eng|sct|wls)$/.test(flag)) {
    return `\u{1F3F4}${[...flag.replace('-', '')].map(tag).join('')}\u{E007F}`
  }
  if (!/^[a-z]{2}$/i.test(flag)) return ''
  return [...flag.toUpperCase()].map(regionalIndicator).join('')
}

/** Pinned languages first (in the given order), then recent ones, then the rest. */
export function orderLanguages<T extends { code: string }>(
  languages: readonly T[],
  pinned: readonly string[] = [],
  recent: readonly string[] = [],
  toCode: (code: string) => string = code => code,
): T[] {
  const rank = new Map<string, number>()
  ;[...pinned, ...recent].map(toCode).forEach((code, index) => {
    if (!rank.has(code)) rank.set(code, index)
  })
  if (!rank.size) return [...languages]
  const rankOf = (lang: T) => rank.get(toCode(lang.code)) ?? Infinity
  return [...languages].sort((a, b) => rankOf(a) - rankOf(b))
}

export type Theme = 'light' | 'dark' | 'auto'
export type FlagStyle = 'image' | 'emoji'
export type LanguageDisplay = 'native' | 'english' | 'both'

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

const RECENT_KEY = 'gtw-recent-languages'

export function readRecentLanguages(): string[] {
  try {
    const value = JSON.parse(safeStorage.get(RECENT_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter(code => typeof code === 'string') : []
  } catch {
    return []
  }
}

export function rememberRecentLanguage(code: string, limit: number): string[] {
  const next = [code, ...readRecentLanguages().filter(c => c !== code)].slice(0, limit)
  safeStorage.set(RECENT_KEY, JSON.stringify(next))
  return next
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

export interface WidgetLabels {
  /** Accessible name of the floating button. */
  open: string
  /** Accessible name of the close button. */
  close: string
  noResults: string
  noResultsHint: string
  /** Announced to screen readers as the search narrows the list. */
  results: (count: number) => string
  /** The browser-language prompt. */
  suggestion: (language: Language) => string
  accept: string
  dismiss: string
}

export const DEFAULT_WIDGET_LABELS: WidgetLabels = {
  open: 'Change language',
  close: 'Close',
  noResults: 'No languages found',
  noResultsHint: 'Try a different search term',
  results: count => (count === 1 ? '1 language' : `${count} languages`),
  suggestion: language => `View this page in ${language.nativeName}?`,
  accept: 'Translate',
  dismiss: 'No thanks',
}
