# Server Handlers

**Who this is for:** anyone using DeepL, Google Cloud, Azure or a private LibreTranslate. **At the end** you'll
have an endpoint that keeps your API key on the server.

```ts
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({ backend: deepl({ apiKey: process.env.DEEPL_API_KEY! }) })
// handler: (request: Request) => Promise<Response>
```

The handler is Fetch-standard: it takes a `Request` and returns a `Response`, so it runs anywhere that speaks Fetch.
It pairs with `endpointProvider({ url })` in the browser.

## Backends

```ts
import {
  azure,
  deepl,
  googleCloud,
  libreTranslateServer,
} from '@ken_de_nigerian/vue-google-translate-widget/server'

deepl({ apiKey })                       // free keys (":fx") use api-free.deepl.com automatically
googleCloud({ apiKey })                 // Cloud Translation v2
azure({ key, region: 'westeurope' })    // Azure AI Translator v3
libreTranslateServer({ url, apiKey })   // your LibreTranslate, key kept private
```

Language codes are converted for each service: e.g. DeepL gets `EN-US`/`PT-BR`/`ZH-HANS` as targets, Azure gets
`zh-Hans`/`he`, LibreTranslate gets `he`/`zh`. Write your own backend by implementing
`{ name, translate(texts, source, target) }`.

::: info How these were verified
Each backend's request (URL, auth header, body) and response parsing are tested against the vendor's documented API
format with mocked HTTP. They haven't been run against the live services in CI, because that needs paid keys. If
something differs for your account, please open an issue.
:::

## Options

```ts
createTranslateHandler({
  backend,
  maxTexts: 100,          // strings per request (413 above)
  maxCharacters: 20_000,  // total characters per request (413 above): this is what you pay for
  allowedTargets: ['fr', 'de', 'es'], // optional (400 otherwise)
  onError: error => console.error(error), // log upstream failures
})
```

The browser gets `{ translations: string[] }`, or `{ error }` with status 400 (bad input), 405 (not POST), 413 (too
large) or 502 (the service failed). Upstream error details are **never** sent to the browser, since they can include
key or quota information. They go to `onError`.

## Nuxt {#nuxt}

```ts
// server/api/translate.post.ts
import { createTranslateHandler, deepl } from '@ken_de_nigerian/vue-google-translate-widget/server'

const handler = createTranslateHandler({ backend: deepl({ apiKey: process.env.DEEPL_API_KEY! }) })

export default defineEventHandler(event => handler(toWebRequest(event)))
```

## Next.js (App Router)

```ts
// app/api/translate/route.ts
import { createTranslateHandler, googleCloud } from '@ken_de_nigerian/vue-google-translate-widget/server'

export const POST = createTranslateHandler({ backend: googleCloud({ apiKey: process.env.GOOGLE_API_KEY! }) })
```

## Hono, Cloudflare Workers, Deno, Bun

```ts
const handler = createTranslateHandler({ backend: azure({ key: env.AZURE_KEY, region: 'westeurope' }) })

app.post('/api/translate', c => handler(c.req.raw)) // Hono
// Workers / Deno / Bun: call handler(request) in your fetch handler
```

## Express

Express predates Fetch, so convert the request:

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

## Laravel (or any other backend)

The contract is small, so any backend can implement it: accept `POST { texts: string[], source, target }` and return
`{ translations: string[] }` in the same order. A simplified example with DeepL (it uppercases codes; DeepL wants
regional targets for English and Portuguese, `EN-US`/`PT-BR`, which `toDeepLCode` in the TypeScript backend
handles):

```php
Route::post('/api/translate', function (Request $request) {
    $data = $request->validate([
        'texts' => 'required|array|max:100', 'texts.*' => 'string',
        'source' => 'required|string', 'target' => 'required|string',
    ]);
    $response = Http::withHeaders(['Authorization' => 'DeepL-Auth-Key '.config('services.deepl.key')])
        ->post('https://api-free.deepl.com/v2/translate', [
            'text' => $data['texts'],
            'source_lang' => strtoupper(explode('-', $data['source'])[0]),
            'target_lang' => strtoupper($data['target']),
        ])->throw();
    return ['translations' => collect($response['translations'])->pluck('text')];
});
```
