# ADR 0002: Translate in place by driving Google's hidden language selector

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 1.1.0)

## Context

1.0 reloaded the page on every language change. Its code tried to switch in place by setting Google's
`select.goog-te-combo`, but it created Google's widget with `InlineLayout.SIMPLE`. Probing the real widget in a
browser showed that the `SIMPLE` layout renders a link menu inside an iframe and no `<select>` at all, so the in-place
path never ran and every change fell through to the reload.

The same probe showed the default layout renders a `<select>` with every language, that setting it and dispatching
`change` translates the page in place (about 1.2 seconds warm; up to about 13 seconds for the first translation of a
visit), and that Google's "Show original" button, in a same-origin iframe, restores the original without a reload.

## Decision

Create Google's widget with the default layout, inside a hidden host element (its appearance doesn't matter), and
switch languages by setting its `<select>`. Restore by clicking "Show original", falling back to a reload if it can't
be found. Keep reload as an opt-in `mode: 'reload'`.

## Alternatives considered

- **Keep reloading.** Simple and robust, but it loses form state, scroll position and anything else in memory, and it
  makes every change feel slow.
- **Calling Google's internal JavaScript API.** Undocumented and obfuscated; it would break without warning.

## Consequences

Changes no longer reload the page. The package depends on Google's `goog-te-combo` class name and the "Show original"
button's ID pattern; a weekly CI job loads the live widget and the fake used in tests mirrors the observed behaviour,
so a change on Google's side is noticed.
