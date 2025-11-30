<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGoogleTranslate, type Language } from '../composables/useGoogleTranslate'

interface Props {
  defaultLanguage?: string
  includedLanguages?: string[]
  languages?: Language[]
  buttonText?: string
  buttonClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultLanguage: 'en',
  buttonText: 'Translate',
})

const emit = defineEmits<{
  languageChanged: [language: string]
}>()

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

const isOpen = ref(false)

const handleLanguageChange = (lang: string) => {
  if (!isChangingLanguage.value) {
    changeLanguage(lang)
    emit('languageChanged', lang)
    isOpen.value = false
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

onMounted(() => {
  initializeTranslate()
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (!target.closest('.gtb-container')) {
      isOpen.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  return () => {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<template>
  <div class="gtb-container">
    <button
      @click="toggleDropdown"
      :class="['gtb-button', buttonClass]"
      :disabled="isChangingLanguage">
      <svg
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
        <div
          v-for="language in languages"
          :key="language.code"
          @click="() => handleLanguageChange(language.code)"
          :class="[
            'gtb-dropdown-item',
            { 'gtb-dropdown-item-active': currentLanguage === language.code },
          ]">
          <img
              class="gtb-flag"
              :src="`https://flagcdn.com/${language.flag}.svg`"
              :alt="`${language.name} flag`"
              loading="lazy"
              @error="(e: Event) => ((e.target as HTMLImageElement).style.display = 'none')" />
          <span class="gtb-language-name">{{ language.nativeName }}</span>
          <svg
            v-if="currentLanguage === language.code"
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
        </div>
      </div>
    </Transition>

    <!-- Hidden Google Translate Element -->
    <div id="google_translate_element" style="display: none"></div>
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

.gtb-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.gtb-button:disabled {
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
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 12rem;
  max-height: 20rem;
  overflow-y: auto;
  z-index: 50;
}

.gtb-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.gtb-dropdown-item:hover {
  background: #f9fafb;
}

.gtb-dropdown-item-active {
  background: rgba(59, 130, 246, 0.05);
  color: #3b82f6;
}

.gtb-flag {
  width: 1.5rem;
  height: 1rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.gtb-language-name {
  flex: 1;
  font-size: 0.875rem;
}

.gtb-dropdown-enter-active,
.gtb-dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.gtb-dropdown-enter-from,
.gtb-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>

<style>
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