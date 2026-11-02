# Nuxt

**Who this is for:** Nuxt 3 users. **At the end** you'll have the components and composable auto-imported, the
stylesheet loaded, and the visitor's language rendered on the server, so hydration matches.

## Add the module

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ken_de_nigerian/vue-google-translate-widget/nuxt'],
  googleTranslate: {
    defaultLanguage: 'en',
    includedLanguages: ['en', 'fr', 'de', 'ar'],
  },
})
```

Now use the components anywhere, with no imports:

```vue
<template>
  <GoogleTranslateButton />
  <GoogleTranslateWidget />
  <span v-no-translate>PayZephyr</span>
</template>
```

`useGoogleTranslate()` is auto-imported too, and `v-no-translate` is registered globally.

## What the module does

- Auto-imports `GoogleTranslateWidget`, `GoogleTranslateButton`, `useGoogleTranslate` and `vNoTranslate`.
- Adds the stylesheet (turn off with `css: false`).
- Registers a plugin that applies your `googleTranslate` config to every component and composable, **reads the
  `googtrans` cookie on the server** (and `?lang=` if you enable `queryParameter`), and renders that language, so
  the first paint and hydration agree.
- Registers `v-no-translate` globally (Nuxt's auto-imports don't reach template directives). On the server it
  renders only `translate="no"`; the `notranslate` class is added after hydration, to avoid a class mismatch.

All of this is checked in CI: a real Nuxt app (`playground-nuxt/`) is built with the module and its server-rendered
HTML is tested for the cookie language, `?lang=` priority, request isolation and the directive.

## Options

Everything from [the composable](./composable.md#options) that can be written in `nuxt.config` (plain values), plus:

| Option | Default | |
| --- | --- | --- |
| `css` | `true` | Add the components' stylesheet |
| `plugin` | `true` | Register the plugin described above |

## Shareable links: `?lang=fr`

```ts
googleTranslate: { queryParameter: 'lang' }
```

`/pricing?lang=fr` now opens in French, on the server and in the browser, and the parameter is kept in sync as the
visitor switches. No `hreflang` tags are generated, on purpose: the server sends the original language, translation
happens in the browser, so telling search engines a French version exists at that URL would be misleading.

## Using a provider, `onTranslate` or a custom cache

Functions can't travel through `nuxt.config`. Turn off the built-in plugin and register your own:

```ts
// nuxt.config.ts
googleTranslate: { plugin: false }
```

```ts
// plugins/translate.ts
import { createGoogleTranslate, endpointProvider, vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

export default defineNuxtPlugin(nuxtApp => {
  const saved = useCookie<string | null>('googtrans', { decode: v => v }).value
  nuxtApp.vueApp.use(
    createGoogleTranslate({
      defaultLanguage: 'en',
      provider: endpointProvider({ url: '/api/translate' }),
      onTranslate: event => console.log('translated', event),
      initialLanguage: saved?.split('/')[2] || undefined,
    }),
  )
  nuxtApp.vueApp.directive('no-translate', vNoTranslate)
})
```

The matching server route is in [Server Handlers](./server-handlers.md#nuxt).
