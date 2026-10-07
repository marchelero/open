# Sessions

One file per work session. Used by `/session-start` (read) and `/session-end` (write).

## Convention

- **One file per session** — never overwrite an existing snapshot
- **Filename**: `YYYY-MM-DD-{slug}.md` where slug is a kebab-case summary (max 50 chars)
- **LATEST.md** — copy of the most recent snapshot, always overwritten by `/session-end`. Used by `/session-start` to find the latest without scanning.

## Lifecycle

```
/session-start (or auto on first action)
  ↓ reads PROJECT.md + LATEST.md
  ↓ reports compact summary
  ↓ waits for user direction
  ↓ [user works in this session]
/session-end
  ↓ reviews session
  ↓ writes YYYY-MM-DD-{slug}.md
  ↓ overwrites LATEST.md
  ↓ [next session reads from LATEST.md]
```

## When to skip

- Trivial one-message sessions (Q&A, no code changes)
- User says "skip snapshot"
- Inside a `/verify` or `/checkpoint` flow (those save their own state)

## Cleanup

Old snapshots are kept for archaeology. Optional: archive snapshots older than 90 days to `docs/sessions/archive/`.

## Auto-snapshot (cost-ledger.js)

Independently of `/session-end`, the `cost-ledger.js` plugin writes a **factual**
snapshot on `session.idle` — branch, `git status --porcelain`, tokens and cost —
to `<YYYY-MM-DD>-session-<id>.md` (one file per session, refreshed on each idle).

`LATEST.md` is only overwritten while it still looks auto-generated, so a
narrated `/session-end` handoff is never clobbered by an idle snapshot. Run
`/session-end` for the real, human-readable handoff; the auto-snapshot is a
safety net if a session ends without one.
