import { defineNuxtPlugin, useCookie, useRoute, useRuntimeConfig } from '#imports'
import {
  createGoogleTranslate,
  vNoTranslate,
  type GoogleTranslateConfig,
} from '@ken_de_nigerian/vue-google-translate-widget'

export default defineNuxtPlugin(nuxtApp => {
  const config = (useRuntimeConfig().public.googleTranslate ?? {}) as GoogleTranslateConfig
  // Render the visitor's language on the server, so hydration matches: ?lang= first (if enabled), then the
  // googtrans cookie ("/en/fr" → "fr").
  const query = config.queryParameter ? useRoute().query[config.queryParameter] : undefined
  const saved = useCookie<string | null>('googtrans', { decode: value => value }).value
  const initialLanguage = (typeof query === 'string' && query) || saved?.split('/')[2] || undefined
  nuxtApp.vueApp.use(createGoogleTranslate({ ...config, initialLanguage }))
  // Auto-imports don't reach template directives, so register v-no-translate globally.
  nuxtApp.vueApp.directive('no-translate', vNoTranslate)
})
