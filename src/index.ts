export { useGoogleTranslate } from './composables/useGoogleTranslate'
export type {
  Language,
  TranslateMode,
  TranslateStatus,
  UseGoogleTranslateOptions,
  UseGoogleTranslateReturn,
} from './composables/useGoogleTranslate'
export { DEFAULT_LANGUAGES, LANGUAGE_CODE_ALIASES, toGoogleCode } from './core/languages'
export { default as GoogleTranslateWidget } from './components/GoogleTranslateWidget.vue'
export { default as GoogleTranslateButton } from './components/GoogleTranslateButton.vue'
