<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { toGoogleCode, type Language } from '../core/languages'
import { useGoogleTranslate, type TranslateMode } from '../composables/useGoogleTranslate'
import LanguageFlag from './LanguageFlag.vue'
import {
  createId,
  DEFAULT_ERROR_TEXT,
  DEFAULT_FLAG_URL,
  lockScroll,
  matchBrowserLanguage,
  orderLanguages,
  readRecentLanguages,
  rememberRecentLanguage,
  safeStorage,
  trapFocus,
  unlockScroll,
  useListNavigation,
  DEFAULT_WIDGET_LABELS,
  type FlagStyle,
  type LanguageDisplay,
  type Theme,
  type WidgetLabels,
} from './shared'
import '../styles/tokens.css'

const SUGGESTION_DISMISSED_KEY = 'gtw-suggestion-dismissed'

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
  labels?: Partial<WidgetLabels>
  showFlags?: boolean
  flagStyle?: FlagStyle
  flagUrl?: (flag: string) => string
  /** Which name(s) to show for each language. */
  display?: LanguageDisplay
  /** Codes to list first, in this order. */
  pinned?: string[]
  /** Remember recently chosen languages (in localStorage) and list them first. `true` keeps 3. */
  rememberRecent?: boolean | number
  /** Offer to translate into the visitor's browser language. */
  suggestBrowserLanguage?: boolean
  theme?: Theme
  /** Render no styles (except screen-reader helpers), for styling from scratch. */
  unstyled?: boolean
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  /** Distance of the floating button from the corner, any CSS length. */
  offset?: string
  /** Load Google only when the widget is first opened (or when a saved translation must be applied). */
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
  title: 'Change Language',
  subtitle: 'Select your preferred language for the interface',
  searchPlaceholder: 'Search languages...',
  errorText: DEFAULT_ERROR_TEXT,
  showFlags: true,
  flagStyle: 'image',
  flagUrl: DEFAULT_FLAG_URL,
  display: 'both',
  rememberRecent: false,
  suggestBrowserLanguage: false,
  theme: 'light',
  unstyled: false,
  position: 'bottom-left',
  lazy: false,
  mode: 'live',
  reloadOnRestore: false,
  hideBranding: true,
  syncDocumentDir: true,
})

const emit = defineEmits<{
  change: [language: string]
  'update:language': [language: string]
  ready: []
  error: [error: Error]
  open: []
  close: []
}>()

defineSlots<{
  /** Content of the floating button (default: translate icon). */
  trigger?: (props: { isOpen: boolean; currentLanguage: string }) => unknown
  /** Replaces the title and subtitle. Put `id="titleId"` on your heading so the dialog stays labelled. */
  header?: (props: { close: () => void; titleId: string }) => unknown
  /** Content of each option (default: flag and names). */
  item?: (props: { language: Language; selected: boolean; active: boolean; select: () => void }) => unknown
  /** Shown when the search matches nothing. */
  empty?: (props: { query: string }) => unknown
  /** Below the list. */
  footer?: (props: { close: () => void }) => unknown
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

const text = computed<WidgetLabels>(() => ({ ...DEFAULT_WIDGET_LABELS, ...props.labels }))

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
const recentCodes = ref<string[]>([])
const suggestion = ref<Language | null>(null)

const recentLimit = computed(() =>
  props.rememberRecent === true ? 3 : typeof props.rememberRecent === 'number' ? props.rememberRecent : 0,
)

const isCurrent = (language: Language) => toGoogleCode(language.code) === currentLanguage.value

const orderedLanguages = computed(() =>
  orderLanguages(languages, props.pinned, recentLimit.value ? recentCodes.value : [], toGoogleCode),
)

const filteredLanguages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return orderedLanguages.value
  return orderedLanguages.value.filter(
    lang =>
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query),
  )
})

const rootClasses = computed(() => [
  'google-translate-widget',
  `gtw-theme-${props.theme}`,
  { 'gtw-styled': !props.unstyled },
])

const rootStyle = computed(() => (props.offset ? { '--gtw-offset': props.offset } : undefined))

const ensureLoaded = () => {
  if (status.value === 'idle') initializeTranslate()
}

const selectLanguage = async (code: string) => {
  if (isChangingLanguage.value) return
  suggestion.value = null
  try {
    await changeLanguage(code)
    if (recentLimit.value) recentCodes.value = rememberRecentLanguage(currentLanguage.value, recentLimit.value)
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
  ensureLoaded()
  isOpen.value = true
  suggestion.value = null
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

const dismissSuggestion = () => {
  suggestion.value = null
  safeStorage.set(SUGGESTION_DISMISSED_KEY, '1')
}

const acceptSuggestion = () => {
  const language = suggestion.value
  if (language) selectLanguage(language.code)
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
  if (recentLimit.value) recentCodes.value = readRecentLanguages()

  const pageLanguage = toGoogleCode(props.defaultLanguage)
  const translated = getCurrentLanguage() !== pageLanguage

  if (
    props.suggestBrowserLanguage &&
    !translated &&
    !props.language &&
    safeStorage.get(SUGGESTION_DISMISSED_KEY) !== '1'
  ) {
    suggestion.value = matchBrowserLanguage(languages, pageLanguage, undefined, toGoogleCode) ?? null
  }

  // A saved translation has to be applied right away, even when lazy.
  if (!props.lazy || translated) await initializeTranslate()

  if (props.language !== undefined && toGoogleCode(props.language) !== currentLanguage.value) {
    emit('update:language', currentLanguage.value)
  }
})

onBeforeUnmount(() => {
  if (isOpen.value) unlockScroll()
})
</script>

<template>
  <div :class="rootClasses" :style="rootStyle">
    <!-- Floating Button -->
    <button
      ref="triggerRef"
      type="button"
      :class="['gtw-float-button', `gtw-pos-${position}`]"
      :aria-label="text.open"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? dialogId : undefined"
      @click="openWidget">
      <slot name="trigger" :is-open="isOpen" :current-language="currentLanguage">
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
      </slot>
    </button>

    <!-- Browser-language suggestion -->
    <div
      v-if="suggestion && !isOpen"
      :class="['gtw-suggestion', `gtw-pos-${position}`, 'notranslate']"
      translate="no"
      role="region"
      :aria-label="text.open">
      <p class="gtw-suggestion-text">{{ text.suggestion(suggestion) }}</p>
      <div class="gtw-suggestion-actions">
        <button type="button" class="gtw-suggestion-accept" @click="acceptSuggestion">{{ text.accept }}</button>
        <button type="button" class="gtw-suggestion-dismiss" @click="dismissSuggestion">{{ text.dismiss }}</button>
      </div>
    </div>

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
              <slot name="header" :close="closeWidget" :title-id="titleId">
                <h2 :id="titleId" class="gtw-modal-title">{{ title }}</h2>
                <p :id="subtitleId" class="gtw-modal-subtitle">{{ subtitle }}</p>
              </slot>
            </div>
            <button type="button" class="gtw-close-button" :aria-label="text.close" @click="closeWidget">
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
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
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
                <slot
                  name="item"
                  :language="lang"
                  :selected="isCurrent(lang)"
                  :active="index === activeIndex"
                  :select="() => selectLanguage(lang.code)">
                  <div class="gtw-language-content">
                    <div v-if="showFlags" class="gtw-flag-wrapper">
                      <LanguageFlag
                        class="gtw-flag"
                        prefix="gtw"
                        :flag="lang.flag"
                        :code="lang.code"
                        :flag-style="flagStyle"
                        :flag-url="flagUrl" />
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
                      <span v-if="display !== 'english'" class="gtw-language-native notranslate" translate="no">
                        {{ lang.nativeName }}
                      </span>
                      <span v-if="display !== 'native'" class="gtw-language-name">{{ lang.name }}</span>
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
                </slot>
              </li>
            </ul>

            <!-- No Results -->
            <div v-if="filteredLanguages.length === 0" class="gtw-no-results">
              <slot name="empty" :query="searchQuery">
                <p class="gtw-no-results-text">{{ text.noResults }}</p>
                <p class="gtw-no-results-hint">{{ text.noResultsHint }}</p>
              </slot>
            </div>

            <p class="gtw-visually-hidden" aria-live="polite">{{ text.results(filteredLanguages.length) }}</p>
          </div>

          <div v-if="$slots.footer" class="gtw-modal-footer">
            <slot name="footer" :close="closeWidget" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Every rule is gated on :where(.gtw-styled), which adds no specificity, so `unstyled` turns them all off. */
.google-translate-widget:where(.gtw-styled) {
  font-family: var(--_gtw-font);
  --_gtw-offset: var(--gtw-offset, 1rem);
}

:where(.gtw-styled) .gtw-float-button {
  position: fixed;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--_gtw-primary);
  color: var(--_gtw-on-primary);
  border: none;
  cursor: pointer;
  transition:
    transform 0.3s,
    background 0.3s;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: var(--_gtw-z-index);
}

:where(.gtw-styled) .gtw-pos-bottom-left {
  left: var(--_gtw-offset);
  bottom: var(--_gtw-offset);
}

:where(.gtw-styled) .gtw-pos-bottom-right {
  right: var(--_gtw-offset);
  bottom: var(--_gtw-offset);
}

:where(.gtw-styled) .gtw-pos-top-left {
  left: var(--_gtw-offset);
  top: var(--_gtw-offset);
}

:where(.gtw-styled) .gtw-pos-top-right {
  right: var(--_gtw-offset);
  top: var(--_gtw-offset);
}

:where(.gtw-styled) .gtw-float-button:hover {
  transform: scale(1.1);
  background: var(--_gtw-primary-hover);
}

:where(.gtw-styled) .gtw-float-button:active {
  transform: scale(0.95);
}

:where(.gtw-styled) .gtw-float-button:focus-visible,
:where(.gtw-styled) .gtw-close-button:focus-visible,
:where(.gtw-styled) .gtw-suggestion button:focus-visible {
  outline: 2px solid var(--_gtw-primary-hover);
  outline-offset: 2px;
}

:where(.gtw-styled) .gtw-suggestion {
  position: fixed;
  max-width: min(20rem, calc(100vw - 2 * var(--_gtw-offset)));
  padding: 0.875rem 1rem;
  background: var(--_gtw-bg);
  color: var(--_gtw-text);
  border: 1px solid var(--_gtw-border);
  border-radius: 0.75rem;
  box-shadow: var(--_gtw-shadow);
  font-size: 0.875rem;
  z-index: var(--_gtw-z-index);
}

:where(.gtw-styled) .gtw-suggestion.gtw-pos-bottom-left,
:where(.gtw-styled) .gtw-suggestion.gtw-pos-bottom-right {
  bottom: calc(var(--_gtw-offset) + 3.75rem);
}

:where(.gtw-styled) .gtw-suggestion.gtw-pos-top-left,
:where(.gtw-styled) .gtw-suggestion.gtw-pos-top-right {
  top: calc(var(--_gtw-offset) + 3.75rem);
}

:where(.gtw-styled) .gtw-suggestion-text {
  margin: 0 0 0.75rem;
}

:where(.gtw-styled) .gtw-suggestion-actions {
  display: flex;
  gap: 0.5rem;
}

:where(.gtw-styled) .gtw-suggestion-accept,
:where(.gtw-styled) .gtw-suggestion-dismiss {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

:where(.gtw-styled) .gtw-suggestion-accept {
  background: var(--_gtw-primary);
  color: var(--_gtw-on-primary);
  border: 1px solid var(--_gtw-primary);
}

:where(.gtw-styled) .gtw-suggestion-dismiss {
  background: transparent;
  color: var(--_gtw-text-muted);
  border: 1px solid var(--_gtw-border);
}

:where(.gtw-styled) .gtw-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: var(--_gtw-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: calc(var(--_gtw-z-index) + 1);
}

:where(.gtw-styled) .gtw-modal {
  background: var(--_gtw-bg);
  color: var(--_gtw-text);
  border-radius: var(--_gtw-radius);
  max-width: 32rem;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--_gtw-shadow);
}

:where(.gtw-styled) .gtw-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--_gtw-border);
}

:where(.gtw-styled) .gtw-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--_gtw-text);
  margin: 0 0 0.25rem 0;
}

:where(.gtw-styled) .gtw-modal-subtitle {
  font-size: 0.875rem;
  color: var(--_gtw-text-muted);
  margin: 0;
}

:where(.gtw-styled) .gtw-close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: var(--_gtw-text-muted);
  transition: all 0.2s;
}

:where(.gtw-styled) .gtw-close-button:hover {
  background: var(--_gtw-surface-strong);
  color: var(--_gtw-text);
}

:where(.gtw-styled) .gtw-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

:where(.gtw-styled) .gtw-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--_gtw-border);
}

:where(.gtw-styled) .gtw-error {
  margin: 0 0 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--_gtw-error-bg);
  color: var(--_gtw-error-text);
  font-size: 0.875rem;
}

:where(.gtw-styled) .gtw-search-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

:where(.gtw-styled) .gtw-search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  border: 1px solid var(--_gtw-border);
  border-radius: 0.75rem;
  background: var(--_gtw-bg);
  color: var(--_gtw-text);
  font-size: 0.875rem;
  transition: all 0.2s;
  outline: none;
}

:where(.gtw-styled) .gtw-search-input:focus {
  border-color: var(--_gtw-primary);
  box-shadow: 0 0 0 3px var(--_gtw-active-bg);
}

:where(.gtw-styled) .gtw-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--_gtw-text-subtle);
}

:where(.gtw-styled) .gtw-languages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

:where(.gtw-styled) .gtw-language-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border: 1px solid var(--_gtw-border);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

:where(.gtw-styled) .gtw-language-item:hover:not(.gtw-language-disabled),
:where(.gtw-styled) .gtw-language-focused:not(.gtw-language-disabled) {
  background: var(--_gtw-surface);
  border-color: var(--_gtw-border-strong);
}

:where(.gtw-styled) .gtw-language-focused {
  outline: 2px solid var(--_gtw-primary);
  outline-offset: -2px;
}

:where(.gtw-styled) .gtw-language-active {
  background: var(--_gtw-active-bg);
  border-color: var(--_gtw-primary);
  border-width: 2px;
  padding: calc(0.75rem - 1px);
}

:where(.gtw-styled) .gtw-language-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

:where(.gtw-styled) .gtw-language-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

:where(.gtw-styled) .gtw-flag-wrapper {
  position: relative;
  flex-shrink: 0;
}

:where(.gtw-styled) .gtw-flag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  object-fit: cover;
}

:where(.gtw-styled) .gtw-flag-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

:where(.gtw-styled) .gtw-flag-code {
  background: var(--_gtw-surface-strong);
  color: var(--_gtw-text);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

:where(.gtw-styled) .gtw-check-badge,
:where(.gtw-styled) .gtw-loading-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 1rem;
  height: 1rem;
  background: var(--_gtw-primary);
  color: var(--_gtw-on-primary);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:where(.gtw-styled) .gtw-spinner {
  width: 0.5rem;
  height: 0.5rem;
  border: 2px solid var(--_gtw-on-primary);
  border-top-color: transparent;
  border-radius: 9999px;
  animation: gtw-spin 0.6s linear infinite;
}

@keyframes gtw-spin {
  to {
    transform: rotate(360deg);
  }
}

:where(.gtw-styled) .gtw-language-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

:where(.gtw-styled) .gtw-language-native,
:where(.gtw-styled) .gtw-language-info > .gtw-language-name:first-child {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--_gtw-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:where(.gtw-styled) .gtw-language-active .gtw-language-native {
  color: var(--_gtw-primary-text);
}

:where(.gtw-styled) .gtw-language-name {
  font-size: 0.75rem;
  color: var(--_gtw-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:where(.gtw-styled) .gtw-chevron {
  flex-shrink: 0;
  color: var(--_gtw-text-subtle);
  transition: opacity 0.2s;
  opacity: 0;
}

:where(.gtw-styled) .gtw-language-item:hover .gtw-chevron,
:where(.gtw-styled) .gtw-language-focused .gtw-chevron {
  opacity: 0.5;
}

:where(.gtw-styled) .gtw-language-active .gtw-chevron {
  color: var(--_gtw-primary);
  opacity: 1;
}

:where(.gtw-styled) .gtw-no-results {
  padding: 3rem 0;
  text-align: center;
}

:where(.gtw-styled) .gtw-no-results-text {
  font-size: 0.875rem;
  color: var(--_gtw-text-muted);
  margin: 0 0 0.25rem 0;
}

:where(.gtw-styled) .gtw-no-results-hint {
  font-size: 0.75rem;
  color: var(--_gtw-text-muted);
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
  :where(.gtw-styled) .gtw-float-button,
  :where(.gtw-styled) .gtw-language-item,
  .gtw-modal-enter-active,
  .gtw-modal-leave-active,
  .gtw-modal-enter-active .gtw-modal,
  .gtw-modal-leave-active .gtw-modal {
    transition: none;
  }

  :where(.gtw-styled) .gtw-float-button:hover {
    transform: none;
  }
}

/* Responsive */
@media (min-width: 768px) {
  .google-translate-widget:where(.gtw-styled) {
    --_gtw-offset: var(--gtw-offset, 1.5rem);
  }
}
</style>
