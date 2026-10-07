---
prd: docs/prds/2026-10-06_2307-fase2-gobernanza.prd.md
status: APPROVED
created: 2026-10-06_2315
---

# Implementation Plan: Fase 2 — Gobernanza

## Overview
Arreglar el bug "9 conductas = 10 ítems" de `AGENTS.md` y adoptar la gobernanza del fork
(recovery post-compactación, coordinación/handoff, memoria de sesión) en un **skill on-demand**
`pack-governance`, dejando en `AGENTS.md` solo punteros cortos. Q1=B (fundir #10), Q2=nuevo skill, Q3=adaptar a `open`.

## Steps

### M1 — Fix `AGENTS.md`
1. `.opencode/AGENTS.md`: quitar el ítem **10 (Context cut-off)** de "### 9 mandatory behaviors" → quedan 9 y el rótulo coincide.
2. Añadir un puntero corto siempre-visible: "tras compactación/continuidad → carga `pack-governance`".
3. Añadir `pack-governance` a la sección "Pointers". NO tocar `Prompt Defense Baseline (GLOBAL …)` ni `**Git consent**` (E3/E6/E9).

### M2 — Skill `pack-governance`
4. Crear `.agents/skills/pack-governance/SKILL.md` (frontmatter `name` + `description` + `triggers`):
   - **Recovery post-compactación** (checklist) + el **Context cut-off** fundido (dejar resumen si el contexto se corta).
   - **Coordinación/handoff** adaptada a `open`: cada agente escribe en `docs/{reports,audits,plans}/`; el siguiente busca el artefacto más reciente; único cierre por flujo.
   - **Disponibilidad de agentes por stack** (fallback genérico `code-reviewer`/`build-error-resolver`) — relevante porque el instalador filtra agents.
   - **Memoria de sesión** mejorada: arranque (`/session-start`: PROJECT.md, LATEST.md, `docs/state/*.json`, planes) y cierre (`/session-end`: snapshot + PROJECT + instintos). Sin citar `project-learning` (no existe).
   - Omitir agentes de Fase 3 (`manual-writer`, `diagram-generator`, `db-schema-visualizer`, `audit-orchestrator`).

### M3 — Re-sincronizar superficies + verificar
5. `node .opencode/bin/build-skills-index.js` (regenera `.agents/skills/INDEX.md` → W3).
6. `evals/cases/static.json`: E11 skills 63→64 (E2 sigue gte 9, sin cambio).
7. `node .opencode/bin/verify-lockfile.js --fix` (re-pin; 64 skills + 59 agents → E15 ≥ 122).
8. `node .opencode/bin/counts.js --update .opencode/README.md .opencode/manual/README.md`.
9. Batería: counts --check, validate-frontmatter, verify-lockfile, smoke-test, lint-docs, wiring-test, installer-test, eval-static, measure-tokens (boot ≤ 1500 GREEN).

## Success Criteria
- [x] `AGENTS.md`: rótulo "9" == 9 ítems; #10 movido al skill; puntero presente.
- [x] skill `pack-governance` existe, no huérfano (E5/W3 verdes), boot GREEN ≤1500 (1407).
- [x] E1/E2/E3/E7/E9 verdes; E11=64; lockfile CLEAN; batería completa verde.
