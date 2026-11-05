# ADR 0007: Flags off by default

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 2.0.0)

## Context

1.x showed a country flag for every language, loaded from flagcdn.com. Several mappings were contested (Catalan,
Basque and Galician shown with Spain's flag; Esperanto with the EU's; Kurdish with Iraq's), and any single flag is wrong
for many speakers of a language spoken in several countries.

## Decision

Off by default in 2.0. When on, use regional flags where they exist, a language-code badge where a flag would be
contested, and offer emoji flags (no requests) and a custom `flagUrl` (self-hosting).

## Alternatives considered

- **Bundle an SVG flag set.** Hundreds of kilobytes in the package for an option most sites won't use; `flagUrl`
  already allows self-hosting any set.

## Consequences

The default switcher makes no third-party image requests and doesn't misrepresent anyone's language. Upgrading from
1.x removes flags unless `show-flags` is added, which the Upgrade Guide covers.
