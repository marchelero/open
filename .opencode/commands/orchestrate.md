---
description: "Orchestrate multiple agents for complex tasks. Auto-invokes prd-agent FIRST for intent clarification."
agent: planner
---

# Orchestrate Command

Orchestrate multiple specialized agents for this complex task: $ARGUMENTS

## Your Task

0. **Invoke prd-agent FIRST** (intent clarification + PRD generation)
1. **Analyze task complexity** and break into subtasks
2. **Identify optimal agents** for each subtasks
3. **Create execution plan** with dependencies
4. **Coordinate execution** - parallel where possible
5. **Synthesize results** into unified output

---

## Phase 0 (MANDATORY) — Intent Clarification via prd-agent

**BEFORE any planning, dispatch `prd-agent`** to:
1. Verify/create `.agents/PROJECT.md` (project context)
2. Run the Understanding Protocol (active listening, intention map, ambiguity resolution, confirmation)
3. Produce `.opencode/prds/{name}.prd.md`

**Dispatch via task tool:**

```
task { subagent_type: "prd-agent", prompt: "$ARGUMENTS" }
```

**Wait for prd-agent to finish.** Do not start planning until the user has confirmed the Intention Map and a PRD file exists.

**If the user has already provided a clear, unambiguous request with explicit acceptance criteria** (e.g., a bug report, a fully-specified RFC, a one-liner with full context), you may skip Phase 0 and proceed to Phase 1. Document this skip in your output: "Skipped prd-agent — request already meets PRD criteria."

---

## Available Agents (for Phases 1+)

| Agent | Specialty | Use For |
|-------|-----------|---------|
| **prd-agent** | **Intent clarification** | **Phase 0 — always first** |
| planner | Implementation planning | Phase 1+ — complex feature design |
| architect | System design | Architectural decisions |
| code-reviewer | Code quality | Review changes |
| security-reviewer | Security analysis | Vulnerability detection |
| tdd-guide | Test-driven dev | Feature implementation |
| build-error-resolver | Build fixes | TypeScript/build errors |
| e2e-runner | E2E testing | User flow testing |
| doc-updater | Documentation | Updating docs |
| refactor-cleaner | Code cleanup | Dead code removal |
| go-reviewer | Go code | Go-specific review |
| go-build-resolver | Go builds | Go build errors |
| database-reviewer | Database | Query optimization |

## Orchestration Patterns

### Sequential Execution
```
prd-agent → planner → tdd-guide → code-reviewer → security-reviewer
```
Use when: Later tasks depend on earlier results

### Parallel Execution
```
              ┌→ security-reviewer
prd-agent → planner →├→ code-reviewer
              └→ architect
```
Use when: Tasks are independent (after PRD is confirmed)

### Fan-Out/Fan-In
```
                   ┌→ agent-1 ─┐
prd-agent → planner →├→ agent-2 ─┼→ synthesizer
                   └→ agent-3 ─┘
```
Use when: Multiple perspectives needed

## Execution Plan Format

### Phase 0: Intent Clarification (ALWAYS FIRST)
- Agent: `prd-agent`
- Task: clarify intent, resolve ambiguities, generate PRD
- Output: `.opencode/prds/{name}.prd.md` + user confirmation
- Depends on: none

### Phase 1: Planning
- Agent: `planner` (or `code-architect` for system design)
- Task: consume PRD, produce implementation plan
- Depends on: Phase 0 (PRD must exist)

### Phase 2: [Specialists] (parallel when independent)
- Agent A: [specialist-1]
  - Task: [specific task from plan]
- Agent B: [specialist-2]
  - Task: [specific task from plan]
- Depends on: Phase 1

### Phase 3: Synthesis
- Combine results from Phases 0–2
- Generate unified output
- Hand off to user with: PRD path, plan summary, next steps

## Coordination Rules

1. **PRD first, always** — Phase 0 is mandatory for any non-trivial task
2. **Plan before execute** — Phase 1 consumes the PRD, produces the plan
3. **Minimize handoffs** — Reduce context switching between agents
4. **Parallelize when possible** — Independent tasks in parallel (after Phase 0)
5. **Clear boundaries** — Each agent has specific scope
6. **Single source of truth** — PRD is the contract; plan is the strategy; code is the implementation

## When to Skip Phase 0

Skip `prd-agent` only when ALL of the following are true:
- Request is a bug report with reproducible steps
- Request is a one-line fix (typo, single-file change)
- Request includes an existing `.opencode/prds/*.prd.md` to consume
- User explicitly says "skip PRD" or "just do it"

In all other cases, Phase 0 is mandatory. The cost of a clear PRD is one extra round trip; the cost of building the wrong thing is much higher.

---

**NOTE**: Complex tasks benefit from multi-agent orchestration starting with intent clarification. Simple tasks should use single agents directly (`@prd-agent` for new work, `@code-reviewer` for review, `@build-error-resolver` for build issues).
