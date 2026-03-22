# Research: Clean Frontend Utils

**Feature**: 003-clean-frontend-utils  
**Date**: 2026-03-21  
**Phase**: 0 — Outline & Research

## Research Tasks

### RT-1: Migrating `auth-provider.js` login to use `fetchJson`

**Decision**: The login flow in `auth-provider.js` will use the project's `fetchJson` utility from `./fetch.js` instead of raw `fetch`.

**Rationale**:
- The `fetchJson` wrapper already handles CSRF token injection, `credentials: "include"`, and standardized error formatting via `HttpError`.
- Login is a POST request — CSRF protection on login prevents CSRF-based login attacks (OWASP recommendation).
- The `fetchJson` wrapper auto-fetches a CSRF token if one isn't cached, which is exactly the pre-authentication scenario.
- Error handling in `fetchJson` already produces `HttpError` objects that react-admin's `checkError` expects, eliminating the need for custom error parsing in the login method.

**Alternatives considered**:
- **Keep raw `fetch` for login**: Rejected because it bypasses CSRF protection and produces non-standard error objects.
- **Create a separate `fetchJsonNoAuth` wrapper**: Rejected because `fetchJson` already works without auth headers — it only adds the `Authorization` header if `options.user.authenticated` is truthy, which it won't be for login.

**Implementation notes**:
- `fetchJson` returns `{ status, headers, body, json }`. The login method currently expects `response.json()` to return `{ data: { token } }`. With `fetchJson`, this becomes `result.json.data.token`.
- `fetchJson` throws `HttpError` on non-2xx responses, so the existing manual status check can be removed — `try`/`catch` handles it.
- The `request` body must be passed as a JSON string in `options.body`, and `Content-Type` will be auto-set by `createHeadersFromOptions`.

---

### RT-2: Migrating `add-upload-feature.js` upload to use centralized HTTP

**Decision**: The `uploadFile` function will use `fetchJson` from `./fetch.js` instead of raw `fetch`.

**Rationale**:
- The upload endpoint (`/api/v1/uploads`) requires authentication. Currently, the function manually reads the token from `tokenProvider` and sets the `Authorization` header. Using `httpClient` (which wraps `fetchJson` with automatic token handling) would be cleaner.
- However, `httpClient` is designed for JSON requests and auto-sets `Content-Type: application/json` if the body isn't `FormData`. The `createHeadersFromOptions` in `fetch.js` already correctly skips `Content-Type` when the body is a `FormData` instance.
- Using `httpClient` gives automatic token refresh (the pre-emptive 5-second window check), CSRF injection, and `credentials: "include"`.

**Alternatives considered**:
- **Use `fetchJson` directly**: Would work but requires manually adding the `Authorization` header, duplicating what `httpClient` already does.
- **Keep raw `fetch`**: Rejected — bypasses CSRF and token refresh.

**Implementation notes**:
- `httpClient` accepts `(url, options)`. For file uploads, pass `{ method: "POST", body: formData }` where `formData` is a `FormData` instance. The `createHeadersFromOptions` function already skips `Content-Type` for `FormData` bodies, letting the browser set the correct `multipart/form-data` boundary.
- The response from `httpClient` is `{ json, status, headers, body }`. Access uploaded file data via `result.json.data`.

---

### RT-3: Best practices for `async`/`await` conversion in react-admin providers

**Decision**: Convert all `.then()` chains to `async`/`await` with `try`/`catch`/`finally` blocks. Preserve the react-admin provider contract (return `Promise<T>`).

**Rationale**:
- react-admin's `authProvider` and `dataProvider` expect methods that return Promises. `async` functions automatically return Promises, so the contract is preserved.
- `.then()` chains mixed with `async` functions create cognitive overhead and make error tracing harder.
- The `new Promise` constructor wrapping `fetch` in `uploadFile` is a well-known anti-pattern — `fetch` already returns a Promise.

**Alternatives considered**:
- **Keep `.then()` for consistency with react-admin docs**: Rejected. react-admin's own examples use both styles. `async`/`await` is more readable and the community standard.

**Implementation notes**:
- `authProvider.checkError` and `authProvider.checkAuth` use `Promise.reject()` / `Promise.resolve()` one-liners. These should remain as-is — wrapping a one-liner in `async` adds no value and is less idiomatic for react-admin's contract.
- `token-provider.js`'s `getRefreshedToken` uses a shared `refreshPromise` for deduplication. When converting to `async`/`await`, the deduplication pattern must be preserved: assign the async function call (not its result) to `refreshPromise` before awaiting.

---

### RT-4: Immutability patterns for react-admin params and options objects

**Decision**: Create shallow copies of mutable arguments (`options`, `options.headers`, `params.data`) before modifying them. Use object spread for plain objects and `new Headers(existingHeaders)` for `Headers` instances.

**Rationale**:
- `http-client.js` currently mutates `options.headers` via `.set()`. If a caller reuses the same `options` object across multiple calls, this causes hard-to-debug header accumulation.
- `add-upload-feature.js` mutates `params.data[name]` directly, replacing file objects with upload results. This makes the original `params` object unusable after the helper runs.

**Alternatives considered**:
- **Deep clone with `structuredClone`**: Rejected — `Headers` and `FormData` instances aren't cloneable with `structuredClone`. Shallow copy is sufficient for these use cases.
- **Use `Object.freeze` to enforce immutability**: Rejected — adds runtime overhead and would break react-admin's internal usage patterns.

**Implementation notes**:
- For `http-client.js`: Create `const headers = new Headers(options.headers)` before calling `.set()`, then pass `{ ...options, headers }` to `fetchJson`.
- For `add-upload-feature.js`: Build a new `data` object with upload results and pass `{ ...params, data: newData }` to the underlying provider method.

---

### RT-5: Variable shadowing fix strategy for `rest-provider.js`

**Decision**: Rename inner `.map()` callback parameters from `resource` to `record` across all methods in `rest-provider.js`.

**Rationale**:
- The outer function parameter `resource` (representing the API resource name, e.g., "users") is shadowed by the `.map((resource) => ...)` callback parameter (representing a single data record). This is confusing and could lead to bugs.
- `record` is semantically accurate — it represents a single data record from the API response.

**Alternatives considered**:
- `item`: Too generic, doesn't convey the data-record meaning.
- `entry`: Acceptable but `record` is more commonly used in react-admin context.

---

## Summary of Resolved Items

All technical context items resolved. No NEEDS CLARIFICATION markers remain.

| Research Task | Status   | Decision                                                |
| ------------- | -------- | ------------------------------------------------------- |
| RT-1          | Resolved | Login uses `fetchJson` with CSRF protection             |
| RT-2          | Resolved | Upload uses `httpClient` with auto token refresh        |
| RT-3          | Resolved | Convert to `async`/`await`; keep one-liner Promise returns |
| RT-4          | Resolved | Shallow copy via spread + `new Headers()`               |
| RT-5          | Resolved | Rename shadowed `resource` → `record` in callbacks      |
