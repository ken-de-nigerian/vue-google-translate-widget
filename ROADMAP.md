# Vue Google Translate Widget: Fix, Polish & v2 Roadmap

Status: Phases 0–4 complete and verified; every release published to npm with provenance. Plan written 2026-11-02 against `v1.0.1` (commit `f44c68f`).

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

## Phase 0: Foundations (`1.0.2`) ✅ done

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

The `NPM_TOKEN` secret is a granular token with "bypass 2FA" (the account requires 2FA to publish).

### 0.5 Make the docs honest

The current docs claim things the code does not do. Until the features ship, the claims come out:

- [x] README "keyboard navigation": remove until 1.2.0
- [x] README "SSR Ready": softened to "SSR-safe" (Google's script only loads in the browser) until the Nuxt module exists
- [x] CHANGELOG: the `rc` entries (never published to npm, claimed dark mode and theming) removed
- [x] CHANGELOG: add the missing `1.0.1` entry; adopt [Keep a Changelog](https://keepachangelog.com) + SemVer headings
- [x] README "Zero Dependencies" is true, but note that flags load from `flagcdn.com` at runtime (fixed in 1.2.0)

---

## Phase 1: Bug fixes (`1.1.0`) ✅ done

**Status (2026-11-02):** every bug below is fixed, has a regression test (100 tests; three fixes were
mutation-checked to make sure their tests fail without them), and the user-visible ones were verified against the
real Google script in the `playground/` app. Exceptions are called out inline.

Found while testing, also fixed in 1.1.0:

| # | Bug | Verified by |
| --- | --- | --- |
| B18 | A `#googtrans(..)` hash overrode a newly chosen language | unit test |
| B19 | Google translated our own language lists ("Deutsch" → "Allemand") | browser + unit test |
| B20 | Button: focus fell to `<body>` after choosing (button was `disabled` mid-change) | browser + unit test |

Learned from probing the real widget (2026-11-02): `InlineLayout.SIMPLE` renders no `<select>`, so 1.0's
in-place path never ran; only the first `TranslateElement` on a page renders; switching via the default layout's
`<select>` takes ~1.2 s warm, ~13 s for the first translation; "Show original" restores in place; Google adds
`translated-rtl` but no `dir` attribute; it offers 248 languages.

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
| B1 ✅ | High | Click-outside listener never removed (memory leak) | `GoogleTranslateButton.vue:51-63` |
| B2 ✅ | High | Duplicate `id="google_translate_element"`; second instance's options silently ignored | both components, composable `loadGoogleTranslateScript` |
| B3 ✅ | High | Full page reload on every language change | composable `changeLanguage` |
| B4 ✅ | High | Restoring the original language fails on subdomains (parent-domain cookie not cleared) | composable `changeLanguage` |
| B5 ✅ | Medium | Options/props aren't reactive; `languages` is a static array | composable, both components |
| B6 ✅ | Medium | `currentLanguage` initialises to hard-coded `'en'`, not `defaultLanguage` | composable |
| B7 ✅ | Medium | No ready/error state; blocked script (ad-blocker, CSP, region) fails silently | composable `loadGoogleTranslateScript` |
| B8 ✅ | Medium | `setInterval` polling (100 ms × 5 s), not cleaned up on unmount | composable `initializeTranslate` |
| B9 ✅ | Medium | Language codes may not match Google's widget (`he`/`iw`, `jv`/`jw`) | `DEFAULT_LANGUAGES` |
| B10 ✅ | Medium | `languageChanged` emitted before the change happens; Widget emits nothing at all | `GoogleTranslateButton.vue:39`, Widget |
| B11 ✅ | Medium | Accessibility: items are `<div @click>`; no keyboard, focus trap, Esc, roles | both components |
| B12 ✅ | Low | `aria-expanded` on the float button is always `false` (button is `v-if="!isOpen"`) | `GoogleTranslateWidget.vue:77-82` |
| B13 ✅ | Low | Protocol-relative script URL `//translate.google.com/...` | composable |
| B14 ✅ | Low | Google's banner shifts `<body>` down (`top: 40px`); no built-in fix | n/a |
| B15 ✅ | Low | Background scrolls while the modal is open | Widget |
| B16 ◐ | Low | Wrong or contested flags (Catalan/Basque/Galician → 🇪🇸, Esperanto → 🇪🇺, Kurdish → 🇮🇶) and third-party image requests | both components |
| B17 ✅ | Low | Opening one `GoogleTranslateButton` doesn't close another on the same page | Button |

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
- *Note:* verified by unit tests; a real multi-level domain can't be exercised on `localhost`.

#### B5: non-reactive options
- **Fix (as built):** `includedLanguages` and `languages` accept refs/getters; `languages` stays a (reactive) array
  so existing code keeps working. `defaultLanguage` stays a plain value: Google fixes the page language when its
  script loads, so changing it later couldn't work anyway.
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
- [ ] Run the script in a scheduled CI job (weekly) so we notice when Google changes the list. **Not done:**
  1.1.0 ships a dated snapshot (`tests/fixtures/google-languages.json`) that CI checks every code against.
  The automated weekly refresh moves to Phase 2.
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
- **Test:** axe-core (directly, not `vitest-axe`) on both components; keyboard interaction tests. Real-keyboard
  checks in the browser pane were partly blocked by the pane being hidden (no animation frames); the same flows
  pass with in-page key events and in the unit tests.

#### B13: script URL
- **Fix:** always `https://`; add a `scriptSrc` option (for proxies) and a `nonce` option for strict CSP.

#### B14: banner offset
- **Fix:** `hideBranding` option (default `true`) injects one small stylesheet: hides the banner iframe, tooltip and
  highlight, and resets `body { top: 0 !important }`. This replaces the copy-paste CSS in the README.
  It's documented as best-effort, because Google can change its class names.

#### B15: scroll lock
- **Fix:** lock `document.body` overflow while the modal is open, compensating for the scrollbar width; restore on close/unmount.

#### B16: flags ◐ partly done
- **Done in 1.1.0:** contested mappings fixed; `flag: ''` per language shows a code badge; `flagUrl` prop lets you
  self-host the images instead of hot-linking `flagcdn.com`.
- **Moved to Phase 2:** an emoji option and a bundled, tree-shakeable SVG set. Moved to 2.0 (breaking): flags
  off by default.

---

## Phase 2: Polish (`1.2.0`) ✅ done

**Status (2026-11-02):** everything below has tests (158 in total) and was checked in the browser against the real
Google script (themes and auto-theme resolution, emoji flags, pinned order, RTL `dir` on and off, `lazy`,
`unstyled`, override specificity). Two items were deliberately dropped; their reasons are below.

- ✅ **Theming with CSS custom properties.** 17 public `--gtw-*` properties (colours, radius, shadow, font,
  z-index, offset), shared by both components and documented in the README. No hard-coded colours remain.
- ✅ **Dark mode.** `theme: 'light' | 'dark' | 'auto'`. `auto` follows `html.dark` / `html.light`, then
  `prefers-color-scheme`. *Deviation:* the default is `'light'`, not `'auto'`, so sites upgrading within 1.x don't
  suddenly get a dark popup on a light page. Switching the default to `'auto'` is on the 2.0 breaking list.
- ✅ **Unstyled mode.** `unstyled`; every rule is gated on `:where(.gtw-styled)` (no added specificity). The
  screen-reader-only helper stays on.
- ✅ **Slots.** Widget: `trigger`, `header` (with `titleId`), `item`, `empty`, `footer`. Button: default slot
  (button content, with the `current` language) and `item`. `item` gets `language`, `selected`, `active`, `select()`.
- ✅ **Floating button position.** `position` (4 corners) and `offset`.
- ✅ **RTL.** `syncDocumentDir` (default `true`): a page-level observer mirrors Google's `translated-rtl` class onto
  `<html dir>` and restores the page's own `dir` afterwards. `lang` needed no work: Google already sets it.
- ✅ **Labels.** Existing text props kept (no deprecations); a `labels` object covers everything else, including
  the accessible names and the screen-reader results count.
- ✅ **Language display.** `display`, `pinned`, `rememberRecent` (localStorage, opt-in, safe when storage throws).
- ✅ **Browser language suggestion.** `suggestBrowserLanguage`: regional match first, then base language;
  silent when the visitor already prefers the page language or the page is translated; dismissal remembered.
- ✅ **`v-no-translate` directive**, including SSR output.
- ✅ **Weekly language check** (moved from Phase 1): `npm run sync:languages` loads the real widget in headless
  Chromium; `.github/workflows/languages.yml` runs it every Monday and fails on drift. Verified locally against
  Google (248 languages, no drift) and with a simulated drift (exits 1).
- ✅ **Emoji flags** (moved from Phase 1): `flagStyle: 'emoji'`, including the England/Scotland/Wales tag
  sequences; regional flags without an emoji fall back to a code badge.
- ✅ **Lazy loading.** `lazy` loads Google on first open; a saved translation still loads immediately.
- ✗ **Virtualised list: dropped.** Measured in the browser: opening the modal with all 110 languages takes ~30 ms
  including two animation frames, and filtering ~17 ms (one frame). Google's full list (248) stays well under
  any noticeable delay, so virtualisation would add code and complexity for no visible gain.
- ✗ **Bundled SVG flag set (moved from Phase 1): dropped.** Shipping 100+ SVGs would add hundreds of kB to the
  package for an option most sites won't use. `flagUrl` already lets you self-host any set (e.g. `flag-icons`),
  and `flagStyle: 'emoji'` needs no files at all.

Bundle budget raised to 12 kB JS / 3 kB CSS (now 11.2 / 2.5 kB brotli) for the features above.

---

## Phase 3: v2.0.0 (platform) ✅ done

**Status (2026-11-02):** done, with the deviations and drops listed below and their reasons. Verified with 235 tests
(including SSR in Node, a provider engine end-to-end through the Widget, and server-handler contract tests); the
Nuxt module was verified by building a real Nuxt app and checking its SSR output and hydration (now automated in
CI as `npm run test:nuxt`).

| Item | Status |
| --- | --- |
| 3.1 Monorepo with three npm packages | **Changed:** one package with subpath exports (`/server`, `/nuxt`) instead. One version, one release workflow, and no new npm names to register. The core (`src/core`) has no Vue dependency, so a split stays possible. |
| 3.1 React / Svelte / web component | Not done (they were "later candidates"); still open. |
| 3.2 Plugin API | ✅ `createGoogleTranslate(config)`; options > plugin > defaults; `false` props beat plugin `true`. |
| 3.3 Nuxt module | ✅ auto-imports, CSS, client+server plugin, SSR of the cookie language with no hydration mismatch, `?lang=` (`queryParameter`). |
| 3.3 `/fr/` path strategy | Not done; `?lang=` covers shareable links. |
| 3.3 `hreflang` generation | **Dropped:** the server renders the original language, so `hreflang` would advertise translations that don't exist in the HTML. Misleading for search engines. |
| 3.4 Providers | ✅ DOM engine; `endpointProvider` + server backends for DeepL, Google Cloud, Azure, LibreTranslate; `libreTranslate` direct; custom `TranslationProvider`. |
| 3.4 Cache in IndexedDB | **Changed:** `localStorage` (+ memory), via a `TranslationCache` interface you can replace. Simpler, synchronous, enough for page text. |
| 3.4 Server recipes | ✅ Nuxt, Next.js, Hono/Workers/Deno/Bun, Express, Laravel in `docs/server-handlers.md`. |
| 3.4 Paid vendors against live APIs | **Not verified live:** request/response formats are tested against the vendors' documentation with mocked HTTP; no paid keys were available. Said so in the docs. |
| 3.5 `onTranslate` | ✅ |
| 3.5 Auto-translate on first visit | ✅ `autoTranslate` (once per browser) |
| 3.5 Drop UMD/CJS | UMD dropped; CJS kept (no download data to justify dropping it). |
| 3.5 Vue 3.6 / Vapor | Not done: not stable yet. |
| Breaking changes batch | ✅ all five, plus the UMD removal. Upgrade guide in `docs/upgrade-guide.md`. |

The original plan follows for reference.


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
- `theme` defaults to `'auto'` (1.x keeps `'light'`)

---

## Documentation & links: the PayZephyr standard ✅ done

**Status (2026-11-02):**

- ✅ D1 README rewritten: badges, what it is, who it's for, Mermaid diagram, quick start, numbered docs links.
  **Dropped:** the comparison table with other packages: their feature sets couldn't be verified, and the README
  shouldn't make claims about other projects that may be wrong.
- ✅ D2 `docs/`: 24 chapters plus `docs/README.md` as the numbered index (instead of `INDEX.md`: on case-insensitive
  filesystems it collides with VitePress's `index.md`, and GitHub shows `README.md` when browsing the folder). The
  language table is generated, and a test fails if it drifts. Old `API.md`/`EXAMPLES.md` folded in.
- ✅ D3 VitePress site with search, Mermaid, a live demo, and a language switcher on every page (the site translates
  itself); `docs.yml` deploys it to GitHub Pages; CI builds it and fails on dead links.
- ✅ D4 Community files (Phase 0), repo description, website and topics. Not done: issue labels, a pinned
  discussion.
- ☐ D5 Launch checklist: the maintainer's call (posting to dev.to, Reddit, Discord, awesome-vue, nuxt.com/modules).


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

## Phase 4: Production hardening (`2.1.0`)

**Status (2026-11-05):** done; see the 2.1.0 changelog. Prompted by a review against PayZephyr's standard.

- ✅ **Dependabot backlog:** all ten PRs resolved in one toolchain upgrade (#14): Vite 7, Vitest 5, plugin-vue 6,
  vue-tsc 3, vite-plugin-dts 5, TypeScript 6, current GitHub Actions. TypeScript 7 deferred (ADR 0008).
- ✅ **Nuxt 4:** the module is built and SSR-checked on Nuxt 3 and 4 in CI; `useCookie` typing fixed for Nuxt 4.
- ✅ **Docs rewritten** as a guide with a running example; new Testing Your App and Accessibility chapters; eight
  decision records; a test that every in-docs anchor link resolves.
- ✅ **`/testing` entry point** with a fake of Google's widget for users' own tests (and ours).
- ✅ **Package smoke test:** CI installs the packed tarball into an empty project and checks every entry point as ESM,
  CommonJS and strict types. It found two published-declaration bugs in 2.0.0 (Nuxt `ModuleOptions` was `any`;
  `CALLBACK_NAME` leaked), both fixed.
- ✅ **WCAG contrast:** the default blue failed AA for text (3.68:1); fixed, and tested for every pair in all themes.
- ✅ **Mutation testing** with Stryker, weekly in CI. The first run scored 78.6%; the surviving mutants pointed at real
  gaps (the server's language-code check wasn't anchored by any test; the subdomain-cookie fix could regress
  unnoticed), and the tests written for them raised it to 92.6%. The weekly job fails below 90%.
- ✅ Repo tidy: the Nuxt fixture moved to `tests/fixtures/`, a leftover probe page removed, `CONTRIBUTING.md` explains
  what every folder is for.
- ☐ Launch posts: drafted (in the git-ignored `launch-posts.md`); posting them is the maintainer's call.
- ☐ React/Svelte wrappers: still open; see the FAQ and ADR 0005.

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
