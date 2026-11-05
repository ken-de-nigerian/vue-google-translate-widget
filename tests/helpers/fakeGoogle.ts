// Our own suite uses the fake the package ships in /testing, so it's exercised on every run.
export { installFakeGoogleTranslate as installFakeGoogle } from '../../src/testing'
export type { FakeGoogleTranslate as FakeGoogle } from '../../src/testing'

/** Runs Google's script callback, as the real script does once it has loaded. */
export function fireGoogleCallback(): void {
  const callback = (window as unknown as Record<string, () => void>).__gtwGoogleTranslateInit
  if (!callback) throw new Error('The loader has not registered its callback yet')
  callback()
}
