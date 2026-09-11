---
name: persistent-memory
description: Use when the user wants to persist knowledge, decisions, or context across sessions beyond the built-in session memory. Covers vector-based memory, knowledge graphs, decision logs, and cross-session context preservation. Complements session memory with longer-term, searchable knowledge storage.
---

# Persistent Memory Skill

Cross-session knowledge persistence via vectors, graphs, and logs.

## Core Principles

1. **Searchable** — find past decisions by query, not just browsing
2. **Structured** — not just raw text, but categorized knowledge
3. **Linked** — connect related decisions and context
4. **Efficient** — store only what matters, prune what doesn't
5. **Accessible** — easy to query and update

## Memory Types

| Type | Content | Retention | Use Case |
|------|---------|-----------|----------|
| **Decisions** | Architecture choices, trade-offs | Forever | "Why did we choose X?" |
| **Patterns** | Code patterns that work | Until deprecated | "How did we solve Y?" |
| **Bugs** | Root causes and fixes | Forever | "We saw this before" |
| **Context** | Project-specific knowledge | Until project ends | "This project uses Z" |
| **Lessons** | What worked/didn't work | Forever | "Next time, do W" |

## Storage Approaches

### 1. File-Based (Simple)

```markdown
# docs/decisions/ADR-001-choose-react.md

## Decision
Use React for frontend

## Date
2026-01-15

## Context
Need interactive dashboard with real-time updates.

## Options Considered
- **React**: Large ecosystem, team knows it
- **Vue**: Simpler, but smaller ecosystem
- **Svelte**: Best performance, but team doesn't know it

## Decision Factors
1. Team expertise (React: 3 years)
2. Ecosystem for charts (Recharts, D3 bindings)
3. Hiring market availability

## Status
Accepted

## Related
- ADR-002-choose-redux (state management)
- PRD: docs/prds/2026-01-15_1200-dashboard.prd.md
```

### 2. Vector-Based (Searchable)

```typescript
// Using a vector store for semantic search
interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'decision' | 'pattern' | 'bug' | 'context' | 'lesson';
    date: string;
    tags: string[];
    relatedIds: string[];
  };
}

// Store
await vectorStore.upsert({
  content: "We chose React because team has 3 years experience",
  metadata: { type: 'decision', tags: ['frontend', 'react'] }
});

// Query
const results = await vectorStore.search("frontend framework choice", {
  limit: 5,
  filter: { type: 'decision' }
});
```

### 3. Knowledge Graph (Linked)

```markdown
# docs/knowledge/graph.md

## Nodes
- React (framework)
- Dashboard (feature)
- Real-time (requirement)
- Team-expertise (factor)

## Edges
- Dashboard → USES → React
- Dashboard → REQUIRES → Real-time
- React → CHOSEN-BECAUSE → Team-expertise
```

## Memory Structure

### Decision Log

```markdown
# docs/decisions/YYYY-MM-DD-topic.md

## Decision
[What was decided]

## Date
[When]

## Context
[Why this decision was needed]

## Options
| Option | Pros | Cons |
|--------|------|------|
| A | ... | ... |
| B | ... | ... |

## Decision Factors
1. [Factor 1]
2. [Factor 2]

## Status
Accepted | Rejected | Superseded-by-ADR-XXX

## Related
- ADR-XXX
- PRD: docs/prds/...
```

### Bug Registry

```markdown
# docs/bugs/YYYY-MM-DD-slug.md

## Symptom
[What was observed]

## Root Cause
[What actually caused it]

## Fix
[How it was fixed]

## Prevention
[How to avoid it in the future]

## Files
- src/auth/login.ts (fixed)
- tests/auth.test.ts (test added)

## Date
2026-01-15
```

## Query Patterns

### By Topic

```bash
# Search decisions about authentication
grep -r "auth" docs/decisions/ | head -10

# Search bugs by file
grep -r "src/payment/" docs/bugs/
```

### By Date

```bash
# Decisions from last month
find docs/decisions/ -name "2026-01-*" | sort

# Recent bugs
find docs/bugs/ -mtime -30 | sort
```

### By Relationship

```bash
# Find related ADRs
grep -r "ADR-001" docs/decisions/

# Find all decisions for a feature
grep -r "Dashboard" docs/decisions/
```

## Integration with Pack

### Session End Snapshot

```bash
# Auto-save decisions from session
node .opencode/bin/state.js update <session> 0 '{"decisions":["ADR-005"]}'
```

### Project Context

```markdown
# docs/PROJECT.md (auto-generated)

## Key Decisions
- ADR-001: React for frontend
- ADR-002: Redux for state
- ADR-003: PostgreSQL for DB

## Known Issues
- BUG-001: Race condition in auth (fixed)
- BUG-002: Memory leak in dashboard (monitoring)
```

## Best Practices

1. **Write decisions when made** — not after, not "later"
2. **Link related items** — ADRs, PRDs, bugs, code
3. **Use consistent format** — same structure for all entries
4. **Tag for search** — add relevant tags to each entry
5. **Prune regularly** — remove obsolete entries quarterly
6. **Review on onboarding** — new team members read decisions

## Tools

| Tool | Purpose | Setup |
|------|---------|-------|
| **Markdown files** | Simple, git-friendly | Just write |
| **Vectra** | Vector search | npm install vectra |
| **Knowledge Graph** | Linked memory | Custom or Neo4j |
| **Obsidian** | Visual graph | Use .md files |

## When to Use

- After making a significant decision
- When solving a tricky bug
- When discovering a pattern that works
- During architecture reviews
- When onboarding new team members

## See Also

- `skill: session-memory` — built-in session snapshots
- `skill: pack-reference` — memory layers documentation
- `skill: contextual-commits` — capture WHY in git
- `skill: documentation-lookup` — find past decisions
