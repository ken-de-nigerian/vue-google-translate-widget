# Architecture

This chapter is for contributors, and for anyone who wants to know how the package is put together before relying on
it. It covers how the code is organized, the decisions that shaped it, and how it's tested.

## How the code is organized

```
src/
  core/                    Plain TypeScript, no Vue
    loader.ts              Loads Google's widget once per page into one hidden host; promise-based, with timeout and retry
    cookies.ts             The googtrans cookie on every domain level, #googtrans hashes, ?lang= parameters
    page.ts                The branding stylesheet, "Show original", waiting for Google, dir="rtl" sync
    domTranslator.ts       The provider engine: walk, de-duplicate, batch, cache, observe, restore
    providers.ts           endpointProvider and libreTranslate
    languages.ts           The built-in language list and the he → iw / jv → jw aliases
    browser.ts             localStorage that never throws, browser-language matching
  composables/
    useGoogleTranslate.ts  Shared state; options > plugin > defaults; the two engines behind one API
  components/              GoogleTranslateWidget, GoogleTranslateButton, LanguageFlag, shared keyboard/focus helpers
  directives/              v-no-translate
  styles/tokens.css        The --gtw-* custom properties and the three themes
  plugin.ts                createGoogleTranslate
  server/                  createTranslateHandler and the DeepL, Google Cloud, Azure and LibreTranslate backends
  testing/                 The fake Google widget and resetGoogleTranslate, for users' tests
  nuxt/                    The Nuxt module and its runtime plugin
```

The build produces one package with several entry points (`.`, `/server`, `/testing`, `/nuxt`, `/style.css`), as
ESM and CommonJS with bundled type declarations. Entry points that share state import the same chunk.

## Decisions

The decisions that shaped the package are recorded as architecture decision records, each with its context, the
alternatives and the consequences:

- [ADR 0001](architecture/adr/0001-one-translator-per-page.md): One translator per page, shared by every component
- [ADR 0002](architecture/adr/0002-drive-googles-default-layout.md): Translate in place by driving Google's hidden language selector
- [ADR 0003](architecture/adr/0003-cookie-is-the-source-of-truth.md): The googtrans cookie is the source of truth
- [ADR 0004](architecture/adr/0004-provider-engine.md): A DOM engine for providers, with API keys kept on the server
- [ADR 0005](architecture/adr/0005-single-package-with-subpath-exports.md): One package with subpath exports, not a monorepo
- [ADR 0006](architecture/adr/0006-no-hreflang-or-path-prefixes.md): No hreflang tags or /fr/ URL prefixes
- [ADR 0007](architecture/adr/0007-flags-off-by-default.md): Flags off by default
- [ADR 0008](architecture/adr/0008-typescript-7-deferred.md): Stay on TypeScript 6 until the tooling supports TypeScript 7

New decisions start from the [template](architecture/adr/0000-template.md).

## How it's tested

Every push and pull request runs all of this in CI, and `npm publish` runs it again before anything is published.

| What | How |
| --- | --- |
| Behaviour | Unit and component tests (Vitest and happy-dom) on Node 20, 22 and 24 and Vue 3.3, 3.4 and 3.5. They run against a fake of Google's widget, modelled on the real widget's behaviour as observed in a browser, and shipped to users as `/testing`. |
| Accessibility | axe-core against both components; keyboard and focus behaviour; WCAG AA contrast of the default colours in all three themes, read from the real stylesheet |
| Server rendering | Components rendered in a Node environment, including concurrent requests in different languages |
| Nuxt | A real Nuxt app (`tests/fixtures/nuxt-app/`) built with the module on Nuxt 3 and 4, and its server output checked |
| The package itself | The tarball npm would publish, installed into an empty project and used as ESM and CommonJS, with strict type checks of every entry point |
| Test strength | Mutation testing with Stryker, weekly: the code is changed in small ways and a test must fail each time. 92.6% of 1,637 mutants are caught (the server handlers 97%); the job fails below 90%. |
| Packaging | publint and Are the Types Wrong? |
| Size | A budget per entry point, measured with tree-shaking |
| Docs | The documentation site builds with no dead links; the language table matches the code; example codes are ones Google supports |
| Google's widget | A scheduled job loads the live widget every week and fails if its language list changes |

Some mistakes were only caught because tests check the real thing rather than the code's idea of it: Hebrew and
Javanese had never worked (caught by checking codes against the live widget), 2.0.0's Nuxt types resolved to `any`
(caught by type-checking the packed tarball), and no test would have noticed if the subdomain-cookie fix regressed
(caught by mutation testing).

## Working on it

- `npm run dev` opens `playground/`, a small app that uses the real Google script. Options can be set in the URL, for
  example `?theme=dark&flagStyle=emoji&position=bottom-right&pinned=fr,de`. It's for trying changes by hand; it
  isn't published.
- `npm run nuxt:dev` runs the Nuxt fixture in development mode, which is the quickest way to spot hydration warnings.
- `npm run docs:dev` runs this documentation site.

[Contributing](contributing.md) lists every script and how releases work.
