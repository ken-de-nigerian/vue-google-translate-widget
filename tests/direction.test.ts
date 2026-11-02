import { afterEach, describe, expect, it } from 'vitest'
import { startDirectionSync, stopDirectionSync } from '../src/core/page'

const root = document.documentElement
const flush = () => new Promise(resolve => setTimeout(resolve))

afterEach(() => {
  stopDirectionSync()
  root.removeAttribute('dir')
})

describe('startDirectionSync (RTL)', () => {
  it('sets dir="rtl" while Google shows a right-to-left language, and removes it after', async () => {
    startDirectionSync()
    root.className = 'translated-rtl'
    await flush()
    expect(root.dir).toBe('rtl')

    root.className = 'translated-ltr'
    await flush()
    expect(root.hasAttribute('dir')).toBe(false)
  })

  it('puts back the page’s own dir', async () => {
    root.dir = 'ltr'
    startDirectionSync()
    root.className = 'translated-rtl'
    await flush()
    expect(root.dir).toBe('rtl')

    root.className = ''
    await flush()
    expect(root.dir).toBe('ltr')
  })

  it('applies immediately if the page is already translated', () => {
    root.className = 'translated-rtl'
    startDirectionSync()
    expect(root.dir).toBe('rtl')
  })

  it('is idempotent', async () => {
    startDirectionSync()
    startDirectionSync()
    root.className = 'translated-rtl'
    await flush()
    expect(root.dir).toBe('rtl')
  })
})
