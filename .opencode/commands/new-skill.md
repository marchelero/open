---
description: "Scaffold a new skill (.agents/skills/<name>/SKILL.md) with proper frontmatter, description, and triggers. Use when contributing a new skill to the opencode pack."
agent: build
---

# New Skill Command

Scaffold a new skill at `.agents/skills/<name>/SKILL.md` with the canonical frontmatter (`name`, `description`, optional `triggers`) and a body template with `## When to Activate`, `## Core Principle`, `## Workflow`, `## Output Format`, `## Rules`, `## Anti-Patterns`, `## Integration`, `## Quick Example` sections.

## Your Task

Run the scaffolder:

```bash
node .opencode/bin/scaffold-new-skill.js <name> --triggers "t1,t2,t3" --description "..."
```

### Optional flags

| Flag | What it does |
|------|--------------|
| `<name>` (positional, required) | Skill name (lowercase, hyphens, no dots) |
| `--triggers "foo,bar,baz"` | Comma-separated trigger keywords for the frontmatter |
| `--description "..."` | Description line (1-1024 chars, third person, "Use when...") |
| `--force` | Overwrite existing skill |
| `--dry-run` | Show what would be created, don't write |

## Name rules

- Lowercase letters, digits, hyphens
- Must start with a letter
- No dots, no underscores, no spaces
- Examples: `error-handling`, `python-patterns`, `tdd-workflow`

## When to use

- Adding a new reusable knowledge area to the pack
- Capturing a workflow that the primary agent should load on-demand
- Extracting patterns from a `docs/instincts/*.json` that has proven useful

## Behavior

- **Safe by default**: refuses to overwrite existing skills. Pass `--force` to overwrite.
- **Validates name**: rejects names that don't match `/^[a-z][a-z0-9-]*$/`.
- **Body template is a starting point**: every section is marked `TODO` and needs to be replaced with real content.

## Next steps

1. Replace the `TODO` sections in the scaffolded `SKILL.md`
2. Refine the `description` and `triggers` in the frontmatter (these drive `router` matching)
3. Run `node .opencode/bin/validate-frontmatter.js` to verify the frontmatter
4. Run `node .opencode/bin/build-skills-index.js` to refresh `.agents/skills/INDEX.md`
