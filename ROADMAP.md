# Vue Google Translate Widget: Fix, Polish & v2 Roadmap

Status: Phase 0 implemented (not yet released). Plan written 2026-11-02 against `v1.0.1` (commit `f44c68f`).

The goal is to take the package from "works on my site" to something people can trust and recommend over the
alternatives (`@google-translate-select/vue3` ~3.2k downloads/month, `vue-gtranslate` ~850/month; we are at 26). We
get there in four releases:

| Release | Theme | Outcome |
| --- | --- | --- |
| **1.0.2** | Foundations | Correct links, tests, CI, honest docs. No behaviour change. |
| **1.1.0** | Bug fixes | Every known bug fixed and covered by a test. Live switching (no reload). |
| **1.2.0** | Polish | Accessibility, theming, dark mode, slots, RTL, events, `v-model`. |
| **2.0.0** | Platform | Framework-agnostic core, Nuxt module, pluggable translation providers. |

Alongside these, the documentation is rebuilt to the same standard as PayZephyr (see [Documentation & links](#documentation--links-the-payzephyr-standard)).

---

## Phase 0: Foundations (`1.0.2`) ✅ done, unreleased

Nothing user-visible changes here. This phase exists so every later fix lands with a test and a green CI badge.

### 0.1 Fix package metadata

`package.json` points at `github.com/ken_de_nigerian/...`, which is a 404 (GitHub usernames cannot contain
underscores). The repo actually lives at `github.com/ken-de-nigerian/vue-google-translate-widget`.

- [x] `repository.url` → `git+https://github.com/ken-de-nigerian/vue-google-translate-widget.git`
- [x] `bugs.url` → `https://github.com/ken-de-nigerian/vue-google-translate-widget/issues`
- [ ] `homepage` → the docs site once live (Phase D); GitHub README until then
- [x] `author` → object form with `email` and `url` (`https://github.com/ken-de-nigerian`), matching PayZephyr's composer.json
- [ ] `funding` (GitHub Sponsors) if wanted
- ~~`engines.node`~~ dropped: this is browser code, so `engines` would only cause install warnings
- [x] `keywords`: add `nuxt`, `language-switcher`, `website-translator`, `multilingual`, `localization`, `rtl`
- [x] `files`: add `LICENSE`, `CHANGELOG.md`
- [x] `sideEffects: ["**/*.css"]` so bundlers tree-shake the JS but keep the stylesheet

### 0.2 Fix the `exports` map

- [x] Put `types` **first** in each condition (TypeScript resolves conditions in order; `types` after `import` is ignored by some resolvers).
- [x] Add a `./style.css` export alias so users can write `import '@ken_de_nigerian/vue-google-translate-widget/style.css'` (keep `./dist/style.css` for back-compat).
- [x] Ship a separate `.d.cts` for the `require` condition (`scripts/copy-cts-types.mjs`)
- [x] Validate with `publint` and `@arethetypeswrong/cli` in CI.

### 0.3 Tooling

- [x] **Vitest** + `@vue/test-utils` + `happy-dom`, with a `tests/` folder and coverage (`@vitest/coverage-v8`)
- [x] **ESLint** (`@vue/eslint-config-typescript`) + **Prettier**
- [x] `vue-tsc --noEmit` typecheck script
- [x] **size-limit** with a budget (target: core < 3 kB gzip, components < 8 kB gzip)
- [ ] `playground/` Vite app for manual testing against the real Google script (moved to Phase 1, needed to verify B3)
- [x] Scripts: `lint`, `typecheck`, `test`, `test:coverage`, `build`, `check:publish` (publint + attw), `size`
- [x] `prepublishOnly` → `npm run lint && npm run typecheck && npm test && npm run build`

### 0.4 CI/CD (mirrors PayZephyr's `.github/workflows`)

`tests.yml`: on push/PR to `main` and `develop`, with `concurrency` cancel-in-progress and actions pinned by SHA:
- Job `quality`: lint, typecheck, publint, attw
- Job `test`: matrix Node 20 / 22 / 24 × Vue 3.3 / 3.4 / 3.5; upload coverage (Node 18 dropped: EOL, and happy-dom needs ≥ 20)
- Size budget runs in the `quality` job (PR comment bot not added yet)

`release.yml`: on tag `v*`:
- Build, test, `npm publish --provenance --access public` (npm provenance badge on the package page)
- `softprops/action-gh-release` with generated notes, same as PayZephyr

Also: Dependabot (npm + actions), issue templates (bug / feature), PR template, `CODEOWNERS`. ✅

**Before the first tagged release:** add an `NPM_TOKEN` secret to the repo (or configure npm trusted publishing).

### 0.5 Make the docs honest

The current docs claim things the code does not do. Until the features ship, the claims come out:

- [x] README "keyboard navigation": remove until 1.2.0
- [x] README "SSR Ready": softened to "SSR-safe" (Google's script only loads in the browser) until the Nuxt module exists
- [x] CHANGELOG: the `rc` entries (never published to npm, claimed dark mode and theming) removed
- [x] CHANGELOG: add the missing `1.0.1` entry; adopt [Keep a Changelog](https://keepachangelog.com) + SemVer headings
- [x] README "Zero Dependencies" is true, but note that flags load from `flagcdn.com` at runtime (fixed in 1.2.0)

---

## Phase 1: Bug fixes (`1.1.0`)

Each bug: what's wrong, where, the fix, and the test that proves it. **Every fix ships with a regression test.**

### Architecture change that unlocks most fixes

Today each component calls `useGoogleTranslate()` independently. Each one writes its own
`<div id="google_translate_element">` and overwrites `window.googleTranslateElementInit`. Bugs B2, B7, B8 and part of
B3 all come from that. The fix is a single **shared module-level loader**:

```
src/core/
  loader.ts      ← singleton: injects script once, owns the hidden host element, returns a Promise<TranslateApi>
  cookies.ts     ← read / write / clear googtrans across all domain variants
  state.ts       ← one shared reactive store (currentLanguage, status, error)
  languages.ts   ← DEFAULT_LANGUAGES + helpers (moved out of the composable)
src/composables/useGoogleTranslate.ts  ← thin wrapper over core/state + core/loader
```

All instances share one script, one host element and one state. The first caller's config wins; a conflicting config
logs a dev-only warning.

### Bug list

| # | Severity | Bug | Location |
| --- | --- | --- | --- |
| B1 | High | Click-outside listener never removed (memory leak) | `GoogleTranslateButton.vue:51-63` |
| B2 | High | Duplicate `id="google_translate_element"`; second instance's options silently ignored | both components, composable `loadGoogleTranslateScript` |
| B3 | High | Full page reload on every language change | composable `changeLanguage` |
| B4 | High | Restoring the original language fails on subdomains (parent-domain cookie not cleared) | composable `changeLanguage` |
| B5 | Medium | Options/props aren't reactive; `languages` is a static array | composable, both components |
| B6 | Medium | `currentLanguage` initialises to hard-coded `'en'`, not `defaultLanguage` | composable |
| B7 | Medium | No ready/error state; blocked script (ad-blocker, CSP, region) fails silently | composable `loadGoogleTranslateScript` |
| B8 | Medium | `setInterval` polling (100 ms × 5 s), not cleaned up on unmount | composable `initializeTranslate` |
| B9 | Medium | Language codes may not match Google's widget (`he`/`iw`, `jv`/`jw`) | `DEFAULT_LANGUAGES` |
| B10 | Medium | `languageChanged` emitted before the change happens; Widget emits nothing at all | `GoogleTranslateButton.vue:39`, Widget |
| B11 | Medium | Accessibility: items are `<div @click>`; no keyboard, focus trap, Esc, roles | both components |
| B12 | Low | `aria-expanded` on the float button is always `false` (button is `v-if="!isOpen"`) | `GoogleTranslateWidget.vue:77-82` |
| B13 | Low | Protocol-relative script URL `//translate.google.com/...` | composable |
| B14 | Low | Google's banner shifts `<body>` down (`top: 40px`); no built-in fix | n/a |
| B15 | Low | Background scrolls while the modal is open | Widget |
| B16 | Low | Wrong or contested flags (Catalan/Basque/Galician → 🇪🇸, Esperanto → 🇪🇺, Kurdish → 🇮🇶) and third-party image requests | both components |
| B17 | Low | Opening one `GoogleTranslateButton` doesn't close another on the same page | Button |

#### B1: listener leak
- **Cause:** `onMounted(() => { …; return () => removeEventListener(…) })`. Vue ignores the return value of `onMounted`.
- **Fix:** register in `onMounted` and remove in `onBeforeUnmount`; better, use a template ref with a `contains()` check instead of `closest('.gtb-container')`, which also fixes B17.
- **Test:** mount → unmount → dispatch a document click → handler not called (spy on `removeEventListener`).

#### B2: duplicate host element and global callback
- **Fix:** `core/loader.ts` creates one host `<div>` appended to `document.body` with a unique id and installs a single
  `googleTranslateElementInit` that resolves a shared promise. Components no longer render the host div.
- **Test:** mount Widget + Button together → exactly one `<script>`, one host element, and the `TranslateElement` constructor called once.

#### B3: page reload on every change
- **Cause:** `changeLanguage` always ends in `location.reload()`.
- **Fix:** add `mode: 'live' | 'reload'` (default `'live'`). In live mode: set the cookie, set `.goog-te-combo` value,
  dispatch `change`, wait for `<html class="translated-ltr|translated-rtl">` via `MutationObserver`, then resolve.
  Going back to the original language is the one case Google can't undo cleanly in place: there we try the widget's
  restore path, and fall back to reload behind `reloadOnRestore` (default `true`).
- `changeLanguage` returns a `Promise<void>` so callers can `await` it.
- **Test:** live mode → no `location.reload` call; `currentLanguage` updates; `isChangingLanguage` resets to `false`.

#### B4: cookie not cleared on parent domains
- **Cause:** Google writes `googtrans` on `.example.com`; we only clear `path=/` and the exact hostname.
- **Fix:** `core/cookies.ts#clearGoogtrans()` expires the cookie for: no domain, `hostname`, `.hostname`, and every
  parent suffix (`.example.com` for `a.b.example.com`), stopping before the public suffix. Same list when writing.
- **Test:** table-driven over `localhost`, `example.com`, `www.example.com`, `a.b.example.co.uk`.

#### B5: non-reactive options
- **Fix:** accept `MaybeRefOrGetter` for `includedLanguages`, `languages` and `defaultLanguage`; expose `languages` as a
  `ComputedRef`. Components pass getters (`() => props.includedLanguages`).
- **Test:** change the prop after mount → rendered list updates.

#### B6: wrong initial language
- **Fix:** `ref(defaultLanguage)`, and read the cookie/hash synchronously when `window` exists (SSR-guarded).
- **Test:** `defaultLanguage: 'fr'` with no cookie → `currentLanguage === 'fr'` before `initializeTranslate`.

#### B7: no ready/error state
- **Fix:** expose `status: Ref<'idle' | 'loading' | 'ready' | 'error'>` and `error: Ref<Error | null>`; handle
  `script.onerror` plus a configurable `timeout` (default 10 s). Components show a small "Translation unavailable"
  state and emit `error`.
- **Test:** simulate `onerror` → status `'error'`, `error` emitted.

#### B8: polling interval
- **Fix:** replace `setInterval` with the loader promise plus a `MutationObserver` for `.goog-te-combo`;
  disconnect on unmount and on timeout.
- **Test:** fake timers → no timers left after unmount.

#### B9: language codes
- **Fix:** write a script (`scripts/sync-languages.ts`) that loads the real widget in Playwright, reads the
  `.goog-te-combo` `<option>` values, and diffs them against `DEFAULT_LANGUAGES`. The legacy widget is known to use
  `iw` (Hebrew) and `jw` (Javanese); confirm and alias them, so users can pass either code.
- Run the script in a scheduled CI job (weekly) so we notice when Google changes the list.
- **Test:** unit test for the alias map; snapshot of the default list.

#### B10: events
- **Fix:** emit `change` **after** the change succeeds (await the promise); add `ready`, `error`, `open` and `close`
  to both components; support `v-model:language`. Keep `languageChanged` as a deprecated alias until 2.0.
- **Test:** emitted order and payloads.

#### B11 + B12: accessibility
- Widget: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title); focus trap; Esc closes; focus returns to the trigger.
- List: `role="listbox"` + `role="option"` + `aria-selected`; Arrow Up/Down, Home/End, Enter/Space, type-ahead; `aria-activedescendant`.
- Search input gets a real `<label>` (visually hidden) and `aria-controls` the listbox; results count announced via `aria-live`.
- Button: `aria-haspopup="listbox"`, `aria-expanded` bound to the real state.
- Respect `prefers-reduced-motion`.
- **Test:** `vitest-axe` on both components; keyboard interaction tests.

#### B13: script URL
- **Fix:** always `https://`; add a `scriptSrc` option (for proxies) and a `nonce` option for strict CSP.

#### B14: banner offset
- **Fix:** `hideBranding` option (default `true`) injects one small stylesheet: hides the banner iframe, tooltip and
  highlight, and resets `body { top: 0 !important }`. This replaces the copy-paste CSS in the README.
  It's documented as best-effort, because Google can change its class names.

#### B15: scroll lock
- **Fix:** lock `document.body` overflow while the modal is open, compensating for the scrollbar width; restore on close/unmount.

#### B16: flags
- **Fix:** add a `flag` option: `'none' | 'emoji' | 'image' | (lang) => string`. Default to **no flags + native name**
  (the i18n best practice). For `'image'`, ship a tree-shakeable set of local SVGs instead of hot-linking `flagcdn.com`.
  Fix the contested mappings, and let `flag: null` per language.

---

## Phase 2: Polish (`1.2.0`)

- **Theming with CSS custom properties.** `--gtw-color-primary`, `--gtw-color-bg`, `--gtw-color-text`, `--gtw-radius`,
  `--gtw-font`, `--gtw-z-index`, and so on, documented in a table. Replace every hard-coded colour.
- **Dark mode.** `theme: 'light' | 'dark' | 'auto'` (default `'auto'`, follows `prefers-color-scheme`), and respects a `.dark` class on `<html>`.
- **Unstyled mode.** `unstyled` prop for Tailwind/UnoCSS users; every element keeps a stable `gtw-*` class.
- **Slots.** `trigger`, `header`, `item`, `empty`, `footer`; scoped slot props expose `language`, `active` and `select()`.
- **Floating button position.** `position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'` and `offset`.
- **RTL.** When translating to `ar`, `he`/`iw`, `fa`, `ur`, `yi`, `sd`, `ps`, `ug`, set `dir="rtl"` and `lang` on
  `<html>` (Google sets the class but not `dir`). `syncDocumentDir` option, default `true`.
- **Labels.** Every string (title, subtitle, placeholder, "No languages found", aria labels) becomes a prop, grouped under one `labels` object.
- **Language display.** `display: 'native' | 'english' | 'both'`; `pinned: string[]` (shown first); "recently used" (localStorage, opt-in).
- **Browser language suggestion.** `suggestBrowserLanguage` shows a non-blocking prompt ("View this page in Français?") based on `navigator.languages`.
- **`v-no-translate` directive.** Adds `translate="no"` + `class="notranslate"`, so brand names and code blocks stay untranslated.
- **Performance.** `lazy: true` loads Google's script only on first open, not on mount (a big Lighthouse win).
  Virtualise the list when there are more than 60 items.

---

## Phase 3: v2.0.0 (platform)

v2 is a breaking release. Every break gets a written migration path in `docs/upgrade-guide.md`, the way PayZephyr does it.

### 3.1 Package layout (monorepo, pnpm workspaces)

```
packages/
  core/          @ken_de_nigerian/translate-core     framework-agnostic: loader, cookies, state, providers, languages
  vue/           @ken_de_nigerian/vue-google-translate-widget   (this package, now a thin layer over core)
  nuxt/          @ken_de_nigerian/nuxt-google-translate
docs/            VitePress site (see below)
playground/
```

Later candidates, once core is stable: `react`, `svelte`, and a `<translate-widget>` web component for plain-HTML sites.

### 3.2 Plugin API

```ts
app.use(GoogleTranslate, {
  pageLanguage: 'en',
  languages: ['fr', 'de', 'yo', 'ig', 'ha'],
  mode: 'live',
  provider: googleWidget(),       // default
})
```

Components and `useGoogleTranslate()` read the shared config through `provide/inject`; per-component props override it.

### 3.3 Nuxt module

- `modules: ['@ken_de_nigerian/nuxt-google-translate']` with `googleTranslate: { … }` in `nuxt.config`
- Auto-imports components and the composable; client-only plugin; no hydration mismatch (reads the `googtrans` cookie server-side via `useCookie` so the SSR markup is already correct)
- Optional `?lang=fr` / `/fr/` URL strategy, plus `<link rel="alternate" hreflang>` generation

### 3.4 Pluggable translation providers (the differentiator)

Google's free Website Translator has been closed to new sign-ups since 2019. It still works, but nothing guarantees it
will keep working, and that risk applies to every package in this space. We remove it by making the engine pluggable:

| Provider | Type | Notes |
| --- | --- | --- |
| `googleWidget()` | free, client-side | current behaviour, default |
| `googleCloud({ endpoint })` | paid API | key stays on the user's server, via a proxy endpoint |
| `deepl({ endpoint })` | paid API | best quality for European languages |
| `azure({ endpoint })` | paid API | |
| `libreTranslate({ url })` | self-hosted, free | privacy-friendly, no Google |
| custom | `TranslationProvider` interface | `translate(texts: string[], from, to): Promise<string[]>` |

API providers need our own **DOM translation engine** (in `core`):
- TreeWalker over text nodes plus a configurable attribute list (`placeholder`, `title`, `alt`, `aria-label`); respects `translate="no"` / `.notranslate`
- Batches requests, de-duplicates strings, caches in memory + IndexedDB (keyed by provider/lang/hash), and restores the original instantly
- `MutationObserver` to translate content Vue renders later (route changes, `v-if`)
- **API keys never go in the browser.** Providers call a user-owned endpoint; we ship copy-paste server handlers (Nuxt server route, Express, Laravel) in the docs.

### 3.5 Other v2 items

- `onTranslate` analytics hook (send to GA4 / Plausible / PostHog), and a docs recipe
- Optional auto-translate on first visit from the browser language (off by default)
- Drop the UMD/CJS build if download data shows nobody uses it; ESM-only with a CDN build via `unpkg`/`jsdelivr`
- Vue `>=3.3` only (already true); test against Vue 3.6 / Vapor when stable

### Breaking changes to batch into 2.0

- Remove the deprecated `languageChanged` event (→ `change`)
- `changeLanguage` is async (already returning a Promise from 1.1 onwards, so mostly non-breaking)
- Flags default to `'none'`
- Style import path becomes `/style.css` only

---

## Documentation & links: the PayZephyr standard

PayZephyr is the model: a README that explains *why* before *how*, a numbered `docs/` folder with an `INDEX.md`, CI
and Packagist badges, generated sections kept in sync with the code, and a dedicated docs site (payzephyr.dev) that
renders those same Markdown files, so they are never copied.

### D1. README rewrite (structure)

1. Title + badges: npm version, npm downloads, CI tests, bundle size (bundlejs/pkg-size), types included, license, (Vue 3 / Nuxt)
2. One-line pitch + GIF/screenshot of the widget switching languages live
3. **What is it?** The problem (Google's raw widget is ugly, reloads, leaks branding, has no Vue state) and what we do about it
4. **Is this for you?** Good fit / not a fit (e.g. "if you need hand-curated translations, use vue-i18n; this is machine translation")
5. **How it fits together:** Mermaid diagram (component → composable → core loader → Google script → cookie)
6. **Quick Start:** install → import → render, done in 60 seconds
7. **Documentation:** grouped, numbered links into `docs/` (same pattern as PayZephyr)
8. Comparison table vs. alternatives (honest, factual)
9. Changelog / License / Support / "Built by Ken De Nigerian" footer
10. Generated block `<!-- generated:language-count:start -->` kept in sync by a script, like PayZephyr's provider list

### D2. `docs/` folder (replaces `API.md` + `EXAMPLES.md`)

```
docs/
  INDEX.md
  Getting started:   installation.md · quick-start.md · nuxt.md · how-it-works.md
  Components:        widget.md · button.md · composable.md · directive.md
  Customising:       theming.md · dark-mode.md · slots.md · labels-and-i18n.md · flags.md · languages.md
  Behaviour:         live-vs-reload.md · branding.md · rtl.md · ssr.md · events.md
  Going further:     providers.md · custom-provider.md · server-proxies.md · analytics.md · headless.md
  Shipping it:       performance.md · csp.md · privacy-and-gdpr.md · production-checklist.md
  When it breaks:    troubleshooting.md · faq.md
  Reference:         api-reference.md · architecture.md · contributing.md · upgrade-guide.md · CHANGELOG.md
```

Rules (taken from PayZephyr): every chapter opens by saying who it's for and what you'll have at the end; every code
sample is copy-paste runnable; every option in `api-reference.md` lists its type, default and the version it was added in.

### D3. Docs site

Recommended: **VitePress** inside the repo (`/docs`), the natural fit for a Vue library. It reads the same `docs/*.md`
files, has built-in search, and supports **live Vue demos embedded in the docs** (the widget actually working on the page), which
PayZephyr's playground does for payments.

- Pages: Home (hero + live demo), Guide (the `docs/` chapters), API, Playground (props editor → live widget +
  generated code), Changelog, Comparison
- Deploy: GitHub Pages or Vercel from `release.yml`; custom domain to be decided (e.g. a `.dev` domain alongside payzephyr.dev)
- StackBlitz starter templates (Vue + Vite, Nuxt) linked from the README and every chapter
- Open Graph images, sitemap, `llms.txt` for AI assistants

### D4. Repo community files

`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue/PR templates, GitHub repo description + topics +
website link, a pinned "Roadmap" discussion, and labels (`good first issue`, `provider`, `a11y`).

### D5. Launch checklist (after 1.1.0 ships)

- [ ] dev.to / Hashnode post: "Google Translate in Vue without page reloads"
- [ ] Submit to Vue Land showcase, `awesome-vue`, `nuxt.com/modules` (after the Nuxt module ships)
- [ ] Post in r/vuejs, the Vue Discord and the Nuxt Discord
- [ ] Show the comparison table on the docs home

---

## Definition of done (per release)

- [ ] CI green on all matrix cells; coverage ≥ 90 % on `core`, ≥ 80 % overall
- [ ] `publint` and `attw` clean; size-limit within budget
- [ ] `vitest-axe` reports zero violations
- [ ] Manually verified in the playground against the real Google script (Chrome, Firefox, Safari, mobile Safari)
- [ ] CHANGELOG entry, docs updated in the same PR, upgrade-guide entry for anything breaking
- [ ] Tagged `vX.Y.Z` → release workflow publishes with provenance

## Suggested order of work

1. Phase 0 (one PR per section: metadata, tooling, CI, docs honesty) → publish **1.0.2**
2. `core/` refactor (loader, cookies, state), then B1–B17 in severity order → **1.1.0**
3. README rewrite + `docs/` skeleton + VitePress site live (can run in parallel with step 2)
4. Phase 2 polish → **1.2.0**, then the launch checklist
5. Monorepo split → Nuxt module → provider interface + DOM engine → **2.0.0-beta** → **2.0.0**
