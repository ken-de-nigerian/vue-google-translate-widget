/**
 * A translation backend for the DOM engine (anything except Google's free
 * widget). It receives plain-text strings and returns them translated, in the
 * same order.
 */
export interface TranslationProvider {
  /** Used in cache keys, so changing provider never serves stale translations. */
  name: string
  translate(texts: string[], source: string, target: string, signal?: AbortSignal): Promise<string[]>
}

const assertTranslations = (value: unknown, expected: number, provider: string): string[] => {
  if (!Array.isArray(value) || value.length !== expected || value.some(item => typeof item !== 'string')) {
    throw new Error(`${provider}: expected ${expected} translated strings in the response`)
  }
  return value
}

const postJson = async (url: string, body: unknown, init: RequestInit, provider: string): Promise<unknown> => {
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'content-type': 'application/json', ...init.headers },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`${provider}: ${response.status} ${response.statusText}`.trim())
  return response.json()
}

export interface EndpointProviderOptions {
  /** Your server route, e.g. one made with `createTranslateHandler` from `/server`. */
  url: string
  headers?: Record<string, string>
  /** Sent as `credentials` on the request. Default: `'same-origin'`. */
  credentials?: RequestCredentials
}

/**
 * Calls your own endpoint, which holds the API key and talks to DeepL, Google
 * Cloud, Azure or LibreTranslate. Request: `{ texts, source, target }`.
 * Response: `{ translations: string[] }`.
 */
export function endpointProvider({
  url,
  headers,
  credentials = 'same-origin',
}: EndpointProviderOptions): TranslationProvider {
  return {
    name: `endpoint:${url}`,
    async translate(texts, source, target, signal) {
      const data = (await postJson(url, { texts, source, target }, { headers, credentials, signal }, 'endpoint')) as {
        translations?: unknown
      }
      return assertTranslations(data?.translations, texts.length, 'endpoint')
    },
  }
}

export interface LibreTranslateOptions {
  /** Your LibreTranslate server, e.g. `https://translate.example.com`. */
  url: string
  /** Only if your server requires one. It is visible to visitors; use a key restricted to this site. */
  apiKey?: string
}

/** LibreTranslate's language codes differ from Google's in a few places. */
export const toLibreTranslateCode = (code: string): string =>
  ({ iw: 'he', jw: 'jv', 'zh-CN': 'zh', 'zh-TW': 'zt', 'pt-PT': 'pt' })[code] ?? code

/** Talks to a (self-hosted) LibreTranslate server directly from the browser. */
export function libreTranslate({ url, apiKey }: LibreTranslateOptions): TranslationProvider {
  const endpoint = `${url.replace(/\/+$/, '')}/translate`
  return {
    name: `libretranslate:${url}`,
    async translate(texts, source, target, signal) {
      const body = {
        q: texts,
        source: toLibreTranslateCode(source),
        target: toLibreTranslateCode(target),
        format: 'text',
        ...(apiKey ? { api_key: apiKey } : {}),
      }
      const data = (await postJson(endpoint, body, { signal }, 'LibreTranslate')) as { translatedText?: unknown }
      return assertTranslations(data?.translatedText, texts.length, 'LibreTranslate')
    },
  }
}
