import { describe, expect, it } from 'vitest'
import { DEFAULT_LANGUAGES, LANGUAGE_CODE_ALIASES, toGoogleCode } from '../src'
import snapshot from './fixtures/google-languages.json'

// Codes from the real widget's <select>, captured from translate.google.com
// with pageLanguage "en" (so "en" itself is not listed).
const googleCodes = new Set(snapshot.languages.map(lang => lang.code))

describe('DEFAULT_LANGUAGES (B9)', () => {
  it('only uses codes the real Google widget accepts', () => {
    const unknown = DEFAULT_LANGUAGES.map(lang => lang.code).filter(code => code !== 'en' && !googleCodes.has(code))
    expect(unknown).toEqual([])
  })

  it('has unique codes', () => {
    const codes = DEFAULT_LANGUAGES.map(lang => lang.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('uses Google’s legacy codes for Hebrew and Javanese', () => {
    expect(DEFAULT_LANGUAGES.find(lang => lang.name === 'Hebrew')?.code).toBe('iw')
    expect(DEFAULT_LANGUAGES.find(lang => lang.name === 'Javanese')?.code).toBe('jw')
  })

  it('has no contested country flags (B16)', () => {
    const flagOf = (name: string) => DEFAULT_LANGUAGES.find(lang => lang.name === name)?.flag
    expect(flagOf('Catalan')).toBe('es-ct')
    expect(flagOf('Basque')).toBe('es-pv')
    expect(flagOf('Galician')).toBe('es-ga')
    expect(flagOf('Esperanto')).toBe('')
    expect(flagOf('Kurdish (Kurmanji)')).toBe('')
  })

  it('distinguishes Brazilian and European Portuguese', () => {
    expect(DEFAULT_LANGUAGES.find(lang => lang.code === 'pt')?.flag).toBe('br')
    expect(DEFAULT_LANGUAGES.find(lang => lang.code === 'pt-PT')?.flag).toBe('pt')
  })
})

describe('toGoogleCode', () => {
  it('maps modern codes to the ones Google uses', () => {
    expect(toGoogleCode('he')).toBe('iw')
    expect(toGoogleCode('jv')).toBe('jw')
  })

  it('passes other codes through', () => {
    expect(toGoogleCode('fr')).toBe('fr')
    expect(toGoogleCode('zh-CN')).toBe('zh-CN')
  })

  it('only aliases to codes Google accepts', () => {
    for (const code of Object.values(LANGUAGE_CODE_ALIASES)) expect(googleCodes.has(code)).toBe(true)
  })
})

describe('DEFAULT_LANGUAGES data', () => {
  // Any change to a name, native name, code or flag shows up as a snapshot diff to review, rather than slipping
  // through. Update with `npx vitest run -u` when the change is intended.
  it('matches the reviewed list', () => {
    expect(DEFAULT_LANGUAGES).toMatchSnapshot()
  })
})
