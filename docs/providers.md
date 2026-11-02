# Translation Providers

**Who this is for:** anyone who doesn't want to depend on Google's free widget, or wants DeepL quality, or wants no
Google requests at all. **At the end** you'll translate with the provider of your choice, using the same components.

Google's free Website Translator has been closed to new sites since 2019. It still works, but nothing guarantees
it will keep working. A provider removes that dependency.

```ts
import { createGoogleTranslate, endpointProvider } from '@ken_de_nigerian/vue-google-translate-widget'

app.use(
  createGoogleTranslate({
    provider: endpointProvider({ url: '/api/translate' }),
  }),
)
```

Everything else stays the same: components, `changeLanguage`, the cookie, `?lang=`, RTL, events. Google's script is
never loaded.

## Which provider

| Provider | Where the key lives | Notes |
| --- | --- | --- |
| `endpointProvider({ url })` → your server → **DeepL** | your server | Excellent for European languages |
| `endpointProvider({ url })` → your server → **Google Cloud Translation** | your server | Widest language coverage |
| `endpointProvider({ url })` → your server → **Azure AI Translator** | your server | |
| `endpointProvider({ url })` → your server → **LibreTranslate** | your server | Self-hosted, open source |
| `libreTranslate({ url })` directly from the browser | no key, or a public one | Your own LibreTranslate server, no backend code |
| your own object | wherever you like | Implement `TranslationProvider` |

**API keys never go in the browser.** For paid services, the browser calls your endpoint, and your server holds the
key. The handler for that is one line: see [Server Handlers](./server-handlers.md).

## How the provider engine works

1. It walks the page's text nodes, plus the `placeholder`, `title`, `alt` and `aria-label` attributes
   (`translateAttributes` to change), and skips `notranslate` / `translate="no"`, `<code>`, `<pre>`, `<script>`,
   `<style>`, `<textarea>`, `<svg>`, and strings without letters.
2. It sends each **distinct** string once, in batches of 50, and keeps surrounding whitespace intact.
3. It caches the results (in `localStorage` by default, keyed by provider, language pair and text), so returning
   visitors and repeated strings cost nothing.
4. It follows the page: content Vue renders later, and text Vue changes, are translated as they appear.
5. It keeps the originals, so switching language or restoring is instant, with no flash of the source text.
6. If the provider fails, the page is restored to the original, `changeLanguage` rejects, and `error` is set.

```ts
import { createGoogleTranslate, endpointProvider, memoryCache } from '@ken_de_nigerian/vue-google-translate-widget'

createGoogleTranslate({
  provider: endpointProvider({ url: '/api/translate', headers: { 'x-csrf-token': token } }),
  cache: memoryCache(), // don't persist translations
  translateAttributes: ['placeholder', 'title', 'alt', 'aria-label', 'data-tooltip'],
})
```

## LibreTranslate, straight from the browser

```ts
import { libreTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

createGoogleTranslate({ provider: libreTranslate({ url: 'https://translate.example.com' }) })
```

Codes are mapped for you (`iw` → `he`, `zh-CN` → `zh`, …). If your server needs an API key, either restrict that key
to your site or go through your own endpoint with `libreTranslateServer`.

## Your own provider

```ts
import type { TranslationProvider } from '@ken_de_nigerian/vue-google-translate-widget'

const myProvider: TranslationProvider = {
  name: 'my-api', // used in cache keys
  async translate(texts, source, target, signal) {
    const response = await fetch('/my-api', {
      method: 'POST',
      body: JSON.stringify({ texts, source, target }),
      signal,
    })
    return (await response.json()).results // same length and order as `texts`
  },
}
```

Codes passed to `translate` are Google's (`iw`, `zh-CN`, …); map them if your service differs.

## Costs

Paid APIs charge per character. The engine only sends visible, distinct text once per language, and caches it.
On the server, `createTranslateHandler` limits each request (`maxTexts`, `maxCharacters`) and can restrict target
languages (`allowedTargets`). Add your own rate limiting in front of it for public sites.
