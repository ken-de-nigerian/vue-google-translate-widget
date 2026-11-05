# ADR 0006: No hreflang tags or /fr/ URL prefixes

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The 2.0 plan listed `/fr/` path prefixes and generated `<link rel="alternate" hreflang>` tags for the Nuxt module.

## Decision

Don't generate either. Support shareable `?lang=fr` links (`queryParameter`) instead.

Both `hreflang` and language path prefixes tell search engines that a translated version of the page exists at that
URL. With translation in the browser, it doesn't: the server sends the original language. Advertising translations
the HTML doesn't contain misleads search engines and can hurt how they treat the site.

## Alternatives considered

- **Generate them anyway, behind an option.** Makes it easy for users to harm their own SEO without realizing.

## Consequences

Sites that need multilingual SEO need server-rendered translations (vue-i18n), and the docs say so plainly.
`?lang=` covers the legitimate need: a link that opens in a given language.
