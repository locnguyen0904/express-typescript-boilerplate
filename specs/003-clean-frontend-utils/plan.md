# Implementation Plan: Clean Frontend Utils

**Branch**: `003-clean-frontend-utils` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-clean-frontend-utils/spec.md`

## Summary

Refactor all 7 files in `frontend/src/utils/` (~574 lines) to follow modern JavaScript best practices: remove dead code, consolidate duplicated logic, standardize on `async`/`await`, eliminate argument mutation, route all HTTP calls through the centralized `fetchJson` wrapper (including login), fix variable shadowing, and narrow imports — while preserving identical behavioral contracts for all consumers.

## Technical Context

**Language/Version**: JavaScript (ES2020+, JSX) via Vite 7 + esbuild  
**Primary Dependencies**: React 19, react-admin 5.14, jwt-decode 4, query-string (transitive via react-admin)  
**Storage**: N/A (frontend only — localStorage for tokens)  
**Testing**: Vitest 4 (configured but no existing util tests)  
**Target Platform**: Browser (SPA served by Vite dev server, proxied to Express backend)  
**Project Type**: Web application — React Admin frontend  
**Performance Goals**: N/A — no new runtime behavior; refactoring only  
**Constraints**: Must preserve all existing behavioral contracts (FR-001). No file renames to minimize import churn. No new dependencies.  
**Scale/Scope**: 7 files, ~574 lines total, 1 consumer (`App.jsx`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Check                                                                                                                 | Gate     | Status  | Notes                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| 1   | Does the feature add/change a layer that violates the strict **Routes → Controller → Service → Repository** pipeline? | MUST NOT | ✅ PASS | Frontend-only refactoring. No backend layers affected.                                     |
| 2   | Does the feature introduce direct `process.env` access outside `config/env.config.ts`?                                | MUST NOT | ✅ PASS | Frontend uses `import.meta.env.VITE_API_URL` (existing pattern in `csrf-provider.js`). No change. |
| 3   | Are all new endpoints secured (auth middleware, Zod validation, rate limiting applied)?                               | MUST     | ✅ N/A  | No new endpoints. Frontend-only changes.                                                   |
| 4   | Will new business logic have unit tests + integration tests (`mongodb-memory-server`)?                                | MUST     | ⚠️ NOTE | No existing frontend util tests. This is a refactoring-only change; no new business logic. Manual smoke testing covers FR-009. |
| 5   | Are new endpoints registered in a `*.doc.ts` (OpenAPI)?                                                               | MUST     | ✅ N/A  | No new endpoints.                                                                          |
| 6   | Does the feature use `console.log`/`console.error` instead of the shared Pino `logger`?                               | MUST NOT | ✅ PASS | Frontend code; Pino `logger` applies to backend only. No `console.log` added.              |
| 7   | Does the feature change a locked tech-stack dependency without an ADR in `docs/adr/`?                                 | MUST NOT | ✅ PASS | No dependency changes. No new packages added.                                              |
| 8   | Are new API modules generated via Plop (`npm run generate`) or follow the exact same file structure?                  | MUST     | ✅ N/A  | No new modules. Editing existing files only.                                               |

**Gate result**: ✅ All gates pass. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-clean-frontend-utils/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── App.jsx                    # Consumer — imports 4 utils
│   ├── utils/
│   │   ├── add-upload-feature.js  # P1: dead code, duplication, mutation, raw fetch
│   │   ├── auth-provider.js       # P2: .then() chains, raw fetch
│   │   ├── csrf-provider.js       # Minor: already clean
│   │   ├── fetch.js               # Base layer — minimal changes
│   │   ├── http-client.js         # P3: mutates options.headers
│   │   ├── rest-provider.js       # P5: variable shadowing, IIFE, broad import
│   │   └── token-provider.js      # P2: .then() chains
│   ├── components/
│   ├── pages/
│   └── validates/
├── eslint.config.js               # ESLint 9 flat config
├── vite.config.js                 # Vite 7 + @/ alias
└── package.json                   # React 19, react-admin 5.14
```

**Structure Decision**: Web application (Option 2). Changes scoped exclusively to `frontend/src/utils/`.

## Complexity Tracking

No constitution violations to justify. All gates pass cleanly.
