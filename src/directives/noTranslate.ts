import type { ObjectDirective } from 'vue'

const apply = (el: HTMLElement, enabled: unknown) => {
  // `v-no-translate` and `v-no-translate="true"` protect; `v-no-translate="false"` doesn't.
  const protect = enabled !== false
  el.classList.toggle('notranslate', protect)
  if (protect) el.setAttribute('translate', 'no')
  else el.removeAttribute('translate')
}

/**
 * Keeps an element out of Google's translation: brand names, code, addresses.
 * Adds `translate="no"` and `class="notranslate"` (Google honours both).
 *
 * ```vue
 * <span v-no-translate>PayZephyr</span>
 * ```
 */
export const vNoTranslate: ObjectDirective<HTMLElement, boolean | undefined> = {
  mounted: (el, binding) => apply(el, binding.value),
  updated: (el, binding) => apply(el, binding.value),
  // Only the attribute on the server: Google honours translate="no" by itself, and Vue checks the whole `class`
  // during hydration, so adding "notranslate" there would be reported as a hydration mismatch.
  getSSRProps: binding => (binding.value === false ? {} : { translate: 'no' }),
}
