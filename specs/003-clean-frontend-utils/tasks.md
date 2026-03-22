# Tasks: Clean Frontend Utils

**Input**: Design documents from `/specs/003-clean-frontend-utils/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: No test tasks generated — the feature spec does not request automated tests. Verification via manual smoke testing per quickstart.md.

**Organization**: Tasks follow the safe bottom-up refactoring order from data-model.md (leaf dependencies first). User stories map to specific code-quality improvements applied per-file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Establish baseline metrics and verify the development environment

- [x] T001 Capture pre-refactoring baseline: count total lines across all files in `frontend/src/utils/` and record the number (567 lines) for SC-008 comparison
- [x] T002 Run `cd frontend && npm run lint` to confirm current linting state and record any pre-existing warnings (0 errors, 0 warnings)

**Checkpoint**: Baseline recorded. All file metrics captured for post-refactoring comparison.

---

## Phase 2: Foundational (Leaf Dependencies)

**Purpose**: Refactor leaf-node modules that have no downstream dependencies within the utils directory. These MUST be complete before dependent modules are refactored.

- [x] T003 [P] [US2] Refactor `token-provider.js`: convert `getRefreshedToken` from `.then()` chain to `async`/`await` with `try`/`catch`/`finally`, preserving the `refreshPromise` deduplication pattern — `frontend/src/utils/token-provider.js`
- [x] T004 [P] Review `csrf-provider.js`: confirm no changes needed (already clean per analysis) — `frontend/src/utils/csrf-provider.js`
- [x] T005 [P] Review `fetch.js`: confirm no changes needed (base layer, already well-structured) — `frontend/src/utils/fetch.js`

**Checkpoint**: All leaf-node modules refactored. Dependent modules can now be safely updated.

---

## Phase 3: User Story 1 — Remove Dead Code and Duplicated Logic (Priority: P1) 🎯 MVP

**Goal**: Eliminate all dead code and duplicated logic blocks across utils files.

**Independent Test**: Confirm zero unused exports exist. Confirm the `update`/`create` file-handling loop in `add-upload-feature.js` is consolidated into a single helper.

### Implementation for User Story 1

- [x] T006 [US1] Remove the dead `uploadFiles` function (lines 64-110) and its named export from `frontend/src/utils/add-upload-feature.js` (FR-003)
- [x] T007 [US1] Extract the duplicated file-field processing loop (shared between `update` and `create` in `add-upload-feature.js`) into a single private helper function `processFileFields(params)` and invoke it from both methods — `frontend/src/utils/add-upload-feature.js` (FR-002)
- [x] T008 [US1] Narrow the `react-admin` import in `rest-provider.js`: change `import { fetchUtils } from "react-admin"` to import only `flattenObject` directly (e.g., `import { fetchUtils } from "react-admin"` → destructure to `const { flattenObject } = fetchUtils` or equivalent) — `frontend/src/utils/rest-provider.js` (FR-008)

**Checkpoint**: Dead code removed, duplicated logic consolidated. All exports are used. SC-001, SC-002 satisfied.

---

## Phase 4: User Story 2 — Apply Consistent Async/Await Patterns (Priority: P2)

**Goal**: Standardize all asynchronous code to use `async`/`await` with `try`/`catch`. Eliminate `.then()` chains and `new Promise` constructor anti-patterns.

**Independent Test**: Review each util file and confirm no `.then()` chains remain (except one-liner Promise returns in `checkAuth`/`checkError`). Confirm no `new Promise` wrappers exist.

### Implementation for User Story 2

- [x] T009 [US2] Convert `auth-provider.js` `login` method from `.then()` chain to `async`/`await` with `try`/`catch` — `frontend/src/utils/auth-provider.js` (FR-004)
- [x] T010 [US2] Convert `add-upload-feature.js` `uploadFile` function: remove the `new Promise` constructor wrapper and use plain `async`/`await` for the fetch call — `frontend/src/utils/add-upload-feature.js` (FR-004)

> **Note**: `token-provider.js` async conversion already done in T003 (Phase 2). `authProvider.checkAuth` and `checkError` one-liner `Promise.resolve()`/`Promise.reject()` are kept as-is per research.md RT-3.

**Checkpoint**: Consistent async style throughout. SC-004 satisfied.

---

## Phase 5: User Story 3 — Eliminate Side Effects and Improve Immutability (Priority: P3)

**Goal**: Ensure no util function mutates objects passed to it as arguments.

**Independent Test**: Code review confirming zero direct mutations of `options`, `options.headers`, or `params.data` in any util function.

### Implementation for User Story 3

- [x] T011 [US3] Refactor `http-client.js`: create a shallow copy of headers via `new Headers(options.headers)` before calling `.set()`, then pass `{ ...options, headers: newHeaders }` to `fetchJson` — `frontend/src/utils/http-client.js` (FR-005)
- [x] T012 [US3] Refactor `add-upload-feature.js` `processFileFields` helper (from T007): build a new `data` object with upload results instead of mutating `params.data[name]` directly. Return `{ ...params, data: newData }` — `frontend/src/utils/add-upload-feature.js` (FR-005)
- [x] T013 [US3] Refactor `rest-provider.js` `updateMany`: replace the IIFE `(() => { const { id, _id, ...data } = params.data; return data; })()` with standard destructuring consistent with `update` method — `frontend/src/utils/rest-provider.js` (FR-005)

**Checkpoint**: No argument mutation in any util. SC-005 satisfied.

---

## Phase 6: User Story 4 — Use Centralized HTTP Utilities Consistently (Priority: P4)

**Goal**: Route all HTTP calls through the project's centralized `fetchJson`/`httpClient` wrappers (except base-layer `fetch.js` and `token-provider.js`).

**Independent Test**: Search for raw `fetch(` calls in all util files except `fetch.js` and `token-provider.js` — confirm zero results.

### Implementation for User Story 4

- [x] T014 [US4] Migrate `auth-provider.js` `login`: replace raw `fetch(request)` with `fetchJson("/api/v1/auth/login", { method: "POST", body: JSON.stringify(...) })` from `./fetch.js`. Adapt response handling to use `result.json.data.token` format. Ensure CSRF token is injected automatically — `frontend/src/utils/auth-provider.js` (FR-006)
- [x] T015 [US4] Migrate `add-upload-feature.js` upload: replace raw `fetch("/api/v1/uploads", ...)` with `httpClient` import from `./http-client.js`. Pass `{ method: "POST", body: formData }` (FormData body auto-skips Content-Type per `createHeadersFromOptions`). Remove manual `tokenProvider.getToken()` and `Authorization` header — update import from `token-provider` to `http-client` — `frontend/src/utils/add-upload-feature.js` (FR-006)
- [x] T016 [US4] Implement fail-fast error handling in the `processFileFields` helper: if `httpClient` throws during any upload, let the error propagate immediately (do not catch and continue to next field) — `frontend/src/utils/add-upload-feature.js` (FR-010)

**Checkpoint**: Zero raw `fetch()` outside base layers. CSRF protection applied everywhere including login. SC-003 satisfied.

---

## Phase 7: User Story 5 — Fix Variable Shadowing and Naming Clarity (Priority: P5)

**Goal**: Eliminate all variable shadowing and improve parameter naming for clarity.

**Independent Test**: Run ESLint with `no-shadow` rule or manual review confirming no variable is re-declared in a nested scope.

### Implementation for User Story 5

- [x] T017 [P] [US5] Fix variable shadowing in `rest-provider.js`: rename all inner `.map((resource) =>` callback parameters to `(record) =>` across `getList`, `getMany`, `getManyReference`, and `deleteMany` methods — `frontend/src/utils/rest-provider.js` (FR-007)
- [x] T018 [P] [US5] Improve parameter naming in `add-upload-feature.js`: rename generic `field` and `name` parameters in the upload helper to descriptive names like `formFieldKey` and `dataFieldName` (or contextually clear equivalents) — `frontend/src/utils/add-upload-feature.js` (FR-007)

**Checkpoint**: Zero variable shadowing. Clean, descriptive naming throughout. SC-006 satisfied.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, linting, and baseline comparison

- [x] T019 Run `cd frontend && npm run lint` and fix any lint errors/warnings introduced by refactoring — `frontend/src/utils/` (0 errors, 0 warnings)
- [x] T020 Run `cd frontend && npm run build` to confirm the production build succeeds with no errors (build success in 3.39s)
- [x] T021 Count total lines across all files in `frontend/src/utils/` and compare against T001 baseline (567 lines). Result: 486 lines = **14.3% reduction** ✅ SC-008
- [ ] T022 Perform manual smoke test per `specs/003-clean-frontend-utils/quickstart.md`: verify login, CRUD, file upload, token refresh, and CSRF header presence *(requires running environment — user action needed)*
- [x] T023 Final review: confirm all 10 functional requirements (FR-001 through FR-010) and all 8 success criteria (SC-001 through SC-008) are satisfied

**Checkpoint**: All validation complete. Feature ready for PR.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories (leaf nodes must be clean first)
- **User Story 1 (Phase 3)**: Depends on Phase 2 — removes dead code to reduce surface area
- **User Story 2 (Phase 4)**: Depends on Phase 3 — async conversion works on cleaned-up code
- **User Story 3 (Phase 5)**: Depends on Phase 4 — immutability fixes build on async-converted code
- **User Story 4 (Phase 6)**: Depends on Phase 5 — HTTP migration is the most impactful change, done after code is clean and async
- **User Story 5 (Phase 7)**: Depends on Phase 6 — naming is the final cosmetic pass
- **Polish (Phase 8)**: Depends on all phases complete

### Within Each Phase

- Tasks marked [P] within the same phase can run in parallel
- Tasks without [P] must run sequentially in listed order
- Each phase has a checkpoint before the next phase begins

### Why Sequential (Not Parallel) User Stories

Unlike typical feature work, this refactoring operates on **the same 7 files** across all user stories. Running them in parallel would create merge conflicts. The dependency order follows a deliberate strategy:

1. **Remove dead code first (US1)** → smaller surface for subsequent changes
2. **Fix async patterns (US2)** → establishes the code style for remaining changes
3. **Fix immutability (US3)** → restructures data flow, requires stable async code
4. **Migrate HTTP calls (US4)** → most impactful functional change, needs clean code
5. **Fix naming (US5)** → purely cosmetic, done last to avoid churn

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These leaf-node reviews can run in parallel (different files, no dependencies):
Task T003: "Refactor token-provider.js async patterns"
Task T004: "Review csrf-provider.js — confirm no changes"
Task T005: "Review fetch.js — confirm no changes"
```

## Parallel Example: Phase 7 (User Story 5)

```bash
# These naming fixes target different files and can run in parallel:
Task T017: "Fix variable shadowing in rest-provider.js"
Task T018: "Improve parameter naming in add-upload-feature.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline)
2. Complete Phase 2: Foundational (leaf nodes)
3. Complete Phase 3: User Story 1 (dead code removal)
4. **STOP and VALIDATE**: Run lint + build + smoke test
5. This alone delivers measurable value (cleaner code, fewer lines)

### Incremental Delivery

1. Setup + Foundational → Leaf nodes clean
2. Add US1 → Dead code removed → Lint + Build ✓
3. Add US2 → Async patterns consistent → Lint + Build ✓
4. Add US3 → Immutability enforced → Lint + Build ✓
5. Add US4 → Centralized HTTP → Lint + Build + Smoke test ✓ (most important checkpoint — behavioral change)
6. Add US5 → Naming cleaned → Full validation per quickstart.md

### Risk Mitigation

- **US4 (HTTP migration)** is the highest-risk phase — it changes which HTTP layer handles requests. Run smoke test immediately after Phase 6 checkpoint.
- **Commit after each phase** to enable easy rollback if a later phase introduces regressions.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- User stories are sequential (same files), not parallel
- No automated tests generated — spec does not request them
- Commit after each phase checkpoint
- Total tasks: 23 (T001–T023)
