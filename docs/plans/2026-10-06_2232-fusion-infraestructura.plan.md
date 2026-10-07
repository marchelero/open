---
prd: docs/prds/2026-10-06_2226-fusion-infraestructura.prd.md
status: DRAFT
created: 2026-10-06_2232
---

# Implementation Plan: Fusión de infraestructura — Fase 1 (CI · evals · instalador · validación)

## Overview

Portar al pack `open` la capa de ingeniería de Fase 1 del fork `MKY/agentes` **adaptada** a su catálogo real (63 skills · 59 agents · 58 commands · 17 CLIs), sin junctions legacy, sin filtrar skills y sin arrastrar agents filler. La entrega se divide en 4 milestones: **M1** CI multiplataforma (batería existente + eval-static), **M2** runner de evals + dataset propio, **M3** `lint-docs`/`wiring-test`/`installer-test` con remediación mecánica R1/R6/R7 + baseline R3/R4, **M4** `init-opencode.js` idempotente con filtrado de agents por stack.

Orden de ejecución: **M1 ∥ M2 → M3 → M4**. M1 y M2 son paralelizables (archivos disjuntos). M3 depende de M1 (edita `ci.yml`) y de M2 (baseline convive con evals). M4 depende de M3 (`installer-test.js` es su contrato de aceptación) y de la modificación de `smoke-test.js` (umbral `.stack`).

## Requirements

Extraídos del PRD (`docs/prds/2026-10-06_2226-fusion-infraestructura.prd.md`):

- **R1** — CI en `.github/workflows/ci.yml` con jobs Windows + Linux que corren la batería y quedan verdes; `measure-tokens` informativo; **sin paso de junctions**.
- **R2** — `eval-static.js` (runner zero-dep) + `evals/cases/static.json` adaptado, con `0 failures`.
- **R3** — `lint-docs.js`, `wiring-test.js` e `installer-test.js` corren contra `open` con exit 0 o baseline explícita revisada.
- **R4** — `init-opencode.js` (Node puro) instala/re-instala idempotente en Win/Linux, conserva las 63 skills, fusiona `opencode.json`/`.gitignore`/`skills-lock.json` sin pisar, poda huérfanos, **sin junctions**.
- **R5** — No regresión: `counts --check`, `validate-frontmatter`, `smoke-test`, `verify-lockfile` verdes; sin perder skills ni `anydoc` (opt-in); sin agents filler del fork.
- **Contrato global** — Zero-deps, Node ≥18 stdlib, CommonJS, ASCII, `--json`, exit 0/1, `path.join` siempre.

## Decisiones de diseño (Q1–Q3 + hallazgos del análisis)

| Tema | Decisión de este plan | Fundamento |
|---|---|---|
| **Q1 invariantes** | E2 `gte: 9`; E7 `bootStatus == GREEN`; E8 solo `verify.md`; se añaden E10–E15 propias (anydoc inactivo, 63 skills, 59 agents, 58 commands, lockfile v2 no vacío) | `open` tiene 10 ítems numerados pero el patrón `^[1-9]\. \*\*` cuenta 9; `savingsPct=2` (no 30); faltan `spec-lint/trace/definition-of-done` |
| **Q2 lint** | **Remediar** R1, R6, R7 **y fences malformados**; **baseline fingerprint** revisada para R3/R4; R2 queda a 0 al arreglar fences | Evidencia real: R1=1, R6=19, R7=4, R2=6, R3=11, R4=18, R5=0 |
| **Q3 instalador** | Filtrar **solo agents** por stack, `.stack` informativo, `--all-agents` opcional, **NO filtrar skills**, sin junctions | 4 comandos apuntan a `agent:` fuera del pool filtrable → la poda de comandos es no-op |
| **Portabilidad del runner** | `eval-static.js` se copia tal cual (usa `process.cwd()`); `wiring-test.js` y `lint-docs.js` se adaptan | `wiring-test.js` usa `ROOT = __dirname/../..` → al vivir en `.opencode/bin` resuelve `open` |
| **Umbral smoke-test** | Modificar `smoke-test.js` para leer `.opencode/.stack` y relajar el mínimo de agents en instalación filtrada | Hoy exige `agents >= 55`; una instalación filtrada tiene 33–38 → fallaría |

### Hallazgos nuevos (no estaban en el PRD)

1. **Fences malformados**: 6 command files usan fences de **2 backticks** (`flow-bugfix`, `flow-feature`, `flow-refactor`, `flow-security`, `orchestrate`, `plan`; 12 fences). Por eso R2 (prosa) ve líneas que deberían estar en bloque. Es un defecto real, mecánico y sin hash asociado.
2. **`counts --check` sin argumentos es un no-op**: `counts.js --check` solo compara los ficheros pasados como args; sin args, `files=[]` → exit 0 trivial. CI e `installer-test` **deben** pasar `.opencode/README.md .opencode/manual/README.md`.
3. **`wiring-test` detecta 3 huérfanos reales** en `open`: `api-mocker`, `event-driven-architect`, `monorepo-architect` (solo aparecen en `AGENTS_INDEX.md`, catálogo).
4. **Los 59 agents citan `INSTRUCTIONS.md`, no `AGENTS.md`** (`Prompt Defense Baseline: see INSTRUCTIONS.md  Prompt Defense Baseline (GLOBAL)`), y `INSTRUCTIONS.md` no existe. E4/E6 deben adaptarse a esa cadena.
5. **Editar `SKILL.md` invalida el lockfile**: `verify-lockfile` hashea solo `<skill>/SKILL.md` y cada agent `.md`. Toda remediación en un `SKILL.md` exige `verify-lockfile --fix` y re-commit del `skills-lock.json`.

## Architecture Changes

### Archivos nuevos

| Ruta | Origen (fork) | Nota |
|---|---|---|
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | Reescrito: sin junctions, Windows+Linux, Node 18 |
| `.opencode/bin/eval-static.js` | `eval-static.js` | Copia portable (runner) |
| `evals/cases/static.json` | `evals/cases/static.json` | Dataset rehecho para `open` |
| `evals/README.md` | `evals/README.md` | Documenta kinds y cómo añadir casos |
| `.opencode/bin/lint-docs.js` | `lint-docs.js` | Adaptado + baseline fingerprint |
| `.opencode/bin/lint-docs.baseline.json` | — (nuevo) | Baseline revisada R3/R4 |
| `.opencode/bin/wiring-test.js` | `wiring-test.js` | Adaptado a 59/58/63 |
| `.opencode/bin/installer-test.js` | `installer-test.js` | Escenarios/checks de `open` |
| `init-opencode.js` (raíz) | `init-opencode.js` | Instalador adaptado, sin junctions |

### Archivos modificados

| Ruta | Cambio | Milestone |
|---|---|---|
| `smoke-test.js` | Leer `.opencode/.stack`; umbral agents 55 (all) / 30 (filtrado) | M3/M4 |
| `.opencode/commands/flow-*.md` (6), `orchestrate.md`, `plan.md` | Fences 2-backtick a 3-backtick (12) | M3 |
| `.opencode/agents/k8s-reviewer.md:56` | Balancear backtick | M3 |
| `.agents/skills/caveman/README.md:48` | `../../README.md` → `../../../.opencode/README.md` | M3 |
| `.agents/skills/docs-writing/rules/nav-agent-readable.md:9` | `(url)` → `` `url` `` (code span) | M3 |
| `.agents/skills/self-improving/skill-card.md:46-48` | `artifact/{boundaries,setup,operations}.md` → `{boundaries,setup,operations}.md` | M3 |
| `.agents/skills/vercel-react-best-practices/AGENTS.md:116,219,892` | `./async-*.md` → `./rules/async-*.md` (verificar existencia) | M3 |
| `.agents/skills/mcp-server-patterns/SKILL.md:12` | `../../docs/...` → `../../../.opencode/manual/SURFACES.md` | M3 |
| `.opencode/README.md:58-63` | `./.opencode/manual/*` → `./manual/*` (6) | M3 |
| `docs/PROJECT.md:148-151` | Vaciar bloque `## Recent Activity` (placeholder) | M3 |
| `.agents/skills/debugging-patterns/SKILL.md:387` | Envolver muestra `Ã©` en backticks | M3 |
| `.agents/skills/postgresql-optimization/SKILL.md:12,99,147` | Reemplazar U+FFFD (+U+FE0F) por emoji o quitarlo | M3 |
| `skills-lock.json` | Re-pin (efecto de edits en `SKILL.md`) | M3 |
| `.github/workflows/ci.yml` | Añadir gates `lint-docs`, `wiring-test`, `installer-test` | M3 |

---

## Implementation Steps

### Phase M1 — CI multiplataforma

1. **[Verificar Node 18 localmente / fijar baseline]** (File: `.github/workflows/ci.yml` nuevo)
   - Action: confirmar que los 5 CLIs existing corren en Node 18 (revisar uso de `fs.rmSync` OK 14.14+, `structuredClone` ausente, `??=`/optional chaining OK 14+). Fijar `node-version: "18"` en ambos jobs (opcional matrix `[18, 20]`).
   - Why: `package.json` declara `engines.node >=18`; el fork usa 24.
   - Dependencies: None. Risk: Low.
   - Parallelizable con M2.

2. **[Crear `ci.yml` con la batería actual + eval-static]** (File: `.github/workflows/ci.yml`)
   - Action: jobs `verify-windows` (`windows-latest`) y `verify-linux` (`ubuntu-latest`). Pasos idénticos, sin junctions:
     `counts.js --check .opencode/README.md .opencode/manual/README.md` → `validate-frontmatter.js` → `verify-lockfile.js` → `smoke-test.js` → `eval-static.js` (M2) → `measure-tokens.js` (`continue-on-error: true`).
   - Why: gate mínimo en verde desde el día 1; los CLIs nuevos se añaden en M3.
   - Dependencies: M2 (eval-static) para el paso de evals. Risk: Low.
   - **Decisión de diseño**: los pasos `lint-docs`/`wiring-test`/`installer-test` NO entran aquí; se añaden en M3 una vez verdes (evita CI roto desde día 1, riesgo del PRD).

3. **[Sin junctions / sin README]**: no crear step de symlinks; no tocar `README.md` raíz (Out of Scope).

- **Verificación M1**: `node .opencode/bin/counts.js --check .opencode/README.md .opencode/manual/README.md && node .opencode/bin/validate-frontmatter.js && node .opencode/bin/verify-lockfile.js && node .opencode/bin/smoke-test.js` (exit 0). CI verde en push/PR (Windows + Linux).

---

### Phase M2 — Evals de invariantes

1. **[Copiar runner eval-static]** (File: `.opencode/bin/eval-static.js` nuevo)
   - Action: copiar verbatim desde el fork; verificar que solo usa `process.cwd()` y `evals/cases/*.json` (confirmado portable). Sin cambios salvo bug.
   - Dependencies: None. Risk: Low.

2. **[Rehacer dataset adaptado]** (File: `evals/cases/static.json` nuevo)
   - Action: reemplazar el dataset del fork por los casos calibrados:

     | id | kind | definición adaptada |
     |---|---|---|
     | E1 | absent | `.opencode/AGENTS.md` sin `auto-?checkpoint\|auto-?commit\|every 10 minutes\|WIP: pre-` |
     | E2 | count | `^[1-9]\. \*\*` en AGENTS.md, **`gte: 9`** |
     | E3 | present | `Prompt Defense Baseline \(GLOBAL` en AGENTS.md, min 1 |
     | E4 | every | agents `*.md` contienen **`Prompt Defense Baseline`** (cambia de `see AGENTS.md`) |
     | E5 | orphan | 0 huérfanos estrictos |
     | E6 | heading | pattern `Prompt Defense Baseline: see INSTRUCTIONS\.md\s+([^\r\n<]+?)\s*-->`, `dir: .opencode/agents`, `target: .opencode/AGENTS.md` |
     | E7 | metric | `tool: measure-tokens`, `field: bootStatus`, `equals: GREEN` |
     | E8 | files | solo `.opencode/commands/verify.md` |
     | E9 | present | `\*\*Git consent\*\*` en AGENTS.md |
     | E10 | absent | `anydoc` ausente de `opencode.json` (opt-in) |
     | E11 | metric | `tool: counts`, `field: skills`, `equals: 63` |
     | E12 | metric | `tool: counts`, `field: agents`, `equals: 59` |
     | E13 | metric | `tool: counts`, `field: commands`, `equals: 58` |
     | E14 | presence | `skills-lock.json` contiene `"version": 2` |
     | E15 | count | `skills-lock.json` `"sha256"` **`gte: 122`** (63 skills + 59 agents) |

   - Why: refleja ESTE pack (Q1); E5 depende de la remediación de huérfanos (M3); E11–E15 son las invariantes propias.
   - Dependencies: E5 requiere M3 (remover huérfanos); E7 requiere que `measure-tokens --json` siga emitiendo `bootStatus`.
   - Risk: Medium (E5/E6/E11 pueden requerir re-calibración tras M3).
   - **Nota runner**: `kMetric` solo lee campos top-level; por eso E7 usa `bootStatus` (no `current.bootTokens`) y E11–E13 usan `counts --json` (campos top-level). No se modifica el runner.

3. **[Documentar el sistema de evals]** (File: `evals/README.md` nuevo)
   - Action: kinds soportados, cómo añadir un caso (solo JSON), contrato exit 0/1, `--json`/`--quiet`.
   - Dependencies: Step 1. Risk: Low.

- **Verificación M2**: `node .opencode/bin/eval-static.js` → `0 failures`. Aislado en la subfase M2a (E1–E4, E6–E15) y M2b (E5 tras M3). `node .opencode/bin/eval-static.js --json` parseable.

---

### Phase M3 — lint-docs · wiring-test · installer-test (+ remediación)

**M3a — Remediación mecánica (bloquea el gate de lint-docs).**

1. **[R1 unbalanced backtick]** (File: `.opencode/agents/k8s-reviewer.md:56`)
   - Action: añadir el backtick de cierre tras `]` → `` **`capabilities.add: [...]`**: ``.
   - Dependencies: None. Risk: Low.

2. **[R6 enlaces rotos — 19]** (Files: ver tabla "Archivos modificados")
   - Action: corregir cada destino a un path existente o convertir a code span:
     - `caveman/README.md:48` → `../../../.opencode/README.md`
     - `docs-writing/rules/nav-agent-readable.md:9` → `` `url` `` (ejemplo, no enlace)
     - `self-improving/skill-card.md:46-48` → quitar prefijo `artifact/` (los ficheros están en la raíz de la skill)
     - `vercel-react-best-practices/AGENTS.md:116,219,892` → `./rules/<archivo>.md` (verificar nombre real; si no existe, code span)
     - `mcp-server-patterns/SKILL.md:12` → `../../../.opencode/manual/SURFACES.md`
     - `.opencode/README.md:58-63` → `./manual/*` (6)
     - `docs/PROJECT.md:148-151` → vaciar `## Recent Activity` al placeholder auto-managed (historial caducado; el instalador ya lo recorta)
   - Dependencies: None. Risk: Low. **Ojo**: `mcp-server-patterns/SKILL.md` está en lockfile → re-pin en step 5.

3. **[R7 mojibake — 4]** (Files: `debugging-patterns/SKILL.md:387`, `postgresql-optimization/SKILL.md:12,99,147`)
   - Action: `debugging-patterns` documenta un ejemplo de mojibake → envolver la muestra (`Ã©`, U+00C3 U+00A9) en backticks para tratarla como dato. `postgresql-optimization` tiene U+FFFD en 3 headings → reemplazar por el emoji previsto (p.ej. 🐘) o eliminarlo; conservar sin cambios cualquier otra parte de la línea.
   - Why: R7 es prose-rule; los code spans son data.
   - Dependencies: None. Risk: Low. **Ambos `SKILL.md` están en lockfile → re-pin en step 5.**

4. **[Fences malformados — 12, hallazgo nuevo]** (Files: `flow-bugfix:91,104`, `flow-feature:87,100`, `flow-refactor:123,136`, `flow-security:132,145`, `orchestrate:225,238`, `plan:70,83`)
   - Action: `` ``` `` → ` ``` ` (2→3 backticks). Esto elimina los 6 R2 (`frase truncada en "as"`, que eran contenido dentro de fences no detectadas).
   - Dependencies: None. Risk: Low. No están en lockfile.

5. **[Re-pin del lockfile]** (File: `skills-lock.json`)
   - Action: `node .opencode/bin/verify-lockfile.js --fix`; commit del lockfile. Verificar que E14/E15 (M2) siguen verdes.
   - Dependencies: Steps 2–3. Risk: Medium (olvidar el re-pin rompe `verify-lockfile`).

**M3b — CLIs nuevos.**

6. **[Portar `lint-docs.js` + baseline]** (File: `.opencode/bin/lint-docs.js`, `.opencode/bin/lint-docs.baseline.json` nuevos)
   - Action: copiar del fork y adaptar:
     - `SKIP_DIRS`: quitar `agents-backup` (no existe); conservar `node_modules/.git/backup/dist/build/.next`. Añadir `.opencode/node_modules` (ya cubierto por nombre).
     - `SKIP_FILES`: `PENDIENTES.md` (no existe en `open`) → dejar vacío o `LECCIONES.md` si se añade.
     - Añadir **baseline fingerprint**: `--baseline <path>` (default auto-load `lint-docs.baseline.json`), `--update-baseline`, `--strict`. Fingerprint = `rule + relpath + sha1(línea normalizada)` (robusto a desplazamientos de línea, sensible a cambios de contenido). Exit 0 si solo quedan hallazgos baselined; 1 si hay hallazgos nuevos; `--strict` además falla si el baseline tiene entradas stale.
     - Reglas R1–R7 sin cambios.
   - Why: hard-gate con deuda R3/R4 conocida sin romper CI (Q2).
   - Dependencies: M3a (el baseline se captura DESPUÉS de remediar). Risk: Medium.

7. **[Capturar la baseline revisada]** (File: `.opencode/bin/lint-docs.baseline.json`)
   - Action: `node .opencode/bin/lint-docs.js --dir . --update-baseline` tras M3a; revisar que solo contenga R3 (11) y R4 (18). Añadir el fichero al repo.
   - Dependencies: Steps 1–6. Risk: Low.

8. **[Portar `wiring-test.js`]** (File: `.opencode/bin/wiring-test.js` nuevo)
   - Action: portar (ROOT ya resuelve `open` vía `__dirname/../..`); actualizar comentarios 85/40→59/63. W1–W8 sin cambios de lógica.
   - Dependencies: step 9 (remediar W2). Risk: Low.

9. **[Remediar huérfanos W2]** (File: `.opencode/manual/ROUTE.md`)
   - Action: añadir `api-mocker`, `event-driven-architect`, `monorepo-architect` como superficies de dispatch (tabla de agentes por intención de ROUTE.md). `ROUTE.md` es surface de W2 y tierA de E5, y no está en lockfile.
   - Why: estar en `AGENTS_INDEX` (catálogo) no es ruta de dispatch.
   - Dependencies: None. Risk: Low. **Fallback**: si se decide que son catálogo-only, añadir allowlist documentada en `wiring-test.js`+`eval-static` (requiere cambio del runner → preferir remediar).

10. **[Reescribir `installer-test.js`]** (File: `.opencode/bin/installer-test.js` nuevo)
    - Action: portar los 7 escenarios adaptados a `open`:
      - **T1** install limpia con filtro (flutter): `agents` entre 30 y 58; `commands == 58`; 0 huérfanos; `.opencode/.stack` presente; **skills == 63** (no se filtran); router intacto; sin nesting; `counts --check` con ficheros; `smoke-test` PASS.
      - **T2** merge conservador: `.gitignore` conserva líneas propias; `opencode.json` conserva `theme/model/mcp`; añade `context7`; **no** espera bloque de junctions.
      - **T3** idempotencia: hash estable de `.gitignore`, `opencode.json`, **`skills-lock.json`**; agents estables; sin nesting.
      - **T4** `--all-agents`: `agents == 59`, sin `.stack`.
      - **T5** `--pack-path` inválido: error claro y 0 instalación.
      - **T6** stack no detectado: conserva los 59 agents (conservador) y 63 skills.
      - **T7** scaffolders crean artefactos válidos y refrescan `## Counts`.
    - `testCounts()` debe pasar `counts.js --check .opencode/README.md .opencode/manual/README.md` (no-op fix).
    - Dependencies: M4 (`init-opencode.js`) para estar verde; `smoke-test.js` adaptado. Risk: Medium-High.

11. **[Adaptar `smoke-test.js` a `.stack`]** (File: `.opencode/bin/smoke-test.js`)
    - Action: si `.opencode/.stack` existe y ≠ `all` → `agents >= 30`; si no → `agents >= 55`. `skills` sigue `>= 10` (63 real).
    - Why: instalación filtrada (33–38 agents) rompería el umbral 55.
    - Dependencies: M4 writer. Risk: Low.

12. **[Wirear M3 en `ci.yml`]** (File: `.github/workflows/ci.yml`)
    - Action: añadir steps `lint-docs --dir . --baseline .opencode/bin/lint-docs.baseline.json`, `wiring-test`, `installer-test` a ambos jobs, tras `smoke-test` y antes de `measure-tokens`.
    - Dependencies: Steps 1–11. Risk: Low.

- **Verificación M3**: `node .opencode/bin/lint-docs.js --dir . --baseline .opencode/bin/lint-docs.baseline.json` (exit 0; R1=R2=R5=R6=R7=0, R3=11, R4=18 baselined); `node .opencode/bin/wiring-test.js` (exit 0, 8/8); `node .opencode/bin/verify-lockfile.js` (CLEAN); `node .opencode/bin/installer-test.js` (exit 0 tras M4).

---

### Phase M4 — Instalador idempotente

1. **[Portar `init-opencode.js` sin junctions]** (File: `init-opencode.js` raíz, nuevo)
   - Action: partir del fork y adaptar:
     - **Eliminar** `ensureLink`, `readLinkNormalized`, `spawnNodeQuiet` de junctions y el bloque "Junctions compat 1.17.x". `smoke-test` ya valida que `.opencode/agent`/`.opencode/skill` NO existan.
     - **STACK_AGENTS** = pool de lenguaje real de `open` (28): `angular-{build-resolver,reviewer}`, `cpp-{build-resolver,reviewer}`, `csharp-reviewer`, `dart-build-resolver`, `flutter-reviewer`, `django-{build-resolver,reviewer}`, `fastapi-reviewer`, `go-{build-resolver,reviewer}`, `java-{build-resolver,reviewer}`, `kotlin-{build-resolver,reviewer}`, `php-reviewer`, `python-reviewer`, `pytorch-build-resolver`, `react-{build-resolver,reviewer}`, `rust-{build-resolver,reviewer}`, `svelte-reviewer`, `swift-{build-resolver,reviewer}`, `typescript-reviewer`, `vue-reviewer`. Quitar `harmonyos-app-resolver` (no existe).
     - **STACK_KEEP** por stack (node conserva angular/react/svelte/typescript/vue; python añade `django-reviewer`; kotlin sin harmonyos; resto según pool).
     - **Eliminar** `JS_ONLY_SKILLS`/`STACK_SKILLS` y toda la poda de skills + poda de filas del router (Q3: NO filtrar skills).
     - Mantener poda de **comandos huérfanos** (no-op en `open`, pero correcta).
     - `.stack`: escribir `detectedStack` cuando haya filtro; borrarlo si no; ausente con `--all-agents`.
     - Final checks adaptados: agents min 30 (filtrado) / 55 (all); commands min 50; skills min 55 (63); CLIs min 10; plugins 1; manual 5; templates 1.
     - Mensajes/labels: "63 skills", "59 agents", MCPs `context7` activo + `anydoc` opt-in, ciclo SDD real (`/prd → /plan → /tasks → /verify → /audit-report`).
     - `mergeJsonConservative`/`mergeGitignore`/`copyDirChildren` sin cambios (ya son conservadores y anti-nesting).
     - **No** añadir junctions al `.gitignore` del destino más allá de lo que ya esté en el pack (el pack ya ignora `/.opencode/agent|skill`).
   - Dependencies: M3 steps 10–11. Risk: High (el punto duro del PRD).
   - **Paralelizable**: la construcción del archivo es independiente de M3a/M3b; su *verde* depende de `installer-test`.

2. **[Regenerar índices y conteos tras instalar]** — ya presente en el port: `counts.js --update .opencode/README.md .opencode/manual/README.md`, `build-agents-index.js`, `build-skills-index.js` (ambos resuelven el proyecto instalado por `__dirname`). Verificar que el README instalado diga 63 skills / agents filtrados.

3. **[Smoke-test en proyecto instalado]** — depende del step 11 de M3.

- **Verificación M4**:
  - `node init-opencode.js --project-path <tmp-flutter> --stack flutter --skip-install --skip-docs --force` (2 veces) → 63 skills, agents 33, `.stack=flutter`, 0 nesting.
  - `node init-opencode.js --project-path <tmp-node> --stack node --skip-install --skip-docs` → agents 38, 63 skills.
  - `node init-opencode.js --project-path <tmp-all> --all-agents --skip-install --skip-docs` → 59 agents, sin `.stack`.
  - `node .opencode/bin/installer-test.js` → PASS; `node .opencode/bin/smoke-test.js` en el proyecto instalado → PASS.

---

## Testing Strategy

- **Unit (por CLI)**: cada CLI con `--json` y exit codes; `eval-static` kinds cubiertos por el dataset; `lint-docs` baseline (nuevo vs tolerado vs stale).
- **Integración**:
  - `installer-test.js` T1–T7 (install/merge/idempotencia/all-agents/bad-pack/unknown-stack/scaffold) sobre `os.tmpdir()`, sin junctions.
  - `verify-lockfile` tras cada remediación de `SKILL.md`/agent.
  - `counts --check` con ficheros explícitos.
- **E2E (CI)**: Windows + Linux, Node 18, batería completa + eval-static + medida informativa.
- **No regresión**: comparar `counts --json` (63/59/58/17) y lockfile antes/después; `smoke-test` 21/21; `anydoc` ausente de `opencode.json`.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **smoke-test umbral 55 rompe install filtrada** (no previsto en PRD) | high | high | Adaptar `smoke-test.js` a `.stack` (M3 step 11) antes de validar `installer-test` |
| **3 huérfanos W2/E5** (api-mocker, event-driven-architect, monorepo-architect) | high | med | Remediar vía `ROUTE.md` (`ROUTE` no está en lockfile); fallback allowlist |
| **Editar `SKILL.md` invalida lockfile** → `verify-lockfile` rojo | high | med | `verify-lockfile --fix` en M3 step 5; E14/E15 confirman |
| **Fences malformados (12)** no previstos; pueden esconder más deuda | med | med | Arreglar 2→3 backticks; re-medir lint-docs; baseline resultante revisada |
| **`counts --check` no-op** da falsa seguridad | high | low | Pasar ficheros explícitos en CI e installer-test |
| **Node 18 vs local 24** (divergencias API) | low | med | Correr la batería en Node 18 en CI; optional matrix 18+20 |
| **Baseline fingerprint laxo** (línea-independiente) deja pasar regresiones | med | med | Fingerprint = hash de contenido de línea; `--strict` en CI opcional |
| **`installer-test` en M3 sin instalador M4** (falso rojo temporal) | high | low | Autoría en M3, verde bloqueado a M4; no wirear a `ci.yml` hasta M4 verde |
| **E6 apunta a `INSTRUCTIONS.md` inexistente** (texto engañoso en 59 agents) | med | low | E6 valida contra `AGENTS.md`; documentar mismatch; no tocar 59 agents (fuera de alcance) |
| **Scope creep** (README, gobernanza, Fase 3/4) | med | med | Out of Scope del PRD; PR único por milestone |

## Success Criteria

- [x] `.github/workflows/ci.yml` en su sitio (Windows + Linux, Node 18), sin junctions; `measure-tokens` informativo.
- [x] `node .opencode/bin/eval-static.js` → `0 failures` con el dataset adaptado (E1–E15).
- [x] `lint-docs` exit 0 con baseline revisada (R1=R2=R5=R6=R7=0; R3=11, R4=18 baselined); `wiring-test` 8/8; `installer-test` 43/43.
- [x] `init-opencode.js` idempotente, conserva 63 skills, filtra agents por stack, `.stack` informativo, `--all-agents`, sin junctions.
- [x] Sin regresión: `counts --check` (con ficheros), `validate-frontmatter`, `smoke-test`, `verify-lockfile` verdes; `anydoc` ausente de `opencode.json`; 0 agents filler del fork.

---
*Plan generado por `/plan` desde el PRD `2026-10-06_2226-fusion-infraestructura`. Ejecución: M1 ∥ M2 → M3 → M4. Sin implementación hasta aprobación.*
