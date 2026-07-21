---
name: skill-router
description: Use when the primary agent must select a knowledge skill for any non-Q&A request. Triggers on action verbs (build/add/create/fix/review/test/refactor/plan/deploy/ship/audit/document, plus Spanish crear/agregar/arreglar/revisar/testear/refactorizar/planear/desplegar/auditar/documentar) and on natural-language patterns ("I need to...", "in this folder...", "this project...", "me ayudas con...", "como puedo..."). Also fires on meta-routing questions ("what skill should I use for X", "que skill uso para..."). Maps request keywords + intent to the right skill from the catalog. Load alongside agent-router when execution + knowledge are both needed.
triggers: [skill, skills, route, routing, which skill, what skill, load, knowledge, build, create, add, implement, fix, repair, refactor, rewrite, modify, change, update, improve, optimize, review, audit, test, debug, document, deploy, ship, scaffold, setup, configure, install, migrate, design, plan, analyze, simplify, clean, verify, validate, check, crear, agregar, añadir, hacer, implementar, arreglar, refactorizar, reescribir, cambiar, modificar, actualizar, mejorar, optimizar, revisar, auditar, probar, testear, debuggear, documentar, desplegar, configurar, instalar, migrar, diseñar, planear, analizar, simplificar, limpiar, verificar, validar, "I need to", "I want to", "can you", "could you", "this folder", "this project", "in this repo", "puedo agregar", "me ayudas", "podes ayudarme", "como puedo", "como hago", "le pedi", "en esta carpeta", "este proyecto"]
---

# Skill Router

Decide which skill to load for a user request. This is the routing layer between "user said something" and "agent knows the right patterns".

## Trigger Conditions (load me when...)

**Default rule**: load this skill for ANY non-Q&A user request. Most work needs at least one knowledge skill (patterns, security checklist, TDD workflow, error handling, etc.), and loading it takes 1 call.

### Direct action verbs (always trigger)
- **English**: build, create, add, implement, fix, refactor, modify, update, review, audit, test, debug, document, deploy, ship, setup, configure, install, migrate, design, plan, analyze, simplify, clean, verify, validate
- **Spanish**: crear, agregar, implementar, arreglar, refactorizar, modificar, actualizar, revisar, auditar, probar, testear, documentar, desplegar, configurar, instalar, migrar, diseñar, planear, analizar, simplificar, limpiar, verificar

### Natural-language patterns (trigger even without an action verb)
- **English**: "I need to...", "I want to...", "can you...", "in this folder...", "this project requires...", "we have to..."
- **Spanish**: "me ayudas con...", "puedes ayudarme a...", "como puedo...", "como hago para...", "en esta carpeta...", "este proyecto necesita...", "le pedi sobre un proyecto hacer alguna modificacion"

### Domain signals (also trigger)
- React, JSX, TSX, hooks, form, component, render
- Express, FastAPI, NestJS, Spring, Django, controller, middleware, repository
- REST, GraphQL, endpoint, status code, pagination, API
- auth, password, JWT, session, CSRF, XSS, SQL injection, secret, OWASP
- test, TDD, coverage, jest, pytest, vitest, mock
- error, exception, try/catch, retry, circuit breaker
- commit, branch, PR, merge, rebase, conflict
- verify, audit, validate, regression
- PRD, requirement, acceptance criteria, scope
- MCP, model-context-protocol, server, tool definition

### Meta-routing questions (also trigger)
- "what skill should I use for X" / "which skill" / "que skill uso para..."

### When NOT to load
- Pure Q&A without implementation intent
- User already named the skill explicitly
- Single specific tool invocation ("run `npm test`")
- Pack meta questions ("how many skills are there") — use `bin/build-skills-index.js` directly

## When to Activate

- The primary agent is unsure which skill applies to the current request
- The user describes a need in natural language without naming a skill ("I need to add X", "me ayudas con Y") — STILL load, the trigger map below catches it
- The user explicitly asks "what skill should I use for X"
- The request spans multiple domains and could match several skills
- A new skill has been added and the agent needs to know when to use it

## Routing Process

### Step 1 — Extract the Intent

From the user's request, identify:
- The **action verb** (build, review, fix, document, deploy, test, refactor)
- The **domain noun** (UI, API, database, security, config, CI, test, deployment)
- Any **explicit technology** mentioned (React, Express, Postgres, Kubernetes, etc.)

### Step 2 — Match Against Triggers

Use the table below. Multiple matches are fine — load up to 3 relevant skills.

### Step 3 — Load the Top Match

If only one skill matches, load it.
If multiple match, load the most specific (framework-specific beats language-specific beats general).

## Trigger Map

| If the request mentions... | Load |
|---------------------------|------|
| React, JSX, TSX, hooks, useState, useEffect, useMemo, useCallback, form, prop drilling, render, component, Suspense, Context | `frontend-patterns` |
| Express, FastAPI, NestJS, Spring, repository pattern, service layer, DI, dependency injection, transaction, controller, middleware, auth, validation | `backend-patterns` |
| REST, GraphQL, endpoint, route URL, status code, pagination, API contract, version, rate limit, API design | `api-design` |
| auth, password, JWT, session, CSRF, XSS, SQL injection, secret, OWASP, vulnerability, sanitize, CORS, encryption | `security-review` |
| test, TDD, RED, GREEN, REFACTOR, coverage, jest, pytest, vitest, mock, unit test, integration test | `tdd-workflow` |
| error, exception, try/catch, retry, circuit breaker, error message, log error, throw, error boundary | `error-handling` |
| library, framework, API docs, version, example code, latest, deprecated, alternatives | `documentation-lookup` |
| MCP, model-context-protocol, server, tool definition, resource, prompt, stdio | `mcp-server-patterns` |
| commit, branch, PR, merge, rebase, conflict, git workflow, cherry-pick, bisect, stash | `git-workflow` |
| verify, check, audit, validate, regression, post-change, after implementing | `verification-loop` |
| PRD, requirement, acceptance criteria, scope, objective, success criteria, intention map | `intent-driven-development` |
| task graph, dependency, DAG, parallel work, work breakdown, sprint, estimate | `task-decomposition` |
| naming, immutability, code quality, lint, formatting, KISS, DRY, YAGNI, complexity | `coding-standards` |

## Decision Examples

| User says | Load |
|-----------|------|
| "build a React form with validation" | `frontend-patterns` (React) + `backend-patterns` (validation flow) |
| "add JWT auth to my Express API" | `backend-patterns` + `security-review` |
| "review this code" | `code-reviewer` agent (NOT a skill — different surface). Use `agent-router` skill to pick the right reviewer. |
| "how do I use Prisma" | `documentation-lookup` (Prisma → Context7) |
| "write tests for this function" | `tdd-workflow` |
| "plan a DB migration" | `task-decomposition` + (delegate to `migration-planner` agent) |
| "fix this git conflict" | `git-workflow` + (delegate to `merge-conflict` command) |
| "is this endpoint secure" | `security-review` + `api-design` (status codes / contract) |

## Anti-Patterns

- **Loading all skills** — never load all 13. Pick the top 1-3 by trigger match.
- **Loading a skill that doesn't match** — if a request is about deployment, don't load `frontend-patterns` because there's a "config" trigger.
- **Skipping the router when uncertain** — if 0 skills match, ask the user or load `intent-driven-development` to clarify.
- **Treating the router as optional** — for ambiguous requests, this skill prevents the primary agent from guessing and producing wrong-context output.

## Pairing With agent-router

This skill covers **knowledge** (which patterns to apply). For **execution** (which subagent to dispatch), use the parallel `agent-router` skill. Most requests need both.

| If the request is... | Load both |
|----------------------|-----------|
| "build a React form with validation" | `skill-router` (frontend + backend skills) + `agent-router` (planner + tdd-guide + react-reviewer) |
| "add JWT auth to my Express API" | `skill-router` (security-review + backend-patterns) + `agent-router` (prd-agent → planner → security-reviewer) |
| "fix build error in Go" | `agent-router` only (go-build-resolver) |
| "write tests for X" | `skill-router` (tdd-workflow) + `agent-router` (tdd-guide) |
| "review this code" | `agent-router` (stack-specific reviewer) + `skill-router` (coding-standards + error-handling) |

## Integration

- This skill is loaded on-demand. It does NOT auto-load on every request.
- The primary agent loads it when it sees trigger words or when the request is ambiguous.
- For tool-based discovery, see `.agents/skills/INDEX.md` (auto-generated).
- See `agent-router` skill for the parallel agent-selection matrix.

## When NOT to Activate

- The user has already named the skill: "load `api-design`" → no router needed.
- The request is a single specific tool invocation: "run `npm test`" → no skill needed.
- Pure Q&A about the pack itself ("how many skills are there") → use `bin/build-skills-index.js` directly.
