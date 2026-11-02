# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Planned work is in [ROADMAP.md](ROADMAP.md).

## Unreleased

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
