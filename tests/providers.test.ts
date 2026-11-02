import { describe, expect, it, vi } from 'vitest'
import { endpointProvider, libreTranslate } from '../src/core/providers'

function mockFetch(body: unknown, init: { status?: number } = {}) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () =>
      new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('endpointProvider', () => {
  it('POSTs { texts, source, target } and reads { translations }', async () => {
    const fetchMock = mockFetch({ translations: ['Bonjour', 'Monde'] })
    const provider = endpointProvider({ url: '/api/translate', headers: { 'x-csrf': 't' } })

    await expect(provider.translate(['Hello', 'World'], 'en', 'fr')).resolves.toEqual(['Bonjour', 'Monde'])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/translate')
    expect(init!.method).toBe('POST')
    expect(init!.credentials).toBe('same-origin')
    expect((init!.headers as Record<string, string>)['x-csrf']).toBe('t')
    expect(JSON.parse(init!.body as string)).toEqual({ texts: ['Hello', 'World'], source: 'en', target: 'fr' })
  })

  it('rejects on HTTP errors', async () => {
    mockFetch({ error: 'nope' }, { status: 429 })
    await expect(endpointProvider({ url: '/x' }).translate(['a'], 'en', 'fr')).rejects.toThrow('429')
  })

  it('rejects a response with the wrong number of strings', async () => {
    mockFetch({ translations: ['only one'] })
    await expect(endpointProvider({ url: '/x' }).translate(['a', 'b'], 'en', 'fr')).rejects.toThrow(
      'expected 2 translated strings',
    )
  })
})

describe('libreTranslate', () => {
  it('calls /translate with LibreTranslate’s format and codes', async () => {
    const fetchMock = mockFetch({ translatedText: ['שלום'] })
    const provider = libreTranslate({ url: 'https://lt.example.com/', apiKey: 'k' })

    await expect(provider.translate(['Hello'], 'en', 'iw')).resolves.toEqual(['שלום'])
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://lt.example.com/translate')
    expect(JSON.parse(init!.body as string)).toEqual({
      q: ['Hello'],
      source: 'en',
      target: 'he',
      format: 'text',
      api_key: 'k',
    })
  })
})
