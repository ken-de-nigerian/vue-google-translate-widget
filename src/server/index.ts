/**
 * Server-side translation backends. Import from
 * `@ken_de_nigerian/vue-google-translate-widget/server` in your server code only:
 * these hold API keys, which must never reach the browser.
 *
 * ```ts
 * // server/api/translate.post.ts (Nuxt)
 * import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'
 * const handler = createTranslateHandler({ backend: deepl({ apiKey: process.env.DEEPL_KEY! }) })
 * export default defineEventHandler(event => handler(toWebRequest(event)))
 * ```
 */

export interface TranslationBackend {
  name: string
  translate(texts: string[], source: string, target: string): Promise<string[]>
}

const request = async (url: string, init: RequestInit, backend: string): Promise<unknown> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`${backend} responded ${response.status}`)
  }
  return response.json()
}

const expectStrings = (value: unknown, count: number, backend: string): string[] => {
  if (!Array.isArray(value) || value.length !== count || value.some(v => typeof v !== 'string')) {
    throw new Error(`${backend} returned an unexpected response`)
  }
  return value
}

// --- DeepL -------------------------------------------------------------------

/** DeepL uses upper-case codes, regional English/Portuguese targets and script codes for Chinese. */
export function toDeepLCode(code: string, role: 'source' | 'target'): string {
  const targets: Record<string, string> = {
    en: 'EN-US',
    pt: 'PT-BR',
    'pt-PT': 'PT-PT',
    'zh-CN': 'ZH-HANS',
    'zh-TW': 'ZH-HANT',
    iw: 'HE',
    nb: 'NB',
    no: 'NB',
  }
  if (role === 'target' && targets[code]) return targets[code]
  const base = { iw: 'he', no: 'nb' }[code] ?? code.split('-')[0]
  return base.toUpperCase()
}

export interface DeepLOptions {
  apiKey: string
  /** Defaults to the free API for keys ending in ":fx", the Pro API otherwise. */
  url?: string
}

export function deepl({ apiKey, url }: DeepLOptions): TranslationBackend {
  const endpoint =
    url ?? (apiKey.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate')
  return {
    name: 'deepl',
    async translate(texts, source, target) {
      const data = (await request(
        endpoint,
        {
          method: 'POST',
          headers: { authorization: `DeepL-Auth-Key ${apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            text: texts,
            source_lang: toDeepLCode(source, 'source'),
            target_lang: toDeepLCode(target, 'target'),
          }),
        },
        'DeepL',
      )) as { translations?: { text: string }[] }
      return expectStrings(
        data.translations?.map(t => t.text),
        texts.length,
        'DeepL',
      )
    },
  }
}

// --- Google Cloud Translation (v2, API key) -----------------------------------

export interface GoogleCloudOptions {
  apiKey: string
}

export function googleCloud({ apiKey }: GoogleCloudOptions): TranslationBackend {
  return {
    name: 'google-cloud',
    async translate(texts, source, target) {
      const data = (await request(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ q: texts, source, target, format: 'text' }),
        },
        'Google Cloud Translation',
      )) as { data?: { translations?: { translatedText: string }[] } }
      return expectStrings(
        data.data?.translations?.map(t => t.translatedText),
        texts.length,
        'Google Cloud Translation',
      )
    },
  }
}

// --- Azure AI Translator --------------------------------------------------------

export const toAzureCode = (code: string): string =>
  ({ iw: 'he', jw: 'jv', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant', tl: 'fil', no: 'nb', 'pt-PT': 'pt-pt' })[code] ?? code

export interface AzureOptions {
  key: string
  /** Your resource's region, e.g. "westeurope". Required for regional and multi-service resources. */
  region?: string
  url?: string
}

export function azure({
  key,
  region,
  url = 'https://api.cognitive.microsofttranslator.com',
}: AzureOptions): TranslationBackend {
  return {
    name: 'azure',
    async translate(texts, source, target) {
      const query = new URLSearchParams({ 'api-version': '3.0', from: toAzureCode(source), to: toAzureCode(target) })
      const data = (await request(
        `${url.replace(/\/+$/, '')}/translate?${query}`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            ...(region ? { 'Ocp-Apim-Subscription-Region': region } : {}),
            'content-type': 'application/json',
          },
          body: JSON.stringify(texts.map(text => ({ Text: text }))),
        },
        'Azure Translator',
      )) as { translations?: { text: string }[] }[]
      return expectStrings(
        Array.isArray(data) ? data.map(item => item.translations?.[0]?.text) : undefined,
        texts.length,
        'Azure Translator',
      )
    },
  }
}

// --- LibreTranslate (server-side, e.g. to keep its API key private) -------------

export const toLibreTranslateCode = (code: string): string =>
  ({ iw: 'he', jw: 'jv', 'zh-CN': 'zh', 'zh-TW': 'zt', 'pt-PT': 'pt' })[code] ?? code

export interface LibreTranslateServerOptions {
  url: string
  apiKey?: string
}

export function libreTranslateServer({ url, apiKey }: LibreTranslateServerOptions): TranslationBackend {
  return {
    name: 'libretranslate',
    async translate(texts, source, target) {
      const data = (await request(
        `${url.replace(/\/+$/, '')}/translate`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            q: texts,
            source: toLibreTranslateCode(source),
            target: toLibreTranslateCode(target),
            format: 'text',
            ...(apiKey ? { api_key: apiKey } : {}),
          }),
        },
        'LibreTranslate',
      )) as { translatedText?: unknown }
      return expectStrings(data.translatedText, texts.length, 'LibreTranslate')
    },
  }
}

// --- The handler ------------------------------------------------------------------

export interface TranslateHandlerOptions {
  backend: TranslationBackend
  /** Most strings per request. Default: 100. */
  maxTexts?: number
  /** Most characters per request, all strings together (this is what you pay for). Default: 20 000. */
  maxCharacters?: number
  /** Only allow these target languages (Google codes). Default: any. */
  allowedTargets?: string[]
  /** Called when the backend fails, e.g. to log it. The visitor only sees a generic error. */
  onError?: (error: unknown) => void
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const isLanguageCode = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(value)

/**
 * A Fetch-standard handler, `(request: Request) => Promise<Response>`, for the
 * route `endpointProvider({ url })` calls. Works as-is in Nuxt/Nitro (via
 * `toWebRequest`), Next.js route handlers, Hono, Remix, SvelteKit, Deno, Bun and
 * Cloudflare Workers.
 *
 * Request: `POST { texts: string[], source: string, target: string }`.
 * Response: `{ translations: string[] }`, or `{ error }` with status 400/405/413/502.
 */
export function createTranslateHandler({
  backend,
  maxTexts = 100,
  maxCharacters = 20_000,
  allowedTargets,
  onError,
}: TranslateHandlerOptions): (request: Request) => Promise<Response> {
  return async request => {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    let body: { texts?: unknown; source?: unknown; target?: unknown }
    try {
      body = await request.json()
    } catch {
      return json({ error: 'Expected a JSON body' }, 400)
    }

    const { texts, source, target } = body ?? {}
    if (!Array.isArray(texts) || texts.some(text => typeof text !== 'string')) {
      return json({ error: '"texts" must be an array of strings' }, 400)
    }
    if (!isLanguageCode(source) || !isLanguageCode(target)) {
      return json({ error: '"source" and "target" must be language codes' }, 400)
    }
    if (allowedTargets && !allowedTargets.includes(target)) {
      return json({ error: `Translating to "${target}" is not allowed` }, 400)
    }
    if (texts.length > maxTexts) return json({ error: `At most ${maxTexts} strings per request` }, 413)
    const characters = texts.reduce((sum: number, text: string) => sum + text.length, 0)
    if (characters > maxCharacters) return json({ error: `At most ${maxCharacters} characters per request` }, 413)
    if (!texts.length) return json({ translations: [] })

    try {
      return json({ translations: await backend.translate(texts, source, target) })
    } catch (error) {
      onError?.(error)
      // Never echo upstream details (they can include keys or quota info) to the browser.
      return json({ error: 'Translation failed' }, 502)
    }
  }
}
