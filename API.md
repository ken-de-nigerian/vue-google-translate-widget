# API Reference

## Installation

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

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
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

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

<template>
  <div>
    <select 
      :value="currentLanguage" 
      @change="e => handleLanguageSelect(e.target.value)"
      :disabled="isChangingLanguage">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.nativeName }}
      </option>
    </select>
    
    <!-- Required: Hidden Google Translate Element -->
    <div id="google_translate_element" style="display: none"></div>
  </div>
</template>
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
  title?: string                  // Modal title (default: 'Change Language')
  subtitle?: string               // Modal subtitle
  searchPlaceholder?: string      // Search input placeholder
  showFlags?: boolean             // Show country flags (default: true)
}
```

#### Example

```vue
<script setup lang="ts">
import { GoogleTranslateWidget } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateWidget 
    default-language="en"
    :included-languages="['en', 'es', 'fr', 'de', 'it', 'pt']"
    title="Select Language"
    subtitle="Choose your preferred language"
    search-placeholder="Type to search..."
  />
</template>
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
<script setup lang="ts">
import { GoogleTranslateButton } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'

const onLanguageChange = (lang: string) => {
  console.log('Language changed to:', lang)
  // Send analytics, update user preferences, etc.
}
</script>

<template>
  <GoogleTranslateButton 
    button-text="Language"
    :included-languages="['en', 'es', 'fr', 'de']"
    @language-changed="onLanguageChange"
  />
</template>
```

## Types

### `Language`

```typescript
interface Language {
  name: string          // English name (e.g., "Spanish")
  nativeName: string    // Native language name (e.g., "Español")
  code: string          // ISO 639-1 code (e.g., "es")
  flag: string          // Country code for flag (e.g., "es")
}
```

### Example Language Object

```typescript
{
  name: 'Spanish',
  nativeName: 'Español',
  code: 'es',
  flag: 'es'
}
```

## Hiding Google Translate Branding

Google Translate adds branding elements (logo, "Powered by" text, banner) to your page by default. You can hide these by adding global CSS styles to your application.

### How to Hide Branding

Add these styles to your **global CSS file** (e.g., `src/assets/main.css`) or in a `<style>` block in your root component (`App.vue`):

```css
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
```

### ⚠️ Important: Google Styles May Change

**Please note:** Google periodically updates their translate widget, which may change class names and HTML structure. If branding elements reappear after a Google update:

1. **Open DevTools** and inspect the Google Translate elements
2. **Find the current class names** being used
3. **Update your CSS selectors** accordingly
4. **Keep using `!important`** to ensure your styles override Googles defaults

The CSS above is current as of November 2024 but may need adjustment in the future. Feel free to modify these styles to suit your needs.


## Styling

### CSS Classes

The components use scoped CSS with class prefixes:
- `gtw-*` for GoogleTranslateWidget
- `gtb-*` for GoogleTranslateButton

### Custom Styles

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

### Available CSS Classes

#### GoogleTranslateWidget
- `.gtw-float-button` - Floating button
- `.gtw-modal` - Modal container
- `.gtw-modal-header` - Modal header
- `.gtw-modal-title` - Modal title
- `.gtw-search-input` - Search input
- `.gtw-language-item` - Language item
- `.gtw-language-active` - Active language item
- `.gtw-flag` - Flag image

#### GoogleTranslateButton
- `.gtb-button` - Main button
- `.gtb-dropdown` - Dropdown menu
- `.gtb-dropdown-item` - Dropdown item
- `.gtb-dropdown-item-active` - Active dropdown item
- `.gtb-flag` - Flag image

## Advanced Usage

### Custom Language List

```typescript
import { useGoogleTranslate, type Language } from '@ken_de_nigerian/vue-google-translate-widget'

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
import { watch, onMounted } from 'vue'
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

const { currentLanguage, initializeTranslate } = useGoogleTranslate()

watch(currentLanguage, (newLang) => {
  console.log('Language changed to:', newLang)
  // Update your app state, analytics, etc.
})

onMounted(() => {
  initializeTranslate()
})
</script>

<template>
  <div id="google_translate_element" style="display: none"></div>
</template>
```

## Complete Language List

The package supports 100+ languages. Here's the complete list:

| Language | Code | Language | Code |
|----------|------|----------|------|
| Afrikaans | `af` | Albanian | `sq` |
| Amharic | `am` | Arabic | `ar` |
| Armenian | `hy` | Azerbaijani | `az` |
| Basque | `eu` | Belarusian | `be` |
| Bengali | `bn` | Bosnian | `bs` |
| Bulgarian | `bg` | Catalan | `ca` |
| Cebuano | `ceb` | Chinese (Simplified) | `zh-CN` |
| Chinese (Traditional) | `zh-TW` | Corsican | `co` |
| Croatian | `hr` | Czech | `cs` |
| Danish | `da` | Dutch | `nl` |
| English | `en` | Esperanto | `eo` |
| Estonian | `et` | Finnish | `fi` |
| French | `fr` | Frisian | `fy` |
| Galician | `gl` | Georgian | `ka` |
| German | `de` | Greek | `el` |
| Gujarati | `gu` | Haitian Creole | `ht` |
| Hausa | `ha` | Hawaiian | `haw` |
| Hebrew | `he` | Hindi | `hi` |
| Hmong | `hmn` | Hungarian | `hu` |
| Icelandic | `is` | Igbo | `ig` |
| Indonesian | `id` | Irish | `ga` |
| Italian | `it` | Japanese | `ja` |
| Javanese | `jv` | Kannada | `kn` |
| Kazakh | `kk` | Khmer | `km` |
| Kinyarwanda | `rw` | Korean | `ko` |
| Kurdish | `ku` | Kyrgyz | `ky` |
| Lao | `lo` | Latin | `la` |
| Latvian | `lv` | Lithuanian | `lt` |
| Luxembourgish | `lb` | Macedonian | `mk` |
| Malagasy | `mg` | Malay | `ms` |
| Malayalam | `ml` | Maltese | `mt` |
| Maori | `mi` | Marathi | `mr` |
| Mongolian | `mn` | Myanmar (Burmese) | `my` |
| Nepali | `ne` | Norwegian | `no` |
| Nyanja (Chichewa) | `ny` | Odia (Oriya) | `or` |
| Pashto | `ps` | Persian | `fa` |
| Polish | `pl` | Portuguese | `pt` |
| Punjabi | `pa` | Romanian | `ro` |
| Russian | `ru` | Samoan | `sm` |
| Scots Gaelic | `gd` | Serbian | `sr` |
| Sesotho | `st` | Shona | `sn` |
| Sindhi | `sd` | Sinhala | `si` |
| Slovak | `sk` | Slovenian | `sl` |
| Somali | `so` | Spanish | `es` |
| Sundanese | `su` | Swahili | `sw` |
| Swedish | `sv` | Tagalog (Filipino) | `tl` |
| Tajik | `tg` | Tamil | `ta` |
| Tatar | `tt` | Telugu | `te` |
| Thai | `th` | Turkish | `tr` |
| Turkmen | `tk` | Ukrainian | `uk` |
| Urdu | `ur` | Uyghur | `ug` |
| Uzbek | `uz` | Vietnamese | `vi` |
| Welsh | `cy` | Xhosa | `xh` |
| Yiddish | `yi` | Yoruba | `yo` |
| Zulu | `zu` | | |

## Browser Support

- Chrome/Edge: Latest 2 versions ✅
- Firefox: Latest 2 versions ✅
- Safari: Latest 2 versions ✅
- Mobile browsers: iOS Safari 12+, Chrome Mobile ✅

## Important Notes

### Google Translate Script

- The Google Translate script loads asynchronously
- The first load may take a moment
- Subsequent language changes are faster

### Language Persistence

- Language selections are stored in cookies
- The selected language persists across page reloads
- Cookie name: `googtrans`

### Page Reload

- Changing languages triggers a page reload
- This is required by Google Translate's API
- State management should account for this behavior

### Hidden Element Required

When using the composable directly, you must include the hidden Google Translate element:

```html
<div id="google_translate_element" style="display: none"></div>
```

The pre-built components (`GoogleTranslateWidget` and `GoogleTranslateButton`) include this automatically.

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  Language,
  UseGoogleTranslateOptions,
  UseGoogleTranslateReturn
} from '@ken_de_nigerian/vue-google-translate-widget'
```

## Troubleshooting

### Language not changing

1. Ensure the hidden Google Translate element is present
2. Check browser console for errors
3. Verify the language code is valid

### Styling issues

1. Ensure you've imported the CSS: `import '@ken_de_nigerian/vue-google-translate-widget/dist/style.css'`
2. Use `!important` to override default styles if needed
3. Check for CSS conflicts with your global styles

### TypeScript errors

Ensure you have the correct package versions:

```json
{
  "vue": "^3.4.0",
  "typescript": "^5.5.0"
}
```

## Support

- [GitHub Issues](https://github.com/ken_de_nigerian/vue-google-translate-widget/issues)
- [Documentation](https://github.com/ken_de_nigerian/vue-google-translate-widget)
- [npm Package](https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget)