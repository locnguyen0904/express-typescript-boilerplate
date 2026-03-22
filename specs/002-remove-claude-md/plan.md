# Implementation Plan: Remove CLAUDE.md

**Branch**: `002-remove-claude-md` | **Date**: 2026-03-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-remove-claude-md/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Delete `CLAUDE.md` from the project root and remove referencing links from `README.md`, `CONTRIBUTING.md`, and `docs/SETUP.md`. Exclude files in `node_modules` and historical `specs/001-*`.

## Technical Context

**Language/Version**: Markdown
**Primary Dependencies**: None
**Storage**: None
**Testing**: Verification via `git status` and `grep`
**Target Platform**: Repository documentation
**Project Type**: Documentation maintenance
**Performance Goals**: None
**Constraints**: Must exclude `node_modules/` and `specs/001-*/`
**Scale/Scope**: 1 file deletion, 3 file modifications

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| #   | Check                                                                                                                 | Gate     | Applies |
| --- | --------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 1   | Does the feature add/change a layer that violates the strict **Routes → Controller → Service → Repository** pipeline? | MUST NOT | Pass    |
| 2   | Does the feature introduce direct `process.env` access outside `config/env.config.ts`?                                | MUST NOT | Pass    |
| 3   | Are all new endpoints secured (auth middleware, Zod validation, rate limiting applied)?                               | MUST     | N/A     |
| 4   | Will new business logic have unit tests + integration tests (`mongodb-memory-server`)?                                | MUST     | N/A     |
| 5   | Are new endpoints registered in a `*.doc.ts` (OpenAPI)?                                                               | MUST     | N/A     |
| 6   | Does the feature use `console.log`/`console.error` instead of the shared Pino `logger`?                               | MUST NOT | Pass    |
| 7   | Does the feature change a locked tech-stack dependency without an ADR in `docs/adr/`?                                 | MUST NOT | Pass    |
| 8   | Are new API modules generated via Plop (`npm run generate`) or follow the exact same file structure?                  | MUST     | N/A     |

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-claude-md/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/
├── CLAUDE.md            # TO BE DELETED
├── README.md            # TO BE MODIFIED
├── CONTRIBUTING.md      # TO BE MODIFIED
└── docs/
    └── SETUP.md         # TO BE MODIFIED
```

**Structure Decision**: This is a direct file deletion and text removal. No new structural modules are added.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations)*
