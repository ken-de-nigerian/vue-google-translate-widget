# Contributing

Thanks for helping out. Bug reports, documentation fixes and code are all welcome. This page explains how the
repository is laid out, how to run everything locally, and what a pull request needs before it can be merged.

## Before you start

- **Bugs:** open an issue with a reproduction (a StackBlitz link is ideal) before sending a fix, unless it's a
  one-liner.
- **Features:** check [ROADMAP.md](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/ROADMAP.md)
  and the [decision records](https://ken-de-nigerian.github.io/vue-google-translate-widget/architecture) first. If it
  isn't covered, open a feature request so we can agree on the API before you write it.
- **Security issues:** don't open an issue. See [SECURITY.md](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/SECURITY.md).

## Setup

```bash
git clone https://github.com/ken-de-nigerian/vue-google-translate-widget.git
cd vue-google-translate-widget
npm install
```

Node 20 or newer is needed for development (the published package itself supports any browser, and Node 18+ for
`/server`).

## What's where

| Path | What it is | Published to npm? |
| --- | --- | --- |
| `src/` | The package's source. [Architecture](https://ken-de-nigerian.github.io/vue-google-translate-widget/architecture) explains how it's organized. | Built into `dist/` |
| `tests/` | Unit, component, accessibility, SSR and docs tests (Vitest) | No |
| `tests/fixtures/nuxt-app/` | A real Nuxt app that installs the module like a user would. CI builds it on Nuxt 3 and 4 and checks its server-rendered HTML. | No |
| `tests/fixtures/google-languages.json` | A snapshot of the languages Google's live widget offers, checked weekly | No |
| `playground/` | A small app for trying changes by hand against the **real** Google script (`npm run dev`). The tests use a fake of Google's widget; the playground is where you check the real thing. | No |
| `docs/` | The documentation, published at the [documentation website](https://ken-de-nigerian.github.io/vue-google-translate-widget/) | No |
| `scripts/` | The Nuxt SSR check, the package smoke test, the language sync, and a build helper | No |

Only `dist/`, `README.md`, `CHANGELOG.md` and `LICENSE` are published (see `files` in `package.json`). The package smoke
test checks what's in the tarball.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | The playground at `http://localhost:5173`, using the real Google script. Options go in the URL, for example `?theme=dark&flagStyle=emoji&position=bottom-right&pinned=fr,de`. |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests on change |
| `npm run test:coverage` | Tests with a coverage report in `coverage/` |
| `npm run lint` | ESLint (`npm run lint:fix` to fix what it can) |
| `npm run format` | Prettier (`npm run format:check` is what CI runs) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run build` | Build `dist/` |
| `npm run check:publish` | publint and Are the Types Wrong? against the built package |
| `npm run size` | Bundle size of each entry point against its budget |
| `npm run test:package` | Pack the tarball, install it into an empty project, and use every entry point as ESM, CommonJS and with strict types. Run `npm run build` first. |
| `npm run test:nuxt` | Build the Nuxt fixture and check its server-rendered HTML. Run `npm run build` first. |
| `npm run nuxt:dev` | The Nuxt fixture in development mode; the quickest way to spot hydration warnings |
| `npm run docs:dev` | The documentation site at `http://localhost:5173/vue-google-translate-widget/` (`docs:build` to build it) |
| `npm run test:mutation` | Mutation testing with Stryker (about 15 minutes): changes the code in small ways and checks a test fails each time. The report is in `reports/mutation/`. Runs weekly in CI. |
| `npm run sync:languages` | Compare Google's live language list with the snapshot (`-- --write` to update it). Needs `npx playwright-core install chromium` once. |

CI runs all of these on every pull request (except `dev`, `nuxt:dev`, `docs:dev` and `test:mutation`), with tests on
Node 20, 22 and 24 and Vue 3.3, 3.4 and 3.5, and the Nuxt check on Nuxt 3 and 4. `sync:languages` and `test:mutation`
run weekly.

## Writing tests

- Tests never load Google's real script; happy-dom is configured to block it. Use the fake in `src/testing/` (the
  same one users get from `/testing`), which behaves like the real widget: it renders the language `<select>`, sets
  `translated-ltr`/`translated-rtl`, writes the cookie and provides "Show original".
- Every bug fix comes with a test that fails without the fix. For anything non-obvious, check that the test fails if
  you revert the fix.
- If you change logic in `src/core`, `src/composables`, `src/server`, `src/directives` or `src/plugin.ts`, run
  `npm run test:mutation` and look at the surviving mutants for the lines you touched: each one is a change to the
  code that no test notices.
- Check user-visible changes in the playground too, against the real Google script.

## Pull requests

- One change per pull request. Keep refactors separate from behaviour changes.
- Update the docs in the same pull request if you change an option or behaviour. Write them as prose that explains why,
  like the chapters already there.
- Add a line to `CHANGELOG.md` under **Unreleased**.
- A significant design decision gets a decision record in `docs/architecture/adr/`, starting from `0000-template.md`.
- Anything listed in the [API Reference](https://ken-de-nigerian.github.io/vue-google-translate-widget/api-reference)
  is public API, including CSS class names and `--gtw-*` custom properties. Changing it incompatibly needs a major
  version and an entry in the Upgrade Guide.

## Releasing (maintainers)

1. Move the **Unreleased** changelog entries under a new version heading, with the date.
2. `npm version <patch|minor|major>` updates `package.json` and creates the `vX.Y.Z` tag.
3. `git push --follow-tags`. The release workflow checks the tag matches `package.json`, runs every check including
   the package smoke test, publishes to npm with provenance, and creates the GitHub release.

The `NPM_TOKEN` repository secret must be a granular access token with "bypass two-factor authentication" enabled,
because the npm account requires 2FA to publish and CI can't enter a code.
