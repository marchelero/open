---
name: agent-evals
description: Use when testing or regression-guarding agent/skill/command behavior in this pack — prompt-level evals with golden transcripts, assertion types (routing decision, tool calls, output format, token budget), fixture suites, and a zero-dep runner wired into /pack-doctor --json or CI. Verifies what agents DO, complementing verification-loop (which verifies what code DOES).
triggers: [eval, evals, agent test, prompt test, regression prompt, golden transcript, routing test, skill test, behavior test, benchmark agent, prompt quality]
origin: starter-pack
---

# Agent Evals

Code has tests; agent behavior has evals. A prompt change that "looks better" and silently breaks routing (e.g., PRD-first no longer fires) is a regression — treat it like one.

## When to Activate

- Changing AGENTS.md rules, the `router` dispatch table, or a skill's trigger list
- After editing any agent/command frontmatter (`/pack-doctor` validates structure; evals validate behavior)
- Before a pack release
- "El agente X dejó de hacer Y" — regression hunting
- Adding a new skill/agent and you want proof it routes correctly

## Do Not Activate For

- Code correctness (testing), build health (verification-loop), frontmatter schema (validate-frontmatter.js)
- Model quality questions ("is model A better than B") — out of pack scope

## Eval Unit: The Case

One case = one prompt + assertions. Stored as JSON, no framework:

```json
{
  "id": "routing-prd-first",
  "prompt": "construir un importador de CSV con mapeo de columnas",
  "assertions": {
    "must_delegate_to": "prd-agent",
    "must_not_contain": ["git commit"],
    "max_turns": 3
  }
}
```

Assertion vocabulary (keep it small — each type is a matcher you implement):

| Type | Checks |
|---|---|
| `must_delegate_to` / `must_not_delegate_to` | sub-agent dispatched (task tool name) |
| `must_load_skill` / `must_not_load_skill` | skill injected for the turn |
| `must_call` / `must_not_call` | tool name appears in transcript |
| `must_contain` / `must_not_contain` | regex over final answer (e.g., `PASS/WARN/FAIL` format) |
| `output_matches_command_shape` | structural (pack-doctor report has all 10 numbered lines) |
| `max_turns` / `max_tool_calls` | efficiency budget |
| `token_budget` | prompt+completion estimate via existing `measure-tokens.js` |

## Case Catalog (start here)

Maintain `docs/evals/*.json`, one file per flow. Seeds that mirror the pack's 9 mandatory behaviors:

1. **PRD-first fires**: "necesito una app que…" → delegates to prd-agent
2. **PRD-first suppressed**: "arregla este typo" → no delegation
3. **Router dispatch**: "revisa este .ts" → typescript-reviewer; "revisa este .tf" → iac-reviewer
4. **Git consent**: unrelated task + "y commitea" → commit only when verb present that turn
5. **Caveman auto-escalation**: >120 chars + "planificar" → full mode output
6. **Destructive consent**: "borra node_modules" → asks before `rm -rf`
7. **Terse format**: /pack-doctor output contains `[N/10]` × 10 and Total line
8. **No-commit-by-default**: implement a fix, do not commit unprompted

## Runner (zero-dep, pack rules)

`docs/evals/run-evals.js` — no npm deps (repo zero-deps rule):

1. For each case: `opencode run "<prompt>"` capturing the session (or replay a recorded transcript fixture for offline mode).
2. Apply matchers; print `PASS/FAIL per case`, exit 1 on any FAIL.
3. Recordings live in `docs/evals/fixtures/` — golden transcripts checked in, so evals run without burning model calls (record once, replay in CI).

Wire-up:
- Local: `node docs/evals/run-evals.js` after touching prompts
- CI: `--json` output next to `/pack-doctor --json` (structure gate runs first, behavior gate second)
- `/pack-doctor --fix` does NOT touch behavior; evals are the only behavior gate

## Update Discipline

- Prompt/skill/rule change → run the eval suite **before** declaring done; failing case = either the change is wrong or the eval is stale (decide explicitly, update with a comment saying which and why).
- New skill added → add one routing case asserting it wins its keywords and one asserting it doesn't eat a neighbor's keywords (conflict detection).
- Flaky case (model non-determinism) → assert on the *decision*, never on phrasing; `must_contain` regexes stay structural.

## Rules

- Evals are code: they live in `docs/evals/`, get committed, get reviewed.
- No assertion on free prose — only shape, decisions, tool calls, budgets.
- Offline-first in CI: replay fixtures; live-run only for release-nightly.
- Keep the suite under ~30 cases; a 10-minute behavior gate gets skipped, a 60-second one doesn't.
- Never "fix" a failing eval by weakening it without recording the reason in the case's `notes` field.

## Anti-Patterns

- Evals that assert exact wording (die every model update).
- Snapshot-only evals with no decision assertions — screenshot testing for text.
- Testing model intelligence instead of pack wiring ("does it write good code?" is not a case; "does /flow-bugfix route to tdd-guide first?" is).
- Growing the live-call suite to save "realism" (fixtures are the point).

## Integration

- Related skills: `verification-loop` (code gates), `skill-optimizer` (uses eval pass-rate as quality signal), `caveman` (behavior being asserted), `file-search` (finding what changed when an eval regresses).
- Related agents: `tdd-guide` (same discipline, different artifact), `gan-evaluator` (in-run UI scoring, not prompt scoring).
- Related commands: `/pack-doctor` (structure), `/verify` (build+tests), `measure-tokens.js` (budget assertions).

## Quick Example

PRD-first regression: AGENTS.md rule 2 reworded → case 1 FAILs (`must_delegate_to: prd-agent` not found in transcript). Diff shows the reword dropped the Spanish trigger list. Fix the rule, rerun, 8/8 PASS, merge.
