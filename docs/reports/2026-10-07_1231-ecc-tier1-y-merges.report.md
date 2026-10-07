---
prd: docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md
plan: docs/plans/2026-10-07_0303-ecc-aprovechamiento.plan.md
tasks: docs/tasks/2026-10-07_0303-ecc-aprovechamiento.tasks.md
status: COMPLETE
created: 2026-10-07_1231
---

# Report: cierre de Fase 4 (merges) + Fase 5 (Tier 1) del plan ECC

Segunda pasada del plan `2026-10-07_0303-ecc-aprovechamiento`. La primera dejó T-014..T-016,
T-018, T-021 y T-022 pendientes; esta sesión las cierra. Fuente: `/home/marcelo/dev/ECC/skills/`.

## Qué se hizo

### AC-05 — Merges de skills homónimas (T-014, T-015, T-016, T-018)

| Skill | Secciones portadas de ECC |
|---|---|
| `frontend-patterns` | Error Boundary (con placement rules + `reportError`), virtualización con `@tanstack/react-virtual` (código completo + aviso de contenedor con altura acotada), Focus Management (guardar/restaurar `activeElement` en el `cleanup`, trap Tab, `Escape`), Keyboard Navigation para widgets compuestos, Animation Patterns (`AnimatePresence`, solo `opacity`/`transform`, `prefers-reduced-motion`), 4 anti-patterns nuevos |
| `backend-patterns` | Caching (cache-aside + invalidación en escritura, stampede, no cachear checks de autorización cross-user), Background Jobs & Queues (broker durable, consumidor idempotente, DLQ, payload por identificador), Retry con backoff exponencial + jitter + presupuesto de reintentos, JWT verificado en el borde (algoritmo pineado, `iss`/`aud`, claims sin confiar), RBAC role→permission map (deny by default, un solo módulo), 7 anti-patterns nuevos |
| `database-migrations` | PG11+ `ADD COLUMN ... DEFAULT` sin rewrite (y cuándo no), `CREATE INDEX CONCURRENTLY` fuera de transacción + limpieza de índices `INVALID`, backfill con `FOR UPDATE SKIP LOCKED` y reglas de batch, Kysely (`kysely-ctl`, `Kysely<any>` en migraciones, `allowUnorderedMigrations` solo dev), Django (`RunPython` batcheado con modelo histórico + `SeparateDatabaseAndState`), timeline expand-contract por días, +5 filas de anti-patterns |
| `docker-patterns` | Compose Networking (DNS por nombre de servicio, planos frontend/backend, `127.0.0.1:` para puertos publicados), Volume Strategies (named vs bind vs anonymous, `:ro`), `.dockerignore` (contexto = riesgo de fuga de `.env`), Debugging (comandos + diagnóstico de red + orden de diagnóstico), +4 filas de anti-patterns |

Excluido a propósito: los *harness* de instalador propios de ECC (`Hardened CLI Installer Harnesses`).

### AC-06 — Tier 1 importado (T-021, T-022) — 29 skills

- **Arquitectura (4)**: `hexagonal-architecture`, `contract-first`, `architecture-decision-records`, `deployment-patterns`
- **Accesibilidad (2)**: `accessibility`, `frontend-a11y`
- **Testing (2)**: `e2e-testing`, `tdd-workflow`
- **Lenguajes (13)**: `golang-patterns`, `golang-testing`, `rust-patterns`, `rust-testing`, `python-patterns`, `python-testing`, `django-patterns`, `fastapi-patterns`, `springboot-patterns`, `java-coding-standards`, `kotlin-patterns`, `cpp-coding-standards`, `dotnet-patterns`
- **DB (4)**: `mysql-patterns`, `redis-patterns`, `clickhouse-io`, `nestjs-patterns`
- **Design (4)**: `design-system`, `make-interfaces-feel-better`, `motion-foundations`, `motion-patterns`

Adaptación por skill (script `import-tier1`, frontmatter nuevo):
- `description` reordenada para arrancar con `Use when ...` (convención del pack; `validate-frontmatter` no emite warnings).
- `triggers:` curado a mano por skill (8 keywords c/u) para que el router lexico pueda matchear.
- `origin: github.com/affaan-m/ECC` (MIT — compatible; se conserva la atribución).
- Se descartó el bloque `metadata:` de ECC.

Des-adaptación de referencias Claude/ECC (únicas en el set):
- `tdd-workflow`: detector de package manager de ECC → resolución portable (`packageManager` → lockfile → workspace → `npm`); rutas de evidencia `.claude/tdd/` → `docs/reports/tdd/`.
- Escaneo de `claude|anthropic|\.cursor|copilot|ECC` sobre los 29 archivos: 0 restos.

### Deriva interna corregida al cambiar 79 → 108 skills

- `evals/cases/static.json`: E11 `equals` 79→108, E15 `gte` 147→176 (+ `title`/`why`).
- `.opencode/bin/installer-test.js`: `EXPECT_SKILLS` 79→108.
- Recuentos en docs: `README.md`, `.opencode/README.md`, `.opencode/manual/README.md`, `.opencode/CHANGELOG.md` (vía `counts --update`), `AGENTS_INDEX.md` (vía `build-agents-index`), `manual/START-HERE.md`, `manual/COMMANDS.md`, `manual/ARCH.md`, `commands/help.md`, `commands/start-here.md`, `commands/pack-doctor.md`, `examples/README.md`.
- `.agents/skills/router/SKILL.md`: catálogo de skills **+29 filas** (para que el Tier 1 sea enrutable, no solo existente) y contadores 79→108 / 147→176.
- `.agents/skills/pack-reference/SKILL.md`: 72 agents/20 skills → 68/108 (estaba stale desde antes).

## Verificación (8/8 gates)

| Gate | Resultado |
|---|---|
| `counts --check` | exit 0 |
| `validate-frontmatter` | 0 fail (2 warnings pre-existentes: `ui-ux-pro-max`, `vercel-react-best-practices`) |
| `verify-lockfile` | CLEAN — 108 skills + 68 agents |
| `smoke-test` | PASSED |
| `wiring-test` | 8/8 |
| `installer-test` | 43/43 |
| `eval-static` | 22/22 (incluye E16 router lexico y E17 RAG — no regresaron con las 29 filas nuevas) |
| `lint-docs` | 493 .md, new=0 |

`measure-tokens` (E7) sigue GREEN: el boot no carga skills, siguen on-demand.

## Archivos

**Nuevos** (29): `.agents/skills/<tier1>/SKILL.md`.
**Modificados**: `.agents/skills/{frontend-patterns,backend-patterns,database-migrations,docker-patterns,router,pack-reference,tdd-workflow}/SKILL.md`, `.agents/skills/INDEX.md`, `skills-lock.json`, `.opencode/AGENTS_INDEX.md`, `evals/cases/static.json`, `.opencode/bin/installer-test.js`, `README.md`, `.opencode/README.md`, `.opencode/manual/README.md`, `.opencode/manual/START-HERE.md`, `.opencode/manual/COMMANDS.md`, `.opencode/manual/ARCH.md`, `.opencode/CHANGELOG.md`, `.opencode/commands/{help,start-here,pack-doctor}.md`, `.opencode/examples/README.md`, `docs/tasks/2026-10-07_0303-ecc-aprovechamiento.tasks.md`, este report.

## Pendientes conocidos

1. `docs/PROJECT.md` stale (72 agents / 65 commands / 21 skills) — regenerar con `refresh-project` (no tocado: tiene secciones manuales preservadas).
2. Los 2 warnings de frontmatter pre-existentes no se tocaron (fuera de alcance del PRD).

## Próximos pasos
1. Revisar diff y commitear (requiere verbo explícito).
2. Recibir la propuesta de mejoras adicionales de ECC.
