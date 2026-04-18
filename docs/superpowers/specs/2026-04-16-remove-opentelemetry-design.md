# Remove OpenTelemetry Instrumentation

**Date:** 2026-04-16
**Status:** Completed

## Goal

Remove OpenTelemetry from the boilerplate. It adds dependency weight (~15 transitive packages) without providing value in a starter template. Users who need observability can add it themselves.

## Scope

Pure removal -- no replacement, no new code. OTel is self-contained with zero coupling to business logic.

## Changes

### Delete files

| File | Reason |
|------|--------|
| `src/instrumentation.ts` | Entire OTel setup |
| `docs/adr/005-opentelemetry-observability.md` | ADR for the removed feature |

### Edit files

| File | Change |
|------|--------|
| `package.json` | Remove `--import` flags from `start` and `dev` scripts. Uninstall 5 `@opentelemetry/*` dependencies. |
| `src/config/env.schema.ts` | Remove `OTEL_ENABLED`, `OTEL_EXPORTER_ENDPOINT`, `OTEL_SERVICE_NAME` from schema |
| `.env.example` | Remove OpenTelemetry section (lines 55-58) |
| `README.md` | Remove OTel row from tech stack table, env vars table, and features list |
| `docs/SETUP.md` | Remove `OTEL_ENABLED` line from Optional Modules section |
| `SECURITY.md` | Remove `OTEL_ENABLED=true` recommendation line |
| `docs/ARCHITECTURE.md` | Remove ADR-005 row from ADR table |

### Dependencies to uninstall

- `@opentelemetry/api`
- `@opentelemetry/auto-instrumentations-node`
- `@opentelemetry/exporter-metrics-otlp-http`
- `@opentelemetry/exporter-trace-otlp-http`
- `@opentelemetry/sdk-node`

### Verification

- `npm run build` succeeds
- `npm test` passes
- `grep -r "opentelemetry\|OTEL\|instrumentation" src/ docs/ --include="*.ts" --include="*.md"` returns no matches
