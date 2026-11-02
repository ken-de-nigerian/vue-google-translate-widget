import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { resetLoader } from '../src/core/loader'
import { resetTranslateState } from '../src/composables/useGoogleTranslate'

const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 UTC'

export function clearGoogtransCookie(): void {
  document.cookie = `googtrans=; ${EXPIRED}; path=/;`
  document.cookie = `googtrans=; ${EXPIRED}; path=/; domain=${window.location.hostname}`
}

/** Replaces location.reload with a spy (happy-dom can't really reload). */
export function stubReload() {
  const reload = vi.fn()
  vi.spyOn(window.location, 'reload').mockImplementation(reload)
  return reload
}

// Unmount every component a test mounted, so its listeners and scroll lock go too.
enableAutoUnmount(afterEach)

afterEach(() => {
  resetLoader()
  resetTranslateState()
  clearGoogtransCookie()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.className = ''
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
})
