# RAG cross-proyecto · Report de ejecución

> PRD: `docs/prds/2026-10-07_0113-rag-cross-proyecto.prd.md`
> Plan: `docs/plans/2026-10-07_0125-rag-cross-proyecto.plan.md`

## Status
COMPLETADO — 8/8 gates verdes.

## Contexto
Extra §11.3 #6 (1/10): memoria global por usuario buscable, offline. MVP BM25 zero-dep; embeddings diferidos.

## Cambios
**Nuevos**: `.opencode/bin/lib/knowledge-engine.js` (BM25), `.opencode/bin/knowledge.js` (CLI), `evals/knowledge/cases.json` (corpus 22 + 24 casos).
**Modificados**: `evals/cases/static.json` (E17), `pack-governance/SKILL.md`, `commands/session-end.md` (Step 7b), READMEs (clis 22), `skills-lock.json`.

## Criterios (evidencia)
| Gate | Resultado |
|---|---|
| `knowledge --eval` | top-1 **100%** (24/24) vs baseline 50% → delta +50 (≥20); top-3 100% |
| counts | clis **22** · 78 skills · 67 agents · 64 commands; `--check` exit 0 |
| eval-static | **17/17** (E16 router + E17 knowledge gate) |
| verify-lockfile | CLEAN (78+67) |
| wiring / lint / smoke / installer | 8/8 · 0 · 21/21 · 43/43 |
| measure-tokens | boot 1399 GREEN |
| aislamiento de home | home real **intacto** con `OPENCODE_KNOWLEDGE_HOME` |

## Desvíos / Incidentes
- Tokenizer: se importa `tokenize` de `route-engine.js` (sin extraer `bm25.js`) para garantizar byte-identidad del router; `git diff` de `route-engine.js` vacío.
- Fixture autocontenido (corpus propio) para que E17 corra offline en CI.
- `baseline_top1=50%` alto (queries comparten tokens con títulos); margen amplio igual (delta 50 vs 20).

## Próximos pasos
1. Commit + push.
2. Extras §11 restantes (2/10 en adelante): cache de skills, embeddings opt-in, LLM-as-judge, policy engine, sandbox, versionado de prompts, A/B, telemetría de uso, fallback local.

---
*Auditable via `/audit-report rag-cross-proyecto`.*
