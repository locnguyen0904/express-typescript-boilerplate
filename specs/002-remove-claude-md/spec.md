# Feature Specification: Remove CLAUDE.md

**Feature Branch**: `002-remove-claude-md`  
**Created**: 2026-03-21  
**Status**: Draft  
**Input**: User description: "Remove CLAUDE.md and all references to CLAUDE.md from the project"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Repository No Longer Contains CLAUDE.md (Priority: P1)

A project contributor clones or opens the repository and sees a clean documentation
structure without any Claude-specific files. The repository should not contain tooling
guidance files tied to a specific AI vendor (Anthropic Claude) since the team does not
use that tool.

**Why this priority**: The file itself is the primary artifact to remove. Without
deleting it first, references in other files become meaningless to clean up.

**Independent Test**: Can be fully tested by verifying that `CLAUDE.md` no longer
exists at the repository root and `git status` shows it as deleted.

**Acceptance Scenarios**:

1. **Given** the repository root contains `CLAUDE.md`, **When** the cleanup is
   applied, **Then** the file `CLAUDE.md` no longer exists in the repository root.
2. **Given** a contributor runs `find . -name "CLAUDE.md" -not -path "*/node_modules/*"`,
   **When** the cleanup is complete, **Then** zero results are returned.

---

### User Story 2 - Documentation References Are Cleaned Up (Priority: P1)

A contributor reading `README.md`, `CONTRIBUTING.md`, or `docs/SETUP.md` no longer
encounters broken links or references to a non-existent `CLAUDE.md` file. Each
document remains coherent and well-structured after the reference removal.

**Why this priority**: Leaving dangling references to a deleted file creates confusion
for contributors and signals poor documentation hygiene. This is equally critical to
the file deletion itself.

**Independent Test**: Can be fully tested by searching all markdown files for
"CLAUDE.md" and confirming zero matches outside of `node_modules/` and `specs/`.

**Acceptance Scenarios**:

1. **Given** `README.md` line 137 lists `CLAUDE.md` in the Documentation table,
   **When** the cleanup is applied, **Then** that row is removed from the table.
2. **Given** `CONTRIBUTING.md` line 203 references `CLAUDE.md`, **When** the cleanup
   is applied, **Then** that line is removed or replaced with an appropriate
   alternative.
3. **Given** `docs/SETUP.md` line 303 references `CLAUDE.md` in the "Next Steps"
   section, **When** the cleanup is applied, **Then** that line is removed or
   replaced with an appropriate alternative.
4. **Given** a contributor opens any documentation file, **When** they read through
   it, **Then** the surrounding content still reads naturally with no awkward gaps
   or broken numbering.

---

### Edge Cases

- What happens if a future contributor re-adds a `CLAUDE.md`? — Out of scope; this
  spec only addresses current removal.
- What about `CLAUDE.md` inside `node_modules/` (e.g., `thread-stream/CLAUDE.md`)?
  — These are third-party dependencies and must NOT be removed.
- What about references in `specs/001-fix-template-quality-gaps/`? — These are
  historical spec documents describing past work. They should be left intact as
  an audit trail, since they describe what was done, not current instructions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The file `CLAUDE.md` at the repository root MUST be deleted.
- **FR-002**: The row referencing `CLAUDE.md` in the `README.md` Documentation table
  (line 137) MUST be removed.
- **FR-003**: The reference to `CLAUDE.md` in `CONTRIBUTING.md` (line 203) MUST be
  removed or replaced with relevant guidance that does not reference the deleted file.
- **FR-004**: The reference to `CLAUDE.md` in `docs/SETUP.md` (line 303, "Next Steps"
  list item 3) MUST be removed or replaced so the numbered list remains coherent.
- **FR-005**: Files inside `node_modules/` MUST NOT be modified.
- **FR-006**: Historical spec files under `specs/001-fix-template-quality-gaps/` MUST
  NOT be modified (they serve as an audit trail).

## Assumptions

- The team does not use Claude and has no plans to adopt it; therefore the file
  provides no value.
- No CI/CD pipelines or build scripts reference `CLAUDE.md`. (Confirmed by grep —
  no references found outside documentation files and historical specs.)
- The content in `CLAUDE.md` (architecture patterns, coding conventions, etc.) is
  already adequately documented in other project files like `CONTRIBUTING.md`,
  `docs/ARCHITECTURE.md`, and `docs/SETUP.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero files named `CLAUDE.md` exist at the repository root after the
  change is applied.
- **SC-002**: A full-text search for "CLAUDE.md" across all project-owned markdown
  files (excluding `node_modules/` and `specs/001-*`) returns zero results.
- **SC-003**: All documentation files (`README.md`, `CONTRIBUTING.md`, `docs/SETUP.md`)
  remain well-structured with no broken links, dangling references, or numbering gaps
  after the cleanup.
- **SC-004**: A contributor reading the documentation can understand the project setup
  and contribution guidelines without encountering references to a non-existent file.
