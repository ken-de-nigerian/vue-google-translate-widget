# useGoogleTranslate

**Who this is for:** anyone building their own language UI, or reacting to the current language in code. **At the
end** you'll know every option and return value.

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

const { currentLanguage, languages, isChangingLanguage, status, changeLanguage, initializeTranslate } =
  useGoogleTranslate({ includedLanguages: ['en', 'fr', 'de'] })

onMounted(initializeTranslate)
</script>

<template>
  <select
    :value="currentLanguage"
    :disabled="isChangingLanguage || status === 'error'"
    @change="e => changeLanguage((e.target as HTMLSelectElement).value)">
    <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.nativeName }}</option>
  </select>
</template>
```

Translation is page-wide, so the state is too: every call (and every component) shares the same current language,
status and error, and the engine is loaded once. On the server each call gets its own state, so requests can't leak
into each other.

## Options

Every option can also be set app-wide with [the plugin](./plugin.md); options passed here win.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `defaultLanguage` | `string` | `'en'` | The page's language. Use the same value everywhere on a page. |
| `languages` | `MaybeRefOrGetter<Language[]>` | built-in list | Reactive |
| `includedLanguages` | `MaybeRefOrGetter<string[]>` | all | Reactive; `he`/`jv` accepted |
| `mode` | `'live' \| 'reload'` | `'live'` | |
| `reloadOnRestore` | `boolean` | `false` | |
| `hideBranding` | `boolean` | `true` | Google widget only |
| `syncDocumentDir` | `boolean` | `true` | |
| `autoDisplay` | `boolean` | `false` | Google's own "translate this page?" prompt |
| `scriptSrc` | `string` | Google's URL | |
| `nonce` | `string` | | CSP nonce |
| `timeout` | `number` | `10000` | ms to wait for Google |
| `provider` | `TranslationProvider` | | Use a translation service instead of Google's widget: [Providers](./providers.md) |
| `cache` | `TranslationCache` | `localStorageCache()` | Provider translations cache |
| `translateAttributes` | `string[]` | placeholder, title, alt, aria-label | Provider engine only |
| `onTranslate` | `(event: TranslateEvent) => void` | | See [Events & Analytics](./events-and-analytics.md) |
| `autoTranslate` | `boolean` | `false` | Translate into the browser language on the first visit |
| `queryParameter` | `string` | | e.g. `'lang'` for `?lang=fr` links |
| `initialLanguage` | `string` | | The language to render on the server (the Nuxt module sets it) |

## Returns

| | Type | |
| --- | --- | --- |
| `currentLanguage` | `Ref<string>` | Google code the page is shown in |
| `pageLanguage` | `string` | The resolved `defaultLanguage` |
| `languages` | `Language[]` | Reactive array of languages to offer |
| `isChangingLanguage` | `Ref<boolean>` | |
| `status` | `Ref<'idle' \| 'loading' \| 'ready' \| 'error'>` | |
| `error` | `Ref<Error \| null>` | |
| `isReady` | `ComputedRef<boolean>` | |
| `initializeTranslate()` | `() => Promise<void>` | Loads the engine and applies a saved language. **Never rejects**; check `status`/`error`. Call it in `onMounted`. |
| `changeLanguage(code)` | `(code: string) => Promise<void>` | Resolves once applied. **Rejects** (and sets `error`) if it can't be. Passing the page language restores the original. Ignored while another change runs. |
| `restoreOriginal()` | `() => Promise<void>` | |
| `getCurrentLanguage()` | `() => string` | Reads `#googtrans(...)`, then `?lang=` (if enabled), then the cookie |

## Handling failures

```ts
try {
  await changeLanguage('fr')
} catch (error) {
  // Google was blocked, the code isn't supported, or your provider failed.
  // currentLanguage already reflects what's on screen.
}
```
