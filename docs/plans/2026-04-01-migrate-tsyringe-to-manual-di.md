# Migrate tsyringe → Manual DI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace tsyringe with a zero-dependency Manual DI composition root, eliminating decorators, `reflect-metadata`, and the `emitDecoratorMetadata` workaround.

**Architecture:** A single `container.ts` file acts as the composition root — all classes are instantiated with plain `new` and wired via constructor injection. Services, middleware, and routes import resolved instances from the container instead of calling `container.resolve()`. No DI library needed.

**Tech Stack:** TypeScript, Express 5, Mongoose (no new dependencies — we're removing dependencies)

**Why Manual DI over Awilix:** The codebase has only 11 singletons with a flat dependency graph. A DI library adds unnecessary complexity. Manual DI gives maximum type safety, zero runtime overhead, and zero library maintenance risk.

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| **Create** | `backend/src/container.ts` | Composition root — instantiates and wires all services |
| **Modify** | `backend/src/services/redis.service.ts` | Remove `@singleton()` decorator |
| **Modify** | `backend/src/services/event.service.ts` | Remove `@singleton()` decorator |
| **Modify** | `backend/src/services/token-blacklist.service.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/users/user.repository.ts` | Remove `@singleton()` decorator |
| **Modify** | `backend/src/api/users/user.service.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/users/user.controller.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/users/index.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/api/users/user.events.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/api/examples/example.repository.ts` | Remove `@singleton()` decorator |
| **Modify** | `backend/src/api/examples/example.service.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/examples/example.controller.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/examples/index.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/api/auth/auth.service.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/auth/auth.controller.ts` | Remove `@singleton()`, `@inject()` decorators |
| **Modify** | `backend/src/api/auth/index.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/middlewares/auth.middleware.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/middlewares/rate-limit.middleware.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/api/health/index.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/jobs/index.ts` | Import from container instead of `container.resolve()` |
| **Modify** | `backend/src/server.ts` | Remove `reflect-metadata`, import from container |
| **Modify** | `backend/tsconfig.json` | Remove `emitDecoratorMetadata`, `experimentalDecorators` |
| **Modify** | `backend/package.json` | Remove `tsyringe`, `reflect-metadata` |
| **Modify** | `backend/plop-templates/*.hbs` | Remove tsyringe decorators |
| **Modify** | `backend/src/__tests__/middlewares/auth.middleware.test.ts` | Remove tsyringe mock |
| **Modify** | `docs/adr/002-tsyringe-dependency-injection.md` | Update to reflect Manual DI |
| **Modify** | `docs/ARCHITECTURE.md` | Update DI section |

---

### Task 1: Create the Composition Root

**Files:**
- Create: `backend/src/container.ts`

- [ ] **Step 1: Create `backend/src/container.ts`**

```typescript
/**
 * Composition Root — Manual Dependency Injection
 *
 * All service instances are created here and wired via constructors.
 * Import resolved instances from this file wherever needed.
 *
 * Order matters: dependencies must be instantiated before dependants.
 */

// --- Shared Services (no dependencies on domain modules) ---
import RedisService from '@/services/redis.service';
import EventService from '@/services/event.service';
import TokenBlacklistService from '@/services/token-blacklist.service';

// --- Domain: Users ---
import { UserRepository } from '@/api/users/user.repository';
import UserService from '@/api/users/user.service';
import UserController from '@/api/users/user.controller';

// --- Domain: Examples ---
import { ExampleRepository } from '@/api/examples/example.repository';
import ExampleService from '@/api/examples/example.service';
import ExampleController from '@/api/examples/example.controller';

// --- Domain: Auth ---
import AuthService from '@/api/auth/auth.service';
import AuthController from '@/api/auth/auth.controller';

// 1. Shared services
const redisService = new RedisService();
const eventService = new EventService();
const tokenBlacklistService = new TokenBlacklistService(redisService);

// 2. User domain
const userRepository = new UserRepository();
const userService = new UserService(userRepository, eventService);
const userController = new UserController(userService);

// 3. Example domain
const exampleRepository = new ExampleRepository();
const exampleService = new ExampleService(exampleRepository, redisService);
const exampleController = new ExampleController(exampleService);

// 4. Auth domain
const authService = new AuthService(userService, tokenBlacklistService);
const authController = new AuthController(authService);

export {
  redisService,
  eventService,
  tokenBlacklistService,
  userRepository,
  userService,
  userController,
  exampleRepository,
  exampleService,
  exampleController,
  authService,
  authController,
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/container.ts
git commit -m "feat: add composition root for manual dependency injection"
```

---

### Task 2: Migrate Shared Services (remove decorators)

**Files:**
- Modify: `backend/src/services/redis.service.ts` — Remove line 1 (`import { singleton } from 'tsyringe'`) and line 8 (`@singleton()`)
- Modify: `backend/src/services/event.service.ts` — Remove line 2 (`import { singleton } from 'tsyringe'`) and line 11 (`@singleton()`)
- Modify: `backend/src/services/token-blacklist.service.ts` — Remove line 1 (`import { inject, singleton } from 'tsyringe'`), line 7 (`@singleton()`), and change line 9 constructor from `constructor(@inject(RedisService) private readonly redis: RedisService) {}` to `constructor(private readonly redis: RedisService) {}`

- [ ] **Step 1: Edit the three service files as described above**
- [ ] **Step 2: Commit**

```bash
git add backend/src/services/
git commit -m "refactor: remove tsyringe decorators from shared services"
```

---

### Task 3: Migrate User Domain

**Files:**
- Modify: `backend/src/api/users/user.repository.ts` — Remove `import { singleton } from 'tsyringe'` and `@singleton()`
- Modify: `backend/src/api/users/user.service.ts` — Remove `import { inject, singleton } from 'tsyringe'`, `@singleton()`, and `@inject()` from constructor params
- Modify: `backend/src/api/users/user.controller.ts` — Same pattern
- Modify: `backend/src/api/users/index.ts` — Replace `import { container } from 'tsyringe'` + `container.resolve(UserController)` with `import { userController } from '@/container'`
- Modify: `backend/src/api/users/user.events.ts` — Replace `import { container } from 'tsyringe'` + `container.resolve(EventService)` with `import { eventService } from '@/container'`

- [ ] **Step 1: Edit the five files as described**

For `user.service.ts`, the constructor becomes:
```typescript
constructor(
  private readonly userRepository: UserRepository,
  private readonly eventService: EventService
) {}
```

For `user.controller.ts`, the constructor becomes:
```typescript
constructor(private readonly userService: UserService) {}
```

For `index.ts`:
```typescript
import { userController } from '@/container';
const controller = userController;
```

For `user.events.ts`:
```typescript
import { eventService } from '@/container';
const events = eventService;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/api/users/
git commit -m "refactor: migrate user domain to manual DI"
```

---

### Task 4: Migrate Example Domain

Same pattern as Task 3 for `backend/src/api/examples/`:
- Remove decorators from repository, service, controller
- Replace `container.resolve()` in `index.ts` with `import { exampleController } from '@/container'`

- [ ] **Step 1: Edit the four files**
- [ ] **Step 2: Commit**

```bash
git add backend/src/api/examples/
git commit -m "refactor: migrate example domain to manual DI"
```

---

### Task 5: Migrate Auth Domain

Same pattern for `backend/src/api/auth/`:
- Remove decorators from `auth.service.ts` and `auth.controller.ts`
- Replace `container.resolve()` in `index.ts` with `import { authController } from '@/container'`

- [ ] **Step 1: Edit the three files**
- [ ] **Step 2: Commit**

```bash
git add backend/src/api/auth/
git commit -m "refactor: migrate auth domain to manual DI"
```

---

### Task 6: Migrate Middleware, Jobs, Health, and Server

**Files:**
- Modify: `backend/src/middlewares/auth.middleware.ts` — Replace `import { container } from 'tsyringe'` with `import { tokenBlacklistService } from '@/container'`. Replace `container.resolve(TokenBlacklistService)` on line 34 with `tokenBlacklistService`. Remove `TokenBlacklistService` import.
- Modify: `backend/src/middlewares/rate-limit.middleware.ts` — Replace `import { container } from 'tsyringe'` with `import { redisService } from '@/container'`. Replace `container.resolve(RedisService)` with `redisService`. Remove `RedisService` import from `@/services`.
- Modify: `backend/src/api/health/index.ts` — Replace `import { container } from 'tsyringe'` with `import { redisService } from '@/container'`. Replace `container.resolve(RedisService).isConnected` with `redisService.isConnected`. Remove `RedisService` import from `@/services`.
- Modify: `backend/src/jobs/index.ts` — Replace `import { container } from 'tsyringe'` with `import { redisService } from '@/container'`. Replace `container.resolve(RedisService)` with `redisService`. Remove `RedisService` import from `@/services`.
- Modify: `backend/src/server.ts` — Remove `import 'reflect-metadata'` (line 1). Replace `import { container } from 'tsyringe'` with `import { redisService } from '@/container'`. Replace both `container.resolve(RedisService)` calls with `redisService`. Remove `RedisService` from `'./services'` import.

- [ ] **Step 1: Edit the five files as described**
- [ ] **Step 2: Commit**

```bash
git add backend/src/middlewares/ backend/src/api/health/ backend/src/jobs/index.ts backend/src/server.ts
git commit -m "refactor: migrate middleware, jobs, health, and server to manual DI"
```

---

### Task 7: Update Tests, Plop Templates, Remove tsyringe

- [ ] **Step 1: Update `backend/src/__tests__/middlewares/auth.middleware.test.ts`**

Replace `jest.mock('tsyringe', ...)` with:
```typescript
const mockBlacklist = { revoke: jest.fn(), isRevoked: jest.fn() };
jest.mock('@/container', () => ({ tokenBlacklistService: mockBlacklist }));
```
Remove `import { container } from 'tsyringe'` and the `(container.resolve as jest.Mock)` setup in `beforeEach`. Remove `expect(container.resolve).toHaveBeenCalledWith(TokenBlacklistService)` assertion (line 90) — no longer relevant.

- [ ] **Step 2: Update all 4 plop templates** — Remove tsyringe imports and decorators. For `routes.ts.hbs`, add a TODO comment noting the controller must be registered in `container.ts`.

- [ ] **Step 3: Update `backend/tsconfig.json`** — Remove `"emitDecoratorMetadata": true` and `"experimentalDecorators": true`

- [ ] **Step 4: Remove packages**

```bash
cd backend && npm uninstall tsyringe reflect-metadata
```

- [ ] **Step 5: Run tests**

```bash
cd backend && npm test
```
Expected: All tests pass.

- [ ] **Step 6: Run lint**

```bash
cd backend && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove tsyringe and reflect-metadata, update templates and tsconfig"
```

---

### Task 8: Update Documentation

- [ ] **Step 1: Update `docs/adr/002-tsyringe-dependency-injection.md`** — Add "Superseded by Manual DI (2026-04-01)" status and document the reasoning (maintenance concerns, legacy decorators, esbuild incompatibility, small codebase size).

- [ ] **Step 2: Update `docs/ARCHITECTURE.md` DI section (lines 102-134)** — Replace tsyringe examples with Manual DI composition root pattern.

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: update ADR and architecture docs for manual DI migration"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Verify no tsyringe references remain**

```bash
grep -r "tsyringe" backend/src/ backend/plop-templates/ --include="*.ts" --include="*.hbs"
```
Expected: No output.

- [ ] **Step 2: Verify no reflect-metadata references remain**

```bash
grep -r "reflect-metadata" backend/src/ --include="*.ts"
```
Expected: No output.

- [ ] **Step 3: Run full test suite**

```bash
cd backend && npm test
```

- [ ] **Step 4: Run build**

```bash
cd backend && npm run build
```

- [ ] **Step 5: Run dev server smoke test**

```bash
cd backend && npm run dev
```
Expected: Server starts, health endpoint responds.
