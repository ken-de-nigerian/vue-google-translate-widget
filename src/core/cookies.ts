const COOKIE_NAME = 'googtrans'
const EXPIRED = 'Thu, 01 Jan 1970 00:00:00 UTC'

export interface GoogtransValue {
  source: string
  target: string
}

const isIpAddress = (hostname: string): boolean => /^[\d.]+$/.test(hostname) || hostname.includes(':')

/**
 * Every `domain=` value a googtrans cookie may have been written with for this
 * hostname. Google writes it on the parent domain (`.example.com`) as well as
 * the host, so clearing only the host leaves the page stuck in a translation.
 * `undefined` means a host-only cookie (no domain attribute). Browsers silently
 * ignore the public-suffix entries (`.co.uk`), so no suffix list is needed.
 */
export function getCookieDomains(hostname: string): (string | undefined)[] {
  if (!hostname || isIpAddress(hostname) || !hostname.includes('.')) {
    return hostname ? [undefined, hostname] : [undefined]
  }

  const parts = hostname.split('.')
  const domains: (string | undefined)[] = [undefined, hostname]
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`.${parts.slice(i).join('.')}`)
  }
  return domains
}

const parseValue = (value: string): GoogtransValue | null => {
  // "/en/fr"
  const [, source, target] = value.split('/')
  return source && target ? { source, target } : null
}

/** Reads `#googtrans(en|fr)` or `#googtrans/en/fr` from the URL hash. */
export function readGoogtransHash(hash: string): GoogtransValue | null {
  const match = hash.match(/googtrans\(([^|)]+)\|([^)]+)\)/) ?? hash.match(/googtrans\/([^/]+)\/([^/&]+)/)
  return match ? { source: match[1], target: match[2] } : null
}

export function readGoogtransCookie(cookieString: string): GoogtransValue | null {
  for (const cookie of cookieString.split(';')) {
    const separator = cookie.indexOf('=')
    if (separator === -1 || cookie.slice(0, separator).trim() !== COOKIE_NAME) continue

    const parsed = parseValue(decodeURIComponent(cookie.slice(separator + 1).trim()))
    if (parsed) return parsed
  }
  return null
}

/** The translation currently requested by the URL hash or cookie (hash wins). */
export function readGoogtrans(): GoogtransValue | null {
  if (typeof window === 'undefined') return null
  return readGoogtransHash(window.location.hash) ?? readGoogtransCookie(document.cookie)
}

const domainAttribute = (domain: string | undefined): string => (domain ? `; domain=${domain}` : '')

export function clearGoogtrans(): void {
  for (const domain of getCookieDomains(window.location.hostname)) {
    document.cookie = `${COOKIE_NAME}=; expires=${EXPIRED}; path=/${domainAttribute(domain)}`
  }
}

export function writeGoogtrans(source: string, target: string): void {
  clearGoogtrans()
  const value = `/${source}/${target}`
  document.cookie = `${COOKIE_NAME}=${value}; path=/`
  if (window.location.hostname) {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=${window.location.hostname}`
  }
}

/**
 * Removes a `#googtrans(...)` hash without adding a history entry. Left in
 * place, it re-applies the translation on the next load.
 */
export function clearGoogtransHash(): void {
  if (!readGoogtransHash(window.location.hash)) return
  const { pathname, search } = window.location
  window.history.replaceState(window.history.state, '', pathname + search)
}
