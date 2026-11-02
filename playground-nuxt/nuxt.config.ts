// A real Nuxt app that installs the module like a user would (through
// node_modules/@ken_de_nigerian/vue-google-translate-widget, a symlink to the repo).
// Run `npm run build` first, then `npm run nuxt:build` / `npm run nuxt:dev`.
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
