export { useGoogleTranslate, GOOGLE_TRANSLATE_CONFIG } from './composables/useGoogleTranslate'
export type {
  GoogleTranslateConfig,
  Language,
  TranslateEvent,
  TranslateMode,
  TranslateStatus,
  UseGoogleTranslateOptions,
  UseGoogleTranslateReturn,
} from './composables/useGoogleTranslate'
export { createGoogleTranslate } from './plugin'
export { DEFAULT_LANGUAGES, LANGUAGE_CODE_ALIASES, toGoogleCode } from './core/languages'
export { endpointProvider, libreTranslate, toLibreTranslateCode } from './core/providers'
export type { EndpointProviderOptions, LibreTranslateOptions, TranslationProvider } from './core/providers'
export { createDomTranslator, localStorageCache, memoryCache } from './core/domTranslator'
export type { DomTranslator, DomTranslatorOptions, TranslationCache } from './core/domTranslator'
export { vNoTranslate } from './directives/noTranslate'
export { DEFAULT_WIDGET_LABELS, flagEmoji } from './components/shared'
export type { FlagStyle, LanguageDisplay, Theme, WidgetLabels } from './components/shared'
export { default as GoogleTranslateWidget } from './components/GoogleTranslateWidget.vue'
export { default as GoogleTranslateButton } from './components/GoogleTranslateButton.vue'
