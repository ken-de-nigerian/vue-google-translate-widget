<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toGoogleCode, type Language } from '../core/languages'
import { useGoogleTranslate, type TranslateMode } from '../composables/useGoogleTranslate'
import { createId, DEFAULT_ERROR_TEXT, DEFAULT_FLAG_URL, useListNavigation } from './shared'

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
  flagUrl?: (flag: string) => string
  mode?: TranslateMode
  reloadOnRestore?: boolean
  hideBranding?: boolean
  scriptSrc?: string
  nonce?: string
  timeout?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultLanguage: 'en',
  buttonText: 'Translate',
  errorText: DEFAULT_ERROR_TEXT,
  showFlags: true,
  flagUrl: DEFAULT_FLAG_URL,
  mode: 'live',
  reloadOnRestore: false,
  hideBranding: true,
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

const { currentLanguage, isChangingLanguage, languages, status, error, changeLanguage, initializeTranslate } =
  useGoogleTranslate({
    defaultLanguage: props.defaultLanguage,
    includedLanguages: () => props.includedLanguages,
    languages: () => props.languages,
    mode: props.mode,
    reloadOnRestore: props.reloadOnRestore,
    hideBranding: props.hideBranding,
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

const isCurrent = (language: Language) => toGoogleCode(language.code) === currentLanguage.value

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
    emit('change', currentLanguage.value)
    emit('languageChanged', currentLanguage.value)
    emit('update:language', currentLanguage.value)
  } catch (cause) {
    emit('error', cause as Error)
  }
}

const { activeIndex, setActive, onKeydown } = useListNavigation({
  count: () => languages.length,
  optionId,
  onSelect: index => selectLanguage(languages[index].code),
  onClose: () => closeDropdown(),
  spaceSelects: true,
})

const activeDescendant = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < languages.length ? optionId(activeIndex.value) : undefined,
)

const openDropdown = async () => {
  if (isOpen.value) return
  isOpen.value = true
  emit('open')
  await nextTick()
  const current = languages.findIndex(isCurrent)
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
  await initializeTranslate()
  if (props.language !== undefined && toGoogleCode(props.language) !== currentLanguage.value) {
    emit('update:language', currentLanguage.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="rootRef" class="gtb-container">
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
        :class="{ 'gtb-chevron-open': isOpen }">
        <path d="m6 9 6 6 6-6" />
      </svg>
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
            v-for="(lang, index) in languages"
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
            <template v-if="showFlags">
              <img
                v-if="lang.flag"
                class="gtb-flag"
                :src="flagUrl(lang.flag)"
                alt=""
                loading="lazy"
                @error="(e: Event) => ((e.target as HTMLImageElement).style.visibility = 'hidden')" />
              <span v-else class="gtb-flag gtb-flag-code notranslate" translate="no" aria-hidden="true">{{
                lang.code
              }}</span>
            </template>
            <span class="gtb-language-name notranslate" translate="no">{{ lang.nativeName }}</span>
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
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gtb-container {
  position: relative;
  display: inline-block;
}

.gtb-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.gtb-button:hover:not([aria-disabled='true']) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.gtb-button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.gtb-button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.gtb-button svg:last-child {
  transition: transform 0.2s;
}

.gtb-chevron-open {
  transform: rotate(180deg);
}

.gtb-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 12rem;
  max-height: 20rem;
  overflow-y: auto;
  z-index: 50;
}

.gtb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  outline: none;
}

.gtb-error {
  margin: 0;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
}

.gtb-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.gtb-dropdown-item:hover,
.gtb-dropdown-item-focused {
  background: #f3f4f6;
}

.gtb-list:focus-visible .gtb-dropdown-item-focused {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.gtb-dropdown-item-active {
  background: rgba(59, 130, 246, 0.05);
  color: #2563eb;
}

.gtb-flag {
  display: block;
  width: 1.5rem;
  height: 1rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.gtb-flag-code {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.gtb-language-name {
  flex: 1;
  font-size: 0.875rem;
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
  .gtb-button,
  .gtb-dropdown-item,
  .gtb-dropdown-enter-active,
  .gtb-dropdown-leave-active {
    transition: none;
  }
}
</style>
