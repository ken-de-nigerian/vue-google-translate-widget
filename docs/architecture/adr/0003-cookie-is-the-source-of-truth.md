# ADR 0003: The googtrans cookie is the source of truth for the chosen language

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 1.1.0; extended in 2.0.0)

## Context

The chosen language has to survive navigation and reloads, be readable on the server (for Nuxt to render it without a
hydration mismatch), and work with both engines: Google's widget and the provider DOM engine added in 2.0.

Google's widget already stores the choice in a `googtrans` cookie (`/en/fr`) and applies it on load. It writes the
cookie on the parent domain as well as the host, which 1.0 didn't clear, leaving visitors on subdomains stuck in a
translation.

## Decision

Use `googtrans` for both engines. Read it in order after `#googtrans(…)` in the URL and `?lang=` (if enabled). Clear
it on every level of the hostname when restoring the original. The Nuxt module reads it on the server.

## Alternatives considered

- **Our own cookie or `localStorage`.** `localStorage` isn't readable on the server. A separate cookie would disagree
  with Google's whenever Google writes its own, and switching engines would lose visitors' choices.

## Consequences

Switching from Google's widget to a provider keeps every visitor's language. The server can render the right language.
The cookie name is shared with any other Google Translate integration on the same domain, which is documented in
Troubleshooting.
