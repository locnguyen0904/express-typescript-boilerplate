# Feature Specification: Clean Frontend Utils

**Feature Branch**: `003-clean-frontend-utils`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: User description: "Update code utils best practice and clean"

## Clarifications

### Session 2026-03-21

- Q: Should the login flow in `auth-provider.js` use the centralized `fetchJson` wrapper (gaining CSRF protection), or remain a standalone raw `fetch` call? → A: Use `fetchJson` for login — gains CSRF protection against CSRF-based login attacks (OWASP pattern) and consistent error handling.
- Q: When `addUploadFeature` encounters a failed file upload while processing multiple file fields, should it fail fast or attempt all fields and collect errors? → A: Fail fast — stop on first upload error and propagate it immediately.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Dead Code and Duplicated Logic (Priority: P1)

A developer opens the `frontend/src/utils/` directory and finds code that is easy to follow, with no unused exports, no copy-pasted blocks, and no commented-out "currently not used" functions. Every exported symbol is imported and used somewhere in the application.

**Why this priority**: Dead code and duplicated logic are the most immediate sources of confusion and maintenance burden. Removing them first reduces the surface area for all subsequent improvements.

**Independent Test**: Can be verified by confirming zero unused exports exist and that duplicated file-upload handling in `add-upload-feature.js` (between `update` and `create`) is consolidated into a single shared helper.

**Acceptance Scenarios**:

1. **Given** the `uploadFiles` function in `add-upload-feature.js` is marked "currently not used", **When** a developer reviews the file after cleanup, **Then** the dead function is removed entirely.
2. **Given** the `update` and `create` methods in `add-upload-feature.js` contain nearly identical file-handling loops, **When** a developer reviews the file after cleanup, **Then** the shared logic is extracted into a single reusable helper invoked by both methods.
3. **Given** `rest-provider.js` imports `fetchUtils` from `react-admin` but only uses `fetchUtils.flattenObject`, **When** a developer reviews the file after cleanup, **Then** the import is narrowed to only what is actually used.

---

### User Story 2 - Apply Consistent Async/Await Patterns (Priority: P2)

A developer reading any util file sees a consistent coding style: modern `async`/`await` syntax throughout, no unnecessary `.then()` chains mixed with `async` functions, and no Promise-constructor anti-patterns (wrapping an already async flow in `new Promise`).

**Why this priority**: Inconsistent promise handling (mixed `.then()` chains and `async`/`await`) makes error flows harder to trace and is a common source of swallowed errors. Standardizing reduces cognitive load.

**Independent Test**: Can be verified by linting or code-reviewing each util file to confirm no `.then()` chains remain where `async`/`await` is viable, and no `new Promise` wrappers exist around already-async operations.

**Acceptance Scenarios**:

1. **Given** `auth-provider.js` login uses a `.then()` chain inside an un-marked function, **When** a developer reviews the file after cleanup, **Then** the login method uses `async`/`await` with `try`/`catch`.
2. **Given** `add-upload-feature.js` wraps `fetch` in a `new Promise` constructor (anti-pattern), **When** a developer reviews the file after cleanup, **Then** the upload function uses plain `async`/`await` without an unnecessary `new Promise` wrapper.
3. **Given** `token-provider.js` uses a `.then()` chain for refresh, **When** a developer reviews the file after cleanup, **Then** the refresh logic uses `async`/`await` with `try`/`catch`/`finally`.

---

### User Story 3 - Eliminate Side Effects and Improve Immutability (Priority: P3)

A developer inspecting `http-client.js` and `add-upload-feature.js` finds that no function mutates its incoming arguments. Options objects and params objects are treated as immutable; any modifications produce new objects.

**Why this priority**: Mutating incoming arguments (`options.headers` in http-client, `params.data` in add-upload-feature) creates hidden coupling and makes debugging difficult. Fixing this improves predictability.

**Independent Test**: Can be verified by code review confirming that no util function directly mutates properties on objects passed in as arguments.

**Acceptance Scenarios**:

1. **Given** `http-client.js` directly mutates `options.headers` via `options.headers.set(...)`, **When** a developer reviews the file after cleanup, **Then** a shallow copy of headers is created before modification, leaving the original `options` object untouched.
2. **Given** `add-upload-feature.js` directly mutates `params.data[name]` to replace file data with upload results, **When** a developer reviews the file after cleanup, **Then** the function creates a new data object with upload results instead of mutating the original.
3. **Given** `rest-provider.js` destructures `id` and `_id` inside `update` but uses an IIFE inside `updateMany` for the same purpose, **When** a developer reviews the file after cleanup, **Then** both use consistent destructuring without IIFE wrappers.

---

### User Story 4 - Use Centralized HTTP Utilities Consistently (Priority: P4)

A developer notices that all HTTP calls in the utils directory flow through the project's centralized `fetchJson` and `httpClient` utilities. No util file uses the browser's raw `fetch` API directly (except the lowest-level `fetch.js` and `token-provider.js` which are the centralized layers themselves).

**Why this priority**: The centralized fetch wrapper (`fetch.js`) handles CSRF tokens, error normalization, and credential inclusion. Bypassing it in `add-upload-feature.js` and `auth-provider.js` means those flows silently skip CSRF protection and have inconsistent error formats.

**Independent Test**: Can be verified by searching for raw `fetch(` calls in all util files except `fetch.js` and `token-provider.js`, confirming none exist.

**Acceptance Scenarios**:

1. **Given** `add-upload-feature.js` calls raw `fetch("/api/v1/uploads", ...)` directly, **When** a developer reviews the file after cleanup, **Then** it uses the project's `fetchJson` or `httpClient` instead, gaining automatic CSRF token injection and standardized error handling.
2. **Given** `auth-provider.js` login calls `fetch(request)` directly, **When** a developer reviews the file after cleanup, **Then** it uses the project's `fetchJson` utility, gaining automatic CSRF protection on login and consistent error handling.

---

### User Story 5 - Fix Variable Shadowing and Naming Clarity (Priority: P5)

A developer reviewing `rest-provider.js` does not encounter variable shadowing (e.g., `resource` parameter shadowed by `.map((resource) =>` callback). All variables have clear, descriptive names that prevent confusion.

**Why this priority**: Variable shadowing is a minor but genuine readability and bug risk. Fixing it is low-effort and high-value for long-term maintainability.

**Independent Test**: Can be verified by running an ESLint rule (`no-shadow`) or manual code review confirming no variable name is re-declared in a nested scope.

**Acceptance Scenarios**:

1. **Given** `rest-provider.js` uses `resource` as both a function parameter and a `.map()` callback parameter, **When** a developer reviews the file after cleanup, **Then** the inner callback uses a distinct name like `item` or `record`.
2. **Given** `add-upload-feature.js` uses generic names like `field` and `name` for upload parameters, **When** a developer reviews the file after cleanup, **Then** parameters use descriptive names like `formFieldKey` and `dataFieldName` (or similar contextually clear names).

---

### Edge Cases

- What happens when file upload fails midway through processing multiple file fields in `add-upload-feature.js`? The cleanup MUST use a **fail-fast** strategy: stop processing on the first upload error and propagate it immediately to the caller. No further upload attempts should be made for remaining fields.
- How does `auth-provider.js` `checkError` behave when `error.status` is undefined? The cleanup should handle this edge case to avoid unexpected behavior.
- What happens when `token-provider.js` refresh endpoint returns a 200 status but with an unexpected body shape (e.g., missing `data.token`)? The cleanup should ensure the existing guard (`if (data && data.token)`) is preserved or improved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All behavioral contracts (inputs, outputs, side effects visible to callers) of every util module MUST remain identical after the cleanup — the refactoring MUST be purely internal.
- **FR-002**: The `addUploadFeature` decorator MUST consolidate duplicated file-handling loops in `update` and `create` into a single shared helper function.
- **FR-003**: The unused `uploadFiles` export in `add-upload-feature.js` MUST be removed.
- **FR-004**: All async operations across util files MUST use `async`/`await` consistently, replacing `.then()` chains and `new Promise` constructor anti-patterns.
- **FR-005**: No util function MUST mutate objects passed to it as arguments (e.g., `options.headers`, `params.data`). Utility functions MUST create copies before modification.
- **FR-006**: All HTTP calls (except within the base `fetch.js` fetch wrapper and `token-provider.js` refresh endpoint) MUST route through the project's centralized `fetchJson` or `httpClient` utilities to ensure consistent CSRF protection and error handling. This explicitly includes `auth-provider.js` login, which MUST use `fetchJson` for CSRF-based login attack prevention.
- **FR-007**: No variable shadowing MUST exist in any util file; inner scope variables MUST use distinct names from outer function parameters.
- **FR-008**: Unused or overly broad imports (e.g., importing an entire module when only one function is used) MUST be narrowed to only what is consumed.
- **FR-009**: All existing application functionality (login, token refresh, CRUD operations, file uploads, CSRF handling) MUST continue to work identically after the refactoring.
- **FR-010**: The `addUploadFeature` file-processing loop MUST use a fail-fast error strategy — if any single file upload fails, processing MUST stop immediately and the error MUST propagate to the caller without attempting remaining fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero dead/unused exports remain in any file within `frontend/src/utils/` — every exported symbol is imported elsewhere.
- **SC-002**: Zero instances of duplicated logic blocks (>3 identical lines) remain across util files.
- **SC-003**: Zero raw `fetch()` calls exist outside of `fetch.js` and `token-provider.js`.
- **SC-004**: Zero `.then()` chain usages remain where `async`/`await` is viable; consistent async style throughout.
- **SC-005**: Zero direct mutations of function arguments (`params`, `options`) occur in any util function.
- **SC-006**: Zero variable-shadowing warnings when checked by an ESLint `no-shadow` rule.
- **SC-007**: All existing end-to-end flows (login, CRUD, file upload, token refresh, CSRF handling) pass manual or automated testing without behavioral changes.
- **SC-008**: Total lines of code across the utils directory is reduced by at least 10% compared to the pre-cleanup baseline (currently ~574 lines total).

## Assumptions

- The refactoring is limited to `frontend/src/utils/` files only. Consumers (e.g., `App.jsx`) may need import path adjustments if files are renamed, but behavioral changes to consumers are out of scope.
- The project does not currently have automated frontend tests for the utils. Verification will rely on manual testing or integration-level smoke tests.
- The `token-provider.js` refresh endpoint raw `fetch` call is intentional — it is the lowest-level auth primitive and should not depend on `httpClient` (which itself depends on `token-provider`), avoiding a circular dependency.
- File names (kebab-case `.js` convention) are kept as-is to minimize import churn across the project.
