import { afterEach, vi } from 'vitest'

// The composable writes cookies, injects a <script> into <head> and reloads the
// page. Reset all of that so every test starts from a clean document.
export function clearGoogtransCookie(): void {
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
}

export function stubReload() {
  const reload = vi.fn()
  vi.stubGlobal('location', {
    ...window.location,
    hash: window.location.hash,
    hostname: window.location.hostname,
    reload,
  })
  return reload
}

afterEach(() => {
  clearGoogtransCookie()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  window.location.hash = ''
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
