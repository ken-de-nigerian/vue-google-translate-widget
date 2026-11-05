# ADR 0004: A DOM engine for providers, with API keys kept on the server

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 2.0.0)

## Context

Google closed the Website Translator to new sites in 2019 and makes no promise to keep it running. Every package that
wraps it shares that risk. Some users also need a different engine (DeepL), or can't send content to Google.

Translation APIs (DeepL, Google Cloud, Azure) authenticate with keys that must not reach the browser.

## Decision

Add an optional `provider`. When set, Google's script is never loaded; the package's own DOM engine walks text nodes
and a few attributes, skips anything marked `notranslate`, de-duplicates and batches strings, caches results, writes
them back, keeps originals for instant restore, and follows later DOM changes. It marks `<html>` the way Google does
(`lang`, `translated-ltr`/`translated-rtl`), so state and right-to-left handling work the same for both engines.

Paid services are reached through the app's own endpoint (`endpointProvider`), with Fetch-standard server handlers in
`/server` that hold the key, validate input, cap request size and never forward upstream error details.

## Alternatives considered

- **Calling paid APIs directly from the browser.** Exposes the key to every visitor.
- **Translating whole HTML documents.** Simpler, but loses Vue's DOM state and re-sends unchanged text.

## Consequences

The package no longer depends on Google's free widget for users who opt in. The vendor backends are verified against
the vendors' documented APIs with mocked HTTP, not against live services, because that needs paid keys.
