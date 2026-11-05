# ADR 0005: One package with subpath exports, not a monorepo

- **Status:** Accepted
- **Date:** 2026-11-02 (released in 2.0.0)

## Context

The 2.0 plan proposed a monorepo with three packages: a framework-agnostic core, the Vue package and a Nuxt module.

## Decision

Ship one package with subpath exports: `.` (Vue), `/server`, `/nuxt`, `/testing` and `/style.css`. Keep `src/core/`
free of Vue so a split stays possible.

## Alternatives considered

- **A monorepo with separate packages.** Three versions to keep in step, three release pipelines, and new package names
  to register, for no benefit to users of a Vue-only package today.

## Consequences

One version and one release. Entry points that share state (the main entry and `/testing`) must import the same
chunk, or `resetGoogleTranslate()` would reset a copy; the package smoke test checks this on the packed tarball.
