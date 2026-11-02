import type { Plugin } from 'vue'
import { GOOGLE_TRANSLATE_CONFIG, type GoogleTranslateConfig } from './composables/useGoogleTranslate'

/**
 * Sets defaults for every component and `useGoogleTranslate()` in the app.
 * Props and composable options still override them.
 *
 * ```ts
 * app.use(createGoogleTranslate({ defaultLanguage: 'en', includedLanguages: ['fr', 'de'] }))
 * ```
 */
export function createGoogleTranslate(config: GoogleTranslateConfig = {}): Plugin {
  return {
    install(app) {
      app.provide(GOOGLE_TRANSLATE_CONFIG, config)
    },
  }
}
