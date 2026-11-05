# Security Policy

## Supported versions

| Version | Security fixes |
| --- | --- |
| 2.x (latest minor) | ✅ |
| 1.x | ❌ Upgrade to 2.x; see the [Upgrade Guide](https://ken-de-nigerian.github.io/vue-google-translate-widget/upgrade-guide) |

## Reporting a vulnerability

Please **don't** open a public issue. Report it privately through
[GitHub Security Advisories](https://github.com/ken-de-nigerian/vue-google-translate-widget/security/advisories/new),
with steps to reproduce and the affected version.

You'll get an acknowledgement within 72 hours. Once a fix is released, the advisory is published and you're credited,
unless you'd rather not be.

## What's in scope

- **The browser package:** anything that lets page content, a URL parameter or a cookie run script, change another
  origin's state, or leak data it shouldn't. The package reads `#googtrans(…)`, `?lang=` and the `googtrans` cookie,
  all of which a visitor or a link can set; their values are only ever used as language codes (`?lang=` is validated
  against a language-code pattern), never as HTML or script.
- **The server handlers (`/server`):** anything that exposes an API key, lets a request bypass `maxTexts`,
  `maxCharacters` or `allowedTargets`, or forwards upstream error details to the browser. These handlers sit on a
  public route that spends money, so they're the most sensitive part of the package.
- **The Nuxt module:** anything in its server-side plugin that lets one visitor's request affect another's.

## Out of scope

- Google's own Website Translator script, and the translation services themselves. Report those to Google, DeepL,
  Microsoft or the LibreTranslate project.
- Rate limiting of your translation endpoint, which is deliberately left to your infrastructure (see
  [Security, CSP & Privacy](https://ken-de-nigerian.github.io/vue-google-translate-widget/csp-and-privacy#protecting-your-translation-endpoint)).
- Vulnerabilities in development-only dependencies that don't reach the published package. `npm audit --omit=dev`
  reports 0 vulnerabilities for what's published.

## How releases are protected

Releases are published from GitHub Actions only, with [npm provenance](https://docs.npmjs.com/generating-provenance-statements),
so you can check that a version on npm was built from this repository: `npm audit signatures`. GitHub Actions are
pinned to full commit SHAs. The published package has no runtime dependencies.
