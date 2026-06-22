# Project Context

> This file is the project's source of truth for stack, conventions, and non-negotiables.
> Edit freely. The prd-agent reads it before any clarification work.
> Run `@prd-agent` to auto-generate this from existing project files (README, package.json, etc.).

## Identity
- **Name**: (your project name)
- **Type**: (web app | mobile | CLI | library | API service | monorepo | other)
- **Description**: (one-line description)

## Stack
- **Language**: (primary, e.g., TypeScript, Dart, Python, Rust, Go)
- **Framework**: (e.g., Next.js 15, Flutter 3.x, FastAPI, Axum, Gin)
- **Runtime / Build**: (Node 20+, Flutter 3.x+, Python 3.12, Rust 1.75)
- **Package manager**: (npm | pnpm | yarn | bun | cargo | pub | pip | poetry | uv)
- **Database**: (postgres | sqlite | mongo | none | other)
- **Deployment**: (Vercel | Fly.io | AWS | GCP | local | other)

## Conventions
- **Style**: (prettier, black, rustfmt, gofmt — or "free-form")
- **Lint**: (eslint, ruff, clippy — or "none")
- **Tests**: (jest, vitest, pytest, cargo test, go test, flutter test)
- **Coverage target**: (80%+? 70%? no target?)
- **Commits**: (conventional commits | free-form | other)
- **Branching**: (trunk | gitflow | github flow | other)

## Non-Negotiables
- (anything in README that says "always" or "must")
- (license constraints — MIT? Apache? proprietary?)
- (security/compliance notes — GDPR? HIPAA? PCI?)

## Architecture Notes
- (key modules / layers / boundaries)
- (eventual consistency? offline-first? real-time?)
- (state management approach)

## Open Questions
- (anything ambiguous about the project itself, not the request)
