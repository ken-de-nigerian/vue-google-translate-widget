# API Reference

## Composables

### `useGoogleTranslate(options?)`

The main composable for managing Google Translate functionality.

#### Parameters

```typescript
interface UseGoogleTranslateOptions {
  defaultLanguage?: string        // Default: 'en'
  languages?: Language[]           // Custom language list
  includedLanguages?: string[]     // Language codes to include
  autoDisplay?: boolean            // Default: false
}
```

#### Returns

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

#### Example

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoogleTranslate } from 'vue-google-translate-widget'

const {
  currentLanguage,
  isChangingLanguage,
  languages,
  changeLanguage,
  initializeTranslate
} = useGoogleTranslate({
  defaultLanguage: 'en',
  includedLanguages: ['en', 'es', 'fr', 'de', 'it']
})

onMounted(() => {
  initializeTranslate()
})

const handleLanguageSelect = (langCode: string) => {
  changeLanguage(langCode)
}
</script>
```

## Components

### `GoogleTranslateWidget`

A complete modal-based language selector with search functionality and floating button.

#### Props

```typescript
interface Props {
  defaultLanguage?: string        // Default: 'en'
  includedLanguages?: string[]    // Filter languages
  languages?: Language[]          // Custom language list
  title?: string                  // Modal title
  subtitle?: string               // Modal subtitle
  searchPlaceholder?: string      // Search input placeholder
  showFlags?: boolean             // Show country flags (default: true)
}
```

#### Example

```vue
<template>
  <GoogleTranslateWidget 
    default-language="en"
    :included-languages="['en', 'es', 'fr', 'de', 'it', 'pt']"
    title="Select Language"
    subtitle="Choose your preferred language"
    search-placeholder="Type to search..."
  />
</template>

<script setup lang="ts">
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>
```

### `GoogleTranslateButton`

A simple dropdown button for language selection.

#### Props

```typescript
interface Props {
  defaultLanguage?: string        // Default: 'en'
  includedLanguages?: string[]    // Filter languages
  languages?: Language[]          // Custom language list
  buttonText?: string             // Button label (default: 'Translate')
  buttonClass?: string            // Custom CSS class for button
}
```

#### Events

- `languageChanged(language: string)` - Emitted when language changes

#### Example

```vue
<template>
  <GoogleTranslateButton 
    button-text="Language"
    :included-languages="['en', 'es', 'fr', 'de']"
    @language-changed="onLanguageChange"
  />
</template>

<script setup lang="ts">
import { GoogleTranslateButton } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'

const onLanguageChange = (lang: string) => {
  console.log('Language changed to:', lang)
}
</script>
```

## Types

### `Language`

```typescript
interface Language {
  name: string          // English name
  nativeName: string    // Native language name
  code: string          // ISO 639-1 code
  flag: string          // Country code for flag
}
```

## Styling

### Custom Styles

The components use scoped CSS with class prefixes:
- `gtw-*` for GoogleTranslateWidget
- `gtb-*` for GoogleTranslateButton

You can override styles globally:

```css
/* Override widget button color */
.gtw-float-button {
  background: #10b981 !important;
}

/* Override modal styles */
.gtw-modal {
  border-radius: 1.5rem !important;
}

/* Override dropdown item hover */
.gtb-dropdown-item:hover {
  background: #eff6ff !important;
}
```

### CSS Variables Support

You can also use CSS variables for easier theming:

```css
:root {
  --gtw-primary-color: #3b82f6;
  --gtw-border-color: #e5e7eb;
  --gtw-text-color: #111827;
  --gtw-bg-color: white;
}

.dark-mode {
  --gtw-primary-color: #60a5fa;
  --gtw-border-color: #374151;
  --gtw-text-color: #f9fafb;
  --gtw-bg-color: #1f2937;
}
```

## Advanced Usage

### Custom Language List

```typescript
import { useGoogleTranslate, type Language } from 'vue-google-translate-widget'

const myLanguages: Language[] = [
  { name: 'English', nativeName: 'English', code: 'en', flag: 'gb' },
  { name: 'Spanish', nativeName: 'Español', code: 'es', flag: 'es' },
  { name: 'French', nativeName: 'Français', code: 'fr', flag: 'fr' },
]

const { changeLanguage } = useGoogleTranslate({
  languages: myLanguages
})
```

### Programmatic Language Change

```typescript
const { changeLanguage, currentLanguage } = useGoogleTranslate()

// Change to Spanish
changeLanguage('es')

// Get current language
console.log(currentLanguage.value) // 'es'
```

### Listen for Language Changes

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useGoogleTranslate } from 'vue-google-translate-widget'

const { currentLanguage, initializeTranslate } = useGoogleTranslate()

watch(currentLanguage, (newLang) => {
  console.log('Language changed to:', newLang)
  // Update your app state, analytics, etc.
})

onMounted(() => {
  initializeTranslate()
})
</script>
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## Notes

- Google Translate script loads asynchronously
- Language changes trigger a page reload
- Previous language selection is stored in cookies
- Flags use flagcdn.com CDN