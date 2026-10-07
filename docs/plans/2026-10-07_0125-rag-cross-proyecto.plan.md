---
prd: docs/prds/2026-10-07_0113-rag-cross-proyecto.prd.md
status: APPROVED
created: 2026-10-07_0125
---

# Implementation Plan: RAG cross-proyecto (BM25)

## Overview
Memoria global por usuario, buscable localmente (BM25 zero-dep), reutilizable entre proyectos.
Q1-A (store nuevo), Q2 (~/.config/opencode/knowledge/, override env), Q3-A (CLI knowledge.js).

## Pasos
1. `lib/knowledge-engine.js`: BM25 field-weighted (title 4 / tags 3 / body 2); importa `tokenize` de `route-engine.js` (sin forkear → E16 intacto).
2. `bin/knowledge.js`: `add|search|list|export|import|stats` + `--eval`/`--json`; store global + `OPENCODE_KNOWLEDGE_HOME`; guarda anti-secretos.
3. `evals/knowledge/cases.json` (corpus 22 + 24 casos) + `--eval`.
4. Integración en `pack-governance` y `/session-end` (ingesta 1–3).
5. Re-sincronizar: counts (clis 21→22), lockfile, E17.

## Success Criteria
- [x] motor determinista offline; `--eval` top-1 100% ≥ baseline 50% (+50 ≥20), top-3 100% ≥80%.
- [x] CLI con add/search/list/export/import/stats; override de home (home real intacto).
- [x] anti-secretos en `add`; cero red.
- [x] E17 en eval-static; counts clis=22 / 78 / 67 / 64.
- [x] batería completa verde; boot GREEN.
