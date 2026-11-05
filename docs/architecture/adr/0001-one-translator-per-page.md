# ADR 0001: One translator per page, shared by every component

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 1.1.0)

## Context

In 1.0, every component called `useGoogleTranslate()` independently. Each rendered its own
`<div id="google_translate_element">` and overwrote the global callback Google's script calls when it loads. Putting
a `GoogleTranslateWidget` and a `GoogleTranslateButton` on the same page produced duplicate element IDs, and the second
component's options were silently ignored.

Testing against the real widget showed why it can't work any other way: Google only renders the first
`TranslateElement` on a page. A second one renders nothing.

## Decision

A single module-level loader injects Google's script once, owns one hidden host element, and returns one shared
promise. The current language, loading status and error are module-level state, shared by every component and
composable. The first caller's `pageLanguage` wins; a different value later logs a warning.

During server-side rendering, every call gets its own state instead, so two concurrent requests can't see each
other's language.

## Alternatives considered

- **One translator per component.** Impossible: Google renders only the first.
- **Requiring an app-level provider component.** Would work, but every existing 1.x user would have had to change
  their code to fix a bug.

## Consequences

Components on the same page always agree. `defaultLanguage` is effectively per page, which the docs say and the
plugin makes easy to set once. Tests need to reset the shared state between cases, which is why `/testing` exports
`resetGoogleTranslate()`.
