---
description: "Scaffold a new project's docs/ tree (PROJECT.md, prds/plans/reports/audits/sessions/state/instincts dirs + README index). Use when copying the opencode pack to a fresh repo or onboarding a new project."
agent: build
---

# New Project Command

Scaffold the `docs/` tree for a new project. Creates the standard directory structure (`prds/`, `plans/`, `reports/`, `audits/`, `sessions/`, `state/`, `instincts/`) plus a `PROJECT.md` template and a `docs/README.md` index.

## Your Task

Run the scaffolder:

```bash
node .opencode/bin/scaffold-new-project.js
```

### Optional flags

| Flag | What it does |
|------|--------------|
| `--name "my-app"` | Set the project name in `PROJECT.md` (default: basename of CWD) |
| `--force` | Overwrite existing `PROJECT.md` and `docs/README.md` |
| `--dry-run` | Show what would be created, don't write |

## What it creates

```
docs/
├── PROJECT.md           # stack + conventions + non-negotiables
├── README.md            # index pointing at all subdirs
├── prds/                # Product Requirements Docs
├── plans/               # Implementation plans
├── reports/             # Agent run reports
├── audits/              # Audit reports
├── sessions/            # Session memory snapshots
├── state/               # CLI recovery state
└── instincts/           # Learned heuristics
```

## When to use

- Copying the opencode pack to a fresh repo
- Onboarding a new project that doesn't have a `docs/` tree yet
- After cloning an existing project that lacks standardized doc storage

## Behavior

- **Safe by default**: refuses to overwrite existing files. Pass `--force` to overwrite `PROJECT.md` and `docs/README.md`.
- **Idempotent**: directories that already exist are skipped silently.
- **Independent of `refresh-project.js`**: this scaffolder creates templates, not real stack detection. Run `node .opencode/bin/refresh-project.js` afterward to populate `PROJECT.md` from your actual `package.json` / `pyproject.toml` / etc.

## Next steps

1. Edit `docs/PROJECT.md` → fill in Identity / Stack / Non-Negotiables / Architecture Notes
2. Run `node .opencode/bin/refresh-project.js` to auto-detect stack from project files
3. Commit the `docs/` tree (project-only, doesn't pollute the pack)
