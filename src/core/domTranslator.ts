import type { TranslationProvider } from './providers'

export const RTL_LANGUAGES = new Set([
  'ar',
  'iw',
  'he',
  'fa',
  'fa-AF',
  'ur',
  'yi',
  'sd',
  'ps',
  'ug',
  'dv',
  'ckb',
  'pa-Arab',
  'ms-Arab',
])

/** Where translations are kept between visits. */
export interface TranslationCache {
  get(key: string): string | undefined
  set(key: string, value: string): void
}

export function memoryCache(): TranslationCache {
  const store = new Map<string, string>()
  return { get: key => store.get(key), set: (key, value) => void store.set(key, value) }
}

/**
 * Keeps translations in localStorage so a returning visitor gets them
 * instantly. Silently becomes memory-only when storage is unavailable or full.
 */
export function localStorageCache(prefix = 'gtw-cache:'): TranslationCache {
  const memory = memoryCache()
  return {
    get(key) {
      const hit = memory.get(key)
      if (hit !== undefined) return hit
      try {
        const stored = window.localStorage.getItem(prefix + key)
        if (stored !== null) memory.set(key, stored)
        return stored ?? undefined
      } catch {
        return undefined
      }
    },
    set(key, value) {
      memory.set(key, value)
      try {
        window.localStorage.setItem(prefix + key, value)
      } catch {
        // Full or blocked: keep it in memory only.
      }
    },
  }
}

export interface DomTranslatorOptions {
  provider: TranslationProvider
  /** Default: `document.body`. */
  root?: () => HTMLElement
  /** Attributes to translate as well as text. */
  attributes?: string[]
  /** Strings per provider request. Default: 50. */
  batchSize?: number
  cache?: TranslationCache
  /** Translate content added or changed after the first pass (route changes, v-if). Default: true. */
  observe?: boolean
}

export interface DomTranslator {
  translate(source: string, target: string): Promise<void>
  restore(): void
  readonly target: string | null
  /** Stops observing and restores the page. */
  destroy(): void
}

const DEFAULT_ATTRIBUTES = ['placeholder', 'title', 'alt', 'aria-label']
// Content we never send for translation.
const SKIP = '[translate="no"], .notranslate, script, style, noscript, template, code, pre, textarea, svg, math'

const hash = (text: string): string => {
  // FNV-1a: short, stable cache keys without storing the full source string twice.
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36) + text.length.toString(36)
}

/** Splits "  Hello  " into ["  ", "Hello", "  "] so whitespace survives translation. */
const splitWhitespace = (text: string): [string, string, string] => {
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!
  return [match[1], match[2], match[3]]
}

/**
 * Translates the page through a {@link TranslationProvider}: walks text nodes
 * and selected attributes, skips anything marked `notranslate`, batches and
 * de-duplicates strings, caches the results, keeps the originals so the page
 * can be restored instantly, and follows content that is rendered later.
 */
export function createDomTranslator(options: DomTranslatorOptions): DomTranslator {
  const {
    provider,
    root = () => document.body,
    attributes = DEFAULT_ATTRIBUTES,
    batchSize = 50,
    cache = memoryCache(),
    observe = true,
  } = options

  // Original values, and what we last wrote, so our own writes can be told
  // apart from the app changing the text underneath us.
  const textOriginals = new Map<Text, { original: string; written: string }>()
  const attrOriginals = new Map<Element, Map<string, { original: string; written: string }>>()

  let source = ''
  let target: string | null = null
  let observer: MutationObserver | null = null
  let controller: AbortController | null = null
  let pendingNodes = new Set<Node>()
  let flushScheduled = false

  const cacheKey = (text: string) => `${provider.name}|${source}|${target}|${hash(text)}`

  const isSkipped = (node: Node): boolean => {
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
    return !element || !!element.closest(SKIP)
  }

  interface Job {
    text: string
    apply: (translated: string) => void
  }

  const collect = (scope: Node): Job[] => {
    const jobs: Job[] = []
    const addText = (node: Text) => {
      if (isSkipped(node)) return
      const known = textOriginals.get(node)
      // The app replaced the text since we wrote it: that's the new original.
      const original = known && node.data === known.written ? known.original : node.data
      const [lead, core, trail] = splitWhitespace(original)
      if (!core || !/\p{L}/u.test(core)) return
      jobs.push({
        text: core,
        apply: translated => {
          const written = lead + translated + trail
          textOriginals.set(node, { original, written })
          if (node.data !== written) node.data = written
        },
      })
    }

    const addAttributes = (element: Element) => {
      if (isSkipped(element)) return
      for (const name of attributes) {
        const value = element.getAttribute(name)
        if (value === null) continue
        const known = attrOriginals.get(element)?.get(name)
        const original = known && value === known.written ? known.original : value
        if (!original.trim() || !/\p{L}/u.test(original)) continue
        jobs.push({
          text: original.trim(),
          apply: translated => {
            if (!attrOriginals.has(element)) attrOriginals.set(element, new Map())
            attrOriginals.get(element)!.set(name, { original, written: translated })
            if (element.getAttribute(name) !== translated) element.setAttribute(name, translated)
          },
        })
      }
    }

    if (scope.nodeType === Node.TEXT_NODE) {
      addText(scope as Text)
      return jobs
    }
    if (scope.nodeType !== Node.ELEMENT_NODE) return jobs

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) addText(node as Text)
    const element = scope as Element
    if (attributes.length) {
      const selector = attributes.map(name => `[${name}]`).join(',')
      if (element.matches(selector)) addAttributes(element)
      element.querySelectorAll(selector).forEach(addAttributes)
    }
    return jobs
  }

  const run = async (jobs: Job[]) => {
    if (!target || !jobs.length) return
    const forTarget = target
    const unique = [...new Set(jobs.map(job => job.text))]
    const results = new Map<string, string>()
    const missing: string[] = []
    for (const text of unique) {
      const cached = cache.get(cacheKey(text))
      if (cached !== undefined) results.set(text, cached)
      else missing.push(text)
    }

    controller = new AbortController()
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize)
      const translated = await provider.translate(batch, source, forTarget, controller.signal)
      // The visitor switched language (or restored) while we were waiting.
      if (target !== forTarget) return
      batch.forEach((text, index) => {
        results.set(text, translated[index])
        cache.set(cacheKey(text), translated[index])
      })
    }

    withoutObserving(() => {
      for (const job of jobs) {
        const translated = results.get(job.text)
        if (translated !== undefined) job.apply(translated)
      }
    })
  }

  const withoutObserving = (write: () => void) => {
    observer?.disconnect()
    try {
      write()
    } finally {
      if (observer && target) observer.observe(root(), observerOptions)
    }
  }

  const observerOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: attributes.length > 0,
    attributeFilter: attributes.length ? attributes : undefined,
  }

  const flush = () => {
    flushScheduled = false
    const nodes = [...pendingNodes].filter(node => node.isConnected)
    pendingNodes = new Set()
    run(nodes.flatMap(collect)).catch(() => {
      // A failed follow-up batch leaves that content untranslated; the next change retries.
    })
  }

  const onMutations = (records: MutationRecord[]) => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(node => pendingNodes.add(node))
      else pendingNodes.add(record.target)
    }
    if (!flushScheduled) {
      flushScheduled = true
      setTimeout(flush, 50)
    }
  }

  const setDocumentState = (language: string, translated: boolean) => {
    const html = document.documentElement
    html.lang = language
    html.classList.remove('translated-ltr', 'translated-rtl')
    if (translated) html.classList.add(RTL_LANGUAGES.has(language) ? 'translated-rtl' : 'translated-ltr')
  }

  const restore = () => {
    controller?.abort()
    observer?.disconnect()
    observer = null
    for (const [node, { original, written }] of textOriginals) {
      if (node.isConnected && node.data === written) node.data = original
    }
    for (const [element, attrs] of attrOriginals) {
      for (const [name, { original, written }] of attrs) {
        if (element.isConnected && element.getAttribute(name) === written) element.setAttribute(name, original)
      }
    }
    textOriginals.clear()
    attrOriginals.clear()
    if (target) setDocumentState(source, false)
    target = null
  }

  return {
    get target() {
      return target
    },
    async translate(from, to) {
      // Switching languages translates from the stored originals, so there's no flash of the source text.
      controller?.abort()
      source = from
      target = to
      setDocumentState(to, true)
      try {
        await run(collect(root()))
      } catch (error) {
        restore()
        throw error
      }
      if (observe && target === to && !observer) {
        observer = new MutationObserver(onMutations)
        observer.observe(root(), observerOptions)
      }
    },
    restore,
    destroy: restore,
  }
}
