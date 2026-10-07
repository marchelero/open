---
prd: docs/prds/2026-10-07_0017-fase4-skills-saas.prd.md
status: APPROVED
created: 2026-10-07_0030
---

# Implementation Plan: Fase 4 — Skills SaaS/stack selectivas

## Overview
Añadir 14 skills SaaS/stack del fork (Q1/Q2 excluyen 7 solapadas; Q3 always-on), normalizadas y cableadas.
Resultado: skills 64 → **78**; agents 67; commands 64.

## Skills a añadir (14)
- SaaS (11): drizzle-patterns, supabase-patterns, stripe-integration, clerk-auth, firebase-patterns, turso-libsql, railway-deploy, vercel-deploy, compliance-checker, api-contract-tester, db-schema-visualizer.
- Plataforma/calidad (3): dependency-audit, performance-budget, user-manual-generator.
- Excluidas (7): flow-visualizer, github-actions, tdd-workflow, testing-patterns, plan-persistence, project-learning, checkpoint-mode.

## Pasos
1. Copiar los 14 directorios de skill desde el fork (SKILL.md + subficheros), UTF-8 limpio.
2. Cablear en `.agents/skills/router/SKILL.md` (tierA → E5/W3).
3. Re-sincronizar: build-skills-index → evals (E11=78, E15≥145) → installer-test (EXPECT_SKILLS=78) → verify-lockfile --fix → counts --update → docs.
4. Batería verde.

## Success Criteria
- [x] 14 SKILL.md válidos (name==dir, description "Use when…", triggers), R7=0.
- [x] skills 64→78; ninguna de las 64 previas perdida.
- [x] eval-static 15/15 (E11=78, E15 145≥145); wiring 8/8 (W3=78).
- [x] installer-test 43/43 (EXPECT_SKILLS=78); verify-lockfile CLEAN (78+67).
- [x] boot 1407 GREEN; batería completa verde.
