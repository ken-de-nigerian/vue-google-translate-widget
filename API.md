# API Reference

Everything the package exports, as of 1.1.0. For guides and recipes, see the [README](./README.md) and
[EXAMPLES.md](./EXAMPLES.md).

## Installation

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

```ts
import '@ken_de_nigerian/vue-google-translate-widget/style.css' // needed for the components
```

## Exports

| Export | Kind |
|---|---|
| `GoogleTranslateWidget` | Component: floating button + searchable modal |
| `GoogleTranslateButton` | Component: dropdown button |
| `useGoogleTranslate` | Composable |
| `DEFAULT_LANGUAGES` | `Language[]`: the built-in list |
| `LANGUAGE_CODE_ALIASES` | `{ he: 'iw', jv: 'jw' }` |
| `toGoogleCode(code)` | Converts a modern code to the one Google uses |
| `Language`, `TranslateMode`, `TranslateStatus`, `UseGoogleTranslateOptions`, `UseGoogleTranslateReturn` | Types |

## `useGoogleTranslate(options?)`

Translation is page-wide, so the state is too: every call (and every component) shares the same current
language, loading status and error, and Google's script is loaded only once.

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultLanguage` | `string` | `'en'` | The language the page is written in. Use the same value everywhere on a page. |
| `languages` | `MaybeRefOrGetter<Language[] \| undefined>` | `DEFAULT_LANGUAGES` | Languages to offer. Reactive. |
| `includedLanguages` | `MaybeRefOrGetter<string[] \| undefined>` | all | Only offer these codes. Reactive. `he`/`jv` are accepted. |
| `autoDisplay` | `boolean` | `false` | Let Google show its own "translate this page?" prompt |
| `mode` | `'live' \| 'reload'` | `'live'` | `live` translates in place; `reload` writes the cookie and reloads (1.0 behaviour) |
| `reloadOnRestore` | `boolean` | `false` | Reload instead of restoring the original text in place |
| `hideBranding` | `boolean` | `true` | Inject a stylesheet hiding Google's banner, tooltips and highlight, and its 40px body offset |
| `scriptSrc` | `string` | `https://translate.google.com/translate_a/element.js` | Load Google's script from elsewhere |
| `nonce` | `string` | | CSP nonce for the injected `<script>` and `<style>` |
| `timeout` | `number` | `10000` | Milliseconds to wait for Google before `status` becomes `'error'` |

`mode`, `hideBranding`, `scriptSrc`, `nonce`, `timeout`, `autoDisplay` and `defaultLanguage` are read when the
composable is called. The first call that loads Google decides `defaultLanguage` for the page (a different value
later logs a warning).

### Returns

| Property | Type | Description |
|---|---|---|
| `currentLanguage` | `Ref<string>` | Google code the page is shown in (`defaultLanguage` when untranslated) |
| `isChangingLanguage` | `Ref<boolean>` | `true` while a change is being applied |
| `languages` | `Language[]` | Reactive array of the languages to offer |
| `status` | `Ref<'idle' \| 'loading' \| 'ready' \| 'error'>` | Google script status |
| `error` | `Ref<Error \| null>` | Why loading or the last change failed |
| `isReady` | `ComputedRef<boolean>` | `status === 'ready'` |
| `initializeTranslate()` | `() => Promise<void>` | Loads Google and applies a saved language. Never rejects. Call it in `onMounted`. |
| `changeLanguage(lang)` | `(lang: string) => Promise<void>` | Resolves once Google has applied the change. Rejects (and sets `error`) if Google can't load or doesn't support `lang`. Passing `defaultLanguage` restores the original. Ignored while another change is running. |
| `restoreOriginal()` | `() => Promise<void>` | Shows the original text and clears the saved choice |
| `getCurrentLanguage()` | `() => string` | Reads the saved choice from the URL hash or cookie |

### Example

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

const { currentLanguage, languages, status, error, changeLanguage, initializeTranslate } = useGoogleTranslate({
  includedLanguages: ['en', 'fr', 'de', 'yo'],
})

onMounted(initializeTranslate)

async function pick(code: string) {
  try {
    await changeLanguage(code)
  } catch (e) {
    console.warn('Could not translate:', e)
  }
}
</script>

<template>
  <p v-if="status === 'error'">Translation unavailable: {{ error?.message }}</p>
  <button v-for="lang in languages" :key="lang.code" :aria-pressed="currentLanguage === lang.code" @click="pick(lang.code)">
    {{ lang.nativeName }}
  </button>
</template>
```

## Components

Both components take every composable option as a prop (`default-language`, `included-languages`, `languages`,
`mode`, `reload-on-restore`, `hide-branding`, `script-src`, `nonce`, `timeout`), plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `language` | `string` | | Current language, for `v-model:language`. On load, the page's saved language wins and is emitted back. |
| `errorText` | `string` | `'Translation is unavailable right now. Please try again later.'` | Shown in the popup if Google can't load |
| `showFlags` | `boolean` | `true` | Show flags; a language with `flag: ''` shows its code instead |
| `flagUrl` | `(flag: string) => string` | `flag => \`https://flagcdn.com/${flag}.svg\`` | Where flag images come from |

### `GoogleTranslateWidget`

A floating button (bottom-left) that opens a modal dialog with a search box and the language list.

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | `'Change Language'` |
| `subtitle` | `string` | `'Select your preferred language for the interface'` |
| `searchPlaceholder` | `string` | `'Search languages...'` |

Accessibility: the button has `aria-haspopup="dialog"` and `aria-expanded`; the modal is a `role="dialog"` with
`aria-modal`, labelled by its title; the search box is a combobox controlling a listbox via
`aria-activedescendant`; result counts are announced in a polite live region; Tab is trapped in the dialog; Esc
closes it and focus returns to the button; page scroll is locked while open.

### `GoogleTranslateButton`

A button that opens a dropdown listbox.

| Prop | Type | Default |
|---|---|---|
| `buttonText` | `string` | `'Translate'` |
| `buttonClass` | `string` | |

Accessibility: `aria-haspopup="listbox"` and `aria-expanded`; ↓/↑ open the list; ↑ ↓ Home End move; Enter/Space
choose; Esc closes and returns focus; Tab closes. While a change is applied the button is `aria-disabled` (not
`disabled`, so focus isn't lost).

### Events (both components)

| Event | Payload | When |
|---|---|---|
| `change` | `string` | After Google has applied a new language |
| `update:language` | `string` | Same as `change`, for `v-model:language`; also on load if the saved language differs from `language` |
| `ready` | | Google's script loaded |
| `error` | `Error` | Google couldn't load, or a change failed |
| `open` / `close` | | Popup opened / closed |
| `languageChanged` | `string` | **Button only, deprecated**: use `change`. Removed in 2.0. |

## Types

### `Language`

```typescript
interface Language {
  name: string        // English name, e.g. "German"
  nativeName: string  // e.g. "Deutsch"
  code: string        // Google code, e.g. "de", "zh-CN", "iw"
  flag: string        // flagcdn.com code, e.g. "de", "gb-wls"; '' for no flag
}
```

## Language codes

Google's Website Translator uses **`iw`** for Hebrew and **`jw`** for Javanese. The built-in list uses those, and
`he`/`jv` are accepted anywhere a code is (`includedLanguages`, `changeLanguage`, `language`). Every built-in code
is checked in CI against a snapshot of the real widget's language list (captured 2026-11-02; Google offers 248).

Contested flags are avoided: Catalan, Basque and Galician use their regional flags; Esperanto and Kurdish show a
code badge instead of a country flag.

### Built-in languages

| Language | Native name | Code |
|---|---|---|
| Afrikaans | Afrikaans | `af` |
| Albanian | Shqip | `sq` |
| Amharic | አማርኛ | `am` |
| Arabic | العربية | `ar` |
| Armenian | Հայերեն | `hy` |
| Azerbaijani | Azərbaycan | `az` |
| Basque | Euskara | `eu` |
| Belarusian | Беларуская | `be` |
| Bengali | বাংলা | `bn` |
| Bosnian | Bosanski | `bs` |
| Bulgarian | Български | `bg` |
| Catalan | Català | `ca` |
| Cebuano | Cebuano | `ceb` |
| Chinese (Simplified) | 中文 (简体) | `zh-CN` |
| Chinese (Traditional) | 中文 (繁體) | `zh-TW` |
| Corsican | Corsu | `co` |
| Croatian | Hrvatski | `hr` |
| Czech | Čeština | `cs` |
| Danish | Dansk | `da` |
| Dutch | Nederlands | `nl` |
| English | English | `en` |
| Esperanto | Esperanto | `eo` |
| Estonian | Eesti | `et` |
| Finnish | Suomi | `fi` |
| French | Français | `fr` |
| Frisian | Frysk | `fy` |
| Galician | Galego | `gl` |
| Georgian | ქართული | `ka` |
| German | Deutsch | `de` |
| Greek | Ελληνικά | `el` |
| Gujarati | ગુજરાતી | `gu` |
| Haitian Creole | Kreyòl Ayisyen | `ht` |
| Hausa | Hausa | `ha` |
| Hawaiian | ʻŌlelo Hawaiʻi | `haw` |
| Hebrew | עברית | `iw` |
| Hindi | हिन्दी | `hi` |
| Hmong | Hmoob | `hmn` |
| Hungarian | Magyar | `hu` |
| Icelandic | Íslenska | `is` |
| Igbo | Igbo | `ig` |
| Indonesian | Bahasa Indonesia | `id` |
| Irish | Gaeilge | `ga` |
| Italian | Italiano | `it` |
| Japanese | 日本語 | `ja` |
| Javanese | Basa Jawa | `jw` |
| Kannada | ಕನ್ನಡ | `kn` |
| Kazakh | Қазақ | `kk` |
| Khmer | ខ្មែរ | `km` |
| Kinyarwanda | Kinyarwanda | `rw` |
| Korean | 한국어 | `ko` |
| Kurdish (Kurmanji) | Kurdî | `ku` |
| Kyrgyz | Кыргызча | `ky` |
| Lao | ລາວ | `lo` |
| Latin | Latina | `la` |
| Latvian | Latviešu | `lv` |
| Lithuanian | Lietuvių | `lt` |
| Luxembourgish | Lëtzebuergesch | `lb` |
| Macedonian | Македонски | `mk` |
| Malagasy | Malagasy | `mg` |
| Malay | Bahasa Melayu | `ms` |
| Malayalam | മലയാളം | `ml` |
| Maltese | Malti | `mt` |
| Maori | Māori | `mi` |
| Marathi | मराठी | `mr` |
| Mongolian | Монгол | `mn` |
| Myanmar (Burmese) | မြန်မာ | `my` |
| Nepali | नेपाली | `ne` |
| Norwegian | Norsk | `no` |
| Nyanja (Chichewa) | Chichewa | `ny` |
| Odia (Oriya) | ଓଡ଼ିଆ | `or` |
| Pashto | پښتو | `ps` |
| Persian | فارسی | `fa` |
| Polish | Polski | `pl` |
| Portuguese (Brazil) | Português (Brasil) | `pt` |
| Portuguese (Portugal) | Português (Portugal) | `pt-PT` |
| Punjabi | ਪੰਜਾਬੀ | `pa` |
| Romanian | Română | `ro` |
| Russian | Русский | `ru` |
| Samoan | Samoa | `sm` |
| Scots Gaelic | Gàidhlig | `gd` |
| Serbian | Српски | `sr` |
| Sesotho | Sesotho | `st` |
| Shona | Shona | `sn` |
| Sindhi | سنڌي | `sd` |
| Sinhala | සිංහල | `si` |
| Slovak | Slovenčina | `sk` |
| Slovenian | Slovenščina | `sl` |
| Somali | Soomaali | `so` |
| Spanish | Español | `es` |
| Sundanese | Basa Sunda | `su` |
| Swahili | Kiswahili | `sw` |
| Swedish | Svenska | `sv` |
| Tagalog (Filipino) | Tagalog | `tl` |
| Tajik | Тоҷикӣ | `tg` |
| Tamil | தமிழ் | `ta` |
| Tatar | Татар | `tt` |
| Telugu | తెలుగు | `te` |
| Thai | ไทย | `th` |
| Turkish | Türkçe | `tr` |
| Turkmen | Türkmençe | `tk` |
| Ukrainian | Українська | `uk` |
| Urdu | اردو | `ur` |
| Uyghur | ئۇيغۇر | `ug` |
| Uzbek | Oʻzbek | `uz` |
| Vietnamese | Tiếng Việt | `vi` |
| Welsh | Cymraeg | `cy` |
| Xhosa | isiXhosa | `xh` |
| Yiddish | ייִדיש | `yi` |
| Yoruba | Yorùbá | `yo` |
| Zulu | isiZulu | `zu` |


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
- `.gtw-modal-overlay` / `.gtw-modal` - Backdrop / dialog
- `.gtw-modal-header`, `.gtw-modal-title`, `.gtw-modal-subtitle`, `.gtw-close-button`
- `.gtw-error` - Message shown when Google can't load
- `.gtw-search-input` - Search box
- `.gtw-languages-list` - The listbox
- `.gtw-language-item` - An option; `.gtw-language-active` (current language), `.gtw-language-focused` (keyboard
  position), `.gtw-language-disabled` (while changing)
- `.gtw-flag` - Flag image; `.gtw-flag-code` - Code badge for languages without a flag
- `.gtw-language-native`, `.gtw-language-name` - Native and English names
- `.gtw-no-results` - Empty state

#### GoogleTranslateButton
- `.gtb-button` - Main button (`[aria-disabled="true"]` while changing)
- `.gtb-dropdown` - Popup; `.gtb-list` - The listbox inside it
- `.gtb-error` - Message shown when Google can't load
- `.gtb-dropdown-item` - An option; `.gtb-dropdown-item-active` (current), `.gtb-dropdown-item-focused` (keyboard
  position)
- `.gtb-flag` / `.gtb-flag-code` - Flag image / code badge
- `.gtb-language-name` - Native name

## Notes

- **Persistence:** the choice is stored in Google's `googtrans` cookie (and read from a `#googtrans(en|fr)` hash
  if present), so it survives reloads and navigation. Restoring the original clears it on every domain level,
  including the parent-domain copy Google writes.
- **Excluding content:** add `class="notranslate"` or `translate="no"` to anything Google shouldn't translate.
- **One page language:** Google renders only one translator per page, so every component and composable shares
  one. Use the same `defaultLanguage` everywhere.
- **Content Security Policy:** allow scripts from `translate.google.com` and `translate.googleapis.com`, connections
  to `translate-pa.googleapis.com`, and pass `nonce` if you use nonces.

## Browser Support

Current Chrome, Edge, Firefox and Safari, desktop and mobile. Tested on Vue 3.3, 3.4 and 3.5.
