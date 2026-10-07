---
prd: docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md
status: APPROVED
created: 2026-10-07_0303
---

# Plan: Aprovechamiento de ECC en el pack `open`

> Consume el PRD `2026-10-07_0303-ecc-aprovechamiento.prd.md`.
> Quick wins (Fases 1–4) se implementan en la sesión de ejecución; Tier 1 (Fase 5) queda para fases posteriores.

## Requirements Restatement
Cerrar 5 brechas frente a ECC sin regresión: (1) tools nativas portadas, (2) detección destructiva cross-platform, (3) arranque + drift interno, (4) 14 skills homónimas actualizadas, (5) Tier 1 de skills importado. Toda la batería del pack debe seguir verde.

## Implementation Phases

### Fase 1 — Tools nativas (AC-01) [QUICK WIN]
- 1.1 Leer y validar cada tool de ECC (`git-summary`, `run-tests`, `check-coverage`, `format-code`, `lint-check`, `security-audit`) — confirmar solo `@opencode-ai/plugin` + stdlib.
- 1.2 Copiar a `.opencode/tools/` y de-brandear (`ECC_*`, rutas).
- 1.3 Copiar `changed-files.ts` + `plugins/lib/changed-files-store.ts`.
- 1.4 **No** copiar `dependency-analyzer.ts` (stub) ni `tools/index.ts` (alias `index_*`).
- 1.5 Añadir invariante a `evals/cases/static.json` (7 tools presentes) + regenerar `AGENTS_INDEX`/counts si aplica.

### Fase 2 — Detección destructiva cross-platform (AC-02) [QUICK WIN]
- 2.1 Inventariar patrones actuales de `hookify.js` (POSIX-only).
- 2.2 Crear `.opencode/plugins/gateguard.js`: clasificador cross-platform (POSIX + Windows), perfiles (`minimal`/`standard`/`strict`), modos `warn`/`block`, allowlist de comandos rutinarios, log sin credenciales.
- 2.3 Endurecer `hookify.js`: delegar la parte destructiva a `gateguard` o sumar patrones Windows.
- 2.4 Test del plugin: 8 comandos (4 POSIX + 4 Windows) → detectados; allowlist no dispara.

### Fase 3 — Arranque + drift interno (AC-03, AC-04) [QUICK WIN]
- 3.1 Verificar `node_modules` del pack; ajustar `install-plugins.js` para que sea idempotente (no skipear si faltan deps).
- 3.2 Instalar los 3 plugins npm declarados.
- 3.3 Remediar drift: counts (README/manual/AGENTS_INDEX/INDEX), refs a `/instinct-status`, `/promote`, `/learn`, `/context`, `session-start.md` (`.agents\sessions` → `docs\sessions`), `pack-doctor.md` (counts stale).
- 3.4 Correr `counts --check` + `lint-docs` hasta new=0.

### Fase 4 — Skills homónimas (AC-05) [QUICK WIN]
- 4.1 `security-review`: portar fix placeholder SQL + guard + `error.issues`; completar descripción.
- 4.2 `frontend-patterns`: merge ErrorBoundary, virtualización, focus management, animación.
- 4.3 `backend-patterns`: merge caching, background jobs, JWT/RBAC/retry.
- 4.4 `database-migrations`: merge PostgreSQL patterns, Kysely, Django, timeline.
- 4.5 `deep-research`: merge `MCP Requirements` + `Untrusted Sources`.
- 4.6 `docker-patterns`: merge Networking/Volumes/.dockerignore/Debugging (skip harness ECC).
- 4.7 Fixes menores: `coding-standards` (Zod), `verification-loop` (pipefail/--no-install), descripciones truncadas (`documentation-lookup`, `intent-driven-development`), dedupe `api-design`.
- 4.8 Regenerar `skills-lock.json` + `build-skills-index`.

### Fase 5 — Tier 1 skills (AC-06) [FASE POSTERIOR]
- 5.1 Por cada skill Tier 1: copiar `SKILL.md`, adaptar frontmatter (`triggers:` + `origin`), revisar.
- 5.2 `validate-frontmatter` + `verify-lockfile` + `build-skills-index`.

### Fase 6 — Verificación y no-regresión (AC-07)
- 6.1 Correr la batería completa (counts, validate-frontmatter, verify-lockfile, smoke-test, lint-docs, wiring-test, installer-test, eval-static).
- 6.2 `/verify` → `/audit-report` → `/trace` → `/definition-of-done`.

## Dependencies
- Node 18+; `@opencode-ai/plugin` (ya en `.opencode/package.json`).
- Acceso de lectura a `D:\dev\2026\ECC` (fuente).
- Los CLIs del pack (`bin/*.js`) para verificación.

## Risks
- **HIGH**: editar skills homónimas rompe `verify-lockfile` (sha256) → regenerar lockfile tras cada edición.
- **MEDIUM**: falsos positivos del detector en Windows → modo `warn` por defecto + allowlist.
- **MEDIUM**: instalar plugins npm altera `node_modules` → no versionar; idempotencia.
- **LOW**: drift interno con más referencias de las detectadas → gate `lint-docs`.

## Estimated Complexity
**MEDIUM** — Fases 1, 2 y 3 son mecánicas/creativas acotadas; Fase 4 es la más laboriosa (merge de contenido). Fase 5 es de mayor volumen pero de bajo riesgo (copia + adaptación de formato).

---
*Plan aprobado. Siguiente: `/tasks`.*
