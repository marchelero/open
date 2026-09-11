---
name: deep-research
description: Use when the user needs thorough, multi-source research on a technical topic, library, architecture pattern, or market analysis. Goes beyond simple doc lookup by synthesizing multiple sources, cross-referencing claims, and producing a structured research report with confidence levels.
---

# Deep Research Skill

Structured deep research with multi-source synthesis and confidence scoring.

## Core Principles

1. **Multiple sources** — never rely on a single source
2. **Cross-reference** — verify claims across sources
3. **Confidence levels** — rate certainty (HIGH/MEDIUM/LOW)
4. **Structured output** — clear sections with actionable findings
5. **Human-in-the-loop** — confirm direction before deep dive

## Research Workflow

```text
1. Scope        — define research question and boundaries
2. Discover     — find relevant sources (docs, blogs, repos, issues)
3. Read         — extract key claims and evidence
4. Cross-ref    — verify claims across multiple sources
5. Synthesize   — combine findings into coherent report
6. Confidence   — rate each finding's reliability
7. Report       — structured output with recommendations
```

## Step 1 — Scope

Define before researching:

- **Question**: What exactly are we trying to learn?
- **Context**: Why do we need this? (decision, implementation, comparison)
- **Boundaries**: What's in scope vs out of scope?
- **Depth**: Quick overview (< 10 min) or deep dive (30+ min)?

## Step 2 — Discover Sources

### Priority Order

1. **Official docs** — framework/library documentation
2. **GitHub repos** — source code, issues, discussions
3. **Blog posts** — technical articles from known authors
4. **Stack Overflow** — real-world problems and solutions
5. **Conference talks** — latest developments and patterns
6. **Academic papers** — theoretical foundations (if relevant)

### Search Strategies

```bash
# GitHub: find repos with specific topic
gh search repos "topic" --sort stars --limit 10

# GitHub: find issues mentioning a pattern
gh search issues "pattern" --repo owner/repo

# Web: find recent articles
# Use date range filter for last 6 months
```

## Step 3 — Extract Claims

For each source, extract:

- **Claim**: What does this source say?
- **Evidence**: What supports this claim?
- **Source quality**: Official docs (HIGH), blog (MEDIUM), SO answer (LOW)
- **Recency**: When was this published?
- **Conflicts**: Does other sources disagree?

## Step 4 — Cross-Reference

| Confidence | Meaning | Action |
|-----------|---------|--------|
| **HIGH** | 3+ reliable sources agree | Safe to use |
| **MEDIUM** | 1-2 sources, no conflicts | Use with caution |
| **LOW** | Single source or conflicting reports | Verify before using |
| **UNVERIFIED** | No corroborating evidence | Flag as assumption |

## Step 5 — Synthesize Report

```markdown
# Research: [Topic]

**Date**: YYYY-MM-DD
**Depth**: Quick/Deep
**Confidence**: HIGH/MEDIUM/LOW

## Executive Summary
[2-3 sentences: key findings and recommendation]

## Key Findings

### Finding 1: [Title]
- **What**: [Description]
- **Evidence**: [Sources]
- **Confidence**: HIGH/MEDIUM/LOW
- **Implications**: [What this means for us]

### Finding 2: [Title]
...

## Alternatives Considered
| Option | Pros | Cons | Confidence |
|--------|------|------|------------|
| Option A | ... | ... | HIGH |
| Option B | ... | ... | MEDIUM |

## Recommendations
1. [Primary recommendation with reasoning]
2. [Alternative if primary doesn't fit]

## Open Questions
- [ ] [Question that needs more research]

## Sources
1. [Official docs] — [URL]
2. [Blog post] — [URL]
3. [GitHub issue] — [URL]
```

## Step 6 — Confidence Scoring

### HIGH Confidence (use freely)
- Official documentation
- Multiple independent sources agree
- Source is the library author/maintainer
- Reproducible examples with code

### MEDIUM Confidence (verify first)
- Single reputable source
- Blog post from known author
- Stack Overflow with high votes
- GitHub issue with maintainer response

### LOW Confidence (treat as hypothesis)
- Single unknown source
- Conflicting reports
- Outdated information (>1 year)
- No code examples

## When to Use

- Evaluating a new library/framework for adoption
- Understanding a complex architecture pattern
- Comparing multiple approaches to a problem
- Preparing for a technical decision
- Learning about a new domain

## When NOT to Use

- Simple "how to" questions → use `documentation-lookup`
- Quick API reference → use `docs-lookup`
- Code review → use `code-reviewer`
- Bug investigation → use `debugging-patterns`

## See Also

- `skill: documentation-lookup` — quick doc lookups via Context7
- `skill: api-design` — API research and design
- `skill: backend-patterns` — server-side patterns
- `skill: frontend-patterns` — React/UI patterns
