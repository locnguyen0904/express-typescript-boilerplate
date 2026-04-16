# Simplify Error Handler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead ZodError handling and consolidate PostgreSQL error helpers into a single lookup function.

**Architecture:** The global error handler (`errorHandle`) currently has 5 branches: AppError, ZodError, duplicate key PG error, invalid input PG error, and unknown error fallback. ZodError is dead code because `express-zod-safe` catches validation errors at the middleware layer before they reach the global handler. The two PG error branches each use separate type-guard functions + an extractor -- these can be consolidated into a single `handlePgError` function with a code-to-response map.

**Tech Stack:** Express.js error middleware, PostgreSQL error codes, Jest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/helpers/handle-errors.helper.ts` | Modify | Remove ZodError branch, replace 3 PG helper functions with 1 |
| `src/__tests__/helpers/handle-errors.helper.test.ts` | Modify | Remove ZodError test, keep PG + AppError + unknown tests |

---

### Task 1: Remove ZodError dead code

**Files:**
- Modify: `src/__tests__/helpers/handle-errors.helper.test.ts:100-130`
- Modify: `src/helpers/handle-errors.helper.ts:2,45-60`

- [ ] **Step 1: Remove the ZodError test case**

In `src/__tests__/helpers/handle-errors.helper.test.ts`, delete the ZodError test (lines 100-130) and remove the `ZodError` import from line 2:

```typescript
// line 1-2: change from
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
// to
import { NextFunction, Request, Response } from 'express';
```

Delete the entire test block:
```typescript
    it('handles ZodError with RFC 9457 format', () => {
      // ... entire block from line 100-130
    });
```

- [ ] **Step 2: Run tests to verify the ZodError test is gone and remaining tests still pass**

Run: `npx jest src/__tests__/helpers/handle-errors.helper.test.ts --verbose`
Expected: 7 tests pass (was 8), no ZodError test listed.

- [ ] **Step 3: Remove ZodError handling from the error handler**

In `src/helpers/handle-errors.helper.ts`:

Remove the `ZodError` import on line 2:
```typescript
// change from
import { ZodError } from 'zod';
// remove this line entirely
```

Delete the entire ZodError branch (lines 45-60):
```typescript
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      message: `${issue.path.join('.')}: ${issue.message}`,
      code: issue.code,
    }));
    sendProblem(res, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid request data. Please review the request and try again.',
      instance,
      code: 'VALIDATION_ERROR',
      errors,
    });
    return;
  }
```

Also remove the `errors` field from the `ProblemDetail` interface since no remaining branch uses it:
```typescript
// change from
interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code?: string;
  errors?: { message: string; code: string }[];
  stack?: string;
}
// to
interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code?: string;
  stack?: string;
}
```

- [ ] **Step 4: Run tests to verify everything passes**

Run: `npx jest src/__tests__/helpers/handle-errors.helper.test.ts --verbose`
Expected: All 7 remaining tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/helpers/handle-errors.helper.ts src/__tests__/helpers/handle-errors.helper.test.ts
git commit -m "refactor(core): remove dead zodError handling from global error handler"
```

---

### Task 2: Consolidate PostgreSQL error helpers

**Files:**
- Modify: `src/helpers/handle-errors.helper.ts:62-135`

- [ ] **Step 1: Run existing PG error tests to confirm baseline**

Run: `npx jest src/__tests__/helpers/handle-errors.helper.test.ts -t "PostgreSQL" --verbose`
Expected: Both "duplicate key error (23505)" and "invalid input error (22P02)" pass.

- [ ] **Step 2: Replace three PG helper functions with one consolidated handler**

In `src/helpers/handle-errors.helper.ts`, delete the three functions `isDuplicateKeyError` (lines 107-118), `extractDuplicateDetail` (lines 120-129), and `isInvalidInputError` (lines 131-135). Replace them with a single map-based function placed just above `logErrors`:

```typescript
const PG_ERROR_MAP: Record<string, { status: number; title: string; code: string; detail: string }> = {
  '23505': { status: 409, title: 'Conflict', code: 'DUPLICATE_KEY', detail: 'Duplicate key error' },
  '23503': { status: 409, title: 'Conflict', code: 'DUPLICATE_KEY', detail: 'Foreign key violation' },
  '22P02': { status: 400, title: 'Bad Request', code: 'INVALID_INPUT', detail: 'Invalid input format' },
};

const handlePgError = (
  error: unknown
): { status: number; title: string; code: string; detail: string } | null => {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const pgCode = (error as { code: string }).code;
  const mapped = PG_ERROR_MAP[pgCode];
  if (!mapped) return null;
  const detail =
    'detail' in error && typeof (error as { detail?: string }).detail === 'string'
      ? (error as { detail: string }).detail
      : 'constraint' in error && typeof (error as { constraint?: string }).constraint === 'string'
        ? `Duplicate value for constraint: ${(error as { constraint: string }).constraint}`
        : mapped.detail;
  return { ...mapped, detail };
};
```

- [ ] **Step 3: Replace the two PG branches in `errorHandle` with one**

In the `errorHandle` function, replace the two separate `if` blocks:

```typescript
  // delete these two blocks:
  if (isDuplicateKeyError(error)) {
    const detail = extractDuplicateDetail(error);
    sendProblem(res, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail: detail || 'Duplicate key error',
      instance,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  if (isInvalidInputError(error)) {
    sendProblem(res, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid input format',
      instance,
      code: 'INVALID_INPUT',
    });
    return;
  }
```

With one block:

```typescript
  const pgError = handlePgError(error);
  if (pgError) {
    sendProblem(res, {
      type: 'about:blank',
      title: pgError.title,
      status: pgError.status,
      detail: pgError.detail,
      instance,
      code: pgError.code,
    });
    return;
  }
```

- [ ] **Step 4: Run all error handler tests**

Run: `npx jest src/__tests__/helpers/handle-errors.helper.test.ts --verbose`
Expected: All 7 tests pass. PG tests pass with identical assertions (same status codes, titles, details, codes).

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/helpers/handle-errors.helper.ts
git commit -m "refactor(core): consolidate postgresql error helpers into single handler"
```
