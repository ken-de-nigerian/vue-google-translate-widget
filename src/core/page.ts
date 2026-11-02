const BRANDING_STYLE_ID = 'gtw-hide-branding'

// Google changes these class names from time to time, so this is best effort.
// The obfuscated VIpgJd-* names were current on 2026-11-02.
const BRANDING_CSS = `
body { top: 0 !important; }
body > .skiptranslate,
iframe.skiptranslate,
.goog-te-banner-frame,
#goog-gt-tt,
.goog-te-balloon-frame,
.VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; }
.goog-text-highlight,
.VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q { background: none !important; box-shadow: none !important; }
`

/** Hides Google's banner, tooltips and hover highlight, and undoes the 40px body offset. */
export function injectBrandingStyles(nonce?: string): void {
  if (document.getElementById(BRANDING_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = BRANDING_STYLE_ID
  if (nonce) style.nonce = nonce
  style.textContent = BRANDING_CSS
  document.head.appendChild(style)
}

/**
 * Google's "Show original" button lives in its (same-origin) banner iframe.
 * Clicking it restores the page in place, without a reload.
 */
export function findRestoreButton(): HTMLElement | null {
  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    try {
      const button = frame.contentDocument?.querySelector<HTMLElement>('[id$=".restore"]')
      if (button) return button
    } catch {
      // Cross-origin frame that isn't Google's banner.
    }
  }
  return null
}

export const isPageTranslated = (): boolean => /\btranslated-(ltr|rtl)\b/.test(document.documentElement.className)

/**
 * Resolves once Google has marked <html> as translated (or as restored), or
 * after `timeout` ms. Google sets the class immediately and fills in the text
 * asynchronously, so this marks "Google accepted the change", not "every
 * string is translated".
 */
export function waitForTranslationState(translated: boolean, timeout = 3000): Promise<boolean> {
  if (isPageTranslated() === translated) return Promise.resolve(true)

  return new Promise(resolve => {
    const observer = new MutationObserver(() => {
      if (isPageTranslated() === translated) done(true)
    })
    const timer = setTimeout(() => done(false), timeout)
    const done = (reached: boolean) => {
      observer.disconnect()
      clearTimeout(timer)
      resolve(reached)
    }
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  })
}

export function reloadPage(): void {
  window.location.reload()
}

let directionObserver: MutationObserver | null = null
let originalDir: string | null = null

const syncDirection = () => {
  const root = document.documentElement
  if (/\btranslated-rtl\b/.test(root.className)) {
    if (root.dir !== 'rtl') root.dir = 'rtl'
  } else if (root.dir !== (originalDir ?? '')) {
    if (originalDir) root.dir = originalDir
    else root.removeAttribute('dir')
  }
}

/**
 * Google marks <html> with `translated-rtl` for Arabic, Hebrew, etc. but never
 * sets `dir`, so the layout stays left-to-right. Mirror the class onto `dir`
 * (and put the original back afterwards). One observer per page; idempotent.
 */
export function startDirectionSync(): void {
  if (directionObserver) return
  originalDir = document.documentElement.getAttribute('dir')
  directionObserver = new MutationObserver(syncDirection)
  directionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  syncDirection()
}

/** Test helper. */
export function stopDirectionSync(): void {
  directionObserver?.disconnect()
  directionObserver = null
  originalDir = null
}
