# Project Context

> Source of truth for stack, conventions, and non-negotiables. Edit freely.
> prd-agent reads this at Phase 0. Run `@prd-agent` or `node .opencode/bin/refresh-project.js` to regenerate.

## Identity
- **Name**: open (opencode starter pack)
- **Type**: meta-project (config + prompts + zero-deps CLI)
- **Description**: portable kit of 65 agents, 10 skills, 52 slash commands, 2 MCPs, 4 plugins. Copy to any project, restart opencode, ship.

## Stack
- **Language**: Markdown (YAML frontmatter) + Node.js (CLIs)
- **Runtime**: Node.js 20+ (zero-deps CLIs use only `fs`/`path`/`os`)
- **Package manager**: n/a (root has no `package.json`; `.opencode/package.json` is for plugin install only and is gitignored)
- **Configuration**: `opencode.json` (JSON5-compatible)
- **MCP servers**: context7 (`@upstash/context7-mcp`), playwright (`@playwright/mcp`)
- **Plugins**: `opencode-dynamic-context-pruning`, `opencode-skillful`, `opencode-vibeguard`, `opencode-pty`
- **Junctions**: `.opencode/agent` and `.opencode/skill` are 0-byte junctions to `agents/` and `skills/` for opencode 1.17.x backwards compat

## Conventions
- **Style**: free-form (no formatter — content is prompts/configs)
- **Lint**: `node .opencode/bin/smoke-test.js` + `node .opencode/bin/validate-frontmatter.js` (both zero-deps)
- **Tests**: smoke-test (23 structural checks) + validate-frontmatter (frontmatter shape)
- **Coverage target**: n/a (not application code)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `perf:`)
- **Branching**: trunk-based on `main`
- **No-dependency rule**: root has zero npm deps. CLIs in `.opencode/bin/` use only Node stdlib.

## Non-Negotiables
- **License**: inherited from user project (no embedded license in starter)
- **Caveman mode default ON**: every session in caveman unless user says otherwise
- **PRD-first mandatory**: any "build/create/add" goes through `@prd-agent` first
- **No destructive actions without explicit per-turn consent**: `git commit`/`push`/`rm -rf`/`DROP TABLE` need explicit verb in current turn
- **Skills on-demand**: do NOT list skills in `opencode.json > instructions` (wastes ~30K tokens/turn). Use `<available_skills>` catalog + `skill` tool.
- **Junctions preserved**: `.opencode/agent` and `.opencode/skill` are 0-byte junctions opencode 1.17.x scans. Do not delete.
- **No `model`/`small_model` in `opencode.json`**: each user configures their own provider

## Architecture Notes

```
Capa 1 (always loaded, ~2K tokens):
  - AGENTS.md                caveman + 5 mandatory behaviors
  - INSTRUCTIONS.md          global rules (security, git, testing, style)
  - .agents/PROJECT.md       this file (project source of truth)

Capa 2 (loaded on /session-start, ~1-3K tokens):
  - .agents/sessions/LATEST.md   copy of most recent snapshot
  - .agents/sessions/YYYY-MM-DD-{slug}.md   per-session archive

Capa 3 (on-demand via skill/task tools):
  - 10 skills in .opencode/skills/  (<available_skills> catalog)
  - 1 user skill in .agents/skills/ (caveman)
  - 65 sub-agents in .opencode/agents/  (description-triggered)

Capa 4 (disk only, never loaded):
  - git history
  - .opencode/prds/             PRD artifacts
  - .opencode/instincts/        project-scope instincts (JSON)
  - ~/.config/opencode/instincts/  global instincts
  - .opencode/node_modules/     plugin deps
```

## Open Questions
- (none — this is the starter's own context; downstream projects override)
