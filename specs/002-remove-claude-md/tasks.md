# Implementation Tasks: Remove CLAUDE.md

**Feature**: Remove CLAUDE.md
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Goals

1. Remove the `CLAUDE.md` file from the repository root.
2. Clean up dangling references to `CLAUDE.md` in other root and directory documentation files.

## Dependencies

- **US1** (Delete Artifact) must ideally be recognized before **US2** (Clean references) to avoid having a floating file without references, although they can be done concurrently.

## Phase 1: Setup & Environment

*(No setup required for documentation modification)*

## Phase 2: Foundational Prerequisites

*(No foundational tasks required)*

## Phase 3: User Story 1 - Repository No Longer Contains CLAUDE.md (P1)

**Goal**: Delete the Claude-specific instructions file from the project.
**Independent Test**: verify that `CLAUDE.md` no longer exists at the repository root and `git status` shows it as deleted.

- [x] T001 [US1] Delete `CLAUDE.md` file from `/Users/locvy/Documents/person/backend-template/CLAUDE.md`

## Phase 4: User Story 2 - Documentation References Are Cleaned Up (P1)

**Goal**: Ensure `README.md`, `CONTRIBUTING.md`, and `docs/SETUP.md` do not contain broken links or mentions of `CLAUDE.md`.
**Independent Test**: searching all markdown files for "CLAUDE.md" confirming zero matches outside of `node_modules/` and historical `specs/`.

- [x] T002 [P] [US2] Remove the row referencing `CLAUDE.md` from the documentation table in `/Users/locvy/Documents/person/backend-template/README.md`
- [x] T003 [P] [US2] Remove or rewrite the "Check CLAUDE.md..." reference in `/Users/locvy/Documents/person/backend-template/CONTRIBUTING.md`
- [x] T004 [P] [US2] Remove the "Check CLAUDE.md..." reference in `/Users/locvy/Documents/person/backend-template/docs/SETUP.md`

## Phase 5: Polish & Final Verifications

**Goal**: Ensure no references were missed and all modified markdown remains formatted correctly.

- [x] T005 Run a final project-wide grep to ensure no traces of `CLAUDE.md` exist outside of excluded directories.
- [x] T006 Ensure modified documentation renders correctly (no broken tables or list numbering).

## Implementation Strategy

1. **MVP Scope**: T001 through T004 establish the complete required scope.
2. **Parallel Execution**: T002, T003, and T004 modify entirely separate files and have no inter-dependencies, permitting them to be implemented in parallel.
3. **Rollout**: A single commit encompassing these 4 changes cleanly removes the feature traces.
