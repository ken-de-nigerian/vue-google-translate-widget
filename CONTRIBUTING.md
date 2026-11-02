# Contributing

Thanks for helping out. Bug reports, docs fixes and code are all welcome.

## Before you start

- **Bugs:** open an issue with a reproduction (a StackBlitz link is ideal) before sending a fix, unless it's a one-liner.
- **Features:** check [ROADMAP.md](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/ROADMAP.md) first. If it's not there, open a feature request so we can agree on the API before you write it.

## Setup

```bash
git clone https://github.com/ken-de-nigerian/vue-google-translate-widget.git
cd vue-google-translate-widget
npm install
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | The `playground/` app at `http://localhost:5173`, using the real Google script. Options can be set in the URL, e.g. `?theme=dark&flagStyle=emoji&position=bottom-right&pinned=fr,de` |
| `npm test` | Run the test suite once (Vitest + happy-dom) |
| `npm run test:watch` | Re-run tests on change |
| `npm run test:coverage` | Tests with a coverage report in `coverage/` |
| `npm run lint` | ESLint (`npm run lint:fix` to autofix) |
| `npm run format` | Prettier (`npm run format:check` in CI) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run build` | Build `dist/` |
| `npm run check:publish` | publint + Are the Types Wrong? against the built package |
| `npm run size` | Bundle size against the budget in `package.json` |
| `npm run test:nuxt` | Build `playground-nuxt/` (a real Nuxt app using the module) and check its server-rendered HTML. Run `npm run build` first. |
| `npm run docs:dev` | The documentation site at `http://localhost:5173/vue-google-translate-widget/` (`docs:build` to build it; CI fails on dead links) |
| `npm run sync:languages` | Compare Google's live language list with `tests/fixtures/google-languages.json` (`-- --write` to update). Needs `npx playwright-core install chromium` once. |

CI runs all of these on every pull request, with tests on Node 20/22/24 × Vue 3.3/3.4/3.5.

## Pull requests

- One change per PR. Keep refactors separate from behaviour changes.
- Every bug fix comes with a test that fails without it.
- Update the docs (`docs/*.md`, and the README if it's user-facing) in the same PR if you change an option or behaviour.
- Add a line to `CHANGELOG.md` under **Unreleased**.
- Tests never load Google's real script; happy-dom is configured to block it. Use `tests/helpers/fakeGoogle.ts`,
  which mimics the real widget (its `<select>`, the `translated-ltr/rtl` class, the cookie and the "Show original"
  button). Check user-visible changes in the playground too.

## Releasing (maintainers)

1. Move the **Unreleased** changelog entries under a new version heading.
2. `npm version <patch|minor|major>` (updates `package.json` and creates the `vX.Y.Z` tag).
3. `git push --follow-tags`. The release workflow checks the tag matches `package.json`, runs every check,
   publishes to npm with provenance and creates the GitHub release.
