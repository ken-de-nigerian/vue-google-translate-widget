# Contributing

Thanks for helping out. Bug reports, docs fixes and code are all welcome.

## Before you start

- **Bugs:** open an issue with a reproduction (a StackBlitz link is ideal) before sending a fix, unless it's a one-liner.
- **Features:** check [ROADMAP.md](ROADMAP.md) first. If it's not there, open a feature request so we can agree on the API before you write it.

## Setup

```bash
git clone https://github.com/ken-de-nigerian/vue-google-translate-widget.git
cd vue-google-translate-widget
npm install
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Run the test suite once (Vitest + happy-dom) |
| `npm run test:watch` | Re-run tests on change |
| `npm run test:coverage` | Tests with a coverage report in `coverage/` |
| `npm run lint` | ESLint (`npm run lint:fix` to autofix) |
| `npm run format` | Prettier (`npm run format:check` in CI) |
| `npm run typecheck` | `vue-tsc --noEmit` |
| `npm run build` | Build `dist/` |
| `npm run check:publish` | publint + Are the Types Wrong? against the built package |
| `npm run size` | Bundle size against the budget in `package.json` |

CI runs all of these on every pull request, with tests on Node 20/22/24 × Vue 3.3/3.4/3.5.

## Pull requests

- One change per PR. Keep refactors separate from behaviour changes.
- Every bug fix comes with a test that fails without it.
- Update the docs (README, `API.md`, `EXAMPLES.md`) in the same PR if you change an option or behaviour.
- Add a line to `CHANGELOG.md` under **Unreleased**.
- Tests never load Google's real script; happy-dom is configured to block it. Simulate Google's DOM
  (for example a `select.goog-te-combo`) instead.

## Releasing (maintainers)

1. Move the **Unreleased** changelog entries under a new version heading.
2. `npm version <patch|minor|major>` (updates `package.json` and creates the `vX.Y.Z` tag).
3. `git push --follow-tags`. The release workflow checks the tag matches `package.json`, runs every check,
   publishes to npm with provenance and creates the GitHub release.
