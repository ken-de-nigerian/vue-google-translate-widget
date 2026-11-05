# Building Your Own Switcher

The two components cover most sites, but sometimes the design calls for something else: a row of language
pills in the footer, a setting on the user's profile page, or a single "Read in Yorùbá" link on a recipe. The
`useGoogleTranslate` composable gives you everything the components use, so you can build any of these.

## A footer with language pills

Lagos Eats wants the five languages its readers use as a row of links in the footer:

```vue
<!-- components/LanguagePills.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoogleTranslate, vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

const { currentLanguage, languages, isChangingLanguage, status, changeLanguage, initializeTranslate } =
  useGoogleTranslate({ includedLanguages: ['en', 'fr', 'yo', 'ig', 'ha'] })

onMounted(initializeTranslate)
</script>

<template>
  <nav aria-label="Language">
    <button
      v-for="language in languages"
      :key="language.code"
      v-no-translate
      :aria-pressed="currentLanguage === language.code"
      :disabled="isChangingLanguage || status === 'error'"
      @click="changeLanguage(language.code)">
      {{ language.nativeName }}
    </button>
  </nav>
</template>
```

Three details in there are worth copying:

- **`onMounted(initializeTranslate)`** loads the translation engine and applies a language the visitor chose on an
  earlier visit. Without it, nothing loads until the first `changeLanguage()` call, and a returning French reader
  sees English until they click something.
- **`v-no-translate` on the language names.** Otherwise, once the page is in French, Google translates "Deutsch" to
  "Allemand", and a German reader can no longer find their language. The built-in components do this for you.
- **Disabling the buttons while a change is in progress or when Google is unavailable.** `changeLanguage()` ignores
  calls while another change is running anyway, but the disabled state tells the visitor why nothing happened.

## Everything is shared

Translation applies to the whole page, so the state does too. Every call to `useGoogleTranslate()`, in any
component, sees the same `currentLanguage`, `status` and `error`, and Google's script is loaded once. The pills above
and a `GoogleTranslateWidget` on the same page always agree.

There's one exception: during server-side rendering, every call gets its own state. Otherwise one visitor's language
could leak into another visitor's page when two requests are rendered at the same time.

## Handling failures

`changeLanguage()` returns a promise that resolves once the page has been translated, and rejects if it can't be:

```ts
try {
  await changeLanguage('yo')
} catch (error) {
  // Google's script was blocked, the code isn't one Google supports,
  // or your translation provider failed.
  toast(`Translation unavailable: ${(error as Error).message}`)
}
```

When it rejects, `error` is set and `currentLanguage` already reflects what's on screen, so your UI stays honest
without extra work. `initializeTranslate()` never rejects; check `status` and `error` instead, because there's
usually nothing for the caller to do except show that translation is unavailable.

## Reacting to the language

`currentLanguage` is a ref, so you can watch it. For example, to send the visitor's choice to your backend so their
account remembers it:

```ts
watch(currentLanguage, language => api.updateProfile({ readingLanguage: language }))
```

For analytics across the whole app, `onTranslate` is usually a better fit; see
[Events & Analytics](events-and-analytics.md).

## Options

All of these can also be set app-wide with [the plugin](plugin.md). Options you pass here win.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `defaultLanguage` | `string` | `'en'` | The language the page is written in. Use the same value everywhere on a page. |
| `languages` | `Language[]` (ref or getter allowed) | the built-in list | The languages to offer |
| `includedLanguages` | `string[]` (ref or getter allowed) | all | Only offer these codes. `he` and `jv` are accepted. |
| `mode` | `'live'` \| `'reload'` | `'live'` | [Live and Reload Modes](live-vs-reload.md) |
| `reloadOnRestore` | `boolean` | `false` | Reload instead of restoring the original in place |
| `hideBranding` | `boolean` | `true` | Hide Google's toolbar, tooltips and highlight |
| `syncDocumentDir` | `boolean` | `true` | Set `dir="rtl"` for right-to-left languages |
| `autoDisplay` | `boolean` | `false` | Let Google show its own "translate this page?" bar |
| `scriptSrc` | `string` | Google's URL | Load Google's script from elsewhere |
| `nonce` | `string` | | Content Security Policy nonce for the injected `<script>` and `<style>` |
| `timeout` | `number` | `10000` | Milliseconds to wait for Google |
| `provider` | `TranslationProvider` | | Translate through a service instead of Google's widget: [Translation Providers](providers.md) |
| `cache` | `TranslationCache` | `localStorageCache()` | Where provider translations are kept |
| `translateAttributes` | `string[]` | `placeholder`, `title`, `alt`, `aria-label` | Attributes the provider engine translates |
| `onTranslate` | `(event) => void` | | Called after every successful change: [Events & Analytics](events-and-analytics.md) |
| `autoTranslate` | `boolean` | `false` | Translate into the visitor's browser language on their first visit |
| `queryParameter` | `string` | | Keep the language in the URL, e.g. `'lang'` for `?lang=fr` |
| `initialLanguage` | `string` | | The language to render on the server; the Nuxt module sets it from the cookie |

## What it returns

| | Type | |
| --- | --- | --- |
| `currentLanguage` | `Ref<string>` | The language the page is shown in, as a Google code |
| `pageLanguage` | `string` | `defaultLanguage`, after the plugin and options are combined |
| `languages` | `Language[]` | The languages to offer. Reactive: it updates when `languages` or `includedLanguages` change. |
| `isChangingLanguage` | `Ref<boolean>` | `true` while a change is being applied |
| `status` | `Ref<'idle' \| 'loading' \| 'ready' \| 'error'>` | Whether the engine has loaded |
| `isReady` | `ComputedRef<boolean>` | `status === 'ready'` |
| `error` | `Ref<Error \| null>` | Why loading or the last change failed |
| `initializeTranslate()` | `() => Promise<void>` | Loads the engine and applies a saved language. Call it in `onMounted`. Never rejects. |
| `changeLanguage(code)` | `(code: string) => Promise<void>` | Translates the page. Passing the page's own language restores the original. Rejects if it can't be applied. |
| `restoreOriginal()` | `() => Promise<void>` | Shows the original text |
| `getCurrentLanguage()` | `() => string` | Reads the saved choice: `#googtrans(...)` first, then `?lang=` (if enabled), then the cookie |
