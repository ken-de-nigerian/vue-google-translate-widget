# GoogleTranslateWidget

**Who this is for:** sites that want a floating language picker. **At the end** you'll know every prop, slot and
event of the widget.

A round button in a corner of the screen. It opens an accessible modal dialog with a search box and the language
list.

```vue
<GoogleTranslateWidget
  :included-languages="['en', 'fr', 'de', 'es', 'yo']"
  :pinned="['fr', 'de']"
  position="bottom-right"
  show-flags
  @change="lang => console.log('Now in', lang)" />
```

## Props

Shared with the Button (and settable app-wide through [the plugin](./plugin.md)):

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `defaultLanguage` | `string` | `'en'` | The language your page is written in |
| `includedLanguages` | `string[]` | all | Codes to offer (reactive) |
| `languages` | `Language[]` | built-in list | Your own list (reactive) |
| `language` | `string` | | For `v-model:language` |
| `mode` | `'live' \| 'reload'` | `'live'` | See [Live vs Reload](./live-vs-reload.md) |
| `reloadOnRestore` | `boolean` | `false` | |
| `hideBranding` | `boolean` | `true` | Hide Google's banner, tooltips and highlight |
| `syncDocumentDir` | `boolean` | `true` | See [Right-to-Left](./rtl.md) |
| `scriptSrc`, `nonce`, `timeout` | | | See [CSP & Privacy](./csp-and-privacy.md) |

UI:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` | `string` | `'Change Language'` | Dialog title |
| `subtitle` | `string` | `'Select your preferred language for the interface'` | |
| `searchPlaceholder` | `string` | `'Search languages...'` | Also the search box's accessible label |
| `errorText` | `string` | `'Translation is unavailable right now…'` | Shown if Google can't load |
| `labels` | `Partial<WidgetLabels>` | English | All other text; see [below](#labels) |
| `showFlags` | `boolean` | `false` | |
| `flagStyle` | `'image' \| 'emoji'` | `'image'` | See [Languages & Flags](./languages.md#flags) |
| `flagUrl` | `(flag) => string` | flagcdn.com | |
| `display` | `'native' \| 'english' \| 'both'` | `'both'` | |
| `pinned` | `string[]` | | Listed first |
| `rememberRecent` | `boolean \| number` | `false` | |
| `suggestBrowserLanguage` | `boolean` | `false` | "View this page in Français?" prompt |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | See [Theming](./theming.md) |
| `unstyled` | `boolean` | `false` | |
| `position` | `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right'` | `'bottom-left'` | |
| `offset` | `string` | `1rem` (`1.5rem` from 768px) | Any CSS length |
| `lazy` | `boolean` | `false` | Load Google on first open; see [Performance](./performance.md) |

## Events

| Event | Payload | When |
| --- | --- | --- |
| `change` | `string` | After a new language has been applied |
| `update:language` | `string` | Same, for `v-model:language`; also on load if the saved language differs |
| `ready` | | The engine has loaded |
| `error` | `Error` | Loading or a change failed |
| `open` / `close` | | The dialog opened / closed |

## Slots

| Slot | Props | Replaces |
| --- | --- | --- |
| `trigger` | `isOpen`, `currentLanguage` | The button's icon |
| `header` | `close`, `titleId` | Title and subtitle. Put `:id="titleId"` on your heading so the dialog stays labelled. |
| `item` | `language`, `selected`, `active`, `select()` | An option's content (the option keeps its role and keyboard support) |
| `empty` | `query` | The "no results" message |
| `footer` | `close` | Adds a footer below the list |

```vue
<GoogleTranslateWidget>
  <template #trigger="{ currentLanguage }">{{ currentLanguage.toUpperCase() }}</template>
  <template #footer>
    <small>Machine translation by Google</small>
  </template>
</GoogleTranslateWidget>
```

## Labels

```vue
<GoogleTranslateWidget
  title="Langue"
  subtitle="Choisissez votre langue"
  search-placeholder="Rechercher…"
  :labels="{
    open: 'Changer de langue',
    close: 'Fermer',
    noResults: 'Aucune langue trouvée',
    results: n => `${n} langues`,
    suggestion: lang => `Afficher cette page en ${lang.nativeName} ?`,
    accept: 'Traduire',
    dismiss: 'Non merci',
  }" />
```

## Browser-language prompt

With `suggest-browser-language`, a visitor whose browser prefers a language you offer sees a small, non-blocking
prompt next to the button: "View this page in Français?" It only appears when the page isn't translated yet and the
visitor's top preference isn't already the page language. "No thanks" is remembered. To translate automatically
instead of asking, use `autoTranslate` on [the plugin](./plugin.md).

## Keyboard and screen readers

The button is labelled and announces its dialog. The dialog is modal and labelled by its title. Focus moves to the
search box; **↑ ↓ Home End** move through the results, **Enter** chooses, **Esc** closes and returns focus to the
button, and **Tab** stays inside the dialog. The number of results is announced as you type. Page scroll is locked
while it's open. Both components are checked with axe-core in CI.
