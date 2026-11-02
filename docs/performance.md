# Performance

**Who this is for:** anyone watching Lighthouse scores or bundle size. **At the end** you'll know what the package
costs and how to defer it.

## Bundle size

Measured in CI (minified and brotli-compressed, with tree-shaking, Vue excluded):

| Import | Size |
| --- | --- |
| `GoogleTranslateWidget` | ~11 kB |
| `GoogleTranslateButton` | ~9.6 kB |
| `useGoogleTranslate` only (your own UI) | ~6.6 kB |
| Everything | ~12.5 kB |
| `style.css` | ~2.5 kB |
| `/server` | ~1.5 kB |

## Load Google only when needed

Google's script (and the requests it makes) loads on mount by default. With `lazy`, it loads when the widget is
first opened. A visitor who never opens it never downloads it:

```vue
<GoogleTranslateWidget lazy />
```

If the visitor already chose a language (cookie or `?lang=`), the script loads right away anyway, because the page
has to be translated.

## Flags

Flag images are off by default. `flag-style="emoji"` shows flags with no requests at all.

## Long lists

The full built-in list (110 languages) opens in about 30 ms, two animation frames included, and filters in about one
frame (measured in Chrome). There's no virtualisation, because it isn't needed at this size.

## Provider engine

Translations are cached (in `localStorage` by default), so a returning visitor's page translates without any
requests. Each distinct string is sent once, in batches.
