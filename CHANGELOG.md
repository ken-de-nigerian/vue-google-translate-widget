# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Planned work is in [ROADMAP.md](ROADMAP.md).

## Unreleased

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
