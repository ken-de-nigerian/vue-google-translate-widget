import { afterEach, vi, type Mock } from 'vitest'
import { config, enableAutoUnmount } from '@vue/test-utils'
import { resetLoader } from '../src/core/loader'
import { stopDirectionSync } from '../src/core/page'
import { resetTranslateState } from '../src/composables/useGoogleTranslate'

const EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 UTC'

export function clearGoogtransCookie(): void {
  document.cookie = `googtrans=; ${EXPIRED}; path=/;`
  document.cookie = `googtrans=; ${EXPIRED}; path=/; domain=${window.location.hostname}`
}

/** Replaces location.reload with a spy (happy-dom can't really reload). */
export function stubReload(): Mock<() => void> {
  const reload = vi.fn()
  vi.spyOn(window.location, 'reload').mockImplementation(reload)
  return reload
}

// @vue/test-utils' attachTo cleanup calls app.onUnmount(), which Vue added in 3.5. CI also runs the suite on
// Vue 3.3 and 3.4, so provide it there. Test-harness only: the package itself never uses it.
config.global.plugins.push({
  install(vueApp) {
    // Vue 3.5's types always include onUnmount, so describe the shape we patch.
    const app = vueApp as unknown as { unmount: () => void; onUnmount?: unknown }
    if (app.onUnmount) return
    const callbacks: (() => void)[] = []
    const unmount = app.unmount.bind(app)
    Object.assign(app, {
      onUnmount: (callback: () => void) => callbacks.push(callback),
      unmount: () => {
        unmount()
        callbacks.splice(0).forEach(callback => callback())
      },
    })
  },
})

// Unmount every component a test mounted, so its listeners and scroll lock go too.
if (typeof document !== 'undefined') enableAutoUnmount(afterEach)

afterEach(() => {
  resetTranslateState()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.restoreAllMocks()
  // Server-side tests run without a DOM.
  if (typeof document === 'undefined') return
  resetLoader()
  stopDirectionSync()
  document.documentElement.removeAttribute('dir')
  window.localStorage.clear()
  clearGoogtransCookie()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.className = ''
  window.history.replaceState(null, '', '/')
})
