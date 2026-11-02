<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toGoogleCode, type Language } from '../core/languages'
import { useGoogleTranslate, type TranslateMode } from '../composables/useGoogleTranslate'
import {
  createId,
  DEFAULT_ERROR_TEXT,
  DEFAULT_FLAG_URL,
  lockScroll,
  trapFocus,
  unlockScroll,
  useListNavigation,
} from './shared'

interface Props {
  defaultLanguage?: string
  includedLanguages?: string[]
  languages?: Language[]
  /** Use with `v-model:language`. On load, the page's current translation wins. */
  language?: string
  title?: string
  subtitle?: string
  searchPlaceholder?: string
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
  title: 'Change Language',
  subtitle: 'Select your preferred language for the interface',
  searchPlaceholder: 'Search languages...',
  errorText: DEFAULT_ERROR_TEXT,
  showFlags: true,
  flagUrl: DEFAULT_FLAG_URL,
  mode: 'live',
  reloadOnRestore: false,
  hideBranding: true,
})

const emit = defineEmits<{
  change: [language: string]
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

const baseId = createId('gtw')
const dialogId = `${baseId}-dialog`
const titleId = `${baseId}-title`
const subtitleId = `${baseId}-subtitle`
const searchId = `${baseId}-search`
const listId = `${baseId}-list`
const optionId = (index: number) => `${baseId}-option-${index}`

const triggerRef = ref<HTMLButtonElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const isOpen = ref(false)

const isCurrent = (language: Language) => toGoogleCode(language.code) === currentLanguage.value

const filteredLanguages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return languages
  return languages.filter(
    lang =>
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query),
  )
})

const resultsAnnouncement = computed(() => {
  const count = filteredLanguages.value.length
  return count === 1 ? '1 language' : `${count} languages`
})

const selectLanguage = async (code: string) => {
  if (isChangingLanguage.value) return
  try {
    await changeLanguage(code)
    emit('change', currentLanguage.value)
    emit('update:language', currentLanguage.value)
    closeWidget()
  } catch (cause) {
    emit('error', cause as Error)
  }
}

const {
  activeIndex,
  setActive,
  onKeydown: onListKeydown,
} = useListNavigation({
  count: () => filteredLanguages.value.length,
  optionId,
  onSelect: index => selectLanguage(filteredLanguages.value[index].code),
  onClose: () => closeWidget(),
  spaceSelects: false,
})

const activeDescendant = computed(() =>
  activeIndex.value >= 0 && activeIndex.value < filteredLanguages.value.length
    ? optionId(activeIndex.value)
    : undefined,
)

watch(searchQuery, () => setActive(filteredLanguages.value.length ? 0 : -1))

const openWidget = async () => {
  if (isOpen.value) return
  isOpen.value = true
  lockScroll()
  emit('open')
  await nextTick()
  setActive(filteredLanguages.value.findIndex(isCurrent))
  searchRef.value?.focus()
}

const closeWidget = async () => {
  if (!isOpen.value) return
  isOpen.value = false
  searchQuery.value = ''
  unlockScroll()
  emit('close')
  await nextTick()
  triggerRef.value?.focus()
}

const onDialogKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeWidget()
    return
  }
  trapFocus(event, dialogRef.value)
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
  await initializeTranslate()
  if (props.language !== undefined && toGoogleCode(props.language) !== currentLanguage.value) {
    emit('update:language', currentLanguage.value)
  }
})

onBeforeUnmount(() => {
  if (isOpen.value) unlockScroll()
})
</script>

<template>
  <div class="google-translate-widget">
    <!-- Floating Button -->
    <button
      ref="triggerRef"
      type="button"
      class="gtw-float-button"
      aria-label="Change language"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? dialogId : undefined"
      @click="openWidget">
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
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
    </button>

    <!-- Modal -->
    <Transition name="gtw-modal">
      <div v-if="isOpen" class="gtw-modal-overlay" @click="closeWidget">
        <div
          :id="dialogId"
          ref="dialogRef"
          class="gtw-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="subtitleId"
          @click.stop
          @keydown="onDialogKeydown">
          <div class="gtw-modal-header">
            <div>
              <h2 :id="titleId" class="gtw-modal-title">{{ title }}</h2>
              <p :id="subtitleId" class="gtw-modal-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="gtw-close-button" aria-label="Close" @click="closeWidget">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div class="gtw-modal-body">
            <p v-if="status === 'error'" class="gtw-error" role="alert">{{ errorText }}</p>

            <!-- Search Bar -->
            <div class="gtw-search-wrapper">
              <label :for="searchId" class="gtw-visually-hidden">{{ searchPlaceholder }}</label>
              <input
                :id="searchId"
                ref="searchRef"
                v-model="searchQuery"
                type="text"
                role="combobox"
                autocomplete="off"
                aria-autocomplete="list"
                aria-expanded="true"
                :aria-controls="listId"
                :aria-activedescendant="activeDescendant"
                :placeholder="searchPlaceholder"
                class="gtw-search-input"
                @keydown="onListKeydown" />
              <svg
                class="gtw-search-icon"
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
            </div>

            <!-- Languages List -->
            <ul
              v-show="filteredLanguages.length > 0"
              :id="listId"
              class="gtw-languages-list"
              role="listbox"
              :aria-label="title">
              <li
                v-for="(lang, index) in filteredLanguages"
                :id="optionId(index)"
                :key="lang.code"
                role="option"
                :aria-selected="isCurrent(lang)"
                :aria-disabled="isChangingLanguage || undefined"
                :class="[
                  'gtw-language-item',
                  {
                    'gtw-language-active': isCurrent(lang),
                    'gtw-language-focused': index === activeIndex,
                    'gtw-language-disabled': isChangingLanguage,
                  },
                ]"
                @mousemove="activeIndex !== index && setActive(index)"
                @click="selectLanguage(lang.code)">
                <div class="gtw-language-content">
                  <div v-if="showFlags" class="gtw-flag-wrapper">
                    <img
                      v-if="lang.flag"
                      class="gtw-flag"
                      :src="flagUrl(lang.flag)"
                      alt=""
                      loading="lazy"
                      @error="(e: Event) => ((e.target as HTMLImageElement).style.visibility = 'hidden')" />
                    <span v-else class="gtw-flag gtw-flag-code notranslate" translate="no" aria-hidden="true">{{
                      lang.code
                    }}</span>
                    <div v-if="isCurrent(lang) && !isChangingLanguage" class="gtw-check-badge">
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div v-if="isChangingLanguage && isCurrent(lang)" class="gtw-loading-badge">
                      <div class="gtw-spinner"></div>
                    </div>
                  </div>
                  <div class="gtw-language-info">
                    <!-- Native names must stay as written, or Google turns "Deutsch" into "Allemand". -->
                    <span class="gtw-language-native notranslate" translate="no">{{ lang.nativeName }}</span>
                    <span class="gtw-language-name">{{ lang.name }}</span>
                  </div>
                </div>
                <svg
                  class="gtw-chevron"
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
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </li>
            </ul>

            <!-- No Results -->
            <div v-if="filteredLanguages.length === 0" class="gtw-no-results">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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
              <p class="gtw-no-results-text">No languages found</p>
              <p class="gtw-no-results-hint">Try a different search term</p>
            </div>

            <p class="gtw-visually-hidden" aria-live="polite">{{ resultsAnnouncement }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.google-translate-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.gtw-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.gtw-float-button {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 9999;
}

.gtw-float-button:hover {
  transform: scale(1.1);
  background: #2563eb;
}

.gtw-float-button:active {
  transform: scale(0.95);
}

.gtw-float-button:focus-visible,
.gtw-close-button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.gtw-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 10000;
}

.gtw-modal {
  background: white;
  border-radius: 1rem;
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.gtw-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.gtw-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.gtw-modal-subtitle {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0;
}

.gtw-close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #4b5563;
  transition: all 0.2s;
}

.gtw-close-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.gtw-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.gtw-error {
  margin: 0 0 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.875rem;
}

.gtw-search-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.gtw-search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  outline: none;
}

.gtw-search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.gtw-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.gtw-languages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.gtw-language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.gtw-language-item:hover:not(.gtw-language-disabled),
.gtw-language-focused:not(.gtw-language-disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.gtw-language-focused {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.gtw-language-active {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
  border-width: 2px;
  padding: calc(0.75rem - 1px);
}

.gtw-language-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.gtw-language-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.gtw-flag-wrapper {
  position: relative;
  flex-shrink: 0;
}

.gtw-flag {
  display: block;
  width: 2.5rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  object-fit: cover;
}

.gtw-flag-code {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.gtw-check-badge,
.gtw-loading-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1rem;
  height: 1rem;
  background: #3b82f6;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gtw-check-badge svg {
  color: white;
}

.gtw-spinner {
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: gtw-spin 0.6s linear infinite;
}

@keyframes gtw-spin {
  to {
    transform: rotate(360deg);
  }
}

.gtw-language-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.gtw-language-native {
  font-weight: 600;
  font-size: 0.875rem;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gtw-language-active .gtw-language-native {
  color: #2563eb;
}

.gtw-language-name {
  font-size: 0.75rem;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gtw-chevron {
  flex-shrink: 0;
  color: #9ca3af;
  transition: opacity 0.2s;
  opacity: 0;
}

.gtw-language-item:hover .gtw-chevron,
.gtw-language-focused .gtw-chevron {
  opacity: 0.5;
}

.gtw-language-active .gtw-chevron {
  color: #3b82f6;
  opacity: 1;
}

.gtw-no-results {
  padding: 3rem 0;
  text-align: center;
}

.gtw-no-results svg {
  margin: 0 auto 0.75rem;
  color: rgba(156, 163, 175, 0.3);
}

.gtw-no-results-text {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0 0 0.25rem 0;
}

.gtw-no-results-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* Transitions */
.gtw-modal-enter-active,
.gtw-modal-leave-active {
  transition: opacity 0.2s;
}

.gtw-modal-enter-active .gtw-modal,
.gtw-modal-leave-active .gtw-modal {
  transition:
    transform 0.2s,
    opacity 0.2s;
}

.gtw-modal-enter-from,
.gtw-modal-leave-to {
  opacity: 0;
}

.gtw-modal-enter-from .gtw-modal,
.gtw-modal-leave-to .gtw-modal {
  transform: scale(0.95);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .gtw-float-button,
  .gtw-language-item,
  .gtw-modal-enter-active,
  .gtw-modal-leave-active,
  .gtw-modal-enter-active .gtw-modal,
  .gtw-modal-leave-active .gtw-modal {
    transition: none;
  }

  .gtw-float-button:hover {
    transform: none;
  }
}

/* Responsive */
@media (min-width: 768px) {
  .gtw-float-button {
    left: 1.5rem;
    bottom: 1.5rem;
  }
}
</style>
