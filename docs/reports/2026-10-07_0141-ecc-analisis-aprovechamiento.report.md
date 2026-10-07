# ECC → pack `open` · Análisis de `.opencode` y de la capa Claude, y aprovechamiento

> Generado por análisis multi-agente el 2026-10-07 01:41.
> Origen analizado: `D:\dev\2026\ECC` (repo `affaan-m/ECC`, `ecc-universal` v2.2.3).
> Destino: `D:\dev\2026\open` (pack `open`).
> Alcance: (1) qué hace `ECC/.opencode`, (2) toda la capa construida para Claude, (3) qué es portable a OpenCode, (4) cómo mejora al pack `open`.

## Status
`COMPLETED` — análisis de solo lectura. 0 archivos de ECC modificados. Recomendaciones priorizadas listas para decidir.

---

## Resumen ejecutivo

**Veredicto sobre `ECC/.opencode`:** funcional y mantenido activamente, pero es el **harness secundario** del repo. El código es sólido; la "inmadurez" está en el *bookkeeping* (documentación y config desincronizadas), no en la ingeniería. Trae piezas muy reutilizables (8 tools nativas, un plugin de hooks, 25 prompts de agente).

**Veredicto sobre la capa Claude:** ahí está el músculo real de ECC — runtime de hooks con perfiles y *fail-closed*, memoria + *continuous learning* (instincts con confianza), GateGuard (clasificador de comandos destructivos), ciclo de instalación `doctor/repair/uninstall`, *rules packs* por lenguaje, y *Workflows* multi-agente. La mayoría es **Claude-específico**, pero varias **ideas** son portables a OpenCode vía plugins.

**Veredicto sobre nuestro pack:** ya es maduro y en varias dimensiones está por delante de ECC-OpenCode (eval harness, router BM25, ciclo SDD, lockfile, 4 capas de memoria). Las brechas reales frente a ECC son: **(a) 0 tools nativas** (ECC tiene 8), **(b) cobertura de hooks fina** (solo `tool.execute.before` + `event`), **(c) sin ciclo `doctor/repair/uninstall`**, **(d) sin `rules` always-loaded**, y **(e) catálogo de skills angosto en lenguajes/verticales** (ECC: 293 vs 78; solo 14 coinciden por nombre).

**Mayor ROI inmediato:** portar los **8 tools** de ECC (drop-in) y endurecer `hookify.js` con los patrones de GateGuard + añadir los hooks de `session.idle`/`compacting`/`shell.env`/`permission.ask`.

---

# PARTE 1 — Qué hace `ECC/.opencode`

## 1.1 Estructura

```
.opencode/
├── opencode.json          # config principal (26 agents, 26 commands, plugin, instructions)
├── index.ts               # entry npm (export default del plugin)
├── package.json           # ecc-universal v2.2.3, peerDep @opencode-ai/plugin >=1.0.0
├── tsconfig.json          # ES2022/NodeNext, strict, outDir dist/
├── plugins/
│   ├── index.ts
│   ├── ecc-hooks.ts       # 635 L — TODOS los hooks (Claude → OpenCode)
│   └── lib/changed-files-store.ts   # 98 L — store en memoria de archivos cambiados
├── tools/                 # 8 tools nativas + index.ts barrel
├── prompts/agents/        # 25 .txt (system prompts de subagentes)
├── instructions/INSTRUCTIONS.md   # 337 L — rules consolidadas
├── commands/              # 35 .md (26 wireadas + 9 huérfanas)
├── dist/                  # build (gitignored, STALE)
├── README.md · MIGRATION.md
└── .gitignore · .npmignore
```

## 1.2 `opencode.json`

- `default_agent: "build"` (agent built-in).
- `instructions`: `AGENTS.md`, `CONTRIBUTING.md`, `instructions/INSTRUCTIONS.md` + **11 skills** (`tdd-workflow`, `security-review`, `coding-standards`, `frontend-patterns`, `frontend-slides`, `backend-patterns`, `e2e-testing`, `verification-loop`, `api-design`, `strategic-compact`, `eval-harness`).
- `plugin: ["./plugins"]` (carga el TS fuente directo en modo clone).
- `skills.paths: ["../skills"]` (estilo nuevo) **+** skills en `instructions` (estilo viejo) → mezcla de dos mecanismos.
- `agent`: **26** subagentes; prompts vía `{file:prompts/agents/<name>.txt}`; `tools` booleanos.
- `command`: **26** entradas con `template: "{file:commands/<x>.md}\n\n$ARGUMENTS"`, `agent`, `subtask`.
- `permission: { "mcp_*": "ask" }`.

## 1.3 Plugin de hooks (`ecc-hooks.ts`, 635 L)

Traduce el modelo Claude a eventos OpenCode. Eventos implementados:

| Evento OpenCode | Qué hace |
|---|---|
| `file.edited` | Auto-format Prettier (solo `strict`) + warning `console.log` (standard/strict) |
| `tool.execute.after` | `tsc --noEmit` tras editar `.ts/.tsx` (strict) + log de PR creado |
| `tool.execute.before` | Recordatorio git-push (strict), warning de `.md` no estándar, recordatorio de comandos largos (strict) |
| `session.created` | Carga contexto, detecta `CLAUDE.md` |
| `session.idle` | Auditoría `console.log` de archivos editados + notificación de escritorio cross-platform |
| `session.deleted` | Cleanup |
| `file.watcher.updated` | Tracking de cambios |
| `todo.updated` | Log de progreso |
| `shell.env` | Inyecta `PROJECT_ROOT`, `PACKAGE_MANAGER`, `DETECTED_LANGUAGES`, `PRIMARY_LANGUAGE`, `ECC_VERSION` |
| `experimental.session.compacting` | Inyecta bloque de contexto a preservar durante compactación |
| `permission.ask` | Auto-aprueba reads/formatters/tests; log de auditoría; *fail-closed* ante error |

Controles de runtime: `ECC_HOOK_PROFILE` (`minimal`/`standard`/`strict`) y `ECC_DISABLED_HOOKS` (IDs CSV).

## 1.4 Tools nativas (8)

Todas usan la misma API (`import { tool } from "@opencode-ai/plugin/tool"`, zod vía `tool.schema`, `execute(args, context)` devuelve string JSON):

| Tool | Qué hace | Reusable |
|---|---|---|
| `run-tests` | Detecta PM + framework, **devuelve comando** | Sí (drop-in) |
| `check-coverage` | Lee reportes istanbul/nyc, pass/fail vs umbral | Sí |
| `security-audit` | Regex de secretos + anti-patrones en `src/` | Sí (opinionated) |
| `format-code` | Mapea extensión→formatter, devuelve comando | Sí |
| `lint-check` | Detecta biome/eslint/ruff/pylint/golangci-lint | Sí |
| `git-summary` | `git branch/status/log/diff` vía `execFileSync` + validación anti-inyección | Sí (el mejor) |
| `changed-files` | Árbol ASCII/JSON de cambios de sesión | Sí + requiere el store |
| `dependency-analyzer` | **Scaffold**: `outdated` siempre `false`, `unused` `0` | Portable pero incompleto |

## 1.5 Madurez — señales

**Positivas:** tests en la raíz (`opencode-config/opencode-tools/opencode-plugin-hooks.test.js`), 12+ commits recientes, código *security-conscious* (validación de refs en git-summary, regex de secretos, errores sin filtrar rutas).

**Negativas (drift documental severo):**

| Fuente | Dice | Realidad |
|---|---|---|
| `.opencode/README.md` tablas | 26 agents / 26 commands | ✅ coincide |
| `.opencode/README.md` sample config | 12 agents / 24 commands | ❌ |
| `MIGRATION.md` | 12 agents / 23 commands / 16 skills | ❌ |
| `instructions/INSTRUCTIONS.md` | tabla de 12 agents; "OpenCode no soporta hooks" | ❌ contradice su propio plugin |
| `ecc-hooks.ts` (bloque compacting) | "v2.2.3 · 13 agents" | ❌ |
| `dist/index.js` | VERSION 1.6.0 · agents 13 / commands 31 / skills 37 | ❌ 2 versiones atrás |

**Huérfanos / muertos:** 9 commands sin wirear (`harness-audit`, `loop-start`, `loop-status`, `model-route`, `quality-gate`, `rust-build`, `rust-review`, `rust-test`, `security-scan`); `tools/index.ts` auto-registra alias `index_*` redundantes; `dist/` stale y gitignored; registro de tools duplicado (plugin `tool` map vs auto-discovery de `tools/`); el frontmatter `agent:` de los commands es inerte (el wireo real es el campo `agent` del config).

**Issues referenciadas:** #2530 (resiliencia de import lazy del store), #2477 (bug de namespace de agent-id).

**Conclusión:** `.opencode` es un **puerto secundario trailing** respecto a Claude. No copiar su `opencode.json` ni su doc; sí sus tools, prompts y la *idea* del plugin.

---

# PARTE 2 — Toda la capa construida para Claude

Aquí es donde ECC concentró el trabajo. Se clasifica por portabilidad.

## 2.1 `CLAUDE.md` + `.claude/`

- `CLAUDE.md`: overview + **Prompt Defense Baseline** (6 bullets) + comandos de test + arquitectura + tabla de skills por archivo.
- `.claude/`:
  - `commands/` (3 scaffolds con frontmatter `name`/`description`/`allowed-tools`): `add-language-rules`, `database-migration`, `feature-development`.
  - `ecc-tools.json` (326 L): manifiesto *enterprise* con componentes, grafo de dependencias, archivos gestionados y adapters `claudeCode`/`codex`.
  - `identity.json` / `package-manager.json`: estado (nivel técnico, estilo, PM detectado).
  - `enterprise/controls.md`: gobernanza (aprobaciones, supresión de auditorías).
  - `homunculus/instincts/inherited/ecc-instincts.yaml`: **8 instincts curados** (`id`/`trigger`/`confidence`/`domain`/`source`) — semilla de continuous learning.
  - `research/ecc-research-playbook.md`.
  - `rules/`: `ecc-guardrails.md` (baseline + git + estilo) y `node.md`.
  - `team/ecc-team-config.json`.
  - `workflows/ecc-pro-security-roadmap.js`: **Claude Workflow** (`phase()`/`parallel()`/`agent()` + JSON Schemas).
- **Portabilidad:** ubicación/formato Claude-específicos. El *contenido* (rules, research, team, enterprise, instincts) es portable; el *routing* no.

## 2.2 `.claude-plugin/`

- `plugin.json`: `name: ecc`, `skills: ["./skills/"]`, `commands: ["./commands/"]`, `mcpServers: {}`, `userConfig` (`hooks_enabled`, `hook_profile`).
- `marketplace.json`: catálogo `ecc@ecc`.
- `PLUGIN_SCHEMA_NOTES.md` (231 L): reglas del validador estricto de Claude — **no** añadir `agents` ni `hooks` (auto-descubiertos; error si se duplican), mantener `mcpServers: {}`, `tools:` de agente debe ser CSV escalar (no array YAML).
- **Portabilidad:** nula (formato Claude). Útil solo como referencia de "gotchas" de validación.

## 2.3 `hooks/` — el runtime de enforcement (el corazón)

- `hooks.json`: grafo con **7 eventos** — `PreToolUse`, `PreCompact`, `SessionStart`, `PostToolUse`, `PostToolUseFailure`, `Stop`, `SessionEnd`. Entradas `{ matcher: <regex>, hooks: [{ type, command, timeout, async }] }`.
- `hooks.metadata.json`: **sidecar** con `id` + `description` + **fingerprint** (porque el schema de Claude rechaza claves extra). `scripts/ci/validate-hooks.js` falla si el fingerprint driftea; `check-hooks-schema-keys.js` rechaza claves desconocidas.
- `scripts/hooks/run-with-flags.js` (306 L): wrapper de runtime — lee stdin acotado (1 MiB), chequea `isHookEnabled(id, {profiles})`, dry-run, rechaza path traversal, prefiere `require()` sobre `spawn`, drena stdout (#2222), y **fail-closed** (exit 2) para GateGuard/MCP-health ante stdin truncado.
- Perfiles: `minimal` / `standard` (default) / `strict`. Env: `ECC_HOOKS_ENABLED`, `ECC_HOOK_PROFILE`, `ECC_DISABLED_HOOKS`, `ECC_HOOK_INPUT_MAX_BYTES`, `ECC_GATEGUARD`, etc.

**Hooks notables:**

| Hook ID | Evento | Enforce |
|---|---|---|
| `pre:bash:dispatcher` | PreToolUse Bash | Preflight consolidado: bloqueo de dev-server, tmux, git-push, calidad pre-commit, GateGuard |
| `pre:edit-write:gateguard-fact-force` | PreToolUse Edit/Write | **GateGuard**: bloquea el primer Edit/Write por archivo y exige *facts* (importers, API, schemas, instrucción citada) |
| `pre:config-protection` | PreToolUse Write/Edit | **Bloquea** editar configs de linter/formatter (forzar a arreglar el código) |
| `pre:mcp-health-check` | PreToolUse `^mcp__` | Bloquea MCP no sano; fail-closed |
| `pre:compact` | PreCompact | Guarda estado antes de compactar |
| `session:start` | SessionStart | Carga contexto acotado + **instincts activos** (confianza ≥0.7, max 6, rankeados) + skills aprendidas + **stale-replay guard** |
| `post:dispatcher:sync/async` | PostToolUse `.*` | Build/format/typecheck/console-warn en un solo proceso |
| `stop:format-typecheck` | Stop | Batch format (Biome/Prettier) + `tsc` de todo lo editado |
| `stop:session-end` | Stop | Persiste estado de sesión (transcript) |
| `stop:evaluate-session` | Stop | Evalúa patrones extraíbles (continuous learning) |
| `stop:cost-tracker` | Stop | Telemetría de tokens/costo |

**Scripts clave:**
- `gateguard-fact-force.js` (~1400 L): clasificador *shell-quoting-aware* de comandos destructivos (`rm -rf`, `git reset --hard/push --force/clean/commit --amend/branch -D/stash drop/reflog expire`, `dd`, SQL destructivo, `find -exec`, `sh -c`, `sudo/env` unwrap, heredocs), con estado atómico por sesión en `~/.gateguard` y 30 min de timeout. Referencia GHSA-4v57-ph3x-gf55.
- `session-start.js` (840 L): contexto + instincts + **stale-replay guard** (envuelve resúmenes previos como "HISTORICAL REFERENCE ONLY" para no re-ejecutar `/commands` tras compactar).
- `session-end.js` (360 L): parsea el JSONL de Claude, resume con LLM opcional, escribe `*-session.tmp` con marcadores `<!-- ECC:SUMMARY:START/END -->`.

- **Portabilidad:** el **grafo** es Claude-específico; el **runtime Node** es cross-platform. OpenCode tiene su propio port (`.opencode/plugins`). Las **ideas** (perfiles, fail-closed, sidecar+fingerprint, gateguard, stale-replay guard) son altamente portables.

## 2.4 `rules/` — siempre cargadas (portable)

`common/` (10 files: agents, code-review, coding-style, development-workflow, git-workflow, hooks, patterns, performance, security, testing) + **21 packs de lenguaje/dominio** (angular, arkts, cpp, csharp, dart, fsharp, golang, java, kotlin, nuxt, perl, php, python+fastapi, react, react-native, ruby, rust, swift, typescript, vue, web). Formato markdown con `> This file extends [common/xxx.md] …` y frontmatter `paths:` glob. Prioridad: lenguaje sobre common. `rules-core` targetea 12 harnesses.

## 2.5 `manifests/`, `schemas/`, `contexts/`, `integrations/`, `mcp-configs/`

- `manifests/`: `install-profiles.json` (**7 perfiles**: minimal, opencode, core, developer, security, research, full), `install-modules.json` (**33 módulos** con `id/kind/paths/targets/dependencies/cost/stability`), `install-components.json` (familias), `pi-core.json`.
- `schemas/`: **16 JSON Schemas** (plugin, hooks, hooks-metadata, install-*, memory, package-manager, provenance, state-store, capsule-envelope, context-*).
- `contexts/`: `dev.md`, `research.md`, `review.md` (snippets de system-prompt).
- `integrations/aura/`: adaptador Python con `THREAT_MODEL.md`.
- `mcp-configs/mcp-servers.json`: catálogo de **~35 MCP servers** con `_comments` de uso.

## 2.6 `scripts/` — automatización (mixto)

- `ecc.js` (CLI bin `ecc`): `setup`, `install`, `doctor`, `repair`, `uninstall`, `memory`, `list-installed`, `sessions`, `loop-status`, `harness-audit`, `platform-audit`, `security-ioc-scan`… con `--dry-run` global.
- **Ciclo de vida con ownership**: `install-apply.js` escribe *install-state*; `doctor` detecta drift; `repair` reconstruye archivos gestionados; `uninstall` borra solo lo que registró. `install-guided.js` = wizard multi-harness.
- **Memoria** (`ecc memory` / unified-memory): scopes `project|team|user`; kinds context/decision/fact/handoff/lesson/note/preference/runbook; **create-only, siempre unreviewed**, **rechaza shapes de credenciales**, cuerpos acotados, schemas JSON versionados, sanitización ANSI/bidi. MCP local opcional `ecc-memory-mcp`.
- **Continuous learning**: `observe-runner.js` → `continuous-learning-v2/hooks/observe.sh`; instincts en `.claude/homunculus/instincts/{personal,inherited}`; `session-inspect.js` (skills health/amendify/evaluate).
- **Sessions/state**: SQLite state-store + `sessions-cli.js`, `loop-status.js`, `status.js`.
- **Sync/build**: `sync-ecc-to-codex.sh`, `build-opencode.js` (tsc → `.opencode/dist`).

## 2.7 Agentes, commands, guías

- **`agents/` (68)**: frontmatter `name`, `description`, `tools` (CSV escalar), `model` (opus/sonnet). **Todo agente abre con los 6 bullets del Prompt Defense Baseline.**
- **`commands/` (94)**: frontmatter `description` (+ `argument-hint`); lógica durable vive en `skills/` (commands = shims de migración).
- **`SOUL.md`** (identidad + 5 principios: Agent-First, Test-Driven, Security-First, Immutability, Plan-Before-Execute) + guías `the-shortform-guide.md`, `the-longform-guide.md`, `the-security-guide.md` (vectores de ataque, CVEs de Claude Code, sandboxing, kill switches).

---

# PARTE 3 — Comparativa con el pack `open`

| Dimensión | ECC | `open` | Ventaja |
|---|---|---|---|
| Skills | 293 | 78 | ECC (volumen); `open` (profundidad propia) |
| Agents | 68 | 67 | Empate |
| Commands | 94 | 64 | ECC |
| Tools nativas OpenCode | **8** | **0** | **ECC** |
| Plugins OpenCode | 1 (hooks) | 2 locales + 3 npm | `open` (más variedad) |
| Cobertura de hooks | 11 eventos | 2 eventos (`tool.execute.before` + `event`) | **ECC** |
| CI / evals | tests Node | eval harness + 8 gates CI + invariantes | **`open`** |
| Router | — | BM25 (`route-match.js`) | **`open`** |
| Ciclo SDD | commands shims | `/prd→/spec-lint→/plan→/tasks→/spec-to-tests→/verify→/audit-report` | **`open`** |
| Lockfile integridad | — | `skills-lock.json` sha256 | **`open`** |
| Memoria | vault + instincts + SQLite | PROJECT.md + sessions + state + instincts + knowledge (BM25) | Empate |
| Ciclo install | doctor/repair/uninstall | installer + smoke/installer-test | **ECC** (lifecycle) |
| Rules always-loaded | 21 packs | — (todo on-demand vía skills) | ECC |

**Solapamiento de skills por nombre: solo 14** (`api-design`, `backend-patterns`, `coding-standards`, `database-migrations`, `deep-research`, `docker-patterns`, `documentation-lookup`, `error-handling`, `frontend-patterns`, `git-workflow`, `intent-driven-development`, `mcp-server-patterns`, `security-review`, `verification-loop`). Los catálogos son casi disjuntos: 279 ECC-only, 64 open-only.

**Brechas propias del pack `open` (independientes de ECC):** plugins npm declarados pero no instalados en `node_modules` (riesgo de boot); `package-hooks.json` sin wirear; artefactos generados referenciados pero ausentes (`docs/reports/INDEX.md`, `docs/state/*.json`, `LATEST.md`); eval harness solo estático (Level 2 pendiente); RAG (`knowledge.js`) sin commitear ni wirear; drift documental interno (counts 20 vs 21 vs 23, refs a `/instinct-status`, `/promote`, `/learn`, `/context`).

---

# PARTE 4 — Qué podemos obtener de ECC

## 4.1 Tools nativas — DROP-IN (mayor ROI)

El pack `open` tiene **0 tools nativas**. ECC trae 8 portables sin dependencias (solo `@opencode-ai/plugin/tool` + builtins de Node). Copiar a `.opencode/tools/`:

1. `git-summary.ts` — el de mejor calidad (refs validadas, sin shell).
2. `run-tests.ts` — devuelve el comando según PM + framework.
3. `check-coverage.ts` — parsea istanbul/nyc.
4. `format-code.ts` — extensión → formatter.
5. `lint-check.ts` — detector de linter.
6. `security-audit.ts` — regex de secretos + anti-patrones (ajustar `src/`).
7. `changed-files.ts` + `plugins/lib/changed-files-store.ts` — árbol de cambios de sesión.
8. `dependency-analyzer.ts` — **portar solo tras arreglar el stub** (`outdated`/`unused`/`vulnerable` están vacíos).

> Ajuste: no copiar `tools/index.ts` (auto-registra alias `index_*`); en OpenCode el auto-discovery ya registra por nombre de archivo.

## 4.2 Hooks / plugins — portar ideas a `hookify.js` y plugins nuevos

Nuestro `hookify.js` solo cubre `tool.execute.before`. Extender con:

| Idea de ECC | Evento OpenCode | Aporte al pack |
|---|---|---|
| Perfiles de hook (`minimal/standard/strict`) + `*_DISABLED_HOOKS` | — | Control fino sin editar código |
| Auto-format + audit `console.log` | `file.edited` | Calidad automática |
| `tsc`/format batch de lo editado | `tool.execute.after` / `session.idle` | Verificación real, no solo prompts |
| Inyección de entorno (`PROJECT_ROOT`, `PACKAGE_MANAGER`, `DETECTED_LANGUAGES`) | `shell.env` | Detecta stack para el router/agentes |
| Bloque de contexto a preservar | `experimental.session.compacting` | **Conecta con DCP + memoria de sesión** |
| Auto-aprobar reads/formatters/tests | `permission.ask` | Menos fricción, con log de auditoría |
| Tracking de cambios | `file.watcher.updated` | Alimenta `changed-files` |
| **Bloqueo** de edición de configs de linter | `tool.execute.before` | Fuerza arreglar código, no el config |
| **GateGuard** (clasificador destructivo *shell-aware* + fact-forcing + fail-closed) | `tool.execute.before` | Endurece nuestro `DestructiveWarner` |
| Notificación de escritorio | `session.idle` | Aviso de tarea terminada |

**Crítico para nuestro pack:** `DestructiveWarner` actual es **POSIX-céntrico**; en Windows no matchea `del /s /q`, `Remove-Item -Recurse -Force`, `rmdir /s`, `format`, `diskpart`. Portar los patrones de GateGuard (adaptados a PowerShell/cmd) + pasar de *warn* a *bloqueo opcional*.

## 4.3 Skills — importar (formato compatible con adaptación)

**Delta de formato:** ECC requiere `name` + `description` (ambos ya usamos); ECC añade `metadata.origin` (nosotros usamos `origin` top-level) y **no** usa `triggers:` (nosotros sí, en 58/78). Para portar: **añadir `triggers:` y aplanar `metadata.origin` → `origin`**. 72% de skills de ECC son markdown puro sin dependencias de Claude.

**Tier 1 (brechas grandes, cero runtime):**
- Arquitectura: `hexagonal-architecture`, `contract-first`, `architecture-decision-records`, `deployment-patterns`, `api-connector-builder`, `i18n-sync`.
- Accesibilidad: `accessibility`, `frontend-a11y` (no tenemos ninguna).
- Testing: `e2e-testing`, `tdd-workflow` (tenemos `testing` pero no workflow E2E/TDD).
- Lenguajes (somos JS/TS-heavy): `golang-patterns`, `golang-testing`, `rust-patterns`, `rust-testing`, `python-patterns`, `python-testing`, `django-patterns`, `django-security`, `django-tdd`, `fastapi-patterns`, `springboot-patterns`, `java-coding-standards`, `jpa-patterns`, `kotlin-patterns`, `cpp-coding-standards`, `cpp-testing`, `dotnet-patterns`, `csharp-testing`.
- DB/back-end: `mysql-patterns`, `redis-patterns`, `clickhouse-io`, `nestjs-patterns`, `rails-patterns`, `laravel-patterns`.
- Frontend/design: `design-system`, `make-interfaces-feel-better`, `motion-foundations` → `motion-patterns`, `react-patterns`, `react-performance`, `react-testing`, `vue-patterns`, `vite-patterns`.

**Tier 2 (verticales/investigación):** `hipaa-compliance`, `healthcare-cdss-patterns`, `healthcare-emr-patterns`, `healthcare-phi-compliance`; `research-ops`, `scientific-thinking-*`, `scientific-db-pubmed-database`; `article-writing`, `brand-voice`, `content-engine`, `seo`, `market-research`, `investor-materials`; `security-bounty-hunter`, `defi-amm-security`, `llm-trading-agent-security`; `manim-video`, `remotion-video-creation`, `video-editing`; verticales reguladas (`customs-trade-compliance`, `logistics-exception-management`, `returns-reverse-logistics`, `inventory-demand-planning`, `production-scheduling`, `quality-nonconformance`, `energy-procurement`, `carrier-relationship-management`, `master-agreement-generator`, `esign-field-placement`).

**Tier 3 (agent-meta portable):** `council`, `dev-team`, `santa-method`, `parallel-execution-optimizer`, `blueprint`, `plan-canvas`, `prompt-optimizer`, `skill-scout`, `growth-log`, `agent-self-evaluation`, `loop-design-check`, `eval-harness`.

## 4.4 Agentes — candidatos a añadir

Nuestro catálogo (67) ya cubre casi todo ECC (68). Candidatos que **no** tenemos y aportan valor:
- `gan-generator` / `gan-evaluator` / `gan-planner` (harness adversarial).
- `spec-miner` (minería de especificaciones desde código).
- `comment-analyzer`, `type-design-analyzer`, `silent-failure-hunter`, `pr-test-analyzer`, `code-simplifier`, `conversation-analyzer`, `agent-evaluator`, `rag-pipeline-reviewer`.
- `chief-of-staff` (triage de comunicación).
- `fsharp-reviewer`, `harmonyos-app-resolver` (lenguajes que no cubrimos).

## 4.5 Commands — candidatos a añadir

- **Épicas** (features multi-PR): `epic-claim`, `epic-decompose`, `epic-publish`, `epic-review`, `epic-sync`, `epic-unblock`, `epic-validate`.
- **PRP** (spec-driven): `prp-plan`, `prp-prd`, `prp-implement`, `prp-commit`, `prp-pr`.
- `learn-eval`, `cost-report`, `model-route`, `santa-loop`, `review-pr`, `pr`.

## 4.6 Ideas de arquitectura (no código, alto valor)

1. **`hooks.metadata.json` sidecar + validación de fingerprint en CI** — evita drift entre definición y doc. Encaja con nuestro `validate-frontmatter.js`.
2. **Ciclo `doctor/repair/uninstall` con install-state ownership** — nuestro installer solo instala; añadir verificación de drift y desinstalación segura.
3. **`rules/` always-loaded por lenguaje** — complemento a las skills on-demand (cargar reglas críticas sin gastar un turno).
4. **`manifests/install-modules.json` con `targets` por harness** — instalación modular y auditable.
5. **Stale-replay guard** (envolver resúmenes previos como "HISTORICAL REFERENCE ONLY") — mejora directa a nuestra memoria de sesión para no re-ejecutar comandos viejos tras compactar.
6. **Instincts con confidence scoring + ranking por relevancia de stack** (confianza ≥0.7, max 6, proyecto > global) — mejora a nuestro `instinct.js`.
7. **Vault de memoria create-only + rechazo de shapes de credenciales + `handoff`** — ya hacemos rechazo de secretos; adoptar el *handoff* entre agentes/scopes.
8. **`session-start` acotado** (bounded context, retención/pruning por días) — control de presión de contexto.
9. **Catálogo MCP con `_comments` de uso** — documentar cuándo activar cada MCP.

---

# PARTE 5 — Qué NO traer

- **`opencode.json` de ECC** (rutas a `../skills`, catálogo ECC) — usar como plantilla, no copiar.
- **`dist/`** — stale y gitignored.
- **`ecc-hooks.ts` tal cual** — acoplado a branding/versión ECC (`ECC_*`, `[ECC]`, v2.2.3, "13 agents"). Portar *ideas*, no el archivo.
- **`dependency-analyzer.ts`** — incompleto (stub).
- **Commands huérfanos ECC-only**: `harness-audit` (necesita `scripts/harness-audit.js`), `loop-*` (referencian `.claude/plans/`), `model-route`, `security-scan` (necesita `ecc-agentshield`).
- **Formatos Claude**: `.claude-plugin/*`, `ecc-tools.json`, `identity.json`, Workflows `.js` (`phase/parallel/agent` no son primitivas OpenCode).
- **Skills Claude-runtime**: `hookify-rules`, `gateguard`, `safety-guard`, `delivery-gate`, `continuous-learning*`, `ck`, `config-gc`, `context-budget`, `cost-tracking`, `agentic-os`, `autonomous-*`, `claude-devfleet`, `strategic-compact`, `configure-ecc`, `ecc-guide`, `security-scan`, `unified-memory`, `token-budget-advisor`.
- **Skills dependientes de servicios externos** (salvo que se añada el MCP/CLI): `videodb`, `fal-ai-media`, `exa-search`, `social-publisher`, `jira-integration`, `google-workspace-ops`, `x-api`, `ito-*`, `nutrient-document-processing`, `mailtrap-email-integration`, `uncloud`, `taste*`.
- **Duplicados conceptuales** (ya cubiertos con otro nombre): `postgres-patterns`≈`postgresql-optimization`, `kubernetes-patterns`≈`kubernetes-specialist`, `react-performance`≈`vercel-react-best-practices`.

---

# PARTE 6 — Recomendaciones priorizadas

## Quick wins (bajo riesgo, alto impacto)
1. **Portar 6-7 tools drop-in** (`git-summary`, `run-tests`, `check-coverage`, `format-code`, `lint-check`, `security-audit`, `changed-files`+store) → `.opencode/tools/`. Añadir un caso `metric` a `evals/cases/static.json` que verifique que las tools existen.
2. **Endurecer `hookify.js`**: añadir patrones Windows de destrucción + opción de bloqueo; adoptar perfiles (`PACK_HOOK_PROFILE`) y `PACK_DISABLED_HOOKS`.
3. **Arreglar el boot**: instalar realmente `opencode-vibeguard`/`opencode-pty`/`@tarquinen/opencode-dcp` en `node_modules` (hoy declarados y ausentes) y wirear `package-hooks.json`.
4. **Resolver drift documental interno** (`counts`, refs a `/instinct-status`, `/promote`, `/learn`, `/context`, `session-start.md` apuntando a `.agents\sessions`).

## Medio plazo
5. **Nuevo plugin `session-hooks.js`** con `session.idle` (notificación + snapshot auto), `experimental.session.compacting` (bloque de contexto + stale-replay guard) y `shell.env` (detección de stack).
6. **`permission.ask`** con auto-aprobación segura (reads/formatters/tests) + log de auditoría.
7. **Importar Tier 1 de skills** (arquitectura/ADR, accesibilidad, E2E/TDD, lenguajes Go/Rust/Python/Django/FastAPI/Spring/Kotlin/C++, DB, design-system/motion) con adaptación `triggers:` + `origin`.
8. **Ciclo `doctor/repair`** para el installer (drift detection + ownership), inspirado en ECC.

## Largo plazo / opcional
9. **Rules packs always-loaded** (`rules/common` + lenguajes) opt-in.
10. **Instincts con confidence scoring + ranking** y **memoria `handoff`** entre agentes.
11. **Commands de épicas y PRP** (`epic-*`, `prp-*`) para features multi-PR.
12. **Eval Level 2** (comportamiento en vivo con `opencode run`) y gate del RAG en CI.
13. **Agentes**: `gan-*`, `spec-miner`, `silent-failure-hunter`, `type-design-analyzer`, `comment-analyzer`, `pr-test-analyzer`, `agent-evaluator`, `rag-pipeline-reviewer`.

---

## Anexo — Evidencia (rutas clave)

**ECC:**
- `.opencode/opencode.json` (26 agents / 26 commands / 14 instructions) · `.opencode/plugins/ecc-hooks.ts` (635 L) · `.opencode/plugins/lib/changed-files-store.ts` (98 L) · `.opencode/tools/*.ts` (8) · `.opencode/prompts/agents/*.txt` (25) · `.opencode/commands/*.md` (35; 9 huérfanos) · `.opencode/instructions/INSTRUCTIONS.md` (337 L) · `.opencode/{README.md,MIGRATION.md}`.
- `.claude/` (commands, ecc-tools.json, identity.json, enterprise/, homunculus/instincts/, research/, rules/, team/, workflows/) · `.claude-plugin/{plugin.json,marketplace.json,PLUGIN_SCHEMA_NOTES.md}` · `hooks/{hooks.json,hooks.metadata.json,run-with-flags.js,gateguard-fact-force.js,session-start.js,session-end.js}` · `rules/` (common + 21 packs) · `manifests/{install-profiles,install-modules,install-components}.json` · `schemas/` (16) · `mcp-configs/mcp-servers.json` (~35) · `scripts/ecc.js` + `lib/{install,memory-vault,state-store,skill-improvement}` · `agents/` (68) · `commands/` (94) · `SOUL.md` + guías.

**Pack `open`:**
- `opencode.json` · `.opencode/{agents (67),commands (64),plugins (hookify.js,cost-ledger.js),bin (23 CLIs + 3 lib),manual,templates,reports,examples}` · `.agents/skills/` (78) · `docs/{PROJECT.md,prds,plans,reports,audits,sessions,state,instincts}` · `evals/{cases,routing,knowledge}` · `skills-lock.json` · `init-opencode.js` (918 L).

---
*Análisis de solo lectura; ninguna recomendación fue aplicada. Para ejecutar el port: `/flow-feature` o `/plan` con el Tier elegido.*
