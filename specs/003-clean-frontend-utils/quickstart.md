# Quickstart: Clean Frontend Utils

**Feature**: 003-clean-frontend-utils  
**Date**: 2026-03-21

## What This Feature Does

Refactors all 7 utility files in `frontend/src/utils/` to follow modern JavaScript best practices without changing any external behavior. After this refactoring:

- **Zero dead code** — every export is used
- **Consistent async style** — `async`/`await` everywhere (no mixed `.then()` chains)
- **No argument mutation** — all functions treat incoming objects as immutable
- **Centralized HTTP** — all HTTP calls flow through the CSRF-protected `fetchJson` wrapper
- **Clean naming** — no variable shadowing, descriptive parameter names

## Files Changed

| File                       | Changes                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `token-provider.js`        | Convert `.then()` chain to `async`/`await`                           |
| `csrf-provider.js`         | No changes (already clean)                                           |
| `fetch.js`                 | No changes (base layer)                                              |
| `http-client.js`           | Shallow-copy headers before mutation                                 |
| `auth-provider.js`         | Migrate login to `fetchJson`, convert to `async`/`await`             |
| `rest-provider.js`         | Fix variable shadowing, remove IIFE, narrow `react-admin` import     |
| `add-upload-feature.js`    | Remove dead code, deduplicate, use `httpClient`, async, immutable params |

## How to Verify

1. **Start the development environment**:
   ```bash
   docker compose up -d
   ```

2. **Verify login flow**: Navigate to the frontend, log in with valid credentials. Confirm successful authentication.

3. **Verify CRUD operations**: Navigate to any resource (e.g., Users, Examples). Create, read, update, and delete records.

4. **Verify file upload**: On a resource with file upload fields, upload a file during create and update operations.

5. **Verify token refresh**: Wait for the access token to near expiry (or manually shorten the JWT TTL in backend config), then perform an action. Confirm the token refreshes seamlessly.

6. **Verify CSRF protection**: Open browser DevTools → Network tab. Confirm that POST/PUT/DELETE requests include the `X-CSRF-Token` header (including the login request).

7. **Run linting**:
   ```bash
   cd frontend && npm run lint
   ```
   Confirm zero errors and zero warnings.

## Risks

- **No automated util tests exist**: Verification relies on manual smoke testing. Consider adding Vitest unit tests post-refactoring (separate initiative).
- **`query-string` is a transitive dependency**: It's imported in `rest-provider.js` but not listed in `frontend/package.json`. If `react-admin` ever drops it, the import will break. This is a pre-existing issue, not introduced by this refactoring.
