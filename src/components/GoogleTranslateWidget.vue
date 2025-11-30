<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGoogleTranslate, type Language } from '../composables/useGoogleTranslate'

interface Props {
  defaultLanguage?: string
  includedLanguages?: string[]
  languages?: Language[]
  title?: string
  subtitle?: string
  searchPlaceholder?: string
  showFlags?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultLanguage: 'en',
  title: 'Change Language',
  subtitle: 'Select your preferred language for the interface',
  searchPlaceholder: 'Search languages...',
  showFlags: true,
})

const {
  currentLanguage,
  isChangingLanguage,
  languages,
  changeLanguage,
  initializeTranslate,
} = useGoogleTranslate({
  defaultLanguage: props.defaultLanguage,
  includedLanguages: props.includedLanguages,
  languages: props.languages,
})

const searchQuery = ref('')
const isOpen = ref(false)

const filteredLanguages = computed(() => {
  if (!searchQuery.value.trim()) {
    return languages
  }
  const query = searchQuery.value.toLowerCase()
  return languages.filter(
    lang =>
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
  )
})

const toggleWidget = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    searchQuery.value = ''
  }
}

const closeWidget = () => {
  isOpen.value = false
  searchQuery.value = ''
}

const handleLanguageChange = (lang: string) => {
  if (!isChangingLanguage.value) {
    changeLanguage(lang)
  }
}

onMounted(() => {
  initializeTranslate()
})
</script>

<template>
  <div class="google-translate-widget">
    <!-- Floating Button -->
    <button
      v-if="!isOpen"
      @click="toggleWidget"
      class="gtw-float-button"
      :aria-label="isOpen ? 'Close translate widget' : 'Open translate widget'"
      :aria-expanded="isOpen">
      <svg
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
        <div class="gtw-modal" @click.stop>
          <div class="gtw-modal-header">
            <div>
              <h2 class="gtw-modal-title">{{ title }}</h2>
              <p class="gtw-modal-subtitle">{{ subtitle }}</p>
            </div>
            <button @click="closeWidget" class="gtw-close-button" aria-label="Close">
              <svg
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
            <!-- Search Bar -->
            <div class="gtw-search-wrapper">
              <input
                type="text"
                :placeholder="searchPlaceholder"
                v-model="searchQuery"
                class="gtw-search-input" />
              <svg
                class="gtw-search-icon"
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
            <div v-if="filteredLanguages.length > 0" class="gtw-languages-list">
              <div
                v-for="language in filteredLanguages"
                :key="language.code"
                @click="() => handleLanguageChange(language.code)"
                :class="[
                  'gtw-language-item',
                  {
                    'gtw-language-active': currentLanguage === language.code,
                    'gtw-language-disabled': isChangingLanguage,
                  },
                ]">
                <div class="gtw-language-content">
                  <div v-if="showFlags" class="gtw-flag-wrapper">
                    <img
                        class="gtw-flag"
                        :src="`https://flagcdn.com/${language.flag}.svg`"
                        :alt="`${language.name} flag`"
                        loading="lazy"
                        @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')" />
                    <div
                        v-if="currentLanguage === language.code && !isChangingLanguage"
                      class="gtw-check-badge">
                      <svg
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
                    <div
                      v-if="isChangingLanguage && currentLanguage === language.code"
                      class="gtw-loading-badge">
                      <div class="gtw-spinner"></div>
                    </div>
                  </div>
                  <div class="gtw-language-info">
                    <span class="gtw-language-native">{{ language.nativeName }}</span>
                    <span class="gtw-language-name">{{ language.name }}</span>
                  </div>
                </div>
                <svg
                  class="gtw-chevron"
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
              </div>
            </div>

            <!-- No Results -->
            <div v-else class="gtw-no-results">
              <svg
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
          </div>
        </div>
      </div>
    </Transition>

    <!-- Hidden Google Translate Element -->
    <div id="google_translate_element" style="display: none"></div>
  </div>
</template>

<style scoped>
.google-translate-widget {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 9999;
}

.gtw-float-button:hover {
  transform: scale(1.1);
  background: #2563eb;
}

.gtw-float-button:active {
  transform: scale(0.95);
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  color: #6b7280;
  margin: 0;
}

.gtw-close-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #6b7280;
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

.gtw-search-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.gtw-search-input {
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.gtw-language-item:hover:not(.gtw-language-disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
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
  width: 2.5rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  object-fit: cover;
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
  color: #3b82f6;
}

.gtw-language-name {
  font-size: 0.75rem;
  color: #6b7280;
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

.gtw-language-item:hover .gtw-chevron {
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
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.gtw-no-results-hint {
  font-size: 0.75rem;
  color: rgba(107, 114, 128, 0.7);
  margin: 0;
}

/* Transitions */
.gtw-modal-enter-active,
.gtw-modal-leave-active {
  transition: opacity 0.2s;
}

.gtw-modal-enter-active .gtw-modal,
.gtw-modal-leave-active .gtw-modal {
  transition: transform 0.2s, opacity 0.2s;
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

/* Responsive */
@media (min-width: 768px) {
  .gtw-float-button {
    left: 1.5rem;
    bottom: 1.5rem;
  }
}

.goog-logo-link {
  display: none !important;
}

.goog-te-gadget {
  color: transparent !important;
}

.goog-te-gadget .goog-te-combo {
  color: #b5b5b5 !important;
}

.goog-te-banner-frame.skiptranslate {
  display: none !important;
}

.VIpgJd-ZVi9od-l4eHX-hSRGPd,
.VIpgJd-ZVi9od-l4eHX-hSRGPd:link,
.VIpgJd-ZVi9od-l4eHX-hSRGPd:visited,
.VIpgJd-ZVi9od-l4eHX-hSRGPd:hover,
.VIpgJd-ZVi9od-l4eHX-hSRGPd:active {
  font-size: 12px;
  font-weight: bold;
  color: #444;
  text-decoration: none;
  display: none;
}

.goog-te-gadget img {
  display: none !important;
}

body > .skiptranslate {
  display: none;
}

body {
  top: 0 !important;
}
</style>