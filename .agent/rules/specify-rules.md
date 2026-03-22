# backend-template Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-10

## Active Technologies
- Markdown + None (002-remove-claude-md)
- None (002-remove-claude-md)
- JavaScript (ES2020+, JSX) via Vite 7 + esbuild + React 19, react-admin 5.14, jwt-decode 4, query-string (transitive via react-admin) (003-clean-frontend-utils)
- N/A (frontend only — localStorage for tokens) (003-clean-frontend-utils)
- TypeScript 5 on Node.js ≥ 24 + Express.js 5, tsx 4.21+, tsc-alias, ts-jes (004-fix-backend-warnings)
- MongoDB 8 + Mongoose (unchanged) (004-fix-backend-warnings)

- TypeScript 5 / Node.js 24 + Jest 30, Supertest, mongodb-memory-server (testing only) (001-fix-template-quality-gaps)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5 / Node.js 24: Follow standard conventions

## Recent Changes
- 004-fix-backend-warnings: Added TypeScript 5 on Node.js ≥ 24 + Express.js 5, tsx 4.21+, tsc-alias, ts-jes
- 003-clean-frontend-utils: Added JavaScript (ES2020+, JSX) via Vite 7 + esbuild + React 19, react-admin 5.14, jwt-decode 4, query-string (transitive via react-admin)
- 002-remove-claude-md: Added Markdown + None


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
