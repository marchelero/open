# Comparativa: `open` (tu pack) vs `MKY/agentes` (la "mejora")

**Fecha:** 2026-10-06
**Origen A:** `D:\dev\2026\open` (marchelero/open — tu proyecto)
**Origen B:** `D:\dev\2026\MKY\agentes` (miguelalbisortiz/agentes — fork que te pasaron)

---

## 1. Veredicto en una línea

`agentes` **no es "mejor que el tuyo": es tu pack + una capa de ingeniería de producto** (instalador, CI, evals, orquestación, docs). Gana en robustez y portabilidad. **Pierde** la mitad de tus skills valiosas (docs/PDF/Office, diagramas, UI/design, arquitectura). La jugada correcta es **fusionar**: adoptar la infraestructura de `agentes` y re-integrar las skills que descartó.

---

## 2. Números duros

| Recurso | `open` (A) | `agentes` (B) | Diferencia |
|---|---|---|---|
| Agents | 59 | **85** | B +26 |
| Skills | **63** | 40 | B **−23** |
| Commands | 58 | **70** | B +12 |
| CLIs (`.opencode/bin`) | 16 | **21** | B +5 |
| Plugins locales | 1 (hookify) | 1 (hookify) | = |
| MCP activo | **2** (context7 + anydoc) | 1 (context7) | B −1 |
| MCP opcional | — | 14 (anunciado) | B +14 |
| README.md | ❌ | ✅ (17 KB) | B |
| Instalador | ❌ (copia manual) | ✅ (js + ps1) | B |
| CI (.github) | dependabot.yml | workflows/ci.yml | B |
| Evals / invariantes | ❌ | ✅ (9 invariantes) | B |
| Lint-docs / wiring-test / installer-test | ❌ | ✅ | B |

---

## 3. Diferencias clave en detalle

### 3.1 Ingeniería y validación (gana B con claridad)
- **Instalador idempotente multiplataforma** (`init-opencode.js` + `.ps1`, ~40 KB c/u): detecta el stack del proyecto (`package.json`→node, `pyproject.toml`→python, `pubspec.yaml`→flutter…), **podan los agents/resolvers de lenguajes que no aplican**, fusionan `opencode.json`/`.gitignore`/`skills-lock.json` sin pisar lo tuyo, y limpian referencias huérfanas (comandos que apuntan a un agent descartado, filas del router). Tu pack se copia a mano, sin filtro ni merge.
- **CI gate** (`.github/workflows/ci.yml`): 2 jobs (Windows + Linux) que corren lint-docs, counts, wiring-test, frontmatter, smoke-test, eval-static e installer-test en cada push/PR.
- **EDD (eval-driven)**: `evals/cases/static.json` con 9 invariantes de comportamiento (E1–E9) que protegen regresiones: no auto-commit, las 9 conductas, baseline de prompt-defense, 0 huérfanos, gates SDD presentes, etc. Corren con `eval-static.js`. Esto es lo más maduro del pack.
- **CLIs extra**: `eval-static.js`, `lint-docs.js` (enlaces rotos/mojibake), `wiring-test.js` (command→agent→skill), `installer-test.js` (48 checks).
- **Presupuesto de tokens** con baseline histórica (35 % ahorro vs meta 40 %), heredado de TU PRD `2026-08-12-optimize-pack-token-consumption` (que ya está en tus `docs/prds/archive`).

### 3.2 Gobernanza (`AGENTS.md`) (gana B)
Tu `AGENTS.md` lista "9 conductas" pero tiene **10 ítems** (bug: el ítem 10 "Context cut-off" quedó suelto). B lo arregla y añade:
- **Compaction Recovery** (CRÍTICO): checklist post-compactación para no perder contexto.
- **Agent Coordination Rules**: handoff protocol entre agents (output a `docs/`), y sobre todo **Agent Availability** — si un agent fue podado por el filtro de stack, el router sabe el fallback genérico (`code-reviewer`, `build-error-resolver`).
- **Session Memory enhanced**: al iniciar lee `PROJECT.md` + `LEARNING.md` + `LATEST.md` + `state/*.json` + planes en curso; al cerrar corre `project-learning` y actualiza `LEARNING.md`.
- Mejora la redacción de las conductas 2, 5, 6 y 8 (más precisas, con "cero sub-agentes por defecto").

### 3.3 Orquestación / flujos (gana B)
Ciclo SDD formal y encadenable: `/prd → /spec-lint → /plan → /tasks → /verify → /audit-report → /trace → /definition-of-done`, con `/orchestrate`, `/flow-*`, `/change-request`, `/spec-to-tests`, `/definition-of-done`. Tu pack tiene `/prd`, `/plan`, `/verify`, `/route`, etc., pero no el ciclo completo con gates.

### 3.4 Documentación (gana B)
README de 374 líneas, manual más completo (`COMMANDS.md` 10.6 KB vs 8.4; `ROUTE.md` 9.2 vs 7.0), bloques `## Counts` autogenerados que nunca mienten.

### 3.5 Amplitud de conocimiento (gana A — y es la gran pérdida de B)
B **borró 23 skills** que son justo las de mayor valor para "cualquier cosa":

| Categoría | Skills que B descartó (tú las tienes) |
|---|---|
| Documentos/Office | `docx`, `pdf`, `pptx`, `xlsx`, `convert-documents-to-markdown` |
| Diagramas/visual | `archify`, `codebase-graph`, `open-montage` |
| UI / diseño | `ui-ux-pro-max`, `ui-design-systems`, `anthropic-frontend-design`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-web-design` |
| Arquitectura/backend | `microservices-patterns`, `message-queue-patterns`, `monorepo-patterns`, `caching-patterns`, `edge-computing`, `database-migrations`, `postgresql-optimization`, `webassembly-patterns` |
| IA/LLM | `ai-llm-patterns`, `deep-research`, `persistent-memory` |
| Proceso/calidad | `agent-evals`, `docs-writing`, `changelog-automation`, `contextual-commits`, `git-hooks`, `file-search`, `grill-me`, `self-improving`, `testing`, `typescript-advanced-patterns`, `environment-config`, `feature-flags`, `pipeline-patterns`, `python-async-patterns`, `realtime-patterns`, `github-actions-efficiency`, `kubernetes-specialist` |

B a cambio añadió skills **SaaS/stack-specific** (útiles pero más nicho): `drizzle-patterns`, `supabase-patterns`, `stripe-integration`, `clerk-auth`, `firebase-patterns`, `turso-libsql`, `railway-deploy`, `vercel-deploy`, `compliance-checker`, `api-contract-tester`, `db-schema-visualizer`, `flow-visualizer`.

> Nota: B también **borró el MCP `anydoc`** (tu conversor local de PDF/Word/Excel). Pierdes esa capacidad.

### 3.6 Agents (empate con matices)
B tiene +26 agents, pero una parte son "filler"/muy de nicho: `gan-generator`/`gan-planner`/`gan-evaluator`, `marketing-agent`, `seo-specialist`, `homelab-architect`, `healthcare-reviewer`, `network-*`, `harmonyos-app-resolver`, `fsharp-reviewer`, `opensource-*`. Sí añade buenos: `architect`, `chief-of-staff`, `audit-orchestrator`, `fullstack-builder`, `api-integrator`, `legacy-modernizer`, `refactor-cleaner`, `manual-writer`, `graphql-builder`, `supabase-builder`.
Tu catálogo de 59 es el set estándar bien curado (build-resolvers, reviewers por lenguaje, etc.). B te gana en **cobertura de proceso** (orquestador, auditor, jefe de staff), no necesariamente en calidad por agente.

---

## 4. Puntuación

Escala 0–10 por dimensión. Total sobre 90.

| Dimensión | `open` | `agentes` | Ganador |
|---|---|---|---|
| Skills (amplitud de conocimiento) | **9** | 6 | A |
| Agents (utilidad real) | 7 | 7 | = |
| Comandos / flujos | 7 | **9** | B |
| Ingeniería / verificación (CI, evals, tests) | 5 | **9** | B |
| Instalación / portabilidad | 3 | **9** | B |
| Documentación | 5 | **9** | B |
| Gobernanza (`AGENTS.md`) | 6 | **9** | B |
| Integraciones (MCP) | **8** | 7 | A |
| Mantenibilidad / autogeneración | 6 | **9** | B |
| **TOTAL** | **56** | **74** | **B** |

**Lectura:** `agentes` gana como *producto* (robusto, portable, verificable, documentado). `open` gana como *biblioteca de conocimiento* (muchas más skills, documentos, diagramas y UI).

---

## 5. Beneficios y desventajas de cada uno

### `open` (tuyo)
**Beneficios**
- 63 skills → cobertura real de "cualquier cosa" (Office, PDF, diagramas, UI, arquitectura, IA).
- 2 MCP activos (context7 + anydoc): conversión local de documentos.
- Base bien curada de agents estándar.
- Historial de auditorías/planes/PRDs en `docs/` (incluido el PRD de optimización de tokens que B usó como baseline).

**Desventajas**
- Sin instalador: copia manual, sin filtro por stack, sin merge idempotente.
- Sin CI ni evals: no hay red de seguridad contra regresiones.
- Sin README: onboarding débil.
- `AGENTS.md` tiene el bug de "9 conductas = 10 ítems"; menos gobernanza (sin handoff, sin recovery post-compactación, sin fallback por stack).
- Flujo SDD incompleto (faltan gates `/spec-lint`, `/audit-report`, `/definition-of-done`).

### `agentes` (B)
**Beneficios**
- Ingeniería de producto seria: instalador idempotente multiplataforma con filtro de stack, CI en Windows+Linux, evals de invariantes, lint de docs, wiring test.
- Gobernanza y orquestación superiores.
- Documentación completa y autogenerada (counts, índices).
- +12 comandos y +26 agents de proceso/rol.

**Desventajas**
- **Perdió 23 skills valiosas** y el MCP `anydoc`. Para "cualquier cosa" quedó cojo en documentos, diagramas y diseño de UI.
- Muchos agents nuevos son de nicho/baja demanda (gan-*, marketing, seo, homelab, healthcare, harmonyos).
- Más peso: `AGENTS.md` 5.7 KB vs 3.5 KB; más superficie que mantener.
- La meta de tokens sigue en rojo (35 % vs 40 %) — la optimización no está terminada ni ahí.

---

## 6. Qué hizo BIEN B (cópialo tal cual)

1. **Instalador** `init-opencode.js` + `.ps1` (idempotente, filtro de stack, merge). Es lo que más valor te aporta de inmediato.
2. **CI** `.github/workflows/ci.yml` (jobs Windows + Linux).
3. **Evals** `evals/cases/static.json` + `eval-static.js` (invariantes E1–E9). Añadir regresiones sin tocar código.
4. **CLIs de validación** `lint-docs.js`, `wiring-test.js`, `installer-test.js`.
5. **Secciones de `AGENTS.md`**: "Compaction Recovery", "Agent Coordination Rules" (handoff + fallback por stack), "Session Memory (Enhanced)".
6. **README.md** y el manual `COMMANDS.md`/`ROUTE.md` ampliado.
7. **Comandos de orquestación**: `/orchestrate`, `/spec-lint`, `/audit-report`, `/trace`, `/definition-of-done`, `/change-request`, `/flow-*`, `/spec-to-tests`.
8. **Agents de proceso**: `audit-orchestrator`, `chief-of-staff`, `architect`, `fullstack-builder`, `api-integrator`, `legacy-modernizer`, `refactor-cleaner`, `manual-writer`.
9. **Bloques `## Counts` autogenerados** + `AGENTS_INDEX.md`/`skills/INDEX.md` regenerables.
10. **Arreglo del bug** "9 conductas = 10 ítems".

## 7. Qué hizo MAL B (no lo copies — consérvalo de tu pack)

1. **No borres tus 23 skills**: `docx`, `pdf`, `pptx`, `xlsx`, `convert-documents-to-markdown`, `archify`, `codebase-graph`, `open-montage`, `ui-ux-pro-max`, `ui-design-systems`, `anthropic-frontend-design`, `vercel-*`, `microservices/message-queue/monorepo/caching/edge-computing`, `ai-llm-patterns`, `deep-research`, `database-migrations`, `postgresql-optimization`, `testing`, `typescript-advanced-patterns`, `environment-config`, `feature-flags`, `kubernetes-specialist`, etc.
2. **No borres el MCP `anydoc`** (conversión local de documentos).
3. **No adoptes ciegamente los agents "filler"** (gan-*, marketing, seo, homelab, healthcare, harmonyos, fsharp): añade solo los que uses.
4. **No copies el README de B con su "meta 40 %" sin tu propia baseline**: tu PRD de tokens ya está en tus docs; mide contra tu baseline real.

---

## 8. Plan de fusión recomendado (ordénalo por turno)

**Fase 1 — Infraestructura (copiar de B → A), impacto máximo, riesgo bajo**
1. Añadir `init-opencode.js` + `init-opencode.ps1`.
2. Añadir `.github/workflows/ci.yml`.
3. Añadir `evals/` (cases/static.json + README) y `eval-static.js`.
4. Añadir `lint-docs.js`, `wiring-test.js`, `installer-test.js`.
5. Añadir `README.md` (reescrito para tu pack, no el de B).

**Fase 2 — Gobernanza (fusionar AGENTS.md)**
6. Fusionar secciones "Compaction Recovery", "Agent Coordination Rules", "Session Memory (Enhanced)" sobre TU `AGENTS.md`, y arreglar el bug 9/10.
7. Mantener tu "External Tools" (Archify + AnyDoc) que B borró.

**Fase 3 — Flujos y proceso (copiar de B → A)**
8. Añadir los comandos de orquestación SDD y sus gates.
9. Añadir agents de proceso: `audit-orchestrator`, `chief-of-staff`, `architect`, `fullstack-builder`, `api-integrator`, `legacy-modernizer`, `refactor-cleaner`, `manual-writer`.

**Fase 4 — Skills de B que SÍ valen (copiar selectivamente)**
10. `drizzle-patterns`, `supabase-patterns`, `stripe-integration`, `clerk-auth`, `firebase-patterns`, `turso-libsql`, `compliance-checker`, `api-contract-tester`, `db-schema-visualizer`, `flow-visualizer`, `railway-deploy`, `vercel-deploy`.

**Resultado final esperado:** tu amplitud de skills (63+12≈75) + la ingeniería de B (instalador, CI, evals, orquestación) = un pack claramente superior a ambos.

---

## 9. Conclusión

`agentes` es tu pack con una capa de ingeniería de producto excelente (lo que le faltaba a `open`), pero pagó el precio de **podar tu biblioteca de conocimiento** para enfocarse en un stack SaaS. No es "reemplazo", es "especialización". La versión definitiva es la fusión: **el esqueleto de `agentes` + las skills y el MCP anydoc de `open`**.

---

## 10. Anexo — Comparativa real de consumo de tokens

Mediciones ejecutadas en ambos packs (2026-10-06), usando la heurística del propio pack (`4 bytes ≈ 1 token`) para que sean comparables.

### 10.1 Boot (coste en CADA turno, siempre cargado)

Fuente: `node .opencode/bin/measure-tokens.js --scenario=greeting` en cada pack.

| Componente | `open` | `agentes` |
|---|---|---|
| AGENTS.md | 3 527 B = **882 tok** | 5 682 B = **1 421 tok** |
| MCPs activos | 2 (context7 + anydoc) = 800 tok | 1 (context7) = 400 tok |
| Plugins | 100 tok | 100 tok |
| **Boot total** | **~1 782 tok** | **~1 921 tok** |
| Ahorro vs baseline (hardcodeada) | 40 % | 35 % |

**Lectura:** `open` arranca **139 tokens más barato** pese a tener un MCP de más. La causa: su AGENTS.md es 2 155 B menor. `agentes` añadió gobernanza siempre-activa ("Compaction Recovery", "Agent Coordination Rules", "Session Memory Enhanced") y eso comió la ventaja de quitar `anydoc`.

### 10.2 Catálogo en el system prompt (coste fijo, no medido por measure-tokens)

Escala con el **número de entradas + longitud de descripciones**.

| Frontmatter `description` | `open` | `agentes` |
|---|---|---|
| Skills (chars / ~tokens) | 19 593 / ~4 900 | 10 075 / ~2 520 |
| Agents (chars / ~tokens) | 15 742 / ~3 940 | 20 471 / ~5 120 |
| **Subtotal** | **~8 830 tok** | **~7 640 tok** |
| Entradas (skills + agents) | 122 | 125 |

**Lectura:** empate (~8-9 K tokens fijos). `open` pesa por descripciones de skills (máxima: `xlsx` con 941 chars), `agentes` por descripciones de agents.

### 10.3 Superficie on-demand (solo se carga al usarla)

| | `open` | `agentes` |
|---|---|---|
| Skills (.md) | 236 archivos / 1,15 MB | 43 archivos / 341 KB |
| Skill promedio | 4 861 B = ~1 215 tok | 7 925 B = ~1 980 tok |
| Agents | 59 / 395 KB | 85 / 540 KB |
| Agent promedio | 6 693 B = ~1 673 tok | 6 349 B = ~1 587 tok |
| Router (hot path, cada dispatch) | 22 555 B = ~5 640 tok | 23 600 B = ~5 900 tok |

**Lectura:** `agentes` tiene menos skills pero **más gordas** (~60 % más por skill: 1 980 vs 1 215 tok). `open` tiene 3,4× la superficie total de skills, pero cada una más magra.

### 10.4 Conclusión de tokens

- **Boot: gana `open`** (AGENTS.md más optimizado). `agentes` empeoró el boot con gobernanza siempre-activa.
- **Catálogo: empate** (~8 K tokens fijos).
- **On-demand: depende del uso.** `agentes` es más barato con pocas skills; `open` con muchas skills magras.
- El "35 % vs 40 %" del README de `agentes` **no implica que sea más barato**: es contra una baseline hardcodeada (AGENTS.md viejo de 7 192 B), no una comparación entre packs.

### 10.5 Palancas de mejora (por impacto)

1. **`open`: haz `anydoc` opt-in** (patrón `/mcp-on`, como los 14 MCP opcionales de `agentes`). Ahorra **400 tok/turno** cuando no se convierten documentos. Conservar la skill `convert-documents-to-markdown`.
2. **`agentes` (y `open` si copia sus secciones): mover las secciones nuevas de AGENTS.md a un skill on-demand.** "Compaction Recovery / Coordination / Session Memory" son ~539 tok permanentes que violan su propia filosofía ("skills load on demand; AGENTS.md no se llena de todo").
3. **Ambos: adelgazar el router** (~5 600 tok cargado en cada dispatch).
4. **Ambos: descripciones a una línea** — alimentan el system prompt siempre. Peores casos en `open`: `xlsx`, `ui-ux-pro-max`, `archify`.
5. **Corregir el medidor**: `measure-tokens.js` solo mide AGENTS.md + MCP + plugins e ignora catálogo (~8 K tok) y router. Ambos packs vuelan a ciegas sobre ~70 % de su gasto real. Añadir `catalog + router` a la medición y fijar un techo absoluto de boot (p. ej. 2 000 tok), no solo "≥40 % vs baseline vieja".

---

## 11. Recomendaciones fuera de ambos packs

Ideas, herramientas y prácticas que **ninguno** de los dos proyectos incorpora hoy.

### 11.1 Medición y coste real (ambos usan heurística)

1. **Ledger de tokens por sesión/proyecto.** Ninguno registra el gasto *real* en runtime; ambos estiman. Hook que al cerrar sesión escriba `docs/state/cost-<ts>.json` (tokens in/out, modelo, agente) para ver qué agente/skill sale caro.
2. **Alertas de presupuesto.** Techo por proyecto (p. ej. $/día) que avise y, opcionalmente, bloquee dispatch de agentes caros.
3. **Fallback a modelo local.** Rutear tareas triviales (saludos, resúmenes) a un modelo local (Ollama) y reservar el de pago para lo complejo.

### 11.2 Enrutamiento inteligente (el `router` de ambos es por keywords)

4. **Router semántico (embeddings).** Hoy matchea palabras ("build", "fix"). Un índice de embeddings de descripciones de skills/agents clasifica peticiones ambiguas. Mayor impacto en "me ayuda con cualquier cosa".
5. **Skills con dependencias transitivas.** Que un skill declare `requires: [x, y]` y cargue solo lo necesario, en vez de SKILL.md monolíticos.

### 11.3 Gestión del conocimiento

6. **RAG cross-proyecto compartido.** Memoria **global por usuario** (lecciones de todos los proyectos), consultable desde cualquier pack instalado. Evita re-aprender lo mismo en cada repo.
7. **Cache condensada de skills.** Resumen embedding de cada skill (generado 1 vez) para que el router lea el resumen y no el SKILL.md completo.
8. **Telemetría de uso para podar.** Registrar skills/agents invocados de verdad y, tras N sesiones sin uso, marcarlos para descarte. MKY poda por stack; nadie poda por uso real.

### 11.4 Fiabilidad y seguridad

9. **Lockfile con hash de contenido.** `skills-lock.json` está casi vacío (MKY: 39 bytes). Pin del sha256 de cada SKILL.md/agent y verificación al boot (detecta drift, edición accidental o tampering).
10. **Policy engine en runtime.** Validador que bloquee tool-calls peligrosas según reglas declarativas (p. ej. "nunca `DROP` sin WHERE"), como hook de `hookify`.
11. **Sandbox/aislamiento opcional.** Ejecutar agentes de riesgo (bash destructivo) en contenedor o con dry-run.

### 11.5 Gobernanza y evolución de prompts

12. **Versionado + diff de prompts.** Tratar cada SKILL.md/AGENTS.md como código con changelog que anote el *porqué* y su efecto medido (tokens/calidad antes/después).
13. **A/B de prompts.** Feature-flag de dos versiones de un skill y medir cuál produce mejor resultado (LLM-as-judge) antes de promoverla.
14. **LLM-as-judge de calidad.** Evaluar automáticamente los outputs de los agents (corrección, cobertura), no solo "¿compila?". MKY evalúa invariantes estáticas, no calidad de output.

### 11.6 Top 5 (por impacto / esfuerzo)

| # | Recomendación | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | Router semántico (embeddings) | Alto | Medio |
| 2 | Ledger de coste real + alertas | Alto | Bajo |
| 3 | Lockfile con hashes de skills | Alto (seguridad) | Bajo |
| 4 | RAG cross-proyecto global | Alto | Medio |
| 5 | Cache condensada de skills | Medio (tokens) | Bajo |
