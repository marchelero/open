---
prd: docs/prds/2026-10-07_0035-router-semantico.prd.md
status: APPROVED
created: 2026-10-07_0045
---

# Implementation Plan: Router semántico (MVP zero-dep)

## Overview
Router que, dado un request libre, devuelve el skill/agent más probable + 2 alternativas + comando.
MVP 100% zero-dep (BM25 field-weighted); embeddings diferidos (Q2=B). Q1-A (skills+agents + commands vía tablas).

## Pasos
1. `lib/route-engine.js`: BM25 field-weighted (name×4, triggers×3, description×1), tokenización (NFKC, stopwords EN+ES, plurales). Determinista.
2. `bin/route-match.js`: CLI (`<request>`, `--json`, `--eval`); `--json` sin request = eval + campo `gate`.
3. `catalog.js`: aditivo — exponer `triggers`.
4. Fixture `evals/routing/cases.json` (39 casos, 10 ambiguos) + runner (`--eval`).
5. Integrar `/route` (Step 2) + `router` skill (puntero al CLI).
6. Gate: eval-static E16 (`metric` → route-match `gate == true`).
7. Re-sincronizar counts (clis 20→21), lockfile (router SKILL.md), docs.

## Success Criteria
- [x] motor léxico determinista (2 corridas idénticas), sin red.
- [x] `route-match.js` con contrato (top-1 + 2 alt + comando), `--json`, exit 0/1.
- [x] eval PASS: top-1 100% ≥ baseline 77% (+23pts ≥15); top-3 100% ≥80%.
- [x] E16 en eval-static (16/16); counts skills=78/agents=67/commands=64/clis=21.
- [x] batería completa verde; boot GREEN.
