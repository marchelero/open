---
description: "List all MCPs available to this project: active (loaded from opencode.json) and optional (in mcp.optional.json, opt-in via /setup-mcp), with use-when guidance"
agent: build
---

# List MCPs Command

Show the catalog of MCPs available to this project. Two sources:

- **Active**: declared in `opencode.json` → `mcp` block. Loaded automatically by opencode at boot.
- **Optional**: declared in `.opencode/mcp.optional.json` (template file, ignored by opencode). Opt-in via `/setup-mcp <name>` or `node .opencode/bin/setup-mcp.js activate <name>`.

## Usage

- `/list-mcps` — show both active and optional
- `/list-mcps active` — only active (loaded)
- `/list-mcps optional` — only optional (opt-in)
- `/list-mcps <name>` — detail for one MCP (active or optional), with full setup info

## Output format

```
MCPs (3 total: 2 active, 1 optional)

ACTIVE (auto-loaded by opencode at boot)
  • context7
    Type:   local
    Cmd:    npx -y @upstash/context7-mcp@3.2.3
    Use:    Fetch up-to-date library/framework docs via Context7

  • playwright
    Type:   local
    Cmd:    npx -y @playwright/mcp@0.0.78
    Use:    Drive a real browser for E2E tests, screenshots, scraping

OPTIONAL (opt-in via /setup-mcp activate <name>)
  • github
    Use:    Read GitHub issues, PRs, code search, repo metadata
    Activate: /setup-mcp github

  • postgres
    Use:    Read-only SQL queries against a PostgreSQL database
    Activate: /setup-mcp postgres
```

For `/list-mcps <name>`, show full detail:

```
github (OPTIONAL — not loaded)

Type:        stdio
Command:     npx -y @modelcontextprotocol/server-github
Env vars:    GITHUB_PERSONAL_ACCESS_TOKEN (required)
Docs:        https://github.com/modelcontextprotocol/servers

Description:
  Read GitHub issues, PRs, code search, repo metadata directly from
  the agent. Replaces manual `gh` CLI invocations with structured
  MCP tools (list_issues, get_pull_request, search_code, etc).

Use when:
  - Reviewing PRs that need GitHub context
  - Fetching issues, code search across the org
  - Automating release notes from merged PRs

Activate:    /setup-mcp github
Disable:     /setup-mcp disable github
```

## Your Task

1. Read `opencode.json` → `mcp` block (active MCPs)
2. Read `.opencode/mcp.optional.json` if it exists (optional MCPs)
3. Filter by `$ARGUMENTS` if provided (`active` / `optional` / name)
4. For each MCP, show: name, type, command (if local), env vars required, description, use-when
5. Sort: active first, then optional. Alphabetical within each group.
6. For each optional MCP, append the activation line

## File locations

- Active MCPs: `<project>/opencode.json` → `mcp` block
- Optional MCPs: `<project>/.opencode/mcp.optional.json` (NOT loaded by opencode — it's a template)

If `mcp.optional.json` doesn't exist, show only active and note "No optional MCPs available".

## See also

- `/setup-mcp <name>` — activate an optional MCP (writes to `opencode.json`)
- `/setup-mcp disable <name>` — remove an active MCP
- `/setup-mcp --list` — same as this command, but CLI-only
- `.opencode/manual/MCP.md` — full MCP pack documentation
