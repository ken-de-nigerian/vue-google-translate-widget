import { describe, expect, it } from 'vitest'
import {
  clearGoogtrans,
  clearGoogtransHash,
  getCookieDomains,
  readGoogtrans,
  readGoogtransCookie,
  readGoogtransHash,
  writeGoogtrans,
} from '../src/core/cookies'

describe('getCookieDomains (B4)', () => {
  it.each([
    ['localhost', [undefined, 'localhost']],
    ['127.0.0.1', [undefined, '127.0.0.1']],
    ['example.com', [undefined, 'example.com', '.example.com']],
    ['www.example.com', [undefined, 'www.example.com', '.www.example.com', '.example.com']],
    [
      'a.b.example.co.uk',
      [undefined, 'a.b.example.co.uk', '.a.b.example.co.uk', '.b.example.co.uk', '.example.co.uk', '.co.uk'],
    ],
  ])('%s', (hostname, expected) => {
    expect(getCookieDomains(hostname)).toEqual(expected)
  })

  it('covers the parent domain Google writes to', () => {
    expect(getCookieDomains('shop.example.com')).toContain('.example.com')
  })
})

describe('readGoogtransHash', () => {
  it.each([
    ['#googtrans(en|fr)', { source: 'en', target: 'fr' }],
    ['#googtrans/en/zh-CN', { source: 'en', target: 'zh-CN' }],
    ['#section', null],
    ['', null],
  ])('%s', (hash, expected) => {
    expect(readGoogtransHash(hash)).toEqual(expected)
  })
})

describe('readGoogtransCookie', () => {
  it('reads the target language', () => {
    expect(readGoogtransCookie('a=1; googtrans=/en/de; b=2')).toEqual({ source: 'en', target: 'de' })
  })

  it('decodes URL-encoded values', () => {
    expect(readGoogtransCookie('googtrans=%2Fen%2Fzh-TW')).toEqual({ source: 'en', target: 'zh-TW' })
  })

  it('skips empty copies and uses the first valid one', () => {
    expect(readGoogtransCookie('googtrans=; googtrans=/en/fr')).toEqual({ source: 'en', target: 'fr' })
  })

  it('ignores cookies whose name merely contains googtrans', () => {
    expect(readGoogtransCookie('xgoogtrans=/en/fr')).toBeNull()
  })
})

describe('readGoogtrans', () => {
  it('prefers the hash over the cookie', () => {
    document.cookie = 'googtrans=/en/fr; path=/'
    window.location.hash = '#googtrans(en|de)'
    expect(readGoogtrans()?.target).toBe('de')
  })
})

describe('writeGoogtrans / clearGoogtrans', () => {
  it('writes a cookie the reader understands', () => {
    writeGoogtrans('en', 'yo')
    expect(readGoogtransCookie(document.cookie)).toEqual({ source: 'en', target: 'yo' })
  })

  it('replaces rather than duplicates the previous choice', () => {
    writeGoogtrans('en', 'fr')
    writeGoogtrans('en', 'de')
    expect(document.cookie).not.toContain('/en/fr')
    expect(readGoogtransCookie(document.cookie)?.target).toBe('de')
  })

  it('clears every copy', () => {
    writeGoogtrans('en', 'fr')
    clearGoogtrans()
    expect(readGoogtransCookie(document.cookie)).toBeNull()
  })

  it('expires the cookie on every domain variant', () => {
    const written: string[] = []
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => descriptor.get!.call(document),
      set: (value: string) => written.push(value),
    })
    try {
      clearGoogtrans()
    } finally {
      delete (document as { cookie?: string }).cookie
    }
    const domains = getCookieDomains(window.location.hostname)
    expect(written).toHaveLength(domains.length)
    for (const value of written) expect(value).toMatch(/^googtrans=; expires=Thu, 01 Jan 1970/)
  })
})

describe('clearGoogtransHash', () => {
  it('removes a googtrans hash and keeps path and query', () => {
    window.history.replaceState(null, '', '/page?x=1#googtrans(en|fr)')
    clearGoogtransHash()
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/page?x=1')
  })

  it('leaves other hashes alone', () => {
    window.history.replaceState(null, '', '/page#pricing')
    clearGoogtransHash()
    expect(window.location.hash).toBe('#pricing')
  })
})
