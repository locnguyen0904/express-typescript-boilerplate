# Docs Redesign for Open Source Boilerplate

**Date:** 2026-04-16
**Status:** Approved

## Goal

Replace all project documentation with a clean, flat structure following open source boilerplate conventions. Two files: `README.md` (primary) and `CONTRIBUTING.md` (contributor guide).

## Audience

1. Developers using the boilerplate to start a new project (primary)
2. Contributors wanting to contribute to the boilerplate (secondary)

## Decisions

- **Flat structure** -- no `docs/` subfolder for docs (except `docs/superpowers/` which is tooling, not project docs)
- **No emoji** in headings or content -- technical, professional tone
- **Tables + code blocks** for scannability
- **`.env.example`** remains the source of truth for env vars; README references it

## Files

### README.md

Sections in order:

| # | Section | Content |
|---|---------|---------|
| 1 | Title + badges | Project name, CI/coverage/license badges |
| 2 | One-liner | Single sentence describing the project |
| 3 | Tech Stack | Table: layer → technology (Runtime, Framework, DB, Cache, Auth, Validation, API Docs, DI, Logging, Jobs, Testing, Container) |
| 4 | Quick Start | 5-6 shell commands: clone, .env, docker compose up, db:push, verify |
| 5 | Project Structure | Directory tree of `src/` with one-line descriptions |
| 6 | Scripts | Table of npm scripts: command → description (dev, build, test, lint, db:migrate, db:push, db:studio, seed, docker:up/down) |
| 7 | Environment Variables | Table: variable → description → default. Reference `.env.example` |
| 8 | Architecture | Request flow diagram (text), layered pattern explanation (3-4 sentences), layer responsibility table |
| 9 | Creating a Module | Step-by-step: files to create, where to register, follow `examples` module as reference |
| 10 | Testing | How to run tests, test file location convention, example command |
| 11 | Docker | docker compose services, useful commands |
| 12 | Contributing | One-liner + link to CONTRIBUTING.md |
| 13 | License | ISC |

### CONTRIBUTING.md

Sections in order:

| # | Section | Content |
|---|---------|---------|
| 1 | Git Flow | Branch naming table (feature/*, fix/*, refactor/*, docs/*, chore/*), workflow steps |
| 2 | Commit Convention | Format: `<type>(<scope>): <description>`, types table, scopes table, examples |
| 3 | Code Standards | Pre-commit checklist (format, lint, test), coding rules |
| 4 | Creating a Module | Reference to README section (avoid duplication) |
| 5 | PR Guidelines | Title format, description template, merge strategy (squash) |

## Content Sources

All content is derived from the current codebase state:
- Tech stack from `package.json` dependencies
- Project structure from actual `src/` directory
- Scripts from `package.json` scripts
- Env vars from `.env.example` and `src/config/env.schema.ts`
- Architecture from actual code patterns (routes → controller → service → repository)
- Module creation from existing `src/api/examples/` module
- Git conventions from existing `.husky/` and commitlint config

## What is NOT included

- ADR (Architecture Decision Records) -- overkill for a boilerplate
- SECURITY.md -- security practices can be a README section if needed later
- DOCKER.md -- merged into README Docker section
- SETUP.md -- merged into README Quick Start section
- ARCHITECTURE.md -- merged into README Architecture section

## Verification

- All links in README resolve correctly
- `.env.example` referenced in README matches actual file
- Project structure in README matches actual `src/` directory
- npm scripts table matches `package.json`
