---
name: agent-router
description: Use this skill when the primary agent needs to decide which subagent to invoke for a user request, or when the user asks "what agent should I use for X". Maps request intent + domain to the right agent from the 69-agent catalog. Load this alongside skill-router when both are needed.
triggers: [agent, agents, route, routing, which agent, what agent, invoke, subagent, dispatch, delegate]
---

# Agent Router

Decide which subagent to invoke for a user request. The pack ships 69 agents organized by purpose; this skill provides the decision matrix so the primary agent doesn't have to scan all descriptions.

## When to Activate

- The user request implies work beyond pure Q&A (build, fix, review, plan, test, refactor, audit)
- The primary agent is unsure which subagent to dispatch
- The request matches a known intent (auth bug, plan migration, review PR, etc.)
- Parallel with `skill-router` — load both when the request could need knowledge (skill) + execution (agent)

## Routing Process

### Step 1 — Classify the Request

Extract:
- **Stage**: plan | implement | fix | review | test | refactor | audit | doc | ship
- **Domain**: ui | api | db | security | auth | infra | config | ci | data | ml | perf
- **Stack**: react | ts | python | go | rust | java | swift | flutter | csharp | cpp | php | kotlin | dart | fsharp
- **Risk**: data loss | security | production | safe

### Step 2 — Match Against the Catalog

Pick the highest-priority match. Ties: prefer specialist over generalist.

### Step 3 — Invoke

For implementation work, ALWAYS layer with `planner` → `tdd-guide` → reviewer (stack-specific) before invoking. Never dispatch implementation directly to a generic agent.

## Agent Catalog (by purpose)

### Planning & Architecture

| Request | Primary agent | Alternates |
|---------|---------------|------------|
| "build X" / "add feature" (new work) | `prd-agent` | `planner`, `code-architect` |
| "plan implementation of X" | `planner` | `code-architect`, `architect` |
| "design the system" / architecture decision | `code-architect` | `architect`, `network-architect` |
| "explore how Y works" / map codebase | `code-explorer` | `code-architect` |
| "review the PRD" | `prd-reviewer` | `planner` |
| "break down X into tasks" | `planner` | `task-decomposition` (skill) |
| "migrate X to Y" | `migration-planner` | `planner` |
| "generate spec for X" (autonomous loop) | `gan-planner` | `prd-agent` |

### Implementation & Build

| Request | Primary agent | Notes |
|---------|---------------|-------|
| "implement X" (after PRD/plan) | `build` (primary) | Routes to sub-agents as needed |
| "fix this build error" | `build-error-resolver` | Falls back to language-specific |
| Language-specific build error | `{lang}-build-resolver` | cpp, csharp, dart, django, go, java, kotlin, python, pytorch, react, rust, swift |
| "implement feature via autonomous loop" | `gan-generator` | Pairs with `gan-evaluator` |

### Review & Quality

| Request | Primary agent | Alternates |
|---------|---------------|------------|
| "review this code" / "code review" | `code-reviewer` | Stack-specific reviewer |
| "review this PR" | `pr-test-analyzer` | `code-reviewer` |
| "audit report vs PRD" | `report-auditor` | — |
| "security review" / "is this secure" | `security-reviewer` | `security-review` (skill) |
| "silent failures" / "error handling review" | `silent-failure-hunter` | `error-handling` (skill) |
| "review comments / are docs accurate" | `comment-analyzer` | `doc-updater` |
| "review types / type design" | `type-design-analyzer` | Stack reviewer |
| "is this accessible" | `a11y-architect` | — |
| "review SQL / schema" | `database-reviewer` | — |
| "review ML code" | `mle-reviewer` | — |
| "review healthcare code" | `healthcare-reviewer` | — |
| "is this config correct" | `network-config-reviewer` | `network-architect` |

### Stack-specific Reviewers

Use these INSTEAD of `code-reviewer` when the stack is known:

| Stack | Agent |
|-------|-------|
| TypeScript / JS | `typescript-reviewer` |
| React / TSX | `react-reviewer` |
| Python | `python-reviewer` |
| Go | `go-reviewer` |
| Rust | `rust-reviewer` |
| C++ | `cpp-reviewer` |
| C# | `csharp-reviewer` |
| Java | `java-reviewer` |
| Kotlin / Android | `kotlin-reviewer` |
| Swift / iOS | `swift-reviewer` |
| Flutter / Dart | `flutter-reviewer` |
| PHP | `php-reviewer` |
| F# | `fsharp-reviewer` |
| Django | `django-reviewer` |
| FastAPI | `fastapi-reviewer` |
| HarmonyOS | `harmonyos-app-resolver` |

### Test & QA

| Request | Primary agent | Notes |
|---------|---------------|-------|
| "write tests for X" / "TDD" | `tdd-guide` | Load `tdd-workflow` skill too |
| "run E2E tests" | `e2e-runner` | — |
| "improve test coverage" | `tdd-guide` | — |

### Refactor & Cleanup

| Request | Primary agent | Notes |
|---------|---------------|-------|
| "refactor X" / "clean up" | `refactor-cleaner` | Load `coding-standards` skill |
| "simplify this code" | `code-simplifier` | — |
| "find dead code" | `refactor-cleaner` | — |
| "remove duplicate Y" | `code-simplifier` | — |

### Documentation

| Request | Primary agent | Notes |
|---------|---------------|-------|
| "update docs" / "regenerate codemaps" | `doc-updater` | — |
| "find docs for library X" | `docs-lookup` | Uses Context7 MCP |
| "find existing skill for X" | `find-skills` (skill) | — |

### Domain Specialists

| Domain | Agent |
|--------|-------|
| Network design (enterprise) | `network-architect` |
| Network troubleshooting | `network-troubleshooter` |
| Home / small lab network | `homelab-architect` |
| Performance optimization | `performance-optimizer` |
| Marketing / copy / launch | `marketing-agent` |
| SEO | `seo-specialist` |
| GAN Harness loop | `gan-planner` + `gan-generator` + `gan-evaluator` |
| Autonomous loop operation | `loop-operator` |
| Harness tuning | `harness-optimizer` |

### Meta & Workflow

| Request | Primary agent | Notes |
|---------|---------------|-------|
| "triage my messages" / comms | `chief-of-staff` | — |
| "fork this for open source" | `opensource-forker` | Then `opensource-sanitizer`, `opensource-packager` |
| "sanitize the fork" | `opensource-sanitizer` | — |
| "package for open source release" | `opensource-packager` | — |
| "analyze conversation for hooks" | `conversation-analyzer` | — |
| "what did I learn" / pattern extraction | `learn` (skill) | — |

## Decision Examples

| User says | Route |
|-----------|-------|
| "agregar auth con JWT" | `prd-agent` → `planner` → `backend-patterns` (skill) → `security-review` (skill) → `tdd-guide` → `security-reviewer` (review) |
| "fix el bug en login" | `planner` (repro + plan) → `tdd-guide` (write failing test) → `build` (implement) → stack reviewer |
| "code review del PR #42" | `pr-test-analyzer` → stack-specific reviewer |
| "audit this report against PRD" | `report-auditor` |
| "is this safe to deploy" | `security-reviewer` |
| "regenerate docs" | `doc-updater` |
| "no anda el build de Go" | `go-build-resolver` (NOT general `build-error-resolver` first) |
| "como se hace X en React" | `frontend-patterns` (skill) + `docs-lookup` (for lib docs) |
| "triage my email" | `chief-of-staff` |
| "open source this app" | `opensource-forker` → `opensource-sanitizer` → `opensource-packager` |

## Anti-Patterns

- **Don't dispatch implementation directly to a generic agent.** Use `planner` + `tdd-guide` first.
- **Don't load 5+ agents for one request.** Top 1-3 is the rule.
- **Don't skip the planner for non-trivial work.** Anything touching >1 file needs a plan.
- **Don't use `code-reviewer` for stack-specific code.** Use `{stack}-reviewer`.
- **Don't invoke `build-error-resolver` for specific languages.** The lang-specific resolver is faster and more accurate.
- **Don't load `agent-router` for pure Q&A.** The primary agent answers directly.
- **Don't use `prd-agent` for small fixes.** Use `/quick-prd` flow or skip PRD entirely.

## Pairing With Skills

Most agent invocations benefit from a paired skill:

| Agent | Pair with skill |
|-------|-----------------|
| `{stack}-reviewer` | `coding-standards`, `error-handling` |
| `security-reviewer` | `security-review`, `backend-patterns` |
| `tdd-guide` | `tdd-workflow` |
| `planner` | `intent-driven-development`, `task-decomposition` |
| `prd-agent` | `intent-driven-development` |
| `code-architect` | `frontend-patterns` or `backend-patterns` (whichever applies) |
| `doc-updater` | (no skill needed) |
| `refactor-cleaner` | `coding-standards` |
| `docs-lookup` | (uses Context7 MCP) |

## When NOT to Activate

- The user is asking a pure concept question (no implementation implied)
- The user has already named a specific agent ("run `code-reviewer`")
- The user said "skip routing" or "just do it"
- The request is a one-liner edit that the primary can do directly

## Integration

- `/route <request>` — command-level superset (routes across commands, agents, AND skills)
- `skill-router` — parallel skill for knowledge/skill selection
- `/list-agents <keyword>` — for browsing the full catalog
- `docs/AGENTS_INDEX.md` — auto-generated full index of all 69 agents
