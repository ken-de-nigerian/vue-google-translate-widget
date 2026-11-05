# Performance

A language switcher is a small feature, and it shouldn't cost much: not in bundle size, not in requests, and not in
the time it takes the page to become usable. This chapter shows what the package costs, and how to defer most of it
until a visitor actually wants a translation.

## What the package adds to your bundle

Measured on every change in CI, minified and compressed with Brotli, with tree-shaking, and not counting Vue itself:

| You import | Added to your bundle |
| --- | --- |
| `GoogleTranslateWidget` | ~11 kB |
| `GoogleTranslateButton` | ~9.6 kB |
| `useGoogleTranslate` only (your own UI) | ~6.7 kB |
| Everything | ~12.6 kB |
| `style.css` | ~2.5 kB |
| `/server` (on your server, not in the browser) | ~1.4 kB |

Each has a budget, and CI fails if a change goes over it, so these numbers can't creep up unnoticed.

## What Google's widget adds

Google's Website Translator is the bigger cost. When it loads, it fetches a script, a stylesheet and some images
from Google, and makes a translation request when a visitor picks a language. None of that is on your critical path:
the script is loaded asynchronously after your app has mounted, so it doesn't delay your first paint. But it does
use bandwidth and main-thread time that most visitors, who never translate, don't need.

## Loading Google only when it's needed {#lazy-loading}

```vue
<GoogleTranslateWidget lazy />
```

With `lazy`, nothing loads until the visitor first opens the switcher. A visitor who never opens it never downloads
Google's script.

There's one exception, and it's deliberate: if the visitor already chose a language on an earlier visit (the
`googtrans` cookie is set) or arrived through a `?lang=` link, Google's script loads straight away, because the page
has to be translated for them.

The trade-off is a short wait the first time someone opens the switcher, while the script loads. For most sites that's
worth it.

## Flags

Flags are off by default. If you turn them on, `flag-style="emoji"` shows them without any image requests. Image
flags load lazily, one small SVG each, from flagcdn.com or wherever `flag-url` points.

## Long lists

The full built-in list (110 languages) opens in about 30 milliseconds, including two animation frames, and filters
as you type in about one frame, measured in Chrome. The list isn't virtualised because it doesn't need to be at this
size.

## With a provider

The DOM engine described in [Translation Providers](providers.md) adds no scripts from third parties. It only sends
the visible, distinct text on the page, once per language, and caches the result in `localStorage`, so a returning
visitor's pages translate without any requests at all.
