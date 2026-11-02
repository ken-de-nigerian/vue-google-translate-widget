# Vue Google Translate Widget

[![npm version](https://img.shields.io/npm/v/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![npm downloads](https://img.shields.io/npm/dm/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![Tests](https://github.com/ken-de-nigerian/vue-google-translate-widget/actions/workflows/tests.yml/badge.svg)](https://github.com/ken-de-nigerian/vue-google-translate-widget/actions/workflows/tests.yml)
[![Bundle size](https://img.shields.io/bundlejs/size/@ken_de_nigerian/vue-google-translate-widget?style=flat-square)](https://bundlejs.com/?q=@ken_de_nigerian/vue-google-translate-widget)
[![Types](https://img.shields.io/npm/types/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

A lightweight, customizable Vue 3 component and composable library for integrating Google Translate into your Vue applications. Supports 100+ languages with a clean, ready-made UI.

## Features

- 🌍 **100+ Languages** - Native names, searchable, with codes checked against Google's live widget
- ⚡ **No page reloads** - Switches language in place and restores the original the same way
- ♿ **Accessible** - Keyboard navigation, focus management and ARIA roles, checked with axe-core in CI
- 🧹 **Clean page** - Google's banner, tooltips and highlight are hidden for you (`hideBranding`)
- 🎨 **Customizable UI** - Two ready-made components, or use the composable to build your own
- 🪝 **Vue 3 Composable** - Shared, reactive state: current language, loading status, errors
- 💪 **TypeScript** - Fully typed
- 🎯 **Zero Dependencies** - Only requires Vue 3 (flag images load from `flagcdn.com`; see `flagUrl` / `showFlags`)
- 📦 **Small Bundle** - About 9 kB of JavaScript and 2 kB of CSS (brotli), checked in CI
- 🎭 **SSR-safe** - Google's script only loads in the browser, on mount; use a client-only plugin in Nuxt

> **Roadmap:** theming/dark mode, RTL page direction and a Nuxt module are planned for 1.2–2.0.
> See [ROADMAP.md](ROADMAP.md).

## Installation

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

or

```bash
yarn add @ken_de_nigerian/vue-google-translate-widget
```

or

```bash
pnpm add @ken_de_nigerian/vue-google-translate-widget
```

## Quick Start

### Using the Widget Component (Recommended)

The easiest way to get started is with the `GoogleTranslateWidget` component:

```vue
<script setup>
import { GoogleTranslateWidget } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateWidget />
</template>
```

### Using the Button Component

For a more compact dropdown button:

```vue
<script setup>
import { GoogleTranslateButton } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateButton />
</template>
```

### Using the Composable

For complete control, use the `useGoogleTranslate` composable:

```vue
<script setup>
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
import { onMounted } from 'vue'

const {
  currentLanguage,
  isChangingLanguage,
  languages,
  changeLanguage,
  initializeTranslate
} = useGoogleTranslate()

onMounted(() => {
  initializeTranslate()
})
</script>

<template>
  <select
    :value="currentLanguage"
    :disabled="isChangingLanguage"
    @change="e => changeLanguage(e.target.value)">
    <option v-for="lang in languages" :key="lang.code" :value="lang.code">
      {{ lang.nativeName }}
    </option>
  </select>
</template>
```

You don't need to add any hidden element: the package creates one hidden host for Google and shares it between
every component and composable on the page.

## Google's Branding

Google's widget adds a banner at the top of the page (pushing your layout down by 40px), hover tooltips and a
highlight on translated text. **These are hidden automatically**: the package injects one small stylesheet the first
time it loads. Pass `:hide-branding="false"` (or `hideBranding: false` to the composable) to keep Google's UI.

Google changes its class names from time to time, so this is best effort. If something reappears after a Google
update, please [open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues) with a
screenshot.

## Component Props

Both components accept these:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultLanguage` | `string` | `'en'` | The language your page is written in |
| `includedLanguages` | `string[]` | all | Language codes to offer (reactive) |
| `languages` | `Language[]` | built-in list | Your own language list (reactive) |
| `language` | `string` | | Current language, for `v-model:language` |
| `errorText` | `string` | `'Translation is unavailable right now…'` | Shown if Google can't load |
| `showFlags` | `boolean` | `true` | Show flags (or a code badge when a language has none) |
| `flagUrl` | `(flag: string) => string` | flagcdn.com | Where flag images come from, e.g. your own CDN |
| `mode` | `'live' \| 'reload'` | `'live'` | Translate in place, or reload the page like 1.0 did |
| `reloadOnRestore` | `boolean` | `false` | Reload instead of restoring the original text in place |
| `hideBranding` | `boolean` | `true` | Hide Google's banner, tooltips and highlight |
| `scriptSrc` | `string` | Google's URL | Load Google's script from somewhere else (e.g. a proxy) |
| `nonce` | `string` | | CSP nonce for the injected `<script>` and `<style>` |
| `timeout` | `number` | `10000` | Milliseconds to wait for Google before showing the error |

### GoogleTranslateWidget

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `'Change Language'` | Modal title |
| `subtitle` | `string` | `'Select your preferred language for the interface'` | Modal subtitle |
| `searchPlaceholder` | `string` | `'Search languages...'` | Search placeholder (also its accessible label) |

### GoogleTranslateButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttonText` | `string` | `'Translate'` | Button text |
| `buttonClass` | `string` | `undefined` | Additional CSS classes |

### Events

Both components emit:

| Event | Payload | When |
|-------|---------|------|
| `change` | `language: string` | After Google has applied a new language |
| `update:language` | `language: string` | Same, for `v-model:language` (also on load if the page is already translated) |
| `ready` | | Google's script has loaded |
| `error` | `error: Error` | Google couldn't load, or a language change failed |
| `open` / `close` | | The modal or dropdown opened / closed |

`GoogleTranslateButton` also still emits `languageChanged` (deprecated, use `change`; removed in 2.0).

```vue
<GoogleTranslateButton @change="lang => analytics.track('language', { lang })" />
```

### Keyboard

| Key | Widget (search box focused) | Button (list focused) |
|-----|-----------------------------|-----------------------|
| `↓` / `↑` | Move through the results | Open the list / move through it |
| `Home` / `End` | First / last result | First / last language |
| `Enter` | Choose | Choose |
| `Space` | (types a space) | Choose |
| `Esc` | Close, focus back on the button | Close, focus back on the button |
| `Tab` | Stays inside the dialog | Closes the list |

## Composable Options

### useGoogleTranslate(options?)

```typescript
interface UseGoogleTranslateOptions {
  defaultLanguage?: string                              // 'en'
  languages?: MaybeRefOrGetter<Language[] | undefined>   // reactive
  includedLanguages?: MaybeRefOrGetter<string[] | undefined> // reactive
  autoDisplay?: boolean                                 // false
  mode?: 'live' | 'reload'                              // 'live'
  reloadOnRestore?: boolean                             // false
  hideBranding?: boolean                                // true
  scriptSrc?: string
  nonce?: string
  timeout?: number                                      // 10000
}
```

**Returns:**

```typescript
interface UseGoogleTranslateReturn {
  currentLanguage: Ref<string>          // shared by every instance on the page
  isChangingLanguage: Ref<boolean>
  languages: Language[]                 // reactive array
  status: Ref<'idle' | 'loading' | 'ready' | 'error'>
  error: Ref<Error | null>
  isReady: ComputedRef<boolean>
  changeLanguage: (lang: string) => Promise<void>  // rejects if Google can't apply it
  restoreOriginal: () => Promise<void>
  initializeTranslate: () => Promise<void>         // never rejects; check status/error
  getCurrentLanguage: () => string
}
```

See [API.md](./API.md) for details.

## Examples

### Limit Languages

Only show specific languages:

```vue
<template>
  <GoogleTranslateWidget 
    :includedLanguages="['en', 'es', 'fr', 'de', 'zh-CN']" 
  />
</template>
```

### Custom Styling

Override default styles:

```vue
<template>
  <GoogleTranslateButton 
    buttonClass="my-custom-button"
    buttonText="🌍 Language"
  />
</template>

<style>
.my-custom-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}
</style>
```

### Listen to Language Changes

```vue
<script setup>
const handleLanguageChange = (language) => {
  console.log('Language changed to:', language)
  // Send analytics, update user preferences, etc.
}
</script>

<template>
  <GoogleTranslateButton @change="handleLanguageChange" />
</template>
```

### Two-way Binding

```vue
<script setup>
import { ref } from 'vue'
const language = ref('en')
</script>

<template>
  <GoogleTranslateWidget v-model:language="language" />
  <button @click="language = 'fr'">Français</button>
</template>
```

### With Nuxt 3

Create a plugin to register globally:

```javascript
// plugins/google-translate.client.js
import { GoogleTranslateWidget, GoogleTranslateButton } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('GoogleTranslateWidget', GoogleTranslateWidget)
  nuxtApp.vueApp.component('GoogleTranslateButton', GoogleTranslateButton)
})
```

Then use anywhere:

```vue
<template>
  <GoogleTranslateWidget />
</template>
```

## Language Codes

The package includes 100+ languages. Here are some common ones:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `en` | Spanish | `es` |
| French | `fr` | German | `de` |
| Chinese (Simplified) | `zh-CN` | Chinese (Traditional) | `zh-TW` |
| Japanese | `ja` | Korean | `ko` |
| Arabic | `ar` | Russian | `ru` |
| Portuguese | `pt` | Italian | `it` |
| Hindi | `hi` | Turkish | `tr` |

See [API.md](./API.md) for the complete language list.

Google's widget still uses the legacy codes **`iw`** for Hebrew and **`jw`** for Javanese. The built-in list uses
those, and `he` / `jv` are accepted everywhere and converted for you.

## How It Works

This package drives Google's free Website Translator for you:

1. Google's script is loaded once per page into a hidden element (shared by every component).
2. When a user picks a language, the package sets Google's own language selector, and Google translates the page
   **in place**: no reload. The choice is stored in the `googtrans` cookie, so it survives navigation and reloads.
3. Choosing the page's original language clicks Google's own "Show original" button, again without a reload.
4. Elements with `class="notranslate"` or `translate="no"` are left alone (the language names in the UI use this).

**Note:** This translates the entire page content with machine translation. For hand-curated, app-specific
translations, use vue-i18n instead.

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## TypeScript

The package is written in TypeScript and includes full type definitions:

```typescript
import type { 
  Language, 
  UseGoogleTranslateOptions, 
  UseGoogleTranslateReturn 
} from '@ken_de_nigerian/vue-google-translate-widget'
```

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, scripts and the release process.

### Project Structure

```
vue-google-translate-widget/
├── src/
│   ├── components/
│   │   ├── GoogleTranslateButton.vue
│   │   └── GoogleTranslateWidget.vue
│   ├── composables/
│   │   └── useGoogleTranslate.ts
│   └── index.ts
├── tests/                   (Vitest + happy-dom)
├── dist/                    (generated by build)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/ken-de-nigerian/vue-google-translate-widget.git
cd vue-google-translate-widget

# Install dependencies
npm install

# Run the tests, then build the package
npm test
npm run build
```

## Troubleshooting

### TypeScript Errors During Build

If you encounter TypeScript errors when building, ensure you have compatible package versions installed:

```bash
npm install --save-dev vue@^3.4.0 vue-tsc@^2.1.0 typescript@^5.5.0
```

### Windows Permission Issues

On Windows, if you get `EPERM` errors during installation:

1. Close all Node.js processes
2. Delete `node_modules` and `package-lock.json`
3. Run `npm cache clean --force`
4. Reinstall: `npm install`

### Google Translate Branding Still Showing

Branding is hidden automatically unless you set `hideBranding: false`. If Google has changed its markup and
something shows again, inspect it in DevTools, hide it with your own global CSS for now, and please
[open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues).

### "Translation is unavailable right now"

Google's script didn't load within `timeout` ms. Common causes: an ad or privacy blocker, a Content Security Policy
that doesn't allow `translate.google.com` / `translate.googleapis.com` / `translate-pa.googleapis.com`, or a network
that blocks Google. Listen for the `error` event to log the reason.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and check [ROADMAP.md](ROADMAP.md) for
what's already planned. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues privately
as described in [SECURITY.md](SECURITY.md).

## License

MIT © Nwaneri Chukwunyere Kenneth

## Support

- [GitHub Issues](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues)
- [Changelog](CHANGELOG.md)
- [Documentation](https://github.com/ken-de-nigerian/vue-google-translate-widget#readme)
- [API Reference](./API.md)
- [Examples](./EXAMPLES.md)

## Links

- [npm Package](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
- [GitHub Repository](https://github.com/ken-de-nigerian/vue-google-translate-widget)
- [Report Issues](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues)

---

**Built for the Vue community by [Ken De Nigerian](https://github.com/ken-de-nigerian)**
