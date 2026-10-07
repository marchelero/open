# Project Context

> Auto-refreshed by refresh-project.js on 2026-10-07.
> Source of truth: actual project files (package.json, pubspec.yaml, etc.)
> Edit `Non-Negotiables` / `Architecture Notes` / `Open Questions` sections manually — they are preserved across refreshes.

## Identity
- **Name**: open
- **Type**: unknown
- **Description**: **Un equipo completo de agents, commands y skills que convierte a opencode en un flujo de desarrollo guiado por especificación y verificado en cada paso.**

## Stack
- **Language**: ?
- **Framework**: ?
- **Runtime / Build**: ?
- **Package manager**: ?



## Tooling
- **Test runner**: (not detected)
- **Coverage**: (not detected)
- **Linter**: (not detected)
- **Formatter**: (not detected)
- **CI**: GitHub Actions (1)
- **Container**: (not detected)
- **Env vars**: (not detected)

## Conventions
GitHub Actions CI

## Entry Points
- (no standard entry point detected)

## Directory Layout
- `docs/`

## License
unspecified

## Non-Negotiables
<!-- manual: things that MUST stay true. Preserved across refreshes. -->

- **License**: MIT (from LICENSE)


## Architecture Notes
<!-- manual: ADRs, rationale, key decisions. Preserved across refreshes. -->

- **{decision}**: {rationale}


## Open Questions
<!-- manual: things to resolve later. Preserved across refreshes. -->

- [ ] {question}
- [ ] {question}

## Glossary
<!-- manual: domain-specific terms. Helps sub-agents disambiguate "user" vs "account" vs "tenant" without re-deriving. -->

- **{term}**: {definition in this project's context}
- **{term}**: {definition}

## Token / MCP Opt-in (manual — preserved across refreshes)
<!-- manual: default MCPs are OFF to cut boot tokens (2026-08-12). Override per-project below. -->
- **Default**: MCPs cerrados (`context7`, `playwright` y todos los opcionales NO cargan en boot).
- **Activar**: `/mcp-on context7` (o `node .opencode/bin/setup-mcp.js activate <name>`) → reiniciar opencode.
- **Desactivar**: `/mcp-off <name>` → reiniciar opencode.
- **Per-project override** (bloque manual): descomenta y edita para forzar MCPs en este proyecto aunque el env var global esté vacío:
  `<!-- manual: [mcp] enabled=context7,playwright -->`
