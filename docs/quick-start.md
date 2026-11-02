# Quick Start

**Who this is for:** first-time users. **At the end** you'll have a working language switcher that translates your
page in place, in about a minute.

## 1. Add a component

Pick one. Both translate the whole page through Google's free Website Translator.

```vue
<script setup>
import { GoogleTranslateWidget } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
</script>

<template>
  <!-- A floating button (bottom-left) that opens a searchable language list -->
  <GoogleTranslateWidget />
</template>
```

```vue
<script setup>
import { GoogleTranslateButton } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
</script>

<template>
  <!-- A "Translate" button for your navbar, with a dropdown -->
  <GoogleTranslateButton />
</template>
```

That's it. Pick a language and the page is translated **without reloading**. The choice is remembered (in Google's
`googtrans` cookie), so it survives navigation and reloads.

## 2. Offer only the languages you want

```vue
<GoogleTranslateWidget :included-languages="['en', 'fr', 'de', 'yo', 'ig', 'ha']" />
```

## 3. Tell it what language your page is in

The default is English. If your site is written in French:

```vue
<GoogleTranslateWidget default-language="fr" />
```

## 4. Set it once for the whole app (optional)

```ts
// main.ts
import { createApp } from 'vue'
import { createGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
import App from './App.vue'

createApp(App)
  .use(createGoogleTranslate({ defaultLanguage: 'en', includedLanguages: ['fr', 'de', 'es'] }))
  .mount('#app')
```

Every component and `useGoogleTranslate()` now uses those defaults; props still override them. See
[Plugin](./plugin.md).

## 5. Keep brand names untranslated

```vue
<script setup>
import { vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
</script>

<template>
  <span v-no-translate>PayZephyr</span>
</template>
```

## Where next

- Using Nuxt? → [Nuxt](./nuxt.md)
- How it works, and what it can't do → [How It Works](./how-it-works.md)
- Match your design → [Theming](./theming.md)
- Not want to depend on Google's free widget? → [Translation Providers](./providers.md)
