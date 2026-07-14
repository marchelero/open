---
description: "Check docs/PROJECT.md freshness without writing. Shows days-old + missing/stale/fresh status. Useful before planning or when context feels stale."
agent: build
---

# Project Status

Run the freshness check on `docs/PROJECT.md`.

## Usage

```
/project-status
```

## What it does

Executes `node .opencode/bin/refresh-project.js --status` and prints one of:

- `STATUS: fresh (N days old)` — exit 0
- `STATUS: stale (N days old)` — exit 1, suggests running `refresh-project.js`
- `STATUS: missing` — exit 1, PROJECT.md does not exist

## When to use

- Before starting a non-trivial task (per AGENTS.md behavior #9)
- When context feels stale (long gap between sessions)
- After onboarding to a new project (verify the auto-generated context is sane)
- In CI to fail builds if PROJECT.md is missing (pair with `--check`)

## Related commands

- `/refresh-project` — full refresh (writes to `docs/PROJECT.md`)
- `/refresh-project` with `--auto` flag — silent write, no prompt

## See also

- `.opencode/bin/refresh-project.js` — the underlying CLI
- `AGENTS.md` behavior #9 — Always-On Project Context
