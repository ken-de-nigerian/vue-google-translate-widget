# Vue Google Translate Widget

A Vue 3 composable and component library for integrating Google Translate functionality into your Vue applications with a beautiful, customizable UI.

## Features

- 🌍 Support for 100+ languages
- 🎨 Customizable UI components
- 🔍 Language search functionality
- 🍪 Cookie-based language persistence
- 📱 Responsive design
- ⚡ TypeScript support
- 🎯 Easy integration with existing Vue 3 projects

## Installation

```bash
npm install vue-google-translate-widget
# or
yarn add vue-google-translate-widget
# or
pnpm add vue-google-translate-widget
```

## Basic Usage

### 1. Setup the composable in your component

```vue
<script setup lang="ts">
import { useGoogleTranslate } from 'vue-google-translate-widget'

const {
  currentLanguage,
  languages,
  isChangingLanguage,
  changeLanguage,
  initializeTranslate
} = useGoogleTranslate({
  defaultLanguage: 'en',
  includedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-CN']
})

// Initialize on component mount
onMounted(() => {
  initializeTranslate()
})
</script>

<template>
  <div>
    <select v-model="currentLanguage" @change="changeLanguage(currentLanguage)">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.nativeName }}
      </option>
    </select>
  </div>
</template>
```

### 2. Use the pre-built components

```vue
<script setup lang="ts">
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateWidget 
    :default-language="'en'"
    :included-languages="['en', 'es', 'fr', 'de']"
  />
</template>
```

## Advanced Usage

### Custom Language List

```typescript
import { useGoogleTranslate, type Language } from 'vue-google-translate-widget'

const customLanguages: Language[] = [
  { name: 'English', nativeName: 'English', code: 'en', flag: 'gb' },
  { name: 'Spanish', nativeName: 'Español', code: 'es', flag: 'es' },
  { name: 'French', nativeName: 'Français', code: 'fr', flag: 'fr' }
]

const { changeLanguage } = useGoogleTranslate({
  languages: customLanguages
})
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## License

MIT