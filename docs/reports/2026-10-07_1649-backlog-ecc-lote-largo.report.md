---
source: docs/audits/2026-10-07_1625-pack-full-review.audit.md (candidatos ECC)
status: BACKLOG — no ejecutado
created: 2026-10-07_1649
---

# Backlog: "Lote largo" — features ECC opcionales

Documentado para retomar en otro momento. Origen: gap-analysis ECC→opencode
(subagente `explore`, sesión 2026-10-07) + revisión completa del pack.

**Contexto ya cerrado** (no re-hacer): Lote 1 (policy hardening: shell-substitution,
config-protection, git-integrity, `/build-fix` multi-stack), Lote 2 (continuidad:
compaction hook + auto-snapshot + unicode R8 + `context.js --cost`), Lote 3
(CI con self-tests, 0 warnings frontmatter, `refresh-project` bugfix).

---

## Candidatos (rankeados por valor × portabilidad ÷ riesgo)

### C8 — `shell.env`: exportar el stack detectado a cada bash
- **ECC:** `.opencode/plugins/ecc-hooks.ts` (handler `shell.env`) + `config/project-stack-mappings.json` (571 líneas: stack → build/test/lint/format + presets de permisos).
- **Qué:** poner hechos del stack (`PACKAGE_MANAGER`, `SKIP_INSTALL`, …) en el env de cada invocación bash, para que los comandos del agente usen el runner correcto sin adivinar.
- **Estado en el pack:** parcial — `refresh-project.js` tiene `detectStack()` pero **no** exporta nada; ningún plugin registra `shell.env` (hook libre).
- **Vehículo:** handler `shell.env` en un plugin existente (firma `(input:{cwd,sessionID,callID}, output:{env})`), datos desde `detectStack`. **No** copiar el JSON de ECC entero (auditar campos Claude-específicos).
- **Riesgo:** bajo. **Esfuerzo:** S–M.

### C10 — `/aside`: pregunta al margen sin drift
- **ECC:** `commands/aside.md`.
- **Qué:** responder una pregunta lateral bajo protocolo "no editar / no desviar", y luego retomar explícitamente la tarea interrumpida.
- **Estado en el pack:** no existe entre los 64 commands.
- **Vehículo:** nuevo command con `description` + `agent`; registrar en `.opencode/manual/COMMANDS.md`; `counts --update`; bump **E13 64→65** en `evals/cases/static.json`.
- **Riesgo:** bajo. **Esfuerzo:** S.

### C7 — auto-resume en `session.created`
- **ECC:** `scripts/hooks/session-start.js`.
- **Qué:** inyectar contexto de la sesión previa (`docs/sessions/LATEST.md` + branch) al crear la sesión.
- **Estado en el pack:** solo `/session-start` manual; ningún plugin registra `session.created` (hook libre). El auto-snapshot del Lote 2 ya escribe `LATEST.md`.
- **Vehículo:** plugin existente; inyectar `LATEST.md` + branch con **cap de tamaño**.
- **Riesgo:** medio (costo de tokens por sesión). **Esfuerzo:** M.

### C12 — codemaps deterministas
- **ECC:** `scripts/codemaps/generate.ts` (330 líneas, TS→Markdown reproducible).
- **Qué:** regenerar codemaps desde el código de forma determinista.
- **Estado en el pack:** `/update-codemaps` existe pero es **prompt-only** (no determinista, re-lee el árbol cada vez).
- **Vehículo:** portar el generador como CLI en `.opencode/bin/` (clis +1) y que el command lo invoque; requiere traducir TS→JS (los CLIs del pack son JS plano, sin build).
- **Riesgo:** bajo-medio (nuevo CLI + fidelidad TS→JS). **Esfuerzo:** M.

### C13 — `model:` por agente
- **ECC:** `agents/*.md` — 68/68 llevan `model:` y `tools:`.
- **Qué:** rutear agentes baratos/read-only a un modelo chico, acotar `maxSteps`.
- **Estado en el pack:** 0/68 usan `model:`. `AgentConfig` lo soporta (`model`, `temperature`, `maxSteps`, `tools{}`, `disable`); `validateAgent()` no falla por claves extra.
- **Vehículo:** agregar `model:` in-place a agentes seleccionados. **No** portar `tools:` (ECC usa string separado por comas; opencode espera objeto, y `permission:` del pack ya es más rico).
- **Riesgo:** **alto** — los IDs de modelo dependen del entorno; `opencode.json` no declara modelo/proveedor. Requiere auditoría costo/calidad previa y probablemente ser opt-in. **Esfuerzo:** S por archivo.

### C14 — `/model-route`
- **ECC:** `commands/model-route.md`.
- **Qué:** rutear una tarea a un tier de modelo (fast/deep/cheap).
- **Estado en el pack:** `/route` mapea request → agente + skill, sin tier de modelo.
- **Vehículo:** nuevo command, de-brandeado de los alias Claude.
- **Riesgo:** medio — misma dependencia de entorno que C13; quizá mejor como skill/regla que como command. **Esfuerzo:** M.

---

## NO portar (verificado)

- `hooks/hooks.json` + `hooks/*` → schema de Claude Code (PreToolUse/PostToolUse/Stop/SessionStart); opencode tiene su propia interfaz `Hooks`.
- `.opencode/plugins/ecc-hooks.ts` tal cual → API de plugin vieja (`file.edited`, `todo.updated`, `file.watcher.updated` no existen en el tipo `Hooks` del pack).
- `rules/` (122 archivos, 24 dirs de lenguaje) → always-loaded; revienta el cap de boot (2000 tok, headroom 481).
- `scripts/hooks/gateguard-fact-force.js` (1960 líneas) → gate de bloqueo; el pack es warn-first.
- `tools:` de agentes ECC → formato equivocado + redundante con `permission:`.
- `argument-hint` / `disable-model-invocation` en commands → no existen en el tipo `Command` de opencode (se descartan solos).
- `scripts/observability-readiness.js` → gate de release autoreferencial de ECC, no un auditor de proyecto.
- `pre-bash-dev-server-block.js` + `auto-tmux-dev.js` → `opencode-pty` ya cubre ejecución en background con buffer.
- `scaffolds/`, `.cursor/` → específicos de editor.
- MCPs de `mcp-configs/`/`.mcp.json` always-on → 400 tok de boot cada uno; el pack ya usa opt-in (`mcp.optional.json`).

## Diferido (necesita su propio pase)

- `skills-health.js` + `scripts/lib/skill-evolution/*` (telemetría de uso de skills). El *consumidor* es portable y complementa a `agent-evals`, pero el *productor* es un `PostToolUse` de Claude que escribe `~/.claude/state/skill-runs.jsonl`; en opencode no hay un call hook de skill fiable → **no shippear un dashboard con feed inventado**.
- `commands/santa-loop.md`, `gan-build.md`, `loop-start.md` → orquestación dual-model; requieren modelos pinneados y rompen sin `model`/`provider` en `opencode.json`.

---

## Cómo retomar

1. Elegir candidato(s) → `/prd` (o "skip PRD" si es un one-liner como C10).
2. Revisar el detalle de arriba (paths ECC en `/home/marcelo/dev/ECC/`).
3. Verificar con la batería completa: `counts`, `validate-frontmatter`, `verify-lockfile`, `lint-docs`, `smoke-test`, `wiring-test`, `installer-test`, `eval-static`, `gateguard --selftest`, `policy-selftest`.
4. Si agrega command/CLI/agente: actualizar el invariante correspondiente (E13 commands / counts) y `manual/COMMANDS.md`.
