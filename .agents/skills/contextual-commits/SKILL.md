---
name: contextual-commits
description: Use when writing git commit messages that capture the WHY behind changes, not just the WHAT. Goes beyond conventional commits by adding context about decisions, trade-offs, and reasoning. Complements git-workflow with deeper commit semantics.
---

# Contextual Commits Skill

Git commits that capture the **why**, not just the **what**.

## Core Principles

1. **Why over what** — the diff shows what changed; the message explains why
2. **Decision context** — what alternatives were considered
3. **Trade-offs** — what was sacrificed and why
4. **Linked reasoning** — connect to issue, PRD, or discussion
5. **Future guidance** — what to watch for when revisiting

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | When | Example |
|------|------|---------|
| `feat` | New feature | `feat(auth): add JWT refresh token rotation` |
| `fix` | Bug fix | `fix(api): prevent race condition in user creation` |
| `refactor` | Code restructuring | `refactor(db): extract query builder into separate module` |
| `perf` | Performance | `perf(search): add Redis cache for hot queries` |
| `test` | Tests | `test(auth): add edge case for expired tokens` |
| `docs` | Documentation | `docs(api): clarify rate limit behavior` |
| `chore` | Maintenance | `chore(deps): upgrade lodash to 4.17.21` |

### Body — The WHY Section

```markdown
## Why

[Explain the motivation behind this change]

## Context

[What was the situation before? What problem did it cause?]

## Decision

[What was chosen and why]

## Alternatives Considered

- **Option A**: [Description] — rejected because [reason]
- **Option B**: [Description] — rejected because [reason]

## Trade-offs

- **Gained**: [What improved]
- **Lost**: [What was sacrificed]

## Testing

[How was this verified? What edge cases were considered?]

## Related

- Closes #123
- PRD: docs/prds/2026-01-15_1200-feature.prd.md
- Discussion: [link if applicable]
```

## Examples

### Simple Feature

```markdown
feat(checkout): add Stripe webhook handler

## Why
Users reported successful payments not reflected in their account.
The checkout flow relied on client-side confirmation which is
unreliable — network issues can cause the client to miss the
success redirect.

## Context
Previously: client calls /api/checkout/confirm after redirect.
Problem: if user closes tab or network drops, payment is lost.

## Decision
Server-side webhook handler processes Stripe events directly.
No client dependency.

## Trade-offs
+ Reliable: server always knows about payment status
- Latency: webhook arrives 1-5s after payment (acceptable)
- Complexity: must handle idempotent events

## Testing
- Stripe CLI: `stripe trigger checkout.session.completed`
- Verified idempotency with duplicate events
- Checked race condition: webhook vs client confirm

## Related
- Closes #456
- Ref: https://stripe.com/docs/payments/handling-payment-events
```

### Bug Fix

```markdown
fix(auth): prevent token refresh race condition

## Why
Multiple simultaneous API calls each triggered a token refresh,
causing 401 errors because the first refresh invalidated the
second refresh token.

## Context
Frontend makes parallel requests on page load. Each request
independently detects expired token and tries to refresh.
Only the first refresh succeeds; others get 401.

## Decision
Use a promise-based lock: first refresh wins, others wait
and reuse the same result.

## Alternatives Considered
- **Queue all requests**: rejected — adds latency to every request
- **Silent retry**: rejected — masks real errors
- **Lock**: chosen — minimal overhead, fixes root cause

## Related
- Closes #789
- Bug report: user sees flash of unauthenticated content
```

## Anti-Patterns

| Anti-Pattern | Why Bad | Fix |
|-------------|---------|-----|
| "Fixed bug" | No context for future maintainers | Explain what bug and why this fix |
| "WIP" | Incomplete commit | Use `git commit --amend` or squash |
| Copy-paste from issue | No added value | Summarize relevant context |
| No body | Missing reasoning | Always explain the WHY |

## Conventional Commits Enhancement

Standard conventional commits tell you WHAT changed. Add WHY:

```
# Standard
feat(auth): add refresh token rotation

# Contextual
feat(auth): add refresh token rotation

## Why
Refresh token theft was possible with long-lived tokens.
Rotation limits the window of exploitation.

## Decision
Short-lived access tokens (15min) + rotation on each use.
Stolen refresh token becomes useless after next legitimate use.

## Trade-offs
+ Security: stolen tokens auto-expire
- Complexity: must handle concurrent refresh gracefully
- Latency: slightly more token exchanges
```

## When to Use

- **Every commit** — why not? The diff shows what; explain why
- **Complex changes** — especially when reasoning matters
- **Team projects** — helps teammates understand decisions
- **Open source** — helps contributors understand design choices

## See Also

- `skill: git-workflow` — branching, PR, merge conventions
- `skill: coding-standards` — commit message conventions
- `agent: code-reviewer` — reviews commit quality
