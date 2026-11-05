# GoogleTranslateButton

`GoogleTranslateButton` is a "Translate" button that opens a dropdown list of languages. It sits wherever you put it,
which makes it the natural choice for a navigation bar or footer. If you'd rather have a switcher that floats over
every page, use [GoogleTranslateWidget](widget.md). Both share one translation of the page, so you can use both at
once.

```vue
<nav>
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/recipes">Recipes</RouterLink>
  <GoogleTranslateButton :included-languages="['en', 'fr', 'yo', 'ig', 'ha', 'ar']" />
</nav>
```

## Showing the current language on the button

A button that just says "Translate" doesn't tell visitors what language they're reading. The default slot replaces
the button's content and receives the current language:

```vue
<GoogleTranslateButton>
  <template #default="{ current }">
    🌐 {{ current?.nativeName ?? 'Language' }}
  </template>
</GoogleTranslateButton>
```

`current` is the full `Language` object (`name`, `nativeName`, `code`, `flag`), or `undefined` if the page is in a
language that isn't in your list. To just change the text, use `button-text`; to add classes to the `<button>`, use
`button-class`.

## Choosing what the list shows

The dropdown shows each language under its own name by default ("Deutsch"), because that's the name a German reader
looks for. `display="both"` adds the English name underneath, and `display="english"` shows only that.

`pinned`, `remember-recent` and `show-flags` work exactly as they do on the widget; see
[GoogleTranslateWidget](widget.md#choosing-what-the-list-shows).

The `item` slot replaces what's inside each option, and gets `language`, `selected`, `active` and `select()`.

## Keyboard and screen readers

- The button tells assistive technology it opens a list, and whether it's open.
- **↓** or **↑** on the button opens the list with the current language highlighted.
- **↑** **↓** **Home** **End** move, **Enter** or **Space** chooses, **Esc** closes the list and returns focus to the
  button, and **Tab** closes it and moves on.
- Clicking anywhere else closes it, including opening another `GoogleTranslateButton` on the same page.
- While the page is being translated, the button is marked `aria-disabled` rather than `disabled`. A `disabled`
  button can't hold focus, so keyboard users would lose their place.

## Props

Every prop shared with the widget (`default-language`, `included-languages`, `languages`, `language`, `mode`,
`reload-on-restore`, `hide-branding`, `sync-document-dir`, `script-src`, `nonce`, `timeout`, `lazy`, `theme`,
`unstyled`, `pinned`, `remember-recent`, `show-flags`, `flag-style`, `flag-url`, `error-text`) is described in
[GoogleTranslateWidget](widget.md#props). The button also has:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `button-text` | `string` | `'Translate'` | Also the list's accessible name |
| `button-class` | `string` | | Extra classes on the `<button>` |
| `display` | `'native'` \| `'english'` \| `'both'` | `'native'` | |

## Events

The same as the widget's: `change`, `update:language`, `ready`, `error`, `open` and `close`. See
[GoogleTranslateWidget](widget.md#events).

::: tip Upgrading from 1.x?
The button's old `languageChanged` event was removed in 2.0. Listen to `change` instead; it has the same payload.
:::
