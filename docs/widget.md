# GoogleTranslateWidget

`GoogleTranslateWidget` is a round button that floats in a corner of the screen. Clicking it opens a dialog with a
search box and the list of languages. It's the right choice when the switcher should be available on every page
without taking space in your layout. If you'd rather put it in your navigation bar, use
[GoogleTranslateButton](button.md).

```vue
<GoogleTranslateWidget :included-languages="['en', 'fr', 'yo', 'ig', 'ha', 'ar']" />
```

This chapter covers what the widget does, how to adjust it, and everything it accepts. If you set options with
[the plugin](plugin.md), you only need props here for what's different about this particular widget.

## What a visitor sees

The button sits in the bottom-left corner, 1rem from each edge (1.5rem on screens 768px and wider). Clicking it opens
a dialog titled "Change Language" with the search box already focused, so a visitor can type "fra" and press Enter.
The list shows each language under its own name with the English name below, and the current language is marked.
Choosing one closes the dialog and translates the page; focus goes back to the button.

While the page is being translated, the chosen language shows a spinner. If Google's script couldn't load, the dialog
says so at the top ("Translation is unavailable right now. Please try again later.") and the `error` event fires.

## Changing where it sits

```vue
<GoogleTranslateWidget position="bottom-right" offset="2rem" />
```

`position` is one of `bottom-left` (the default), `bottom-right`, `top-left` and `top-right`. `offset` takes any CSS
length. You can also set `--gtw-offset` in CSS, which is handy for moving it above a chat bubble on small screens
only.

## Changing the words

The title, subtitle and search placeholder have their own props. Everything else, including the text screen readers
hear, goes in `labels`. Here's the widget for a French-language site:

```vue
<GoogleTranslateWidget
  default-language="fr"
  title="Changer de langue"
  subtitle="Choisissez la langue d'affichage"
  search-placeholder="Rechercher une langue…"
  error-text="La traduction est indisponible pour le moment."
  :labels="{
    open: 'Changer de langue',
    close: 'Fermer',
    noResults: 'Aucune langue trouvée',
    noResultsHint: 'Essayez un autre terme',
    results: count => (count === 1 ? '1 langue' : `${count} langues`),
    suggestion: language => `Afficher cette page en ${language.nativeName} ?`,
    accept: 'Traduire',
    dismiss: 'Non merci',
  }" />
```

Any label you leave out keeps its English default. The defaults are exported as `DEFAULT_WIDGET_LABELS` if you want to
build on them.

## Suggesting the visitor's language {#suggesting-the-visitors-language}

Most visitors never look for a language switcher. With `suggest-browser-language`, a visitor whose browser is set to
a language you offer sees a small prompt next to the button: "View this page in Français?", with "Translate" and "No
thanks".

```vue
<GoogleTranslateWidget suggest-browser-language />
```

The prompt only appears when the page isn't already translated and the visitor's first browser language isn't the
page's own language. It matches regional variants first (a browser set to `pt-PT` is offered Portuguese (Portugal)),
then the base language. "No thanks" is remembered in `localStorage`, so it doesn't come back. The prompt itself is
never machine-translated.

If you'd rather translate straight away on a first visit, without asking, use `autoTranslate` in
[the plugin](plugin.md#translating-automatically-on-the-first-visit).

## Choosing what the list shows

- `display`: `'both'` (the default here) shows "Deutsch" with "German" underneath; `'native'` or `'english'` show
  one.
- `pinned`: codes listed first, in your order.
- `remember-recent`: the visitor's recent choices come next, kept in `localStorage`. `true` keeps three; a number
  keeps that many.
- `show-flags`: flags are off by default, because a language isn't a country. See
  [Languages & Flags](languages.md#flags) for why, and for emoji flags that need no image requests.

## Replacing parts of it

Slots let you replace pieces without losing the dialog's behavior:

| Slot | Gets | Replaces |
| --- | --- | --- |
| `trigger` | `isOpen`, `currentLanguage` | The icon inside the floating button |
| `header` | `close`, `titleId` | The title and subtitle. Put `:id="titleId"` on your heading so the dialog stays labelled for screen readers. |
| `item` | `language`, `selected`, `active`, `select()` | What's inside each option. The option itself keeps its role and keyboard handling. |
| `empty` | `query` | The "no languages found" message |
| `footer` | `close` | Nothing; adds a footer under the list |

For example, a button showing the current language code, and a footer crediting the translation:

```vue
<GoogleTranslateWidget>
  <template #trigger="{ currentLanguage }">
    <strong>{{ currentLanguage.toUpperCase() }}</strong>
  </template>
  <template #footer>
    <small>Machine translation by Google. It may contain mistakes.</small>
  </template>
</GoogleTranslateWidget>
```

For a completely different interface, build your own on [the composable](composable.md).

## Keyboard and screen readers

The widget is built to the WAI-ARIA dialog and listbox patterns, and checked with axe-core in CI:

- The floating button has an accessible name ("Change language") and tells assistive technology it opens a dialog.
- The dialog is modal and labelled by its title. Keyboard focus stays inside it while it's open.
- Typing in the search box filters the list, and the number of matches is announced.
- **↑** and **↓** move through the results, **Home** and **End** jump to the first and last, **Enter** chooses, and
  **Esc** closes the dialog and returns focus to the button.
- The page behind the dialog doesn't scroll while it's open.

[Accessibility](accessibility.md) explains what's tested and what's still your responsibility.

## Props

Props shared with `GoogleTranslateButton`. Any of these can be set app-wide with [the plugin](plugin.md):

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `default-language` | `string` | `'en'` | The language your page is written in |
| `included-languages` | `string[]` | all 110 | Codes to offer. Reactive. |
| `languages` | `Language[]` | the built-in list | Your own list. Reactive. |
| `language` | `string` | | For `v-model:language` |
| `mode` | `'live'` \| `'reload'` | `'live'` | See [Live and Reload Modes](live-vs-reload.md) |
| `reload-on-restore` | `boolean` | `false` | Reload instead of restoring the original in place |
| `hide-branding` | `boolean` | `true` | Hide Google's toolbar, tooltips and highlight |
| `sync-document-dir` | `boolean` | `true` | Set `dir="rtl"` for right-to-left languages |
| `script-src` | `string` | Google's URL | Load Google's script from elsewhere, e.g. a proxy |
| `nonce` | `string` | | Your Content Security Policy nonce |
| `timeout` | `number` | `10000` | Milliseconds to wait for Google before showing the error |
| `lazy` | `boolean` | `false` | Load Google when the switcher is first opened |
| `theme` | `'light'` \| `'dark'` \| `'auto'` | `'auto'` | See [Theming](theming.md) |
| `unstyled` | `boolean` | `false` | Turn off all styles |
| `display` | `'native'` \| `'english'` \| `'both'` | `'both'` | |
| `pinned` | `string[]` | | |
| `remember-recent` | `boolean` \| `number` | `false` | |
| `show-flags` | `boolean` | `false` | |
| `flag-style` | `'image'` \| `'emoji'` | `'image'` | |
| `flag-url` | `(flag: string) => string` | flagcdn.com | Where flag images come from |
| `error-text` | `string` | "Translation is unavailable right now. Please try again later." | |

Widget only:

| Prop | Type | Default |
| --- | --- | --- |
| `title` | `string` | `'Change Language'` |
| `subtitle` | `string` | `'Select your preferred language for the interface'` |
| `search-placeholder` | `string` | `'Search languages...'` (also the search box's accessible label) |
| `position` | `'bottom-left'` \| `'bottom-right'` \| `'top-left'` \| `'top-right'` | `'bottom-left'` |
| `offset` | `string` | `1rem`, `1.5rem` from 768px |
| `suggest-browser-language` | `boolean` | `false` |
| `labels` | `Partial<WidgetLabels>` | `DEFAULT_WIDGET_LABELS` |

## Events

| Event | Payload | When |
| --- | --- | --- |
| `change` | the new language code | After the page has been translated (or restored) |
| `update:language` | the new language code | Same as `change`, for `v-model:language`. Also on load, if the saved language differs from the one you bound. |
| `ready` | | Google's script (or your provider) is ready |
| `error` | `Error` | Loading failed, or a change couldn't be applied |
| `open` / `close` | | The dialog opened or closed |

With `v-model:language`, setting the bound value changes the page's language, and the page's language on load wins
over the initial value you bound:

```vue
<script setup lang="ts">
import { ref } from 'vue'
const language = ref('en')
</script>

<template>
  <GoogleTranslateWidget v-model:language="language" />
  <button @click="language = 'yo'">Yorùbá</button>
</template>
```
