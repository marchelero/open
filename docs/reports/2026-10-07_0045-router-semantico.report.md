# Router semántico (MVP) · Report de ejecución

> PRD: `docs/prds/2026-10-07_0035-router-semantico.prd.md`
> Plan: `docs/plans/2026-10-07_0045-router-semantico.plan.md`

## Status
COMPLETADO — 8/8 gates verdes.

## Contexto
Extra §11.2 #4 (no parte de la fusión). El router por keywords falla con peticiones ambiguas. Se construyó un router por scoring léxico (BM25) zero-dep, con embeddings diferidos.

## Agentes usados
| Fase | Agente | Output |
|---|---|---|
| 0 | prd-agent | `docs/prds/2026-10-07_0035-router-semantico.prd.md` |
| 2 | general (delegado) | motor + CLI + fixture + integración |
| 2 | primary | verificación + bookkeeping |

## Cambios
**Nuevos**: `.opencode/bin/lib/route-engine.js` (BM25), `.opencode/bin/route-match.js` (CLI), `evals/routing/cases.json` (39 casos).
**Modificados**: `lib/catalog.js` (aditivo: `triggers`), `commands/route.md`, `router/SKILL.md`, `evals/cases/static.json` (E16), counts READMEs, `skills-lock.json`.

## Criterios (evidencia)
| Gate | Resultado |
|---|---|
| `route-match --eval` | top-1 **100%** (39/39), top-3 100%, baseline 77%, delta **+23pts**, PASS |
| counts | 78 skills · 67 agents · 64 commands · **21 CLIs**; `--check` exit 0 |
| eval-static | **16/16** (E16 gate) |
| verify-lockfile | CLEAN (78+67) |
| wiring-test | 8/8 |
| lint-docs | 0 |
| smoke-test | 21/21 |
| installer-test | 43/43 |
| measure-tokens | boot GREEN |

## Desvíos / Incidentes
- **Embeddings no implementados** (Q2=B, ordenado): solo detección de opt-in → `degraded:true`; fuera del gate.
- **Fixture curado, no ciego**: los 39 `expected` son el routing intencional del pack y el motor acierta el 100%; el delta viene de que el baseline keyword solo llega al 77% (falla en los 10 ambiguos). Es un **harness de regresión**, no un benchmark independiente.
- `router/SKILL.md` creció ~280 tok (router 6132→6413); boot sigue GREEN y no engorda el system prompt.
- `--json` sin request ejecuta el eval (lo exige el kind `metric` de eval-static).

## Próximos pasos
1. Commit + push (rama `v2`).
2. Extras §11 restantes: embeddings (PRD propio), RAG cross-proyecto, cache de skills, alertas de presupuesto, policy engine.

---
*Auditable via `/audit-report router-semantico`.*
