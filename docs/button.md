# GoogleTranslateButton

**Who this is for:** sites that want the language picker in a navbar or footer. **At the end** you'll know every
prop, slot and event of the button.

A "Translate" button that opens a dropdown listbox.

```vue
<GoogleTranslateButton
  button-text="Language"
  :included-languages="['en', 'fr', 'de']"
  display="both"
  @change="onChange" />
```

## Props

All the shared props listed on [GoogleTranslateWidget](./widget.md#props) (`defaultLanguage`, `includedLanguages`,
`languages`, `language`, `mode`, `reloadOnRestore`, `hideBranding`, `syncDocumentDir`, `scriptSrc`, `nonce`,
`timeout`, `errorText`, `showFlags`, `flagStyle`, `flagUrl`, `pinned`, `rememberRecent`, `theme`, `unstyled`,
`lazy`), plus:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `buttonText` | `string` | `'Translate'` | Also the list's accessible name |
| `buttonClass` | `string` | | Extra classes on the `<button>` |
| `display` | `'native' \| 'english' \| 'both'` | `'native'` | |

## Events

`change`, `update:language`, `ready`, `error`, `open`, `close`: the same as [the Widget's](./widget.md#events).

::: tip Upgrading from 1.x
`languageChanged` was removed in 2.0. Use `change`.
:::

## Slots

| Slot | Props | Replaces |
| --- | --- | --- |
| default | `isOpen`, `currentLanguage`, `current` (the `Language`) | The button's content |
| `item` | `language`, `selected`, `active`, `select()` | An option's content |

Show the current language on the button:

```vue
<GoogleTranslateButton>
  <template #default="{ current }">🌐 {{ current?.nativeName ?? 'Language' }}</template>
</GoogleTranslateButton>
```

## Keyboard and screen readers

**↓ / ↑** on the button opens the list on the current language; **↑ ↓ Home End** move; **Enter** or **Space**
chooses; **Esc** closes and returns focus to the button; **Tab** closes. A click outside closes it, including on
another `GoogleTranslateButton`. While a change is applied the button is `aria-disabled` (not `disabled`), so
keyboard focus isn't lost.
