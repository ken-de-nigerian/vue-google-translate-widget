# ADR 0008: Stay on TypeScript 6 until the tooling supports TypeScript 7

- **Status:** Accepted
- **Date:** 2026-11-05

## Context

Dependabot proposed TypeScript 7. TypeScript 7 is the native (Go) compiler. Tried locally: `vue-tsc` fails, and the
declaration build stops with "The installed typescript package does not provide the JavaScript Compiler API (this
happens with TypeScript 7+)".

## Decision

Use TypeScript 6. `dependabot.yml` ignores TypeScript 7 until `vue-tsc` and the declaration bundler support it.

## Consequences

Nothing for users: the published declarations work with TypeScript 5 and later, which the package smoke test checks.
Revisit when `vue-tsc` supports TypeScript 7.
