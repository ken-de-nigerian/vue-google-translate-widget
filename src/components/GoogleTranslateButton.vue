<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toGoogleCode, type Language } from '../core/languages'
import { useGoogleTranslate, type TranslateMode } from '../composables/useGoogleTranslate'
import LanguageFlag from './LanguageFlag.vue'
import {
  createId,
  DEFAULT_ERROR_TEXT,
  DEFAULT_FLAG_URL,
  orderLanguages,
  readRecentLanguages,
  rememberRecentLanguage,
  useListNavigation,
  type FlagStyle,
  type LanguageDisplay,
  type Theme,
} from './shared'
import '../styles/tokens.css'

interface Props {
  defaultLanguage?: string
  includedLanguages?: string[]
  languages?: Language[]
  /** Use with `v-model:language`. On load, the page's current translation wins. */
  language?: string
  buttonText?: string
  buttonClass?: string
  errorText?: string
  showFlags?: boolean
  flagStyle?: FlagStyle
  flagUrl?: (flag: string) => string
  /** Which name(s) to show for each language. */
  display?: LanguageDisplay
  /** Codes to list first, in this order. */
  pinned?: string[]
  /** Remember recently chosen languages (in localStorage) and list them first. `true` keeps 3. */
  rememberRecent?: boolean | number
  theme?: Theme
  /** Render no styles (except screen-reader helpers), for styling from scratch. */
  unstyled?: boolean
  /** Load Google only when the dropdown is first opened (or when a saved translation must be applied). */
  lazy?: boolean
  mode?: TranslateMode
  reloadOnRestore?: boolean
  hideBranding?: boolean
  syncDocumentDir?: boolean
  scriptSrc?: string
  nonce?: string
  timeout?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultLanguage: 'en',
  buttonText: 'Translate',
  errorText: DEFAULT_ERROR_TEXT,
  showFlags: true,
  flagStyle: 'image',
  flagUrl: DEFAULT_FLAG_URL,
  display: 'native',
  rememberRecent: false,
  theme: 'light',
  unstyled: false,
  lazy: false,
  mode: 'live',
  reloadOnRestore: false,
  hideBranding: true,
  syncDocumentDir: true,
})

const emit = defineEmits<{
  change: [language: string]
  /** @deprecated Use `change`. Removed in 2.0. */
  languageChanged: [language: string]
  'update:language': [language: string]
  ready: []
  error: [error: Error]
  open: []
  close: []
}>()

defineSlots<{
  /** Content of the button (default: icon, `buttonText`, chevron). */
  default?: (props: { isOpen: boolean; currentLanguage: string; current: Language | undefined }) => unknown
  /** Content of each option (default: flag and name). */
  item?: (props: { language: Language; selected: boolean; active: boolean; select: () => void }) => unknown
}>()

const {
  currentLanguage,
  isChangingLanguage,
  languages,
  status,
  error,
  changeLanguage,
  initializeTranslate,
  getCurrentLanguage,
} = useGoogleTranslate({
  defaultLanguage: props.defaultLanguage,
  includedLanguages: () => props.includedLanguages,
  languages: () => props.languages,
  mode: props.mode,
  reloadOnRestore: props.reloadOnRestore,
  hideBranding: props.hideBranding,
  syncDocumentDir: props.syncDocumentDir,
  scriptSrc: props.scriptSrc,
  nonce: props.nonce,
  timeout: props.timeout,
})

const baseId = createId('gtb')
const listId = `${baseId}-list`
const optionId = (index: number) => `${baseId}-option-${index}`

const rootRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const recentCodes = ref<string[]>([])

const recentLimit = computed(() =>
  props.rememberRecent === true ? 3 : typeof props.rememberRecent === 'number' ? props.rememberRecent : 0,
)

const isCurrent = (language: Language) => toGoogleCode(language.code) === currentLanguage.value

const orderedLanguages = computed(() =>
  orderLanguages(languages, props.pinned, recentLimit.value ? recentCodes.value : [], toGoogleCode),
)

const currentInfo = computed(() => languages.find(isCurrent))

const rootClasses = computed(() => ['gtb-container', `gtw-theme-${props.theme}`, { 'gtb-styled': !props.unstyled }])

const closeDropdown = (restoreFocus = true) => {
  if (!isOpen.value) return
  isOpen.value = false
  emit('close')
  if (restoreFocus) nextTick(() => buttonRef.value?.focus())
}

const selectLanguage = async (code: string) => {
  if (isChangingLanguage.value) return
  closeDropdown()
  try {
    await changeLanguage(code)
    if (recentLimit.value) recentCodes.value = rememberRecentLanguage(currentLanguage.value, recentLimit.value)
    emit('change', currentLanguage.value)
    emit('languageChanged', currentLanguage.value)
    emit('update:language', currentLanguage.value)
  } catch (cause) {
    emit('error', cause as Error)
  }
}

const { activeIndex, setActive, onKeydown } = useListNavigation({
  count: () => orderedLanguages.value.length,
  optionId,
  onSelect: index => selectLanguage(orderedLanguages.value[index].code),
  onClose: () => closeDropdown(),
  spaceSelects: true,
})

const activeDescendant = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < orderedLanguages.value.length ? optionId(activeIndex.value) : undefined,
)

const openDropdown = async () => {
  if (isOpen.value) return
  if (status.value === 'idle') initializeTranslate()
  isOpen.value = true
  emit('open')
  await nextTick()
  const current = orderedLanguages.value.findIndex(isCurrent)
  setActive(current >= 0 ? current : 0)
  listRef.value?.focus()
}

// aria-disabled rather than disabled: a disabled button can't take focus, so
// focus would fall back to <body> after choosing a language.
const toggleDropdown = () => {
  if (isOpen.value) closeDropdown()
  else if (!isChangingLanguage.value) openDropdown()
}

const onButtonKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isChangingLanguage.value) openDropdown()
  }
}

const onListKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    closeDropdown(false)
    return
  }
  onKeydown(event)
}

// Close when clicking anywhere outside this instance, including another
// GoogleTranslateButton on the same page.
const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    closeDropdown(false)
  }
}

watch(
  status,
  value => {
    if (value === 'ready') emit('ready')
    if (value === 'error' && error.value) emit('error', error.value)
  },
  { immediate: true },
)

watch(
  () => props.language,
  value => {
    if (value && toGoogleCode(value) !== currentLanguage.value) selectLanguage(value)
  },
)

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (recentLimit.value) recentCodes.value = readRecentLanguages()

  // A saved translation has to be applied right away, even when lazy.
  const translated = getCurrentLanguage() !== toGoogleCode(props.defaultLanguage)
  if (!props.lazy || translated) await initializeTranslate()

  if (props.language !== undefined && toGoogleCode(props.language) !== currentLanguage.value) {
    emit('update:language', currentLanguage.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="rootRef" :class="rootClasses">
    <button
      ref="buttonRef"
      type="button"
      :class="['gtb-button', buttonClass]"
      :aria-disabled="isChangingLanguage || undefined"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? listId : undefined"
      @click="toggleDropdown"
      @keydown="onButtonKeydown">
      <slot :is-open="isOpen" :current-language="currentLanguage" :current="currentInfo">
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round">
          <path d="m5 8 6 6" />
          <path d="m4 14 6-6 2-3" />
          <path d="M2 5h12" />
          <path d="M7 2h1" />
          <path d="m22 22-5-10-5 10" />
          <path d="M14 18h6" />
        </svg>
        <span>{{ buttonText }}</span>
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="['gtb-chevron', { 'gtb-chevron-open': isOpen }]">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </slot>
    </button>

    <Transition name="gtb-dropdown">
      <div v-if="isOpen" class="gtb-dropdown">
        <p v-if="status === 'error'" class="gtb-error" role="alert">{{ errorText }}</p>
        <ul
          :id="listId"
          ref="listRef"
          class="gtb-list"
          role="listbox"
          tabindex="-1"
          :aria-label="buttonText"
          :aria-activedescendant="activeDescendant"
          @keydown="onListKeydown">
          <li
            v-for="(lang, index) in orderedLanguages"
            :id="optionId(index)"
            :key="lang.code"
            role="option"
            :aria-selected="isCurrent(lang)"
            :class="[
              'gtb-dropdown-item',
              {
                'gtb-dropdown-item-active': isCurrent(lang),
                'gtb-dropdown-item-focused': index === activeIndex,
              },
            ]"
            @mousemove="activeIndex !== index && setActive(index)"
            @click="selectLanguage(lang.code)">
            <slot
              name="item"
              :language="lang"
              :selected="isCurrent(lang)"
              :active="index === activeIndex"
              :select="() => selectLanguage(lang.code)">
              <LanguageFlag
                v-if="showFlags"
                class="gtb-flag"
                prefix="gtb"
                :flag="lang.flag"
                :code="lang.code"
                :flag-style="flagStyle"
                :flag-url="flagUrl" />
              <span class="gtb-names">
                <span v-if="display !== 'english'" class="gtb-language-name notranslate" translate="no">
                  {{ lang.nativeName }}
                </span>
                <span v-if="display !== 'native'" class="gtb-language-english">{{ lang.name }}</span>
              </span>
              <svg
                v-if="isCurrent(lang)"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </slot>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Every rule is gated on :where(.gtb-styled), which adds no specificity, so `unstyled` turns them all off. */
.gtb-container {
  position: relative;
  display: inline-block;
}

.gtb-container:where(.gtb-styled) {
  font-family: var(--_gtw-font);
}

:where(.gtb-styled) .gtb-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--_gtw-bg);
  border: 1px solid var(--_gtw-border);
  border-radius: 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--_gtw-text);
}

:where(.gtb-styled) .gtb-button:hover:not([aria-disabled='true']) {
  background: var(--_gtw-surface);
  border-color: var(--_gtw-border-strong);
}

:where(.gtb-styled) .gtb-button:focus-visible {
  outline: 2px solid var(--_gtw-primary-hover);
  outline-offset: 2px;
}

:where(.gtb-styled) .gtb-button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

:where(.gtb-styled) .gtb-chevron {
  transition: transform 0.2s;
}

:where(.gtb-styled) .gtb-chevron-open {
  transform: rotate(180deg);
}

:where(.gtb-styled) .gtb-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  inset-inline-end: 0;
  background: var(--_gtw-bg);
  color: var(--_gtw-text);
  border: 1px solid var(--_gtw-border);
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 12rem;
  max-height: 20rem;
  overflow-y: auto;
  z-index: 50;
}

:where(.gtb-styled) .gtb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  outline: none;
}

:where(.gtb-styled) .gtb-error {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--_gtw-error-bg);
  color: var(--_gtw-error-text);
  font-size: 0.8125rem;
}

:where(.gtb-styled) .gtb-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

:where(.gtb-styled) .gtb-dropdown-item:hover,
:where(.gtb-styled) .gtb-dropdown-item-focused {
  background: var(--_gtw-surface-strong);
}

:where(.gtb-styled) .gtb-list:focus-visible .gtb-dropdown-item-focused {
  outline: 2px solid var(--_gtw-primary);
  outline-offset: -2px;
}

:where(.gtb-styled) .gtb-dropdown-item-active {
  background: var(--_gtw-active-bg);
  color: var(--_gtw-primary-text);
}

:where(.gtb-styled) .gtb-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

:where(.gtb-styled) .gtb-flag-emoji {
  font-size: 1.125rem;
  line-height: 1;
}

:where(.gtb-styled) .gtb-flag-code {
  background: var(--_gtw-surface-strong);
  color: var(--_gtw-text);
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
}

:where(.gtb-styled) .gtb-names {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

:where(.gtb-styled) .gtb-language-name {
  font-size: 0.875rem;
}

:where(.gtb-styled) .gtb-language-english {
  font-size: 0.75rem;
  color: var(--_gtw-text-muted);
}

:where(.gtb-styled) .gtb-names > .gtb-language-english:first-child {
  font-size: 0.875rem;
  color: inherit;
}

.gtb-dropdown-enter-active,
.gtb-dropdown-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.gtb-dropdown-enter-from,
.gtb-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  :where(.gtb-styled) .gtb-button,
  :where(.gtb-styled) .gtb-dropdown-item,
  .gtb-dropdown-enter-active,
  .gtb-dropdown-leave-active {
    transition: none;
  }
}
</style>
