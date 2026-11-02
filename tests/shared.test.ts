import { describe, expect, it, vi } from 'vitest'
import {
  flagEmoji,
  matchBrowserLanguage,
  orderLanguages,
  readRecentLanguages,
  rememberRecentLanguage,
  safeStorage,
} from '../src/components/shared'
import { toGoogleCode } from '../src'

const langs = ['af', 'de', 'fr', 'iw', 'yo', 'zh-CN', 'pt', 'pt-PT'].map(code => ({ code }))

describe('flagEmoji', () => {
  it.each([
    ['fr', '🇫🇷'],
    ['NG', '🇳🇬'],
    ['gb-wls', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}'],
    ['gb-sct', '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'],
    ['es-ct', ''],
    ['', ''],
  ])('%s', (flag, expected) => {
    expect(flagEmoji(flag)).toBe(expected)
  })
})

describe('orderLanguages', () => {
  it('keeps the order when nothing is pinned', () => {
    expect(orderLanguages(langs).map(l => l.code)).toEqual(langs.map(l => l.code))
  })

  it('puts pinned first in the given order, then recent, then the rest', () => {
    const ordered = orderLanguages(langs, ['yo', 'fr'], ['de', 'yo'])
    expect(ordered.map(l => l.code)).toEqual(['yo', 'fr', 'de', 'af', 'iw', 'zh-CN', 'pt', 'pt-PT'])
  })

  it('understands modern codes through toCode', () => {
    expect(orderLanguages(langs, ['he'], [], toGoogleCode)[0].code).toBe('iw')
  })

  it('ignores codes that aren’t offered', () => {
    expect(orderLanguages(langs, ['xx'])).toHaveLength(langs.length)
  })
})

describe('matchBrowserLanguage', () => {
  it('matches the exact regional code first', () => {
    expect(matchBrowserLanguage(langs, 'en', ['pt-PT', 'pt'])?.code).toBe('pt-PT')
  })

  it('falls back to the base language', () => {
    expect(matchBrowserLanguage(langs, 'en', ['fr-CA'])?.code).toBe('fr')
  })

  it('is case-insensitive', () => {
    expect(matchBrowserLanguage(langs, 'en', ['ZH-cn'])?.code).toBe('zh-CN')
  })

  it('skips unsupported languages and keeps looking', () => {
    expect(matchBrowserLanguage(langs, 'en', ['tlh', 'de-AT'])?.code).toBe('de')
  })

  it('suggests nothing when the visitor prefers the page language', () => {
    expect(matchBrowserLanguage(langs, 'en', ['en-GB', 'fr'])).toBeUndefined()
  })

  it('maps he to iw', () => {
    expect(matchBrowserLanguage(langs, 'en', ['he-IL'], toGoogleCode)?.code).toBe('iw')
  })
})

describe('recent languages', () => {
  it('remembers the most recent first, without duplicates, up to the limit', () => {
    window.localStorage.clear()
    rememberRecentLanguage('fr', 3)
    rememberRecentLanguage('de', 3)
    rememberRecentLanguage('fr', 3)
    rememberRecentLanguage('yo', 3)
    rememberRecentLanguage('iw', 3)
    expect(readRecentLanguages()).toEqual(['iw', 'yo', 'fr'])
  })

  it('survives corrupt storage', () => {
    window.localStorage.setItem('gtw-recent-languages', '{not json')
    expect(readRecentLanguages()).toEqual([])
    window.localStorage.setItem('gtw-recent-languages', '{"a":1}')
    expect(readRecentLanguages()).toEqual([])
  })

  it('works when storage throws (private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(safeStorage.get('x')).toBeNull()
    expect(() => safeStorage.set('x', '1')).not.toThrow()
    expect(rememberRecentLanguage('fr', 3)).toEqual(['fr'])
  })
})
