// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  azure,
  createTranslateHandler,
  deepl,
  googleCloud,
  libreTranslateServer,
  toDeepLCode,
  type TranslationBackend,
} from '../src/server'

// Requests are checked against each vendor's documented API format; no live keys are used.
function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), { status }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const sent = (fetchMock: ReturnType<typeof mockFetch>) => {
  const [url, init] = fetchMock.mock.calls[0]
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) }
}

describe('deepl', () => {
  it('uses the free endpoint for :fx keys, DeepL’s auth header and codes', async () => {
    const fetchMock = mockFetch({ translations: [{ text: 'Hallo' }, { text: 'Welt' }] })
    await expect(deepl({ apiKey: 'abc:fx' }).translate(['Hello', 'World'], 'en', 'de')).resolves.toEqual([
      'Hallo',
      'Welt',
    ])
    const { url, headers, body } = sent(fetchMock)
    expect(url).toBe('https://api-free.deepl.com/v2/translate')
    expect(headers.authorization).toBe('DeepL-Auth-Key abc:fx')
    expect(body).toEqual({ text: ['Hello', 'World'], source_lang: 'EN', target_lang: 'DE' })
  })

  it('uses the Pro endpoint otherwise', async () => {
    const fetchMock = mockFetch({ translations: [{ text: 'x' }] })
    await deepl({ apiKey: 'pro-key' }).translate(['a'], 'en', 'fr')
    expect(sent(fetchMock).url).toBe('https://api.deepl.com/v2/translate')
  })

  it.each([
    ['en', 'target', 'EN-US'],
    ['en', 'source', 'EN'],
    ['pt', 'target', 'PT-BR'],
    ['pt-PT', 'target', 'PT-PT'],
    ['pt-PT', 'source', 'PT'],
    ['zh-CN', 'target', 'ZH-HANS'],
    ['zh-CN', 'source', 'ZH'],
    ['iw', 'target', 'HE'],
    ['de', 'target', 'DE'],
  ] as const)('maps %s (%s) to %s', (code, role, expected) => {
    expect(toDeepLCode(code, role)).toBe(expected)
  })
})

describe('googleCloud', () => {
  it('calls Translation v2 with the key in the query and format=text', async () => {
    const fetchMock = mockFetch({ data: { translations: [{ translatedText: 'Bonjour' }] } })
    await expect(googleCloud({ apiKey: 'k&y' }).translate(['Hello'], 'en', 'fr')).resolves.toEqual(['Bonjour'])
    const { url, body } = sent(fetchMock)
    expect(url).toBe('https://translation.googleapis.com/language/translate/v2?key=k%26y')
    expect(body).toEqual({ q: ['Hello'], source: 'en', target: 'fr', format: 'text' })
  })
})

describe('azure', () => {
  it('calls /translate v3 with Azure’s headers, codes and body shape', async () => {
    const fetchMock = mockFetch([{ translations: [{ text: '你好', to: 'zh-Hans' }] }])
    await expect(azure({ key: 'k', region: 'westeurope' }).translate(['Hello'], 'en', 'zh-CN')).resolves.toEqual([
      '你好',
    ])
    const { url, headers, body } = sent(fetchMock)
    expect(url).toBe('https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans')
    expect(headers['Ocp-Apim-Subscription-Key']).toBe('k')
    expect(headers['Ocp-Apim-Subscription-Region']).toBe('westeurope')
    expect(body).toEqual([{ Text: 'Hello' }])
  })
})

describe('libreTranslateServer', () => {
  it('calls /translate with the API key kept server-side', async () => {
    const fetchMock = mockFetch({ translatedText: ['Hola'] })
    await expect(
      libreTranslateServer({ url: 'http://lt:5000/', apiKey: 'secret' }).translate(['Hello'], 'en', 'es'),
    ).resolves.toEqual(['Hola'])
    const { url, body } = sent(fetchMock)
    expect(url).toBe('http://lt:5000/translate')
    expect(body).toEqual({ q: ['Hello'], source: 'en', target: 'es', format: 'text', api_key: 'secret' })
  })
})

describe('backends reject bad upstream responses', () => {
  it.each([
    ['deepl', () => deepl({ apiKey: 'k' })],
    ['googleCloud', () => googleCloud({ apiKey: 'k' })],
    ['azure', () => azure({ key: 'k' })],
    ['libreTranslateServer', () => libreTranslateServer({ url: 'http://lt' })],
  ])('%s: HTTP error and wrong shape', async (_name, make) => {
    mockFetch({}, 403)
    await expect(make().translate(['a'], 'en', 'fr')).rejects.toThrow('403')
    mockFetch({ unexpected: true })
    await expect(make().translate(['a'], 'en', 'fr')).rejects.toThrow('unexpected response')
  })
})

describe('createTranslateHandler', () => {
  const echo: TranslationBackend = {
    name: 'echo',
    translate: async (texts, _s, target) => texts.map(t => `${t}@${target}`),
  }
  const post = (body: unknown, method = 'POST') =>
    new Request('https://site.test/api/translate', {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    })

  it('translates a valid request', async () => {
    const response = await createTranslateHandler({ backend: echo })(
      post({ texts: ['Hello', 'World'], source: 'en', target: 'fr' }),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ translations: ['Hello@fr', 'World@fr'] })
  })

  it.each([
    ['GET', undefined, 405],
    ['POST', '{not json', 400],
    ['POST', { texts: 'Hello', source: 'en', target: 'fr' }, 400],
    ['POST', { texts: [1], source: 'en', target: 'fr' }, 400],
    ['POST', { texts: ['a'], source: 'en', target: '<script>' }, 400],
    ['POST', { texts: ['a'], target: 'fr' }, 400],
  ])('%s %j → %i', async (method, body, status) => {
    const response = await createTranslateHandler({ backend: echo })(post(body, method))
    expect(response.status).toBe(status)
    expect((await response.json()).error).toBeTruthy()
  })

  it('enforces maxTexts and maxCharacters (413)', async () => {
    const handler = createTranslateHandler({ backend: echo, maxTexts: 2, maxCharacters: 10 })
    expect((await handler(post({ texts: ['a', 'b', 'c'], source: 'en', target: 'fr' }))).status).toBe(413)
    expect((await handler(post({ texts: ['hello', 'world!'], source: 'en', target: 'fr' }))).status).toBe(413)
    expect((await handler(post({ texts: ['hello'], source: 'en', target: 'fr' }))).status).toBe(200)
  })

  it('restricts targets with allowedTargets', async () => {
    const handler = createTranslateHandler({ backend: echo, allowedTargets: ['fr', 'de'] })
    expect((await handler(post({ texts: ['a'], source: 'en', target: 'ja' }))).status).toBe(400)
    expect((await handler(post({ texts: ['a'], source: 'en', target: 'de' }))).status).toBe(200)
  })

  it('answers an empty request without calling the backend', async () => {
    const translate = vi.fn()
    const response = await createTranslateHandler({ backend: { name: 'x', translate } })(
      post({ texts: [], source: 'en', target: 'fr' }),
    )
    expect(await response.json()).toEqual({ translations: [] })
    expect(translate).not.toHaveBeenCalled()
  })

  it('hides upstream errors from the browser and reports them to onError', async () => {
    const onError = vi.fn()
    const failing: TranslationBackend = {
      name: 'fail',
      translate: async () => {
        throw new Error('DeepL responded 456 (quota for key abc:fx exceeded)')
      },
    }
    const response = await createTranslateHandler({ backend: failing, onError })(
      post({ texts: ['a'], source: 'en', target: 'fr' }),
    )
    expect(response.status).toBe(502)
    const text = await response.text()
    expect(text).not.toContain('abc:fx')
    expect(JSON.parse(text)).toEqual({ error: 'Translation failed' })
    expect(onError).toHaveBeenCalledOnce()
  })

  it('round-trips with endpointProvider', async () => {
    const { endpointProvider } = await import('../src/core/providers')
    const handler = createTranslateHandler({ backend: echo })
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => handler(new Request(`https://site.test${url}`, init)))
    await expect(endpointProvider({ url: '/api/translate' }).translate(['Hi'], 'en', 'yo')).resolves.toEqual(['Hi@yo'])
  })
})
