# Fase 2 — Gobernanza · Report de ejecución

> PRD: `docs/prds/2026-10-06_2307-fase2-gobernanza.prd.md`
> Plan: `docs/plans/2026-10-06_2315-fase2-gobernanza.plan.md`

## Status
COMPLETADO — bug corregido, gobernanza adoptada on-demand, boot preservado; 8/8 gates verdes.

## Contexto
Fase 2 de la fusión (§8): arreglar el bug "9 conductas = 10 ítems" de `AGENTS.md` y adoptar la gobernanza del fork (recovery post-compactación, coordinación/handoff, memoria de sesión) sin empeorar el boot. Decisiones: Q1=B (fundir #10 en el skill), Q2=skill nuevo `pack-governance`, Q3=adaptar a los agentes reales de `open`.

## Agentes usados
| Fase | Agente | Output |
|---|---|---|
| 0 | prd-agent | `docs/prds/2026-10-06_2307-fase2-gobernanza.prd.md` |
| 1 | primary (plan inline) | `docs/plans/2026-10-06_2315-fase2-gobernanza.plan.md` |
| 2 | primary (implementación) | cambios abajo |

## Cambios
- **`.opencode/AGENTS.md`**: eliminado el ítem 10 (*Context cut-off*); quedan **9 conductas** bajo el rótulo "9" (bug cerrado). Añadido puntero corto a `pack-governance` en "Pointers" + recordatorio de continuidad. `Prompt Defense Baseline` y `Git consent` intactos.
- **`.agents/skills/pack-governance/SKILL.md`** (nuevo): recovery post-compactación (con el *Context cut-off* fundido), coordinación/handoff, disponibilidad por stack con fallback genérico, continuidad de sesión. Adaptado a los agentes/skills reales de `open` (sin citar `manual-writer`/`diagram-generator`/`db-schema-visualizer`/`audit-orchestrator`/`project-learning`).
- **Superficies re-sincronizadas**: `.agents/skills/INDEX.md` (64), `skills-lock.json` (64 + 59 = 123 sha256), bloques `## Counts` (READMEs), `evals/cases/static.json` (E11 63→64; E15 title), `installer-test.js` (EXPECT_SKILLS 63→64), comentarios de `init-opencode.js`.

## Criterios
| Criterio | Resultado |
|---|---|
| Rótulo "9" == 9 conductas | ✅ (9 ítems, sin #10) |
| Gobernanza on-demand, no huérfana | ✅ E5/W3 verdes |
| Boot ≤ 1500 GREEN | ✅ **1407** (AGENTS.md 907 + MCP 400 + plugins 100); techo 2000 |
| E1/E2/E3/E7/E9 verdes | ✅ (eval-static 15/15, E2 `9>=9`) |
| Superficies + batería | ✅ 8/8 gates (counts, frontmatter, lockfile, smoke 21/21, lint-docs 0, wiring 8/8, installer 43/43, eval-static 15/15) |

## Desvíos / Incidentes
- `installer-test` rompió a 64 skills (esperaba 63) → `EXPECT_SKILLS` actualizado. Esperado por Q2.
- Boot subió 1382→**1407** (+25 tok) por el puntero de continuidad; muy por debajo del fork (~1921) y del objetivo ≤1500. Exactamente el trade-off buscado (§10.5 #2).

## Próximos pasos
1. Revisar diff y commitear (requiere verbo explícito).
2. **Fase 3**: flujos SDD (`/spec-lint`, `/trace`, `/definition-of-done`) + agents de proceso; **Fase 4**: skills SaaS; **§11**: router semántico/RAG.

---
*Auditable via `/audit-report fase2-gobernanza`.*
