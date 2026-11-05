# Nuxt

Using the package in Nuxt raises one problem a plain Vue app doesn't have. The server renders the page before
anything runs in the browser, and the server doesn't know which language the visitor chose. If the server renders
"English" in the language switcher and the browser then reads the cookie and changes it to "Français", Vue reports a
hydration mismatch and the switcher visibly flickers.

The Nuxt module solves that, and saves you the setup from [Installation](installation.md) at the same time.

## Adding the module

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ken_de_nigerian/vue-google-translate-widget/nuxt'],
  googleTranslate: {
    defaultLanguage: 'en',
    includedLanguages: ['en', 'fr', 'yo', 'ig', 'ha', 'ar'],
  },
})
```

That's the whole setup. Use the components anywhere, without importing them:

```vue
<!-- app.vue -->
<template>
  <header>
    <span v-no-translate class="logo">Lagos Eats</span>
    <GoogleTranslateButton />
  </header>
  <NuxtPage />
</template>
```

## What the module does

- **Registers the components and composable for auto-import**: `GoogleTranslateWidget`, `GoogleTranslateButton`,
  `useGoogleTranslate` and `vNoTranslate`.
- **Adds the stylesheet** to every page. Turn this off with `css: false` if you style the components yourself.
- **Applies your `googleTranslate` options** to every component and composable, exactly as
  [the plugin](plugin.md) does in a plain Vue app.
- **Renders the visitor's language on the server.** A small plugin reads the `googtrans` cookie during the server
  render (and `?lang=`, if you enable [shareable links](#shareable-links)) and passes it to the components, so the
  HTML the server sends already says "Français". The browser agrees when it hydrates, so there's no mismatch and no
  flicker.
- **Registers `v-no-translate` globally.** Nuxt's auto-imports reach scripts, not template directives, so the module
  registers it for you. On the server it renders only `translate="no"`; the `notranslate` class is added in the
  browser after hydration. Rendering the class on the server would make Vue report a class mismatch, because Vue
  compares the whole `class` attribute when it hydrates.

The translation itself still happens in the browser: the server always sends the page's original text. That's the
nature of machine translation in the browser, and [How Translation Works](how-it-works.md#what-machine-translation-can-and-cant-do)
explains what it means for search engines.

## How this is tested

Every change to the package builds a real Nuxt app (`tests/fixtures/nuxt-app/`) on **Nuxt 3 and Nuxt 4**, starts it,
and checks the HTML its server sends: that the components are auto-imported, the stylesheet arrives, the cookie's
language is rendered, `?lang=` takes priority over the cookie, two visitors with different languages requesting pages
at the same time each get their own language, and the directive renders `translate="no"` without a class.

## Options

`googleTranslate` takes every [configuration option](plugin.md#options) whose value can be written in
`nuxt.config` (strings, numbers, booleans, arrays), plus two of its own:

| Option | Default | |
| --- | --- | --- |
| `css` | `true` | Add the components' stylesheet to every page |
| `plugin` | `true` | Register the plugin that applies your options and renders the visitor's language on the server |

Functions can't be written in `nuxt.config`, so `provider`, `cache` and `onTranslate` aren't available here. See
[below](#providers-ontranslate-and-other-functions) for how to set them.

## Shareable links {#shareable-links}

A reader who shares a recipe in French probably wants the person they send it to see it in French too. Turn on the
`lang` query parameter:

```ts
googleTranslate: {
  queryParameter: 'lang',
}
```

Now `https://lagoseats.example/recipes/jollof?lang=fr` opens in French, on the server and in the browser, even for
someone who has never visited. As readers switch languages, the parameter is kept in sync with `history.replaceState`,
so it doesn't add entries to the back button. `?lang=` takes priority over the cookie.

::: info Why there are no `hreflang` tags or `/fr/` URLs
Both tell search engines "a French version of this page exists at this URL". With translation in the browser, it
doesn't: the server sends English. Advertising translations the HTML doesn't contain can hurt how search engines
treat your site, so the module deliberately doesn't generate them. For real multilingual SEO you need translations
rendered on the server, which is a job for vue-i18n.
:::

## Providers, `onTranslate` and other functions {#providers-ontranslate-and-other-functions}

To translate with DeepL or another [provider](providers.md), or to send [analytics events](events-and-analytics.md),
you need to pass functions, which `nuxt.config` can't hold. Turn off the module's plugin and register your own. The
module still handles auto-imports and the stylesheet:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ken_de_nigerian/vue-google-translate-widget/nuxt'],
  googleTranslate: { plugin: false },
})
```

```ts
// plugins/translate.ts
import { createGoogleTranslate, endpointProvider, vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

export default defineNuxtPlugin(nuxtApp => {
  // Render the visitor's language on the server, as the built-in plugin would.
  const saved = useCookie('googtrans', { decode: (value: string) => value }).value

  nuxtApp.vueApp.use(
    createGoogleTranslate({
      defaultLanguage: 'en',
      includedLanguages: ['en', 'fr', 'yo', 'ig', 'ha', 'ar'],
      provider: endpointProvider({ url: '/api/translate' }),
      onTranslate: event => console.log('language changed', event),
      initialLanguage: saved?.split('/')[2] || undefined,
    }),
  )
  nuxtApp.vueApp.directive('no-translate', vNoTranslate)
})
```

The `/api/translate` route that goes with this is in [Server Handlers](server-handlers.md#nuxt).

## Troubleshooting

- **Hydration warnings after a reload in another language.** Make sure the plugin is registered (`plugin: true`, the
  default), or that your own plugin passes `initialLanguage` as above.
- **`v-no-translate` "failed to resolve directive".** You turned the module's plugin off and your own plugin doesn't
  register the directive. Add `nuxtApp.vueApp.directive('no-translate', vNoTranslate)`.
- **No styles.** Check `css` isn't `false`, or import `@ken_de_nigerian/vue-google-translate-widget/style.css`
  yourself.

More in [Troubleshooting](troubleshooting.md).
