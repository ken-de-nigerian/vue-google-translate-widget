import { nextTick, ref, type Ref } from 'vue'

let idCounter = 0
/** A page-unique id prefix (Vue 3.3 has no useId). */
export const createId = (prefix: string): string => `${prefix}-${++idCounter}`

export const DEFAULT_FLAG_URL = (flag: string): string => `https://flagcdn.com/${flag}.svg`

export const DEFAULT_ERROR_TEXT = 'Translation is unavailable right now. Please try again later.'

let scrollLocks = 0
let savedBodyStyle: { overflow: string; paddingRight: string } | null = null

/** Stops the page behind a modal from scrolling, without the layout jumping. */
export function lockScroll(): void {
  if (scrollLocks++ > 0) return
  const { style } = document.body
  savedBodyStyle = { overflow: style.overflow, paddingRight: style.paddingRight }
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  style.overflow = 'hidden'
  if (scrollbarWidth > 0) style.paddingRight = `${scrollbarWidth}px`
}

export function unlockScroll(): void {
  if (scrollLocks === 0 || --scrollLocks > 0) return
  if (savedBodyStyle) Object.assign(document.body.style, savedBodyStyle)
  savedBodyStyle = null
}

interface ListNavigationOptions {
  count: () => number
  optionId: (index: number) => string
  onSelect: (index: number) => void
  onClose: () => void
  /** Space selects (listbox focus) or types (search input focus). */
  spaceSelects: boolean
}

/** Arrow/Home/End/Enter/Escape handling for a list driven by aria-activedescendant. */
export function useListNavigation(options: ListNavigationOptions): {
  activeIndex: Ref<number>
  setActive: (index: number) => void
  onKeydown: (event: KeyboardEvent) => void
} {
  const activeIndex = ref(-1)

  const setActive = (index: number) => {
    activeIndex.value = index
    nextTick(() => {
      if (index < 0) return
      document.getElementById(options.optionId(index))?.scrollIntoView?.({ block: 'nearest' })
    })
  }

  const move = (delta: number) => {
    const count = options.count()
    if (!count) return
    const current = activeIndex.value
    setActive(current < 0 ? (delta > 0 ? 0 : count - 1) : (current + delta + count) % count)
  }

  const onKeydown = (event: KeyboardEvent) => {
    const count = options.count()
    switch (event.key) {
      case 'ArrowDown':
        move(1)
        break
      case 'ArrowUp':
        move(-1)
        break
      case 'Home':
        if (count) setActive(0)
        break
      case 'End':
        if (count) setActive(count - 1)
        break
      case 'Enter':
        if (activeIndex.value >= 0 && activeIndex.value < count) options.onSelect(activeIndex.value)
        break
      case ' ':
        if (!options.spaceSelects) return
        if (activeIndex.value >= 0 && activeIndex.value < count) options.onSelect(activeIndex.value)
        break
      case 'Escape':
        options.onClose()
        break
      default:
        return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  return { activeIndex, setActive, onKeydown }
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/** Keeps Tab / Shift+Tab inside `container`. */
export function trapFocus(event: KeyboardEvent, container: HTMLElement | null): void {
  if (event.key !== 'Tab' || !container) return
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
