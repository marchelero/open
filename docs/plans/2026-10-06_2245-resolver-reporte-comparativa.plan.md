---
prd: docs/prds/2026-10-06_2203-resolver-reporte-comparativa.prd.md
status: APPROVED
created: 2026-10-06_2245
---

# Implementation Plan: Resolver reporte comparativa — Quick-wins (fase 1)

## Overview
Implementa los 4 quick-wins del reporte comparativo sin tocar la fusión de infraestructura: (1) `anydoc` pasa a MCP opt-in, (2) `measure-tokens.js` reporta boot + catálogo + router con techo absoluto y baseline desde `git HEAD`, (3) `skills-lock.json` cubre skills+agents con sha256 y un CLI que detecta drift, (4) un hook escribe un ledger de coste estimado por sesión referenciado en `LATEST.md`.

## Requirements
- **R1** — `anydoc` deja de estar siempre-activo en `opencode.json`; pasa a MCP opcional reactivable; la skill `convert-documents-to-markdown` sigue funcional.
- **R2** — `measure-tokens.js` reporta 3 componentes (boot / catálogo / router) + total, con techo absoluto configurable (default 2000 tok) y baseline relativa derivada de `git HEAD`.
- **R3** — `skills-lock.json` contiene sha256 de todas las skills y todos los agents; un CLI verifica drift (exit 0 limpio, exit ≠0 listando diffs, `--fix` re-pin).
- **R4** — al cerrar sesión un hook escribe `docs/state/cost-<ISO-ts>.json` (timestamp/agente/modelo/tokens in-out/coste) con `estimated: true`, JSON válido, referenciado en `LATEST.md`.

## Architecture Changes
- **`opencode.json`** — quitar bloque `mcp.anydoc`; queda 1 MCP activo (`context7`).
- **`.opencode/mcp.optional.json`** — añadir entrada `anydoc` a `optional_mcps[]`; limpiar marcador `_active_anydoc`.
- **`.opencode/bin/measure-tokens.js`** — reescritura: 3 componentes + total, `--cap`, baseline vía git.
- **`.opencode/bin/lib/catalog.js`** — NUEVO módulo compartido: enumera skills+agents (path, description, bytes) con parse de frontmatter. Lo consumen measure-tokens (M2) y verify-lockfile (M3).
- **`.opencode/bin/verify-lockfile.js`** — NUEVO CLI de drift de lockfile.
- **`skills-lock.json`** — regenerar a schema v2 (skills + agents con sha256).
- **`.opencode/plugins/cost-ledger.js`** — NUEVO plugin con hook `event` (`session.idle`) que escribe el ledger.
- **`.opencode/commands/session-end.md`** — añadir sección "Cost" que referencia el cost-file más reciente.

---

## Decisiones de diseño clave

### D1 — Dónde vive el catálogo (skills + agents)
Existe enumeración duplicada en `build-skills-index.js` y `build-agents-index.js` (parse de frontmatter, filtrado de dirs/archivos). En lugar de una tercera copia, se extrae **un único módulo compartido** `.opencode/bin/lib/catalog.js` que exporta `listCatalog()` → `{ skills: [{name, path, description, bytes}], agents: [{name, path, description, bytes}] }`. Reglas:
- skills = `.agents/skills/*/SKILL.md` (salta dirs sin SKILL.md, con warn opcional).
- agents = `.opencode/agents/*.md` (excluye `INDEX.md` defensivamente).
- `description` = campo frontmatter `description`, `bytes` = `stat.size` del archivo.
- Ubicación `bin/lib/` (no `bin/`) para no ensuciar el conteo de `counts.js` (que cuenta `.js` en `bin/` de forma no-recursiva como CLIs). Este es el primer `lib/` del pack; se documenta en el header del archivo.

### D2 — Integración de `anydoc` con `setup-mcp`
`anydoc` reutiliza `setup-mcp.js` **sin cambios de código**: el template `.opencode/mcp.optional.json` ya soporta `optional_mcps[]` con `name/description/package/command/env/use_when` y la categoría `documents` ya lista `anydoc`. Solo falta (a) añadir el objeto `anydoc` a `optional_mcps[]` con `command: ["npx","-y","mcp-server-anydoc"]` y `env: {}`, y (b) borrar el marcador `_meta._active_anydoc` (deja de ser verdad). `setup-mcp.js activate anydoc` copiará el bloque a `opencode.json`; `disable` lo revierte. `/mcp-on`/`/mcp-off` ya cubren `anydoc` por nombre. **No se crea instalador nuevo** (coincide con la asunción del PRD).

### D3 — Formato del lockfile (v2)
Reemplaza el v1 (solo 13 skills con `source/sourceType/skillPath/computedHash`). Schema v2:
```json
{
  "version": 2,
  "generated": "<ISO-ts>",
  "skills": { "<name>": { "path": ".agents/skills/<name>/SKILL.md", "sha256": "<hex64>" } },
  "agents": { "<name>": { "path": ".opencode/agents/<name>.md", "sha256": "<hex64>" } }
}
```
- Clave = nombre del dir (skills) o nombre sin `.md` (agents); `path` relativo al root; `sha256` = `crypto.createHash('sha256')` del contenido leído como UTF-8.
- **Provenance**: los 13 skills v1 tienen `source`/`sourceType`/`skillPath` valiosos. El CLI, al generar (`--fix` o `init`), **fusiona** esas claves si el nombre coincide, para no perder origen. No son obligatorias para el drift (el drift solo compara `sha256`).
- Se conserva el archivo como **fuente de verdad de integridad**, no de procedencia.

### D4 — Cómo el hook accede al timestamp de fin de sesión + tokens
- opencode expone un hook `event` (además de `tool.execute.before`): `event: async ({ event }) => { if (event.type === "session.idle") ... }`. El plugin dispara **en el momento del idle** (= fin de sesión) y sella `timestamp = new Date().toISOString()` él mismo; no necesita "pedir" el timestamp a opencode.
- **Tokens no accesibles** (confirmado por PRD + inspección de `hookify.js`). El ledger acumula estimación: suma de bytes de texto de mensajes observables (vía eventos `chat.message` si `event.properties` los expone; si no, `estimated: true` con `tokensIn/tokensOut = 0` y `reason` explícito). Heurística `4 bytes ≈ 1 token` reutilizando la constante del pack. Todo se marca `estimated: true`.
- **agente/modelo**: leer de `event.properties.session`/message metadata si existe; si no, `agent: "unknown"`, `model: "unknown"` (nunca inventar). `costUsd: null` salvo que `event.properties` traiga coste real (no esperado).
- El plugin es **defensivo**: `try/catch` global, nunca crashea la sesión (mismo patrón que `hookify.js`), y si no hay datos escribe el JSON con `estimated: true` + `reason: "no token data exposed"` en vez de un archivo corrupto.
- Se implementa como **plugin nuevo** `cost-ledger.js` (no se extiende `hookify.js`, que queda enfocado a seguridad). Convención CommonJS idéntica a `hookify.js` (`module.exports = async () => ({ event: async ({event}) => {...} })`), auto-cargado desde `.opencode/plugins/`.

### D5 — Baseline relativa desde `git HEAD` (en vez de constante)
Se elimina la constante `BASELINE` hardcodeada. La baseline = **la misma medición aplicada al árbol de `git HEAD`**:
- boot: `git show HEAD:.opencode/AGENTS.md` (bytes) + `git show HEAD:opencode.json` (MCP/plugins).
- catálogo/router: `git show HEAD:<path>` por cada skill/agent/router para re-parsear descripciones/tamaños. Para N≈122 archivos son ~122 subprocesos `git show`, aceptable (solo en el cálculo de baseline, no en el run por defecto). Optimización opcional: `git ls-tree -r -l HEAD` para tamaños y `git show` solo para descripciones.
- Flags: `--baseline=<ref>` (default `HEAD`), `--baseline=none` para omitir. **Fallback**: si git falla (repo sin commits / no git), emitir warning y usar un snapshot interno de emergencia, sin romper `--scenario=greeting`.
- `savingsPct = (baselineTotal - currentTotal) / baselineTotal`.

### D6 — Techo absoluto
`--cap=<n>` (default 2000) compara **boot** contra el techo (el PRD dice "compara el boot contra un techo absoluto"). `RED` si `bootTokens > cap` (exit ≠0 en `--json`); `GREEN` en caso contrario. El `total` (boot+catálogo+router) se reporta informativamente, sin gate por defecto (evita scope creep).

---

## Implementation Steps

### Phase 0 — Fundación compartida (prerequisito de M2 y M3)

1. **Crear módulo de catálogo** (File: `.opencode/bin/lib/catalog.js`)
   - Action: Nuevo archivo CommonJS, zero-dep, que exporta `listCatalog()` y `parseFrontmatter()`. Enumeración idéntica a la de `build-skills-index.js`/`build-agents-index.js`, unificada. Incluir `estimateTokens(bytes, BYTES_PER_TOKEN=4)`.
   - Why: fuente única para medir catálogo (M2) y hashear lockfile (M3); evita tercera duplicación del parse.
   - Dependencies: None
   - Risk: Low

2. **Smoke del módulo** (File: `.opencode/bin/lib/catalog.js`)
   - Action: `node -e "const c=require('./.opencode/bin/lib/catalog.js'); const x=c.listCatalog(); console.log(x.skills.length, x.agents.length)"` → esperado `63 59`.
   - Why: valida que la enumeración coincide con `counts.js` (63 skills / 59 agents).
   - Dependencies: Phase 0 step 1
   - Risk: Low

### Phase 1 — Milestone 1: `anydoc` opt-in (paralelizable con Phase 0 y Phase 4)

3. **Quitar `anydoc` de `opencode.json`** (File: `opencode.json`)
   - Action: Eliminar el bloque `"anydoc": { "type":"local", "command":["npx","-y","mcp-server-anydoc"] }`. Dejar solo `context7` en `mcp`.
   - Why: R1 — boot pasa de 2 a 1 MCP activo (~400 tok menos).
   - Dependencies: None
   - Risk: Low

4. **Registrar `anydoc` como opcional** (File: `.opencode/mcp.optional.json`)
   - Action: Añadir a `optional_mcps[]` (junto a `context7`): `{ "name":"anydoc", "description":"...", "package":"mcp-server-anydoc", "command":["npx","-y","mcp-server-anydoc"], "env":{}, "use_when":"Convertir PDF/Word/PPT/Excel/CSV/EPUB/RTF a Markdown (skill convert-documents-to-markdown)." }`. Borrar `_meta._active_anydoc`.
   - Why: hace `anydoc` descubrible/reactivable vía `setup-mcp.js activate anydoc` (D2).
   - Dependencies: Step 3 (opcional, puede ir en paralelo)
   - Risk: Low

5. **Verificar reversibilidad** (File: `opencode.json` / `mcp.optional.json`)
   - Action: `setup-mcp.js activate anydoc` → aparece en `opencode.json`; `setup-mcp.js disable anydoc` → desaparece. Confirmar que la skill `convert-documents-to-markdown` sigue presente (`Test-Path .agents/skills/convert-documents-to-markdown/SKILL.md`).
   - Why: R1 reversibilidad + no-regresión de skills.
   - Dependencies: Step 3, 4
   - Risk: Low

### Phase 2 — Milestone 2: medidor ampliado (depende de Phase 0)

6. **Reescritura de `measure-tokens.js`** (File: `.opencode/bin/measure-tokens.js`)
   - Action: Reemplazar `BASELINE` hardcodeada. Cargar `listCatalog()` (Phase 0) para catálogo; `routerBytes = size(.agents/skills/router/SKILL.md)`. Componentes: `boot` (AGENTS.md + 400×MCP + plugins, igual que hoy), `catalog` (Σ descripción bytes de skills+agents / 4), `router` (router SKILL.md / 4), `total = boot+catalog+router`. Baseline vía `git show` (D5). Flags `--cap` (D6), `--baseline`, `--json`. Conservar `--scenario=greeting` y `--threshold`.
   - Why: R2 — reporta 3 componentes + total + techo + baseline honesta.
   - Dependencies: Phase 0
   - Risk: Medium (mayor superficie; mantener compat con `--scenario=greeting`)

7. **Salida legible + gate** (File: `.opencode/bin/measure-tokens.js`)
   - Action: Imprimir tabla por componente (boot/catálogo/router/total), baseline, `savingsPct`, y `BOOT vs cap <n>: GREEN/RED`. Exit code: `--json` → 0 si boot ≤ cap (o scenario pass), 1 si RED.
   - Why: verificable por CI y por humano.
   - Dependencies: Step 6
   - Risk: Low

### Phase 3 — Milestone 3: lockfile + verificación de drift (depende de Phase 0)

8. **Crear `verify-lockfile.js`** (File: `.opencode/bin/verify-lockfile.js`)
   - Action: CLI CommonJS zero-dep. Sub-comandos: default `check` (verificar), `--fix` (re-pin), `--json`. Usa `listCatalog()` para enumerar skills+agents, calcula `sha256` de cada archivo (UTF-8), compara contra `skills-lock.json`. `check`: exit 0 si sin cambios; exit 1 listando `path | expected | actual` por cada drift. `--fix`: regenera el lockfile (merge provenance, D3) y sale 0.
   - Why: R3 — integridad verificable + re-pin tras ediciones legítimas.
   - Dependencies: Phase 0
   - Risk: Low

9. **Regenerar `skills-lock.json` a v2** (File: `skills-lock.json`)
   - Action: `node .opencode/bin/verify-lockfile.js --fix` → genera v2 con 63 skills + 59 agents y sha256. Commit del lockfile.
   - Why: cierra la brecha "casi vacío".
   - Dependencies: Step 8
   - Risk: Low

10. **Smoke de drift** (File: un skill temporal editado)
    - Action: editar un SKILL.md a propósito → `verify-lockfile.js check` sale 1 y lista el archivo; `verify-lockfile.js --fix` re-pin y sale 0. Revertir la edición.
    - Why: valida detección de drift y tampering.
    - Dependencies: Step 8, 9
    - Risk: Low

### Phase 4 — Milestone 4: ledger de coste (independiente; paralelizable)

11. **Crear plugin `cost-ledger.js`** (File: `.opencode/plugins/cost-ledger.js`)
    - Action: Plugin CommonJS con hook `event` que dispara en `event.type === "session.idle"` (y opcional `session.deleted`). Acumula estimación de tokens (bytes/4) de mensajes observables; escribe `docs/state/cost-<ISO-ts>.json` con `{timestamp, agent, model, tokensIn, tokensOut, costUsd, estimated:true}`. `try/catch` global; sin datos → `estimated:true` + `reason`. Nunca crashea (D4).
    - Why: R4 — ledger por sesión, robusto ante ausencia de tokens.
    - Dependencies: None
    - Risk: High (payload exacto de `event.properties` a validar en runtime)

12. **Referenciar en `LATEST.md`** (File: `.opencode/commands/session-end.md`)
    - Action: Añadir sección "## Cost this session" al template del snapshot (Step 4) y al reporte (Step 8): listar el `docs/state/cost-*.json` más reciente (`ls -t docs/state/cost-*.json | head -1`). Actualizar también el bloque "Files touched" opcionalmente.
    - Why: el ledger queda referenciado en la memoria de sesión (R4).
    - Dependencies: Step 11
    - Risk: Low

13. **Smoke del ledger** (File: `docs/state/cost-*.json`)
    - Action: disparar fin de sesión (o invocar el handler del plugin en un harness mínimo); verificar que se escribe un `cost-<ts>.json` JSON-válido con `estimated: true`; validar con `node -e "JSON.parse(require('fs').readFileSync('<file>'))"`.
    - Why: valida robustez y validez JSON.
    - Dependencies: Step 11
    - Risk: Medium

---

## Testing Strategy
- **Unit (CLI-level, sin framework)**: invocar cada CLI con `--json` y validar shape/exit-code.
  - `measure-tokens.js --json` → claves `current.bootTokens`, `current.catalogTokens`, `current.routerTokens`, `total`, `baseline`, `savingsPct`, `cap`.
  - `verify-lockfile.js --json` (clean y con drift).
  - `setup-mcp.js status` tras activate/disable.
- **Integration**: 
  - `counts.js --json` (mcps_active=1, mcps_optional incluye anydoc) tras M1.
  - `listCatalog()` devuelve 63 skills / 59 agents (consistente con `counts.js`).
- **E2E/smoke**: editar skill → drift detectado → `--fix`; conversión con anydoc reactivado (`anydoc_convert_document` sobre un .md de prueba); fin de sesión → cost-file escrito y referenciado.

## Risks & Mitigations
- **Payload de `event.properties` no documentado (session.idle / chat.message)** — el hook no puede garantizar agent/modelo/tokens reales.
  - Mitigation: diseño defensivo (D4): todo `estimated:true`, fallback a `"unknown"`, `try/catch`. Validar el payload real en el smoke (step 13) y ajustar el parse.
- **`session.idle` puede no disparar en cierres abruptos (kill/Ctrl-C)** — se pierde el ledger de esa sesión.
  - Mitigation: también escuchar `session.deleted`; aceptar best-effort (el ledger es estimación de apoyo, no fuente contable).
- **~122 subprocesos `git show` en baseline pueden ser lentos** en Windows.
  - Mitigation: solo en el cálculo de baseline (no en default); usar `git ls-tree -r -l HEAD` para tamaños y `git show` solo para descripciones; cachear resultado si es necesario.
- **El `lib/` es nuevo y `counts.js` no lo cuenta** — posible inconsistencia de conteo.
  - Mitigation: documentar en el header de `catalog.js`; no altera `counts.js` (cuenta `.js` no-recursivo en `bin/`).
- **Regenerar lockfile genera churn en cada edición legítima** (riesgo alto/bajo del PRD).
  - Mitigation: `--fix` documentado; flujo de re-pin incluido en `/plan` y en el help del CLI.
- **`measure-tokens.js` agrandado sin tope → scope creep**.
  - Mitigation: acotar a 3 componentes exactos (D6); el `total` es informativo, sin gate nuevo.

## Success Criteria
- [x] `opencode.json` sin `anydoc`; `mcp.optional.json` con `anydoc` en `optional_mcps[]`.
- [x] `measure-tokens.js --scenario=greeting` → 1 MCP activo.
- [x] `setup-mcp.js activate anydoc` / `disable anydoc` reversible; skill `convert-documents-to-markdown` intacta.
- [x] `measure-tokens.js --json` reporta boot + catálogo + router + total + baseline (HEAD) + `cap`.
- [x] `measure-tokens.js --cap=<bajo>` → RED y exit ≠0 cuando boot supera el techo.
- [x] `skills-lock.json` v2 con sha256 de 63 skills + 59 agents.
- [x] `verify-lockfile.js` exit 0 limpio; exit ≠0 listando diffs tras editar un skill; `--fix` re-pin.
- [x] `docs/state/cost-<ts>.json` escrito al cerrar sesión, JSON válido, `estimated:true`, referenciado en `LATEST.md` (Step 5b de session-end).

---

## Orden de ejecución (topológico)
```
Phase 0 (catalog.js) ──┬─► Phase 2 (measure-tokens)   [M2]
                       └─► Phase 3 (verify-lockfile)   [M3]
Phase 1 (anydoc opt-in) ................................ [M1]  ⟵ paralela
Phase 4 (cost-ledger) .................................. [M4]  ⟵ paralela
```
- **Paralelizables**: M1 (Phase 1), M4 (Phase 4), y Phase 0 entre sí.
- **Secuencial**: M2 y M3 dependen de Phase 0; cada milestone es mergeable de forma independiente (no requiere que los otros estén completos).
- **Orden de merge sugerido**: M1 → M2 → M3 → M4 (M1 primero porque reduce el boot que M2 mide).

## Puntos de verificación (comando CLI por milestone)
- **M1**: `node .opencode/bin/counts.js --json` → `mcps_active:1`, `mcps_optional` incluye `anydoc`; `node .opencode/bin/measure-tokens.js --scenario=greeting` → "MCPs active: 1"; `node .opencode/bin/setup-mcp.js activate anydoc` + `disable anydoc`.
- **M2**: `node .opencode/bin/measure-tokens.js --json` (componentes+baseline+cap); `node .opencode/bin/measure-tokens.js --cap=1800` (RED esperado); `node .opencode/bin/measure-tokens.js --baseline=none` (sin git).
- **M3**: `node .opencode/bin/verify-lockfile.js` (exit 0); editar skill → `node .opencode/bin/verify-lockfile.js` (exit 1 + diffs); `node .opencode/bin/verify-lockfile.js --fix` (exit 0).
- **M4**: cerrar sesión → `Get-ChildItem docs/state/cost-*.json` existe; `node -e "JSON.parse(require('fs').readFileSync('docs/state/cost-<ts>.json','utf8'))"` ok; `docs/sessions/LATEST.md` referencia el cost-file.
