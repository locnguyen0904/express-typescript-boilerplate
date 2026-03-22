# Data Model: Clean Frontend Utils

**Feature**: 003-clean-frontend-utils  
**Date**: 2026-03-21  
**Phase**: 1 — Design & Contracts

## Overview

This feature is a pure code refactoring — no new data entities are introduced. This document captures the **existing dependency graph** between util modules to inform safe refactoring order.

## Module Dependency Graph

```text
App.jsx
├── auth-provider.js ──────┬── csrf-provider.js
│                          └── token-provider.js
├── http-client.js ────────┬── fetch.js ──────── csrf-provider.js
│                          └── token-provider.js
├── rest-provider.js ────── (receives httpClient as parameter)
└── add-upload-feature.js ── token-provider.js  → MIGRATING to httpClient
```

## Module Contracts (Preserved)

Each module's **external contract** (what callers depend on) must remain identical:

### `token-provider.js`
- **Export**: Default export — singleton object `{ getToken, setToken, removeToken, getRefreshedToken }`
- **Storage**: `localStorage` key `"token"`
- **Dependencies**: Raw `fetch` (intentional — lowest-level auth primitive, avoids circular dependency with `httpClient`)
- **No changes to contract**

### `csrf-provider.js`
- **Export**: Default export — singleton object `{ getToken, fetchToken, refreshToken, clearToken }`
- **Dependencies**: `import.meta.env.VITE_API_URL`, raw `fetch`
- **No changes to contract or implementation** (already clean)

### `fetch.js`
- **Exports**: Named `{ createHeadersFromOptions, fetchJson }`
- **Dependencies**: `csrf-provider.js`, `react-admin` (HttpError)
- **No changes to contract**

### `http-client.js`
- **Export**: Default export — async function `(url, options?) => Promise<FetchJsonResult>`
- **Dependencies**: `fetch.js` (fetchJson), `token-provider.js`, `jwt-decode`
- **Contract preserved**: Callers pass `(url, options)` and receive `{ status, headers, body, json }`
- **Internal change**: Shallow-copy `options.headers` before mutation

### `auth-provider.js`
- **Export**: Default export — object `{ login, checkError, checkAuth, logout, getIdentity, getPermissions }`
- **Dependencies**: `csrf-provider.js`, `token-provider.js` → **adding** `fetch.js` (fetchJson)
- **Contract preserved**: Same react-admin authProvider interface
- **Internal change**: Login uses `fetchJson`, converted to `async`/`await`

### `rest-provider.js`
- **Export**: Default export — factory function `(apiUrl, httpClient) => dataProvider`
- **Dependencies**: `react-admin` (fetchUtils.flattenObject), `query-string` (stringify)
- **Contract preserved**: Same react-admin dataProvider interface
- **Internal change**: Fix variable shadowing, remove IIFE, narrow imports

### `add-upload-feature.js`
- **Export**: Default export `addUploadFeature(dataProvider) => enhancedDataProvider`
- **Dependencies**: `token-provider.js` → **replacing with** `http-client.js` (httpClient)
- **Removed export**: `uploadFiles` (dead code), `uploadFile` (internalized)
- **Contract preserved**: Same decorator interface `(dataProvider) => dataProvider`
- **Internal changes**: Deduplicate logic, use `httpClient`, `async`/`await`, immutable params

## Safe Refactoring Order

Based on the dependency graph, files should be refactored bottom-up (leaves first):

1. **`token-provider.js`** — leaf node, no downstream dependencies. Convert `.then()` to `async`/`await`.
2. **`csrf-provider.js`** — leaf node. Already clean; skip or minimal pass.
3. **`fetch.js`** — depends on `csrf-provider.js`. Already clean; no changes needed.
4. **`http-client.js`** — depends on `fetch.js` + `token-provider.js`. Fix header mutation.
5. **`auth-provider.js`** — depends on `csrf-provider.js` + `token-provider.js`. Migrate to `fetchJson`, convert to `async`/`await`.
6. **`rest-provider.js`** — receives `httpClient` as parameter. Fix shadowing, remove IIFE, narrow imports.
7. **`add-upload-feature.js`** — depends on `token-provider.js` (changing to `http-client.js`). Most complex: deduplicate, migrate HTTP, async/await, immutable params, remove dead code.

## Entities

No new data entities. Existing entities are not modified:

- **Token** (JWT string in `localStorage`): Read/write by `token-provider.js`, consumed by `http-client.js` and `auth-provider.js`
- **CSRF Token** (string in module-level variable): Managed by `csrf-provider.js`, consumed by `fetch.js`
