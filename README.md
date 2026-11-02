# Vue Google Translate Widget

[![npm version](https://img.shields.io/npm/v/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![npm downloads](https://img.shields.io/npm/dm/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![Tests](https://github.com/ken-de-nigerian/vue-google-translate-widget/actions/workflows/tests.yml/badge.svg)](https://github.com/ken-de-nigerian/vue-google-translate-widget/actions/workflows/tests.yml)
[![Bundle size](https://img.shields.io/bundlejs/size/@ken_de_nigerian/vue-google-translate-widget?style=flat-square)](https://bundlejs.com/?q=@ken_de_nigerian/vue-google-translate-widget)
[![Types](https://img.shields.io/npm/types/@ken_de_nigerian/vue-google-translate-widget.svg?style=flat-square)](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

A lightweight, customizable Vue 3 component and composable library for integrating Google Translate into your Vue applications. Supports 100+ languages with a clean, ready-made UI.

## Features

- 🌍 **100+ Languages** - Support for all Google Translate languages
- 🎨 **Customizable UI** - Two beautiful components or use the composable to build your own
- 🪝 **Vue 3 Composable** - Full access to translation state and methods
- 💪 **TypeScript** - Fully typed for better developer experience
- 🎯 **Zero Dependencies** - Only requires Vue 3 (flag images load from `flagcdn.com` unless you set `showFlags: false`)
- 📦 **Small Bundle** - About 5 kB of JavaScript and 1.5 kB of CSS (brotli), checked in CI
- 🎭 **SSR-safe** - Google's script only loads in the browser, on mount; use a client-only plugin in Nuxt

> **Roadmap:** full keyboard navigation, built-in dark mode/theming and switching languages without a page reload
> are planned for 1.1–1.2. See [ROADMAP.md](ROADMAP.md).

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
  <div>
    <select 
      :value="currentLanguage" 
      @change="e => changeLanguage(e.target.value)"
      :disabled="isChangingLanguage">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.nativeName }}
      </option>
    </select>
  </div>

  <!-- Hidden Google Translate Element -->
  <div id="google_translate_element" style="display: none"></div>
</template>
```

## Hiding Google Translate Branding

By default, Google Translate adds branding elements (logo, "Powered by Google" text, banner) to your page. You can hide these by adding global CSS styles to your application.

### Adding Global Styles

Add these styles to your **global CSS file** or in a `<style>` tag in your root component (e.g., `App.vue`):

```vue
<style>
/* Hide Google Translate Branding */
.goog-logo-link {
  display: none !important;
}

.goog-te-gadget {
  color: transparent !important;
}

.goog-te-banner-frame.skiptranslate,
.goog-te-banner-frame {
  display: none !important;
}

.VIpgJd-ZVi9od-l4eHX-hSRGPd {
  display: none !important;
}

.goog-te-gadget img {
  display: none !important;
}

body > .skiptranslate,
iframe.skiptranslate {
  display: none !important;
}

body {
  top: 0 !important;
}
</style>
```

### Important Notes About Google Styles

⚠️ **Please note:** Google Translate's CSS class names and HTML structure may change over time as Google updates their service. If the branding starts appearing again after a Google update:

1. **Inspect the elements** using your browser's DevTools to find the current class names
2. **Update the CSS selectors** accordingly
3. **Use `!important`** to ensure your styles override Google's defaults
4. **Test regularly** to ensure branding remains hidden

These styles work as of November 2025 but may need adjustment in the future.

### Alternative: Custom Styling

You can also customize individual Google Translate elements to match your design instead of hiding them completely. Inspect the elements and apply your own styles.

## Component Props

### GoogleTranslateWidget

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultLanguage` | `string` | `'en'` | Default page language |
| `includedLanguages` | `string[]` | `undefined` | Array of language codes to include |
| `languages` | `Language[]` | All languages | Custom language list |
| `title` | `string` | `'Change Language'` | Modal title |
| `subtitle` | `string` | `'Select your preferred language for the interface'` | Modal subtitle |
| `searchPlaceholder` | `string` | `'Search languages...'` | Search input placeholder |
| `showFlags` | `boolean` | `true` | Show country flags |

### GoogleTranslateButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultLanguage` | `string` | `'en'` | Default page language |
| `includedLanguages` | `string[]` | `undefined` | Array of language codes to include |
| `languages` | `Language[]` | All languages | Custom language list |
| `buttonText` | `string` | `'Translate'` | Button text |
| `buttonClass` | `string` | `undefined` | Additional CSS classes |

### Events

#### GoogleTranslateButton

- `languageChanged` - Emitted when language changes
  ```vue
  <GoogleTranslateButton @languageChanged="handleLanguageChange" />
  ```

## Composable Options

### useGoogleTranslate(options?)

```typescript
interface UseGoogleTranslateOptions {
  defaultLanguage?: string
  languages?: Language[]
  includedLanguages?: string[]
  autoDisplay?: boolean
}
```

**Returns:**

```typescript
interface UseGoogleTranslateReturn {
  currentLanguage: Ref<string>
  isChangingLanguage: Ref<boolean>
  languages: Language[]
  changeLanguage: (lang: string) => void
  initializeTranslate: () => void
  getCurrentLanguage: () => string
}
```

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
  <GoogleTranslateButton @languageChanged="handleLanguageChange" />
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

## How It Works

This package uses Google's free translation widget service. When a user selects a language:

1. The page content is sent to Google Translate
2. Google returns the translated content
3. The page is reloaded with the translated text

**Note:** This translates the entire page content, not individual strings. For app-specific translations, consider using vue-i18n instead.

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

If Google Translate branding is still visible after adding the CSS:

1. Make sure the styles are in your **global CSS** file or root component
2. Check that you're using `!important` on the styles
3. Inspect the Google Translate elements in DevTools - Google may have changed their class names
4. Update the CSS selectors to match the current Google Translate markup

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
