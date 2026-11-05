# API Reference

Every export, for reference. The chapters explain when and why to use each one: [GoogleTranslateWidget](widget.md),
[GoogleTranslateButton](button.md), [Building Your Own Switcher](composable.md), [Configuration](plugin.md),
[Translation Providers](providers.md), [Server Handlers](server-handlers.md), [Testing Your App](testing.md) and
[Nuxt](nuxt.md).

Everything listed here is public API and follows semantic versioning: it only changes incompatibly in a major
release, with a migration path in the [Upgrade Guide](upgrade-guide.md). That includes the CSS class names and the
`--gtw-*` custom properties.

## `@ken_de_nigerian/vue-google-translate-widget`

| Export | Kind | |
| --- | --- | --- |
| `GoogleTranslateWidget` | component | [Widget](widget.md) |
| `GoogleTranslateButton` | component | [Button](button.md) |
| `useGoogleTranslate(options?)` | composable | [Composable](composable.md) |
| `createGoogleTranslate(config?)` | Vue plugin | [Plugin](plugin.md) |
| `GOOGLE_TRANSLATE_CONFIG` | `InjectionKey` | What the plugin provides, for advanced setups |
| `vNoTranslate` | directive | [v-no-translate](directive.md) |
| `endpointProvider({ url, headers?, credentials? })` | provider | Calls your server |
| `libreTranslate({ url, apiKey? })` | provider | Calls a LibreTranslate server |
| `toLibreTranslateCode(code)` | function | Google code → LibreTranslate code |
| `createDomTranslator(options)` | function | The provider engine itself, for use without the composable |
| `memoryCache()`, `localStorageCache(prefix?)` | function | `TranslationCache` implementations |
| `DEFAULT_LANGUAGES` | `Language[]` | The built-in list |
| `LANGUAGE_CODE_ALIASES` | object | `{ he: 'iw', jv: 'jw' }` |
| `toGoogleCode(code)` | function | `'he'` → `'iw'` |
| `flagEmoji(flag)` | function | `'fr'` → `'🇫🇷'`, `''` if none |
| `DEFAULT_WIDGET_LABELS` | `WidgetLabels` | The Widget's English text |

Types: `Language`, `GoogleTranslateConfig`, `UseGoogleTranslateOptions`, `UseGoogleTranslateReturn`,
`TranslateEvent`, `TranslateMode`, `TranslateStatus`, `TranslationProvider`, `EndpointProviderOptions`,
`LibreTranslateOptions`, `TranslationCache`, `DomTranslator`, `DomTranslatorOptions`, `Theme`, `FlagStyle`,
`LanguageDisplay`, `WidgetLabels`.

```ts
interface Language {
  name: string        // "German"
  nativeName: string  // "Deutsch"
  code: string        // Google code: "de", "zh-CN", "iw"
  flag: string        // flagcdn.com code: "de", "gb-wls"; '' for none
}

interface TranslationProvider {
  name: string
  translate(texts: string[], source: string, target: string, signal?: AbortSignal): Promise<string[]>
}

interface TranslateEvent {
  from: string
  to: string
  engine: string           // 'google-widget' or the provider's name
  trigger: 'user' | 'auto'
}

interface WidgetLabels {
  open: string
  close: string
  noResults: string
  noResultsHint: string
  results: (count: number) => string
  suggestion: (language: Language) => string
  accept: string
  dismiss: string
}
```

## `@ken_de_nigerian/vue-google-translate-widget/server`

| Export | |
| --- | --- |
| `createTranslateHandler({ backend, maxTexts?, maxCharacters?, allowedTargets?, onError? })` | `(request: Request) => Promise<Response>` |
| `deepl({ apiKey, url? })` | Backend |
| `googleCloud({ apiKey })` | Backend |
| `azure({ key, region?, url? })` | Backend |
| `libreTranslateServer({ url, apiKey? })` | Backend |
| `toDeepLCode(code, role)`, `toAzureCode(code)`, `toLibreTranslateCode(code)` | Code mapping |

Type: `TranslationBackend { name; translate(texts, source, target): Promise<string[]> }`.

## `@ken_de_nigerian/vue-google-translate-widget/testing`

| Export | |
| --- | --- |
| `installFakeGoogleTranslate({ languages? })` | Replaces Google's widget with an in-memory fake. Returns `{ constructed, restoreClicks, uninstall() }`. |
| `resetGoogleTranslate()` | Resets the package's per-page state between tests |

Types: `FakeGoogleTranslate`, `FakeGoogleTranslateOptions`. See [Testing Your App](testing.md).

## `@ken_de_nigerian/vue-google-translate-widget/nuxt`

The Nuxt module. Config key `googleTranslate`: every serializable `GoogleTranslateConfig` option, plus `css` and
`plugin`. Its options type is exported as `ModuleOptions`. See [Nuxt](nuxt.md).

## `@ken_de_nigerian/vue-google-translate-widget/style.css`

The components' stylesheet.

## CSS classes

**Widget:** `.google-translate-widget` (root, plus `.gtw-theme-light|dark|auto` and `.gtw-styled` unless
`unstyled`), `.gtw-float-button`, `.gtw-pos-*`, `.gtw-suggestion` (`-text`, `-actions`, `-accept`, `-dismiss`),
`.gtw-modal-overlay`, `.gtw-modal`, `.gtw-modal-header`, `.gtw-modal-title`, `.gtw-modal-subtitle`,
`.gtw-close-button`, `.gtw-modal-body`, `.gtw-modal-footer`, `.gtw-error`, `.gtw-search-wrapper`,
`.gtw-search-input`, `.gtw-search-icon`, `.gtw-languages-list`, `.gtw-language-item` (`-active`, `-focused`,
`-disabled`), `.gtw-language-content`, `.gtw-flag-wrapper`, `.gtw-flag` (`-emoji`, `-code`), `.gtw-check-badge`,
`.gtw-loading-badge`, `.gtw-language-info`, `.gtw-language-native`, `.gtw-language-name`, `.gtw-chevron`,
`.gtw-no-results` (`-text`, `-hint`), `.gtw-visually-hidden`.

**Button:** `.gtb-container` (root, plus `.gtw-theme-*` and `.gtb-styled`), `.gtb-button`, `.gtb-chevron`
(`-open`), `.gtb-dropdown`, `.gtb-error`, `.gtb-list`, `.gtb-dropdown-item` (`-active`, `-focused`), `.gtb-flag`
(`-emoji`, `-code`), `.gtb-names`, `.gtb-language-name`, `.gtb-language-english`.
