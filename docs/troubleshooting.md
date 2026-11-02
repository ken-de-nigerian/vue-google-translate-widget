# Troubleshooting

**Who this is for:** anyone whose translation isn't behaving. Each entry: the symptom, the cause, the fix.

### "Translation is unavailable right now" / `status` is `'error'`

Google's script didn't load within `timeout` (10 s). Usually an **ad or privacy blocker**, a **Content Security
Policy** that doesn't allow Google's hosts ([CSP & Privacy](./csp-and-privacy.md)), or a network that blocks Google.
Listen to `@error` to log the exact reason. If this affects many of your visitors, use a [provider](./providers.md).

### `changeLanguage` rejects with "does not support the language code"

Google doesn't know that code. Check the spelling, and note Google uses `iw` (Hebrew), `jw` (Javanese), `zh-CN`,
`zh-TW`. Modern `he` and `jv` are converted for you.

### Some text isn't translated

- It's marked `notranslate` / `translate="no"` (or inside `<code>`, `<pre>`, `<textarea>`).
- It's an image or `<canvas>`: machine translation only reaches text.
- Provider engine: it's in an attribute not listed in `translateAttributes`.
- Google widget: it was added long after load and Google hasn't caught up; it usually does on the next change.

### The page is stuck in a language

A `googtrans` cookie for a parent domain (e.g. `.example.com`) from another app on your domain can force it. Choosing
the original language clears every level. If you set the cookie yourself, set it on one level only.

### The layout is mirrored wrongly in Arabic or Hebrew

The package sets `dir="rtl"`, but CSS written with `left`/`right` doesn't flip. Use logical properties
([Right-to-Left](./rtl.md)).

### Hydration mismatch warnings (Nuxt / SSR)

Use the [Nuxt module](./nuxt.md) (or pass `initialLanguage` from the cookie yourself), so the server renders the
saved language. `v-no-translate` renders only `translate="no"` on the server for the same reason.

### Google's banner or highlight shows up again

Google renamed its classes. Hide the element with your own global CSS for now, and please
[open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues) with a screenshot.

### Two widgets disagree, or the second one's options are ignored

There's one translator per page. Use the same `defaultLanguage` everywhere (a warning is logged otherwise), and
set shared options once with [the plugin](./plugin.md).
