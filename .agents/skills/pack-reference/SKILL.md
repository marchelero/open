---
name: pack-reference
description: "Use when you need opencode pack structure, naming conventions, doc paths, session memory, or non-critical pack-level rules."
---

# pack-reference

Quick reference for opencode pack structure, conventions, and standards. Loaded on-demand by the primary agent when it needs to look up paths, naming rules, plugin behavior, or session memory layout.

**Scope**: reference material only. The 9 mandatory behaviors + security baseline + prompt defense are in `AGENTS.md` (always loaded at boot) and NOT duplicated here.

## Que es esto

Starter pack portable de opencode. El "producto" son los 68 agentes, 64 slash commands y 108 skills. No es codigo de aplicacion — es config + prompts + CLIs en `.opencode/bin/`.

## Estructura

```
.
├── opencode.json          Config principal
├── .opencode/             PACK template (portable)
│   ├── agents/            68 subagentes (description + mode + permission)
│   ├── commands/          64 slash commands
│   ├── plugins/           Local plugins (hookify.js, gateguard.js, cost-ledger.js, stack-env.js)
│   ├── bin/               22 CLIs nativos
│   ├── examples/          3 downstream demos (node-api, python-data, react-app)
│   ├── manual/            PACK docs (info del pack, NO del proyecto)
│   ├── package.json       Plugin deps (npm install on first clone)
│   ├── AGENTS.md          (cargado al boot, contiene core rules)
│   ├── CONVENTIONS.md     Naming + path conventions
├── .agents/skills/        ALL skills (pack + user-installed)
└── docs/                  PROJECT docs (single location, easy to take anywhere)
    ├── PROJECT.md         (auto-gen por refresh-project.js)
    ├── AGENTS_INDEX.md    (auto-gen por build-agents-index.js)
    └── prds/  plans/  reports/  audits/  sessions/  state/  instincts/
```

## Convenciones obligatorias

1. **Nombres de carpetas en PLURAL** (`.opencode/agents/`, `.opencode/commands/`, `.agents/skills/`). Standard oficial.
2. **Rutas plurales nativas** (`.opencode/agents/`, `.agents/skills/`). Los symlinks legacy singulares (`.opencode/agent`, `.opencode/skill`) fueron removidos — opencode >=1.14 usa las rutas plurales; no recrearlos.
3. **Frontmatter agentes**: `description` (required), `mode: subagent` (required), `permission:` (recomendado). `name` se infiere del filename.
4. **Frontmatter skills**: `name` + `description`. Description third person, 1-1024 chars, "Use when...".
5. **Slash commands en `.md` con frontmatter** (no JSON): `description` + `agent`. `agent` enruta a un especialista.

## Que NO hacer

- No crear `tsconfig.json` ni archivos de build en el pack.
- No incluir `model` ni `small_model` en opencode.json (cada usuario configura el suyo). Si lo agregas, sera el default para los 68 agentes — avisar antes.

## Plugins

**npm** (en `.opencode/package.json`): `opencode-vibeguard`, `opencode-pty`, `@tarquinen/opencode-dcp` + `@opencode-ai/plugin` peer.

**Local** (auto-cargado desde `.opencode/plugins/`), 4 plugins:
- **hookify.js** — `SecretBlocker` (bloquea writes a `.env`/`*.key`/`*.pem`/`id_rsa*`/etc, allowlist `.env.example`) + `PolicyEngine` (reglas declarativas de `.opencode/policy-rules.json`, severidades warn/ask/deny) + `PermissionAsk`.
- **gateguard.js** — clasificador destructivo cross-platform (POSIX + Windows) *shell-aware*; perfiles `GATEGUARD_MODE` (warn por defecto / block / off).
- **cost-ledger.js** — escribe `docs/state/cost-*.json` en session idle + snapshot factual en `docs/sessions/` + instruccion de continuidad en compaction.
- **stack-env.js** — hook `shell.env`: inyecta `OPENCODE_STACK_*` (lenguaje, framework, runtime, package manager, monorepo, test runner, linter, formatter) en cada bash; detección compartida con `refresh-project.js` vía `bin/lib/stack-detect.js`. Opt-out `OPENCODE_STACK_ENV=0|false|off`. Self-test: `node .opencode/plugins/stack-env.js --selftest`.

Los logs de auditoría van a `.opencode/logs/policy.log` y `.opencode/logs/gateguard.log` (gitignored).

**Auto-install**: `cd .opencode && npm install` (postinstall corre `bin/install-plugins.js` idempotentemente). `package.json` y `package-lock.json` tracked; `node_modules/` gitignored.

## Skills y agentes custom del usuario

`npx skills add <owner>/<repo>@<skill>` → skills se instalan en `.agents/skills/<name>/SKILL.md`. opencode las descubre via `<available_skills>`. `permission.skill: "allow"` global garantiza que los agentes puedan cargarlas.

## Project docs

Toda doc del proyecto vive en `docs/`. Un solo lugar, facil de llevar (rsync, tar, git). **Por que no `.opencode/`**: el pack es template, se copia entero. Mezclar contenido del proyecto con el pack hace que `cp -r .opencode` traiga basura. `docs/` es project-only.

Naming: PRDs → `docs/prds/{YYYY-MM-DD_HHMM}-{name}.prd.md` · plans → `docs/plans/...` · reports → `docs/reports/...` · audits → `docs/audits/...` · snapshots → `docs/sessions/{YYYY-MM-DD}-{slug}.md` · recovery state → `docs/state/{command}-{ISO-timestamp}.json` · instincts → `docs/instincts/{YYYY-MM-DD}-{slug}.instinct.json`. Detalle completo en `.opencode/CONVENTIONS.md`.

## Memoria de sessions (4 capas)

| Capa | Que vive | Cuando se carga | Tamanio |
|------|----------|-----------------|---------|
| 1 | AGENTS.md + docs/PROJECT.md | siempre | ~2K tokens |
| 2 | docs/sessions/LATEST.md | al `/session-start` o auto al cerrar | ~1-3K tokens |
| 3 | Skills on-demand, files especificos, sub-agents | cuando se necesitan | variable |
| 4 | Full git history, todos los PRDs/plans, instincts | nunca al contexto | disco |

**Regla**: todo lo que pueda vivir en disco → disco. Solo lo "vivo" va a contexto.

## Agent Orchestration

**Immediate agent usage** (no user prompt needed): complex features → `planner` · code just written → `code-reviewer` · bug fix or new feature → `tdd-guide` · architectural decision → `architect`.

**Parallel task execution**: SIEMPRE usar parallel Task para ops independientes. Multi-perspective analysis para problemas complejos (factual/senior/security/consistency sub-agents). Cada sub-agent corre en su propio context, primary sintetiza outputs.
