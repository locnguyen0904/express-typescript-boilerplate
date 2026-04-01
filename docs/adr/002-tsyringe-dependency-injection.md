# ADR-002: Dependency Injection Strategy

**Date:** 2026-02-07
**Status:** Superseded by Manual DI (2026-04-01)

## Original Context

The template was using `typedi` for dependency injection. TypeDI has been unmaintained since January 2021, with no new releases or security patches. We replaced it with `tsyringe` (maintained by Microsoft).

## Superseding Decision (2026-04-01)

Replace `tsyringe` with Manual DI (composition root pattern).

### Why

- tsyringe has uncertain maintenance (60+ open issues, slow triage)
- Requires legacy `experimentalDecorators` and `emitDecoratorMetadata`
- esbuild/tsx doesn't support `emitDecoratorMetadata`, forcing explicit `@inject()` on every param
- With only 11 singletons, a DI library adds unnecessary complexity
- Manual DI provides maximum type safety with zero runtime overhead

### How

All service instances are created in `backend/src/container.ts` (composition root) using plain `new` constructors. Modules import resolved instances directly. No decorators, no `reflect-metadata`, no DI library.

### Migration Mapping

| tsyringe                         | Manual DI                                      |
| -------------------------------- | ---------------------------------------------- |
| `@singleton()`                   | (removed — classes are plain)                  |
| `@inject(Dep) private dep: Dep`  | `private dep: Dep` (constructor)               |
| `container.resolve(Class)`       | `import { instance } from '@/container'`       |
| `reflect-metadata`               | (removed)                                      |

## Original Consequences

**Positive:**

- Actively maintained by Microsoft
- Same decorator-based DI pattern (minimal migration effort)
- Compatible with `reflect-metadata` and existing TypeScript decorator config
- Supports `@injectable()` (transient) and `@singleton()` scopes

**Negative:**

- API differences require a one-time migration of all DI references
- tsyringe is more explicit about singleton vs transient scope (TypeDI defaults to singleton)
