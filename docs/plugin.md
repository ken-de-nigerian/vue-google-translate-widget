# Plugin (app-wide config)

**Who this is for:** apps with more than one language picker, or that want to configure translation in one place.
**At the end** you'll set defaults once for every component and composable.

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
      includedLanguages: ['fr', 'de', 'es', 'yo', 'ig', 'ha'],
      queryParameter: 'lang',
      onTranslate: ({ from, to, trigger }) => console.log('language change', { from, to, trigger }),
    }),
  )
  .mount('#app')
```

For sending that to an analytics tool, see [Events & Analytics](./events-and-analytics.md).

`createGoogleTranslate(config)` accepts every [composable option](./composable.md#options). It sets **defaults**:

1. A prop on a component, or an option passed to `useGoogleTranslate()`, wins.
2. Otherwise the plugin's value is used.
3. Otherwise the built-in default.

A prop explicitly set to `false` counts as set: `<GoogleTranslateButton :hide-branding="false" />` beats
`hideBranding: true` in the plugin.

## Auto-translate on the first visit

```ts
createGoogleTranslate({ autoTranslate: true })
```

On a visitor's **first** visit, if their browser prefers a language you offer (and it isn't the page language), the
page is translated into it right away. It happens once per browser: if they switch back to the original, it isn't
done again. `onTranslate` receives `trigger: 'auto'` for it. For a prompt instead, see the Widget's
[`suggestBrowserLanguage`](./widget.md#browser-language-prompt).
