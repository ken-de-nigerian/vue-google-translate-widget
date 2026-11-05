# Configuration

Once a site has more than one language switcher, say a `GoogleTranslateButton` in the navbar and a
`GoogleTranslateWidget` on mobile, repeating the same props on each gets tedious, and sooner or later they drift
apart. The plugin sets options once for the whole app.

```ts
// main.ts
import { createApp } from 'vue'
import { createGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
import App from './App.vue'

createApp(App)
  .use(
    createGoogleTranslate({
      defaultLanguage: 'en',
      includedLanguages: ['en', 'fr', 'yo', 'ig', 'ha', 'ar'],
      queryParameter: 'lang',
    }),
  )
  .mount('#app')
```

On Nuxt, the module does this for you from the `googleTranslate` key in `nuxt.config`; see [Nuxt](nuxt.md).

## Which value wins

The plugin sets **defaults**. For each option:

1. A prop on a component, or an option passed to `useGoogleTranslate()`, wins.
2. Otherwise, the plugin's value is used.
3. Otherwise, the built-in default.

A prop explicitly set to `false` counts as set. `<GoogleTranslateButton :hide-branding="false" />` keeps Google's
branding for that button even if the plugin says `hideBranding: true`.

Translation applies to the whole page, so some options only make sense once per page. `defaultLanguage` is the
important one: if two switchers disagree about the page's language, the first one to load Google wins and a warning
is logged in the console. Setting it in the plugin avoids that.

## Options

`createGoogleTranslate()` accepts everything [the composable](composable.md#options) does. The ones most often set
here:

| Option | Default | Use it to |
| --- | --- | --- |
| `defaultLanguage` | `'en'` | Say what language your pages are written in |
| `includedLanguages` | all | Offer the same languages everywhere |
| `queryParameter` | off | Keep the language in the URL for shareable links (`?lang=fr`) |
| `provider` | Google's widget | Translate through DeepL, Google Cloud, Azure or LibreTranslate: [Translation Providers](providers.md) |
| `onTranslate` | | Send language changes to analytics: [Events & Analytics](events-and-analytics.md) |
| `autoTranslate` | `false` | Translate into the visitor's language on their first visit ([below](#translating-automatically-on-the-first-visit)) |
| `mode` | `'live'` | Reload the page instead of translating in place: [Live and Reload Modes](live-vs-reload.md) |
| `nonce`, `scriptSrc`, `timeout` | | Fit a Content Security Policy or proxy: [Security, CSP & Privacy](csp-and-privacy.md) |

Display options such as `theme`, `showFlags` and `display` are props on the components, not plugin options. Set them
with CSS custom properties or a wrapper component if you want them everywhere.

## Translating automatically on the first visit {#translating-automatically-on-the-first-visit}

```ts
createGoogleTranslate({ autoTranslate: true })
```

On a visitor's first visit, if their browser prefers a language you offer (and it isn't the page's own language), the
page is translated into it straight away. A reader in Lyon with a French browser lands on Lagos Eats and reads the
recipe in French without touching anything.

It happens once per browser. If the visitor switches back to English, the package remembers that (in
`localStorage`) and won't do it again. `onTranslate` receives `trigger: 'auto'` for these changes, so your analytics
can tell them apart from choices visitors made themselves.

Automatic translation is convenient, but it surprises some visitors and they may not realize they're reading machine
translation. If that matters to you, the widget's
[`suggest-browser-language`](widget.md#suggesting-the-visitors-language) asks first instead.

## Advanced: the injection key

The plugin provides its options under `GOOGLE_TRANSLATE_CONFIG`. If you need to set options for one part of an app,
say a section of the site written in a different language, provide your own object under that key from a parent
component:

```ts
import { provide } from 'vue'
import { GOOGLE_TRANSLATE_CONFIG } from '@ken_de_nigerian/vue-google-translate-widget'

provide(GOOGLE_TRANSLATE_CONFIG, { includedLanguages: ['fr', 'de'] })
```

Remember that translation is page-wide: two sections can offer different languages, but the page is only ever in one
of them.
