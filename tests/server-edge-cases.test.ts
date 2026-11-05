// @vitest-environment node
// Edge cases found by mutation testing: each test pins down behaviour that a deliberate code change survived.
import { describe, expect, it, vi } from 'vitest'
import {
  azure,
  createTranslateHandler,
  deepl,
  googleCloud,
  libreTranslateServer,
  toAzureCode,
  toDeepLCode,
  toLibreTranslateCode,
  type TranslationBackend,
} from '../src/server'

const echo: TranslationBackend = { name: 'echo', translate: async texts => texts }
const post = (body: unknown) =>
  new Request('https://site.test/api/translate', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
const call = async (body: unknown, options: Partial<Parameters<typeof createTranslateHandler>[0]> = {}) => {
  const response = await createTranslateHandler({ backend: echo, ...options })(post(body))
  return { status: response.status, type: response.headers.get('content-type'), body: await response.json() }
}

describe('createTranslateHandler: input validation', () => {
  it.each(['fr<script>', '<b>fr', 'fr-', 'f', 'french', 'fr-ABCDEFGHI', 'fr_CA', ' fr'])(
    'rejects the target code %j',
    async target => {
      const { status, body } = await call({ texts: ['a'], source: 'en', target })
      expect(status).toBe(400)
      expect(body.error).toBe('"source" and "target" must be language codes')
    },
  )

  it.each(['fr', 'yo', 'zh-CN', 'pt-PT', 'fil', 'mni-Mtei'])('accepts the target code %j', async target => {
    expect((await call({ texts: ['a'], source: 'en', target })).status).toBe(200)
  })

  it.each([[['en']], [42], [null]])('rejects a non-string source %j', async source => {
    expect((await call({ texts: ['a'], source, target: 'fr' })).status).toBe(400)
  })

  it('explains each rejection', async () => {
    expect((await call('{not json')).body.error).toBe('Expected a JSON body')
    expect((await call({ texts: 'a', source: 'en', target: 'fr' })).body.error).toBe(
      '"texts" must be an array of strings',
    )
    expect((await call({ texts: ['a'], source: 'en', target: 'ja' }, { allowedTargets: ['fr'] })).body.error).toBe(
      'Translating to "ja" is not allowed',
    )
    expect((await call({ texts: ['a', 'b'], source: 'en', target: 'fr' }, { maxTexts: 1 })).body.error).toBe(
      'At most 1 strings per request',
    )
    expect((await call({ texts: ['abc'], source: 'en', target: 'fr' }, { maxCharacters: 2 })).body.error).toBe(
      'At most 2 characters per request',
    )
  })

  it('allows exactly maxTexts strings and exactly maxCharacters characters', async () => {
    const limits = { maxTexts: 2, maxCharacters: 6 }
    expect((await call({ texts: ['abc', 'def'], source: 'en', target: 'fr' }, limits)).status).toBe(200)
    expect((await call({ texts: ['abc', 'defg'], source: 'en', target: 'fr' }, limits)).status).toBe(413)
    expect((await call({ texts: ['a', 'b', 'c'], source: 'en', target: 'fr' }, limits)).status).toBe(413)
  })

  it('answers with JSON every time', async () => {
    expect((await call({ texts: ['a'], source: 'en', target: 'fr' })).type).toBe('application/json')
    expect((await call('{bad')).type).toBe('application/json')
  })
})

describe('createTranslateHandler: backend failures', () => {
  it('returns 502 even without onError', async () => {
    const failing: TranslationBackend = {
      name: 'fail',
      translate: async () => {
        throw new Error('boom')
      },
    }
    const { status, body } = await call({ texts: ['a'], source: 'en', target: 'fr' }, { backend: failing })
    expect(status).toBe(502)
    expect(body).toEqual({ error: 'Translation failed' })
  })
})

function mockFetch(body: unknown) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body)),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('backends: response checks', () => {
  const backends = {
    deepl: [() => deepl({ apiKey: 'k' }), (t: string[]) => ({ translations: t.map(text => ({ text })) })],
    googleCloud: [
      () => googleCloud({ apiKey: 'k' }),
      (t: string[]) => ({ data: { translations: t.map(translatedText => ({ translatedText })) } }),
    ],
    azure: [() => azure({ key: 'k' }), (t: string[]) => t.map(text => ({ translations: [{ text }] }))],
    libreTranslate: [() => libreTranslateServer({ url: 'http://lt' }), (t: string[]) => ({ translatedText: t })],
  } as const

  it.each(Object.entries(backends))('%s: rejects too few translations', async (_name, [make, shape]) => {
    mockFetch(shape(['one']))
    await expect(make().translate(['a', 'b'], 'en', 'fr')).rejects.toThrow('unexpected response')
  })

  it.each(Object.entries(backends))('%s: rejects non-string translations', async (_name, [make, shape]) => {
    mockFetch(shape([42 as unknown as string]))
    await expect(make().translate(['a'], 'en', 'fr')).rejects.toThrow('unexpected response')
  })

  it.each(Object.entries(backends))('%s: names the service in errors', async (_name, [make]) => {
    mockFetch({ nothing: true })
    await expect(make().translate(['a'], 'en', 'fr')).rejects.toThrow(
      /^(DeepL|Google Cloud Translation|Azure Translator|LibreTranslate) returned an unexpected response$/,
    )
  })

  it('reports each backend’s name', () => {
    expect(
      [
        deepl({ apiKey: 'k' }),
        googleCloud({ apiKey: 'k' }),
        azure({ key: 'k' }),
        libreTranslateServer({ url: 'u' }),
      ].map(b => b.name),
    ).toEqual(['deepl', 'google-cloud', 'azure', 'libretranslate'])
  })

  it('rejects a Google Cloud or Azure response missing its translations', async () => {
    mockFetch({ data: {} })
    await expect(googleCloud({ apiKey: 'k' }).translate(['a'], 'en', 'fr')).rejects.toThrow('unexpected response')
    mockFetch([{}])
    await expect(azure({ key: 'k' }).translate(['a'], 'en', 'fr')).rejects.toThrow('unexpected response')
  })
})

describe('language code mapping', () => {
  it.each([
    ['zh-TW', 'ZH-HANT'],
    ['iw', 'HE'],
    ['nb', 'NB'],
    ['no', 'NB'],
    ['pt', 'PT-BR'],
  ])('DeepL target %s → %s', (code, expected) => expect(toDeepLCode(code, 'target')).toBe(expected))

  it.each([
    ['iw', 'HE'],
    ['no', 'NB'],
    ['zh-TW', 'ZH'],
  ])('DeepL source %s → %s', (code, expected) => expect(toDeepLCode(code, 'source')).toBe(expected))

  it.each([
    ['iw', 'he'],
    ['jw', 'jv'],
    ['zh-CN', 'zh-Hans'],
    ['zh-TW', 'zh-Hant'],
    ['tl', 'fil'],
    ['no', 'nb'],
    ['pt-PT', 'pt-pt'],
    ['fr', 'fr'],
  ])('Azure %s → %s', (code, expected) => expect(toAzureCode(code)).toBe(expected))

  it.each([
    ['iw', 'he'],
    ['jw', 'jv'],
    ['zh-CN', 'zh'],
    ['zh-TW', 'zt'],
    ['pt-PT', 'pt'],
    ['de', 'de'],
  ])('LibreTranslate %s → %s', (code, expected) => expect(toLibreTranslateCode(code)).toBe(expected))
})
