# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Planned work is in [ROADMAP.md](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/ROADMAP.md).

## Unreleased

## 2.0.0 - 2026-11-02

The platform release: translation providers, an app-wide plugin, a Nuxt module, server handlers, and a
documentation website. See the [Upgrade Guide](https://ken-de-nigerian.github.io/vue-google-translate-widget/upgrade-guide); most apps need no code changes.

### Breaking

- `GoogleTranslateButton`'s deprecated `languageChanged` event was removed: use `change`.
- Flags are off by default (`showFlags: false`). Add `show-flags` to keep them.
- `theme` defaults to `'auto'` (follows `html.dark` / `html.light`, then the OS setting). Use `theme="light"` for
  1.x's look.
- The stylesheet is only exported as `…/style.css` (the `…/dist/style.css` path was removed).
- The UMD build was removed. ESM (`dist/index.js`) and CommonJS (`dist/index.cjs`) remain; `main` now points to
  `dist/index.cjs`.

### Added

- **Translation providers:** `provider` option with a built-in DOM translation engine (batching, de-duplication,
  `localStorage` cache, follows content rendered later, instant restore). `endpointProvider({ url })` for your own
  server, `libreTranslate({ url })` for a LibreTranslate server. `createDomTranslator`, `memoryCache`,
  `localStorageCache` for advanced use.
- **Server handlers** (`…/server`): `createTranslateHandler` (Fetch-standard, input validation, size limits,
  `allowedTargets`, upstream errors never sent to the browser) with `deepl`, `googleCloud`, `azure` and
  `libreTranslateServer` backends.
- **Plugin:** `createGoogleTranslate(config)` sets app-wide defaults for every component and composable; props and
  options still win.
- **Nuxt module** (`…/nuxt`): auto-imports, stylesheet, server rendering of the saved language (cookie or
  `?lang=`), `v-no-translate` registered globally.
- **`onTranslate`** hook for analytics, **`autoTranslate`** on the first visit, **`queryParameter`** for
  shareable `?lang=fr` links, **`initialLanguage`** for SSR.
- `pageLanguage` on the composable's return value.
- Documentation website (VitePress, with a live demo) and 24 documentation chapters in `docs/`.

### Fixed

- `v-no-translate` no longer causes a hydration class mismatch: it renders only `translate="no"` on the server
  (found while testing the Nuxt module).
- Server-side rendering no longer shares translation state between requests.

## 1.2.0 - 2026-11-02

Polish: theming, dark mode, slots, RTL and more. Everything is opt-in except the RTL direction fix; nothing
changes visually unless you use the new options.

### Added

- **Themes:** `theme: 'light' | 'dark' | 'auto'` (default `'light'`). `auto` follows `html.dark` / `html.light`,
  then the OS setting.
- **CSS custom properties:** `--gtw-color-*`, `--gtw-radius`, `--gtw-shadow`, `--gtw-font`, `--gtw-z-index`,
  `--gtw-offset`, shared by both components.
- **`unstyled`** prop to style the components from scratch.
- **Slots:** Widget `trigger`, `header`, `item`, `empty`, `footer`; Button default slot and `item`.
- **Widget `position`** (any corner) and **`offset`**.
- **`labels`** prop on the Widget for every remaining piece of text, including accessible names.
- **`display`** (`native` / `english` / `both`), **`pinned`**, **`rememberRecent`** on both components.
- **`suggestBrowserLanguage`** on the Widget: a "View this page in …?" prompt in the visitor's language.
- **`flagStyle: 'emoji'`**: flags without network requests.
- **`lazy`**: load Google on first open instead of on mount.
- **`syncDocumentDir`** (default `true`) on the composable and components.
- **`v-no-translate`** directive (`vNoTranslate`), `flagEmoji()`, `DEFAULT_WIDGET_LABELS`, and types `Theme`,
  `FlagStyle`, `LanguageDisplay`, `WidgetLabels`.
- `npm run sync:languages` and a weekly CI job that check Google's live language list against ours.

### Changed

- `<html dir="rtl">` is now set while the page is shown in a right-to-left language (Arabic, Hebrew, Persian,
  Urdu, …) and restored afterwards; Google only set a class, so layouts stayed left-to-right. Opt out with
  `syncDocumentDir: false`.
- The Widget's search icon is now a magnifying glass.
- The Button's dropdown aligns to the button's inline end, so it opens the right way in RTL layouts.
- Bundle budget: 12 kB JS / 3 kB CSS (now 11.2 / 2.5 kB brotli).

## 1.1.0 - 2026-11-02

Every bug in the roadmap's Phase 1 list (B1–B17) plus three found while testing against the real Google script.
Behaviour changes are listed under **Changed**; nothing was removed.

### Changed

- **Languages switch in place, without reloading the page** (`mode: 'live'`, the new default). 1.0 always
  reloaded: it rendered Google's `SIMPLE` layout, which has no `<select>`, so its in-place code path never ran.
  `mode: 'reload'` keeps the old behaviour.
- Choosing the page's original language restores it in place via Google's own "Show original" button, falling
  back to a reload if that isn't available (`reloadOnRestore: true` forces the reload).
- Google's banner, tooltips and highlight are hidden automatically (`hideBranding`, default `true`). The
  copy-paste CSS in the docs is no longer needed.
- `changeLanguage()` and `initializeTranslate()` now return promises. `changeLanguage` rejects if Google can't
  apply the change; `initializeTranslate` never rejects.
- State is shared: every component and composable on a page sees the same current language and status.
- Hebrew and Javanese use Google's codes (`iw`, `jw`); `he` and `jv` are still accepted.
- Portuguese is now "Portuguese (Brazil)" (`pt`, 🇧🇷), plus a new "Portuguese (Portugal)" (`pt-PT`).
- Catalan, Basque and Galician use their regional flags; Esperanto and Kurdish show a code badge instead of a
  contested country flag.
- The components no longer render their own hidden `#google_translate_element`; one shared host is created.
- Secondary text colours darkened slightly for contrast.
- JavaScript bundle budget raised from 7.5 kB to 10 kB (now 9.2 kB brotli): the accessibility, error and
  live-switching code.

### Added

- `status` (`'idle' | 'loading' | 'ready' | 'error'`), `error`, `isReady` and `restoreOriginal()` on the composable.
- Component events `change`, `update:language` (`v-model:language`), `ready`, `error`, `open`, `close`.
- Props/options `mode`, `reloadOnRestore`, `hideBranding`, `scriptSrc`, `nonce`, `timeout`, `errorText`, `flagUrl`;
  `showFlags` on the Button.
- `languages` and `includedLanguages` are reactive (refs or getters).
- Full keyboard support and ARIA roles: the Widget is a modal dialog with a combobox and listbox, focus trap,
  Esc to close and focus restore; the Button is a listbox popup with arrow, Home/End, Enter/Space and Esc.
- An error message in both popups when Google can't load.
- Exports `DEFAULT_LANGUAGES`, `LANGUAGE_CODE_ALIASES`, `toGoogleCode`, and types `TranslateMode`, `TranslateStatus`.

### Fixed

- Click-outside listener in `GoogleTranslateButton` was never removed (memory leak). (B1)
- Two components, or two instances, created duplicate `#google_translate_element` ids, and only the first
  instance's options were used. (B2)
- Restoring the original language failed on subdomains because Google's parent-domain cookie wasn't cleared. (B4)
- Changing `includedLanguages`/`languages` after mount had no effect. (B5)
- `currentLanguage` started as `'en'` regardless of `defaultLanguage` until Google loaded. (B6)
- A blocked Google script (ad blocker, CSP) failed silently. (B7)
- Language detection polled every 100 ms for 5 s and wasn't cleaned up on unmount. (B8)
- Hebrew (`he`) and Javanese (`jv`) never worked: Google only accepts `iw` and `jw`. (B9)
- `languageChanged` fired before the change was applied; the Widget emitted no events. (B10)
- Language items weren't keyboard accessible. (B11)
- The floating button's `aria-expanded` was always `false`. (B12)
- Google's script was loaded with a protocol-relative URL. (B13)
- The page behind the Widget's modal scrolled. (B15)
- Opening one `GoogleTranslateButton` didn't close another. (B17)
- A `#googtrans(..)` hash in the URL overrode a newly chosen language. (B18)
- Google translated the language names in our own lists ("Deutsch" became "Allemand"). (B19)
- After choosing a language from the Button, keyboard focus fell back to `<body>`. (B20)

## 1.0.2 - 2026-11-02

No behaviour changes: packaging, tooling and documentation only.

### Fixed

- Repository, issues and homepage links pointed at `github.com/ken_de_nigerian`, which doesn't exist. They now point
  at `github.com/ken-de-nigerian/vue-google-translate-widget`.
- CommonJS consumers now get their own `index.d.cts` type declarations instead of the ESM ones.
- `types` is listed first in each `exports` condition, so TypeScript always finds the declarations.

### Added

- `@ken_de_nigerian/vue-google-translate-widget/style.css` export (the old `/dist/style.css` path still works).
- `sideEffects` declaration so bundlers can tree-shake the JavaScript while keeping the stylesheet.
- `LICENSE` and `CHANGELOG.md` are now included in the published package.
- Test suite (Vitest + happy-dom) covering the composable and both components.
- CI on every push and pull request: lint, formatting, typecheck, build, publint, Are the Types Wrong?, bundle-size
  budget, and tests on Node 20/22/24 × Vue 3.3/3.4/3.5.
- Release workflow: tagging `vX.Y.Z` publishes to npm with provenance and creates a GitHub release.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue and pull request templates, Dependabot.

### Changed

- Documentation no longer claims keyboard navigation or full SSR support; both are on the roadmap.
- Changelog rewritten to list only the versions that were actually published.

## 1.0.1 - 2025-11-30

### Fixed

- Build configuration and generated type declarations.

### Added

- MIT license.
- Documentation for hiding Google Translate's branding with global CSS.

## 1.0.0 - 2025-11-30

### Added

- Initial release.
- `useGoogleTranslate` composable.
- `GoogleTranslateWidget` component (floating button + searchable modal).
- `GoogleTranslateButton` component (dropdown) with a `languageChanged` event.
- 109 languages with native names and flags.
- TypeScript definitions.
