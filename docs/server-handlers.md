# Server Handlers

When you translate with DeepL, Google Cloud, Azure or a private LibreTranslate server, the API key has to stay on
your server, so the browser needs a route on your server to call. This chapter gives you that route. If you haven't
read [Translation Providers](providers.md) yet, start there: it explains why the route exists.

```ts
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({
  backend: deepl({ apiKey: process.env.DEEPL_API_KEY! }),
})
```

`handler` is a function that takes a standard `Request` and returns a `Response`, the shape the Fetch API defines. It
runs anywhere that speaks Fetch: Nuxt, Next.js, Hono, Remix, SvelteKit, Cloudflare Workers, Deno and Bun take it
directly, and Express needs three lines of glue. The `/server` entry has no dependency on Vue or the DOM.

## Plugging it into your framework

### Nuxt {#nuxt}

```ts
// server/api/translate.post.ts
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({ backend: deepl({ apiKey: process.env.DEEPL_API_KEY! }) })

export default defineEventHandler(event => handler(toWebRequest(event)))
```

### Next.js (App Router)

```ts
// app/api/translate/route.ts
import { createTranslateHandler, googleCloud } from '@ken_de_nigerian/vue-google-translate-widget/server'

export const POST = createTranslateHandler({
  backend: googleCloud({ apiKey: process.env.GOOGLE_TRANSLATE_API_KEY! }),
})
```

### Hono, Cloudflare Workers, Deno, Bun

```ts
import { azure, createTranslateHandler } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({ backend: azure({ key: env.AZURE_TRANSLATOR_KEY, region: 'westeurope' }) })

app.post('/api/translate', c => handler(c.req.raw)) // Hono
// Workers, Deno and Bun: call handler(request) from your fetch handler.
```

### Express

Express predates the Fetch API, so build a `Request` from Express's request:

```ts
import express from 'express'
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({ backend: deepl({ apiKey: process.env.DEEPL_API_KEY! }) })
const app = express()

app.post('/api/translate', express.json({ limit: '200kb' }), async (req, res) => {
  const response = await handler(
    new Request('http://localhost/api/translate', { method: 'POST', body: JSON.stringify(req.body) }),
  )
  res.status(response.status).type('application/json').send(await response.text())
})
```

### Any other backend

The contract is small enough to implement in any language:

- **Request:** `POST` with a JSON body `{ "texts": string[], "source": string, "target": string }`. Codes are
  Google's (`en`, `fr`, `iw`, `zh-CN`).
- **Response:** `{ "translations": string[] }`, one per input, in the same order.
- **Errors:** any non-2xx status. The browser shows the switcher's error state; the page stays as it was.

For example, a Laravel route using DeepL:

```php
Route::post('/api/translate', function (Request $request) {
    $data = $request->validate([
        'texts' => 'required|array|max:100',
        'texts.*' => 'string',
        'source' => 'required|string',
        'target' => 'required|string',
    ]);

    $response = Http::withHeaders(['Authorization' => 'DeepL-Auth-Key '.config('services.deepl.key')])
        ->post('https://api-free.deepl.com/v2/translate', [
            'text' => $data['texts'],
            'source_lang' => strtoupper(explode('-', $data['source'])[0]),
            'target_lang' => strtoupper($data['target']),
        ])
        ->throw();

    return ['translations' => collect($response['translations'])->pluck('text')];
});
```

This is simplified: DeepL needs regional targets for English and Portuguese (`EN-US`, `PT-BR`), which the
TypeScript `deepl()` backend handles for you via `toDeepLCode()`.

## The backends

```ts
import {
  azure,
  deepl,
  googleCloud,
  libreTranslateServer,
} from '@ken_de_nigerian/vue-google-translate-widget/server'

deepl({ apiKey }) // keys ending in ":fx" use the free API automatically
googleCloud({ apiKey }) // Cloud Translation API v2
azure({ key, region: 'westeurope' }) // Azure AI Translator v3
libreTranslateServer({ url, apiKey }) // your LibreTranslate server, key kept private
```

Each one converts the package's (Google's) language codes into the service's own. DeepL gets `EN-US`, `PT-BR` and
`ZH-HANS` as targets; Azure gets `he` and `zh-Hans`; LibreTranslate gets `he` and `zh`. To use another service,
implement `TranslationBackend`: `{ name, translate(texts, source, target) }`, returning one string per input.

::: info How the backends are tested
Each backend's request (URL, authentication header and body) and its handling of the response are tested against the
service's documented API, with the HTTP calls mocked. They aren't called against the live services in CI, because
that needs paid keys. If something differs for your account, please
[open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues).
:::

## Limits and safety

A translation endpoint is a public route that spends money, so `createTranslateHandler` validates everything before
calling the service:

```ts
createTranslateHandler({
  backend,
  maxTexts: 100, // strings per request
  maxCharacters: 20_000, // characters per request, all strings together: this is what you pay for
  allowedTargets: ['fr', 'yo', 'ig', 'ha', 'ar'], // optional: refuse other languages
  onError: error => logger.error('translation failed', error),
})
```

| Response | When |
| --- | --- |
| `200 { translations }` | Success. An empty `texts` array is answered without calling the service. |
| `400 { error }` | The body isn't JSON, `texts` isn't an array of strings, a code isn't a language code, or the target isn't in `allowedTargets` |
| `405 { error }` | Not a `POST` |
| `413 { error }` | More than `maxTexts` strings or `maxCharacters` characters |
| `502 { error: "Translation failed" }` | The service failed |

When the service fails, the browser only ever sees "Translation failed". The real error goes to `onError`, because
upstream errors can contain quota information or parts of your key.

The handler doesn't rate-limit, because the right limits depend on your traffic and your infrastructure. Put rate
limiting in front of it for any public site; [Security, CSP & Privacy](csp-and-privacy.md#protecting-your-translation-endpoint)
has suggestions.
