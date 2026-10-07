---
prd: docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md
plan: docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md
status: COMPLETED
created: 2026-10-07_0303
audited: 2026-10-07_0320
verdict: PASS-WITH-NITS
---

# Aprovechamiento de ECC en el pack `open` — Report de ejecución (quick wins)

> Generado por `/verify` + `/audit-report` el 2026-10-07 (tras implementar M1–M4 parcial).
> PRD: `docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md`
> Plan: `docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md`
> Tasks: `docs/tasks/2026-10-07_0303-ecc-aprovechamiento.tasks.md`

## Status
COMPLETED (quick wins) — 5 milestones planificados; **4 completos** (M1, M2, M3, M5-parcial) y **1 parcial** (M4). Batería 8/8 verde.

## Contexto
Cerrar las brechas de mayor ROI frente a ECC (`D:\dev\2026\ECC`) sin regresión: tools nativas, detección destructiva cross-platform, arranque + drift interno, y actualización de las 14 skills homónimas. Tier 1 de skills queda como fase posterior.

## Agentes usados

| Fase | Agente | Output | Status |
|------|--------|--------|--------|
| 0 | prd-agent (grill-me) | `docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md` | OK |
| 1 | planner | `docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md` | OK |
| 2 | primary | tools + gateguard + boot + drift + skills | OK |
| 2 | explore (delegado) | comparación de 14 skills homónimas | OK |

## Criterios (evidencia)

| AC | Criterio | Resultado | Evidencia |
|----|----------|-----------|-----------|
| AC-01 | Tools nativas portadas | ✅ PASS | 7 tools + store en `.opencode/tools/` y `.opencode/plugins/lib/`; eval E21 |
| AC-02 | Detección destructiva cross-platform | ✅ PASS | `gateguard.js` (21/21 self-test) + 11 reglas Windows en `policy-rules.json`; policy-selftest 76/0; eval E22 |
| AC-03 | Arranque sin cuelgue | ✅ PASS | `install-plugins.js --check` exit 0 (3 plugins instalados, 125 paquetes) |
| AC-04 | Drift interno cero | ✅ PASS | `counts --check` exit 0; `lint-docs` new=0 |
| AC-05 | 14 skills homónimas actualizadas | 🟡 PARCIAL | 9/13: `security-review`, `deep-research`, `coding-standards`, `verification-loop`, descripciones truncadas; **4 merges grandes pendientes** (frontend/backend/db/docker) |
| AC-06 | Tier 1 importado | ⏸ PENDIENTE | Fase posterior (T-021/T-022) |
| AC-07 | No regresión | ✅ PASS | 8/8 gates verdes |

### Batería de gates

| Gate | Resultado |
|------|-----------|
| `counts --check` | exit 0 |
| `validate-frontmatter` | 0 fail (2 warnings pre-existentes) |
| `verify-lockfile` | CLEAN (79 skills, 68 agents) |
| `smoke-test` | 21/21 |
| `wiring-test` | 8/8 |
| `installer-test` | 43/43 PASS |
| `eval-static` | 22/22 |
| `lint-docs` | new=0 (453 .md) |

## Decisiones
- **Q1–Q6** (grill-me): alcance Quick wins + Tier 1; import curado; plugin dedicado cross-platform; ejecutar quick wins; equivalencias en el PRD; comparar skills homónimas.
- **Detección destructiva**: el pack ya tenía un `PolicyEngine` declarativo (evolucionó desde el reporte, que describía un `DestructiveWarner` POSIX). Se resolvió en dos capas complementarias: (1) 11 reglas Windows + POSIX en `policy-rules.json` (motor declarativo), (2) `gateguard.js` dedicado con clasificación *shell-aware* (unwrap de `sh -c`, `cmd /c`, `powershell -Command`, `sudo`, `env`) + perfiles `GATEGUARD_MODE` (warn/block/off). No se duplicó: `warn` por defecto, el motor mantiene el `deny` catastrófico.
- **Boot**: `install-plugins.js` pasó de "skip si `node_modules` existe" a verificar cada dependencia declarada y auto-reparar (con `--check` y `--force`).

## Desvíos / Incidentes
1. **El reporte de origen describía `hookify.js` con `DestructiveWarner`**, pero el archivo real ya tenía `PolicyEngine` + `SecretBlocker` + `PermissionAsk` (otra sesión lo evolucionó). Se adaptó la solución a la arquitectura real (data-driven + plugin dedicado) en vez de crear un detector redundante.
2. **`counts` cambió `plugins_local` 2→3** al añadir `gateguard.js`; se regeneraron 3 READMEs con `counts --update`.
3. **2 warnings de frontmatter** introducidos por descripciones ECC que no arrancaban con "Use when..."; corregidas para respetar la convención del pack.
4. **`docs/tasks/` no existía**; se creó con el flujo `/tasks`.

## Archivos
**Nuevos**: `.opencode/tools/{git-summary,run-tests,check-coverage,format-code,lint-check,security-audit,changed-files}.ts`, `.opencode/plugins/lib/changed-files-store.ts`, `.opencode/plugins/gateguard.js`, `docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md`, `docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md`, `docs/tasks/2026-10-07_0303-ecc-aprovechamiento.tasks.md`, este report.
**Modificados**: `.opencode/bin/install-plugins.js`, `.opencode/policy-rules.json`, `evals/cases/static.json`, `.agents/skills/{security-review,documentation-lookup,intent-driven-development,coding-standards,verification-loop,deep-research}/SKILL.md`, `.agents/skills/INDEX.md`, `skills-lock.json`, `README.md`, `.opencode/README.md`, `.opencode/manual/README.md`, `.opencode/manual/ARCH.md`, `.opencode/commands/{help,session-end,session-start}.md`, `docs/README.md`.

## Pendientes (fase posterior)
1. **Merges de secciones** (T-014..T-016, T-018): contenido extenso de ECC → `frontend-patterns` (ErrorBoundary/virtualización/focus/animación), `backend-patterns` (caching/jobs/JWT), `database-migrations` (PostgreSQL/Kysely/Django), `docker-patterns` (Networking/Volumes/.dockerignore/Debugging).
2. **Tier 1 skills** (T-021, T-022): ~26 skills curadas + adaptadas (`triggers:` + `origin`).

## Próximos pasos
1. Revisar diff y commitear (requiere verbo explícito).
2. Continuar con T-014..T-018 y T-021..T-022.

---
*Auditable via `/audit-report ecc-aprovechamiento`.*
