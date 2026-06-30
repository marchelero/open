---
description: "Show the top-level overview of the opencode starter pack: commands, agents, skills, conventions"
agent: build
---

# Help Command

Show a one-screen overview of the pack: most useful commands, the agent catalog entry point, the skill catalog, and the enforced conventions. `$ARGUMENTS` may be empty, or a section name to drill in (`agents`, `skills`, `commands`, `conventions`, `flows`).

## Your Task

### Step 1 — Detect the Section

If `$ARGUMENTS` is one of `agents`, `skills`, `commands`, `conventions`, `flows`, jump to that section.

Otherwise, show the overview (sections 2-7 below).

### Step 2 — Overview

Display:

```
opencode starter pack — overview
================================

Pick a starting point:

  /list-agents            # 67 agents — see who can do what
  /list-skills             # 13 skills — see what knowledge is on tap
  /prd "<idea>"            # start a non-trivial feature (PRD-first)
  /plan <prd-path>         # turn a PRD into a phased plan
  /code-review             # review current changes
  /verify                  # validate against the original PRD
  /session-end             # snapshot this session before closing
  /help <section>          # this help; pass: agents, skills, commands, conventions, flows

New here? Read `.opencode/docs/START-HERE.md` (5-minute orientation).

Stuck? Run `node .opencode/bin/validate-frontmatter.js` or `/list-agents` to verify discovery.
```

### Step 3 — Sections (only when `$ARGUMENTS` matches)

**`agents`**: list 5 most-invoked agents with one-line each, plus the path to the full catalog (`.opencode/agents/INDEX.md`).

```
Most-invoked agents:
  prd-agent           — start any non-trivial feature here
  planner             — turn a goal into a phased plan
  code-reviewer       — after writing code, always
  security-reviewer   — auth, input, secrets, payments
  tdd-guide           — enforce test-first on new code

Full catalog: /list-agents  or  .opencode/agents/INDEX.md
```

**`skills`**: list 5 most-loaded skills with one-line each, plus the path to the full catalog.

```
Most-loaded skills:
  frontend-patterns    — React/JSX/TSX patterns
  backend-patterns     — server-side layered architecture
  api-design           — REST/GraphQL contracts
  security-review      — OWASP Top 10, secrets, injection
  task-decomposition   — turn a PRD into a DAG

Full catalog: /list-skills  or  .opencode/skills/INDEX.md
```

**`commands`**: list 10 most-useful commands grouped by flow.

```
Building features:
  /prd           start a PRD from a user request
  /quick-prd     light-weight PRD for small changes
  /plan          PRD → phased implementation plan
  /tdd           enforce RED → GREEN → REFACTOR
  /verify        validate against the original PRD

Reviewing:
  /code-review   review current changes
  /pr-review     review a GitHub PR (uses gh)
  /security      security-focused review
  /merge-conflict  resolve git merge conflicts

Maintaining:
  /refactor-clean   remove dead code, consolidate
  /update-codemaps  refresh docs/CODEMAPS/
  /doc-updater       update README and guides
  /archive-reports  move old reports to _archive/

Discovery:
  /list-agents   browse the agent catalog
  /list-skills   browse the skill catalog
  /context       context budget report
  /help          this help
```

**`conventions`**: show the 4 enforced behaviors.

```
Enforced conventions (see .opencode/AGENTS.md for full list):

1. PRD-first     non-trivial work starts with /prd
                 skip only for one-liners, pure Q&A, or explicit opt-out

2. Caveman mode  responses are compact by default (~75% fewer tokens)
                 override with "stop caveman" or "normal mode"

3. Session memory  /session-end writes a snapshot to .agents/sessions/
                 run before closing a session with important context

4. No destructive actions without consent
                 git commit, git push, rm -rf, DROP TABLE need explicit verbs
                 "dale" / "ok" alone are NOT consent
```

**`flows`**: show the 3 most common end-to-end flows.

```
Flow 1: Idea → Shipped
  /prd "<idea>"           →  .opencode/prds/{ts}-{slug}.prd.md
  /plan <prd-path>        →  phased plan with risks
  /tdd "<task>"           →  code + tests (80%+ coverage)
  /verify                 →  .opencode/reports/{ts}-{slug}.report.md
  /audit-report <slug>    →  PASS / PASS-WITH-NITS / FAIL verdict

Flow 2: Code → Reviewed → Merged
  /code-review            →  severity-grouped findings
  # or
  /pr-review <num>        →  full PR review with parallel reviewers
  # fix findings, commit
  /merge-conflict         →  if there are conflicts, resolve with context

Flow 3: Refactor → Validate
  /refactor-clean         →  dead code, duplicates, unused exports
  /verify                 →  tests still pass, types still check
  /audit-report           →  did the refactor keep behavior?
```

## Behavior Notes

- This command is read-only. No side effects.
- If `START-HERE.md` exists, link to it in section 2.
- Keep this command terse. If the user is reading `/help`, they want a quick orientation, not a wall of text.
- For deep dives, point to `.opencode/docs/START-HERE.md` and `.opencode/agents/INDEX.md`.

## When to Use

- First time using the pack.
- Forgot what commands exist.
- Onboarding someone else to the pack.
- Want a refresher on the conventions.

## When NOT to Use

- For a specific question about a single command — just use it.
- For the full agent catalog — use `/list-agents`.
- For the full skill catalog — use `/list-skills`.
