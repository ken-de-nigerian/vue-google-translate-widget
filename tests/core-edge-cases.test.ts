// Edge cases found by mutation testing: each test pins down behaviour that a deliberate code change survived.
import { describe, expect, it, vi } from 'vitest'
import {
  clearGoogtrans,
  clearGoogtransHash,
  getCookieDomains,
  readGoogtrans,
  readGoogtransCookie,
  readQueryLanguage,
  writeGoogtrans,
  writeQueryLanguage,
} from '../src/core/cookies'
import {
  findRestoreButton,
  injectBrandingStyles,
  startDirectionSync,
  stopDirectionSync,
  waitForTranslationState,
} from '../src/core/page'
import { endpointProvider, libreTranslate } from '../src/core/providers'

/** Records every cookie string written, while still letting the browser store them. */
function recordCookieWrites() {
  const written: string[] = []
  // happy-dom defines the cookie accessor somewhere down document's prototype chain.
  let proto: object | null = Object.getPrototypeOf(document)
  while (proto && !Object.getOwnPropertyDescriptor(proto, 'cookie')) proto = Object.getPrototypeOf(proto)
  const descriptor = Object.getOwnPropertyDescriptor(proto!, 'cookie')!
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => descriptor.get!.call(document),
    set: (value: string) => {
      written.push(value)
      descriptor.set!.call(document, value)
    },
  })
  return { written, restore: () => delete (document as { cookie?: string }).cookie }
}

describe('cookies: exact attributes', () => {
  it('expires the cookie with the right domain attribute for every level', () => {
    const { written, restore } = recordCookieWrites()
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, hostname: 'shop.example.com' })
    try {
      clearGoogtrans()
    } finally {
      restore()
    }
    expect(written).toEqual([
      'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/',
      'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=shop.example.com',
      'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.shop.example.com',
      'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.example.com',
    ])
  })

  it('writes the choice host-only and on the hostname', () => {
    const { written, restore } = recordCookieWrites()
    try {
      writeGoogtrans('en', 'fr')
    } finally {
      restore()
    }
    expect(written.slice(-2)).toEqual([
      'googtrans=/en/fr; path=/',
      `googtrans=/en/fr; path=/; domain=${window.location.hostname}`,
    ])
  })

  it.each([
    ['1.2.3.4', [undefined, '1.2.3.4']],
    ['::1', [undefined, '::1']],
    // Not IP addresses: digits and dots only at the start or the end isn't enough.
    ['a1.2.3', [undefined, 'a1.2.3', '.a1.2.3', '.2.3']],
    ['1.2.3.example', [undefined, '1.2.3.example', '.1.2.3.example', '.2.3.example', '.3.example']],
    ['', [undefined]],
  ])('domains for %j', (hostname, expected) => {
    expect(getCookieDomains(hostname)).toEqual(expected)
  })
})

describe('cookies: parsing', () => {
  it.each([
    ['googtrans', null],
    ['googtrans=', null],
    ['googtrans=/en/', null],
    ['googtrans=//fr', null],
    ['  googtrans  =  /en/fr  ', { source: 'en', target: 'fr' }],
    ['a=b;googtrans=/en/de', { source: 'en', target: 'de' }],
    ['googtransx=/en/fr', null],
  ])('%j', (cookie, expected) => {
    expect(readGoogtransCookie(cookie)).toEqual(expected)
  })
})

describe('?lang= parameter', () => {
  it.each(['fr<x>', '<x>fr', 'fr-', 'fr-a', 'fr-<script>', 'f', ''])('ignores %j', value => {
    expect(readQueryLanguage(`?lang=${encodeURIComponent(value)}`, 'lang')).toBeNull()
  })

  it('reads a valid code and ignores other parameters', () => {
    expect(readQueryLanguage('?x=1&lang=zh-CN', 'lang')).toBe('zh-CN')
    expect(readQueryLanguage('?language=fr', 'lang')).toBeNull()
  })

  it('does not touch history when nothing changes', () => {
    window.history.replaceState(null, '', '/page?lang=fr')
    const replace = vi.spyOn(window.history, 'replaceState')
    writeQueryLanguage('lang', 'fr')
    expect(replace).not.toHaveBeenCalled()
    writeQueryLanguage('lang', 'de')
    expect(replace).toHaveBeenCalledWith(window.history.state, '', expect.objectContaining({ search: '?lang=de' }))
  })

  it('leaves the URL alone when there is no googtrans hash', () => {
    window.history.replaceState(null, '', '/page')
    const replace = vi.spyOn(window.history, 'replaceState')
    clearGoogtransHash()
    expect(replace).not.toHaveBeenCalled()
  })

  it('readGoogtrans returns null when nothing is saved', () => {
    expect(readGoogtrans()).toBeNull()
  })
})

describe('page helpers', () => {
  it('adds the branding stylesheet once, with a nonce only when given', () => {
    injectBrandingStyles()
    injectBrandingStyles('again')
    const styles = document.querySelectorAll('#gtw-hide-branding')
    expect(styles).toHaveLength(1)
    expect(styles[0].hasAttribute('nonce')).toBe(false)

    styles[0].remove()
    injectBrandingStyles('n0nce')
    expect(
      document.getElementById('gtw-hide-branding')!.getAttribute('nonce') ??
        (document.getElementById('gtw-hide-branding') as HTMLStyleElement).nonce,
    ).toBe('n0nce')
  })

  it('finds "Show original" in whichever frame has it', () => {
    const empty = document.createElement('iframe')
    const banner = document.createElement('iframe')
    document.body.append(empty, banner)
    const button = banner.contentDocument!.createElement('button')
    button.id = ':2.restore'
    banner.contentDocument!.body.appendChild(button)
    expect(findRestoreButton()).toBe(button)
  })

  it('returns null when no frame has it, and survives frames that throw', () => {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    vi.spyOn(frame, 'contentDocument', 'get').mockImplementation(() => {
      throw new DOMException('Blocked a frame with origin', 'SecurityError')
    })
    expect(findRestoreButton()).toBeNull()
  })

  it('waits only for the requested state, and reports a timeout as false', async () => {
    vi.useFakeTimers()
    const reached = waitForTranslationState(true, 1000)
    document.documentElement.className = 'something-else'
    await vi.advanceTimersByTimeAsync(10)
    document.documentElement.className = 'translated-ltr'
    await vi.advanceTimersByTimeAsync(10)
    await expect(reached).resolves.toBe(true)

    const timedOut = waitForTranslationState(false, 1000)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(timedOut).resolves.toBe(false)
  })

  it('resolves immediately when already in the requested state', async () => {
    document.documentElement.className = ''
    await expect(waitForTranslationState(false, 1)).resolves.toBe(true)
  })

  it('keeps a page’s own rtl direction when not translated', async () => {
    document.documentElement.dir = 'rtl'
    startDirectionSync()
    document.documentElement.className = 'translated-ltr'
    await new Promise(r => setTimeout(r))
    expect(document.documentElement.dir).toBe('rtl')
    stopDirectionSync()
  })
})

function mockFetch(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), init),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('providers: edge cases', () => {
  it('sends JSON and names itself after its URL', async () => {
    const fetchMock = mockFetch({ translations: ['x'] })
    const provider = endpointProvider({ url: '/api/translate' })
    await provider.translate(['a'], 'en', 'fr')
    expect((fetchMock.mock.calls[0][1]!.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(provider.name).toBe('endpoint:/api/translate')
    expect(libreTranslate({ url: 'https://lt.test' }).name).toBe('libretranslate:https://lt.test')
  })

  it('includes the status text in HTTP errors', async () => {
    mockFetch({}, { status: 503, statusText: 'Service Unavailable' })
    await expect(endpointProvider({ url: '/x' }).translate(['a'], 'en', 'fr')).rejects.toThrow(
      'endpoint: 503 Service Unavailable',
    )
  })

  it.each<[unknown, string]>([
    [{ translations: [42] }, 'non-string'],
    [{}, 'missing'],
    [null, 'null body'],
  ])('rejects an endpoint response that is %s (%s)', async body => {
    mockFetch(body)
    await expect(endpointProvider({ url: '/x' }).translate(['a'], 'en', 'fr')).rejects.toThrow(
      'endpoint: expected 1 translated strings in the response',
    )
  })

  it('rejects a LibreTranslate response with the wrong shape, naming the service', async () => {
    mockFetch({ translatedText: [1] })
    await expect(libreTranslate({ url: 'https://lt.test' }).translate(['a'], 'en', 'fr')).rejects.toThrow(
      'LibreTranslate: expected 1 translated strings in the response',
    )
    mockFetch(null)
    await expect(libreTranslate({ url: 'https://lt.test' }).translate(['a'], 'en', 'fr')).rejects.toThrow(
      'LibreTranslate',
    )
  })

  it('strips every trailing slash from the LibreTranslate URL', async () => {
    const fetchMock = mockFetch({ translatedText: ['x'] })
    await libreTranslate({ url: 'https://lt.test///' }).translate(['a'], 'en', 'fr')
    expect(fetchMock.mock.calls[0][0]).toBe('https://lt.test/translate')
  })

  it.each([
    ['jw', 'jv'],
    ['zh-CN', 'zh'],
    ['zh-TW', 'zt'],
    ['pt-PT', 'pt'],
  ])('maps %s to LibreTranslate’s %s', async (code, expected) => {
    const fetchMock = mockFetch({ translatedText: ['x'] })
    await libreTranslate({ url: 'https://lt.test' }).translate(['a'], 'en', code)
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).target).toBe(expected)
  })
})
