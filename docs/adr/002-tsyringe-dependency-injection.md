# ADR-002: Manual Dependency Injection Strategy

**Date:** 2026-02-07
**Status:** Accepted

## Context

The template previously experimented with decorator-based dependency injection libraries. That approach added framework coupling, extra metadata requirements, and more moving parts than this codebase needs.

## Decision

Use Manual DI with a composition root in `backend/src/container.ts`.

### Why

- Decorator-based DI requires legacy `experimentalDecorators` and `emitDecoratorMetadata`
- `tsx`/esbuild does not support `emitDecoratorMetadata`, forcing explicit DI workarounds
- With a small set of shared singletons, a DI library adds more ceremony than value
- Manual DI provides maximum type safety with zero runtime overhead

### How

All service instances are created in `backend/src/container.ts` (composition root) using plain `new` constructors. Modules import resolved instances directly. No decorators, no `reflect-metadata`, no DI library.

## Consequences

**Positive:**

- Dependencies are visible and explicit at the composition root
- No decorators, metadata reflection, or container magic required
- Works cleanly with the current `tsx` + TypeScript setup
- Easier to trace startup order and optional infrastructure wiring

**Negative:**

- `container.ts` must be maintained carefully as the app grows
- Instance wiring is manual rather than auto-resolved
