// A real Nuxt app that installs the module like a user would (through
// node_modules/@ken_de_nigerian/vue-google-translate-widget, a symlink to the repo root).
// `npm run test:nuxt` builds it and checks its server-rendered HTML (CI does this on
// every push). Run `npm run build` first.
export default defineNuxtConfig({
  modules: ['@ken_de_nigerian/vue-google-translate-widget/nuxt'],
  googleTranslate: {
    defaultLanguage: 'en',
    includedLanguages: ['en', 'fr', 'de', 'ar'],
    queryParameter: 'lang',
  },
  devtools: { enabled: false },
  compatibilityDate: '2025-01-01',
})
