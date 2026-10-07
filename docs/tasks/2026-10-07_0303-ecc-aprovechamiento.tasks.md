---
prd: docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md
plan: docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md
status: COMPLETE
created: 2026-10-07_0303
---

# Tasks: Aprovechamiento de ECC en el pack `open`

## Resumen
- Total: 24 · done: 24 · pending: 0 · blocked: 0
- AC cubiertos: 7/7 (AC-05 y AC-06 completos desde 2026-10-07_1231)
- AC SIN cobertura: ninguno

## Fase 1: Tools nativas (AC-01) [QUICK WIN] ✅ COMPLETA

- [x] T-001 `code` Copiar `git-summary.ts` (de-branding) · ✓ 2026-10-07 — `.opencode/tools/git-summary.ts`
- [x] T-002 `code` Copiar `run-tests`, `check-coverage`, `format-code`, `lint-check`, `security-audit` · ✓ 2026-10-07 — 5 archivos
- [x] T-003 `code` Copiar `changed-files.ts` + `changed-files-store.ts` · ✓ 2026-10-07 — sin `index.ts`
- [x] T-004 `config` Invariante eval (7 tools + store) · ✓ 2026-10-07 — E21 en `evals/cases/static.json`

## Fase 2: Detección destructiva cross-platform (AC-02) [QUICK WIN] ✅ COMPLETA

- [x] T-005 `research` Inventario de patrones · ✓ 2026-10-07 — PolicyEngine era POSIX-only
- [x] T-006 `code` Crear `gateguard.js` (POSIX + Windows, perfiles, warn/block, shell-aware) · ✓ 2026-10-07
- [x] T-007 `code` Endurecer detección: +11 reglas Windows en `policy-rules.json` · ✓ 2026-10-07
- [x] T-008 `test` Self-test del detector · ✓ 2026-10-07 — `gateguard.js --selftest` 21/21; policy-selftest 76/0

## Fase 3: Arranque + drift interno (AC-03, AC-04) [QUICK WIN] ✅ COMPLETA

- [x] T-009 `config` `install-plugins.js` idempotente/auto-reparable + `--check` · ✓ 2026-10-07
- [x] T-010 `chore` Instalar los 3 plugins npm · ✓ 2026-10-07 — 125 paquetes, `--check` exit 0
- [x] T-011 `docs` Remediar counts (3 READMEs) · ✓ 2026-10-07 — `counts --update`
- [x] T-012 `docs` Remediar refs rotas (ARCH, manual/README, docs/README, help, session-end, session-start) · ✓ 2026-10-07

## Fase 4: Skills homónimas (AC-05) [QUICK WIN] 🟡 PARCIAL

- [x] T-013 `code` `security-review`: fix placeholder SQL + guard + `error.issues` + descripción · ✓ 2026-10-07
- [x] T-014 `code` `frontend-patterns`: merge ErrorBoundary, virtualización, focus, animación · ✓ 2026-10-07_1231 — +Error Boundary, código de virtualización, Focus Management, Keyboard Nav, Animation Patterns
- [x] T-015 `code` `backend-patterns`: merge caching, background jobs, JWT/RBAC/retry · ✓ 2026-10-07_1231 — +Caching, Background Jobs & Queues, Retry w/ backoff+jitter, JWT verify pinning, RBAC role→permission map
- [x] T-016 `code` `database-migrations`: merge PostgreSQL patterns, Kysely, Django, timeline · ✓ 2026-10-07_1231 — +PG11 defaults, CONCURRENTLY/INVALID, SKIP LOCKED, Kysely, Django RunPython+SeparateDatabaseAndState, timeline, +5 anti-pattern rows
- [x] T-017 `code` `deep-research`: merge `MCP Requirements` + `Untrusted Sources` · ✓ 2026-10-07
- [x] T-018 `code` `docker-patterns`: merge Networking/Volumes/.dockerignore/Debugging · ✓ 2026-10-07_1231 — +Compose Networking, Volume Strategies, .dockerignore, Debugging (skip harness ECC)
- [x] T-019 `code` Fixes menores: `coding-standards` (Zod), `verification-loop` (pipefail/--no-install), descripciones truncadas · ✓ 2026-10-07
- [x] T-020 `config` Regenerar `skills-lock.json` + `build-skills-index` · ✓ 2026-10-07 — lockfile CLEAN

## Fase 5: Tier 1 skills (AC-06) [FASE POSTERIOR]

- [x] T-021 `docs` Importar arquitectura + accesibilidad + testing (8) · ✓ 2026-10-07_1231 — hexagonal-architecture, contract-first, architecture-decision-records, deployment-patterns, accessibility, frontend-a11y, e2e-testing, tdd-workflow
- [x] T-022 `docs` Importar lenguajes + DB + design (21) · ✓ 2026-10-07_1231 — golang/rust/python/django/fastapi/springboot/java/kotlin/cpp/dotnet (+tests), mysql, redis, clickhouse-io, nestjs, design-system, make-interfaces-feel-better, motion-foundations, motion-patterns

## Fase 6: Verificación (AC-07) ✅

- [x] T-023 `test` Batería completa · ✓ 2026-10-07 — 8/8 gates verdes
- [x] T-024 `docs` `/verify` → `/audit-report` → `/trace` → `/definition-of-done` · ✓ 2026-10-07 — report + DoD

## Matriz de cobertura de AC

| AC | Criterio (resumen) | Tareas | Estado |
|----|--------------------|--------|--------|
| AC-01 | Tools nativas portadas | T-001..T-004 | ✅ done |
| AC-02 | Detección destructiva cross-platform | T-005..T-008 | ✅ done |
| AC-03 | Arranque sin cuelgue | T-009, T-010 | ✅ done |
| AC-04 | Drift interno cero | T-011, T-012 | ✅ done |
| AC-05 | 14 skills homónimas actualizadas | T-013..T-020 | ✅ done (13/13; api-design dedupe no aplicó) |
| AC-06 | Tier 1 importado | T-021, T-022 | ✅ done — 29 skills, frontmatter `triggers:`+`origin` |
| AC-07 | No regresión | T-004, T-020, T-023, T-024 | ✅ done |

## Pendientes (fase posterior)

1. **Merges de secciones** (T-014..T-016, T-018): contenido extenso de ECC → `frontend-patterns`, `backend-patterns`, `database-migrations`, `docker-patterns`.
2. **Tier 1 skills** (T-021, T-022): ~26 skills curadas + adaptadas.
