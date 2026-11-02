# Architecture

**Who this is for:** contributors, and anyone curious how it fits together.

```
src/
  core/                    no Vue: usable on its own
    loader.ts              loads Google's widget once per page; one hidden host; promise-based, with timeout/retry
    cookies.ts             googtrans cookie on every domain level, #googtrans hash, ?lang= parameter
    page.ts                branding stylesheet, "Show original", translated-ltr/rtl waits, dir="rtl" sync
    domTranslator.ts       the provider engine: walk, batch, de-duplicate, cache, observe, restore
    providers.ts           endpointProvider, libreTranslate
    languages.ts           the built-in list, he→iw / jv→jw
    browser.ts             safe localStorage, browser-language matching
  composables/
    useGoogleTranslate.ts  shared state, config resolution (options > plugin > defaults), the two engines
  components/              Widget, Button, LanguageFlag, shared UI helpers (keyboard, focus, scroll lock)
  directives/              v-no-translate
  styles/tokens.css        --gtw-* design tokens, themes
  plugin.ts                createGoogleTranslate
  server/                  createTranslateHandler and vendor backends (no Vue, no DOM)
  nuxt/                    module + runtime plugin
```

## Decisions

- **One translator per page.** Google only renders the first `TranslateElement`, so the loader is a singleton and
  state is page-wide (per request on the server).
- **Google's default layout, hidden.** It's the only layout with a `<select>` to drive, which is what makes
  translating in place possible (1.0 used the `SIMPLE` layout, which has none, so it always reloaded).
- **The provider engine marks `<html>` like Google does** (`translated-ltr/rtl`, `lang`), so RTL handling, waits
  and state work the same for both engines.
- **The cookie is the source of truth** for both engines (`googtrans`), so the Nuxt plugin can render the right
  language on the server either way.
- **One package with subpath exports**, not a monorepo: one version, one release, and no extra npm names (see
  [the roadmap](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/ROADMAP.md)).

## Testing

- Unit and component tests (Vitest + happy-dom) run against a **fake Google** (`tests/helpers/fakeGoogle.ts`)
  modelled on the real widget's behaviour, as observed in a browser.
- Accessibility: axe-core on both components.
- SSR: renders in a Node environment, including concurrent-request isolation.
- Nuxt: a real Nuxt app is built with the module, and its server output is checked (`npm run test:nuxt`).
- Google's live language list: checked weekly (`npm run sync:languages`).
- Manual checks against the real Google script: `npm run dev` (the `playground/` app).
