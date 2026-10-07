#!/usr/bin/env node
/**
 * cost-ledger.js — per-session cost ledger (opencode plugin)
 *
 * On session idle/close, writes `docs/state/cost-<ISO-ts>.json` with the tokens
 * and cost observed from `message.updated` events (assistant messages expose
 * `info.tokens` and `info.cost`). If no token data was seen, the file is still
 * written but flagged `estimated: true` with an explicit `reason` — never a
 * corrupt or half-written file.
 *
 * Also handles continuity:
 *   - C6 (session.idle): writes a factual snapshot to `docs/sessions/`
 *     (branch, changed files, tokens, cost). `LATEST.md` is only overwritten
 *     while it still looks auto-generated, so a `/session-end` handoff is safe.
 *   - C5 (experimental.session.compacting): appends a continuity instruction to
 *     the compaction prompt so a handoff survives context loss.
 *
 * Defensive by design: a global try/catch around every handler, exactly like
 * hookify.js. This plugin NEVER crashes a session.
 *
 * Zero deps, CommonJS. Auto-loaded from .opencode/plugins/.
 */

const fs = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

function ledgerDir() {
  return path.join(process.cwd(), "docs", "state")
}

function writeLedger(acc) {
  try {
    const now = new Date()
    const ts = now.toISOString()

    // Sum over DISTINCT assistant messages (message.updated fires repeatedly
    // while streaming; keying by message id avoids double counting).
    let tokensIn = 0
    let tokensOut = 0
    let costUsd = 0
    let hasCost = false
    let messages = 0
    if (acc && acc.msgs) {
      for (const m of acc.msgs.values()) {
        tokensIn += m.in || 0
        tokensOut += m.out || 0
        if (m.hasCost) {
          costUsd += m.cost || 0
          hasCost = true
        }
        messages++
      }
    }

    const real = tokensIn > 0 || tokensOut > 0
    const out = {
      timestamp: ts,
      sessionID: (acc && acc.sessionID) || "unknown",
      agent: (acc && acc.agent) || "unknown",
      model: (acc && acc.model) || "unknown",
      provider: (acc && acc.provider) || "unknown",
      tokensIn,
      tokensOut,
      costUsd: hasCost ? Number(costUsd.toFixed(6)) : null,
      estimated: !real,
      reason: real ? "tokens from message.updated usage" : "no token data exposed",
      assistantMessages: messages,
      generatedBy: "cost-ledger.js",
    }

    const dir = ledgerDir()
    fs.mkdirSync(dir, { recursive: true })
    const safeTs = ts.replace(/[:.]/g, "-")
    fs.writeFileSync(
      path.join(dir, `cost-${safeTs}.json`),
      JSON.stringify(out, null, 2) + "\n",
      "utf8"
    )
  } catch {
    // Never crash the session over a ledger write failure.
  }
}

function ensureSession(sessions, sessionID) {
  const id = sessionID || "unknown"
  let a = sessions.get(id)
  if (!a) {
    a = {
      sessionID: id,
      agent: "unknown",
      model: "unknown",
      provider: "unknown",
      msgs: new Map(),
      startedAt: Date.now(),
      snapName: null,
    }
    sessions.set(id, a)
  }
  return a
}

// ────────────────────────────────────────────────────────────────────────────
// C6 — factual session snapshot (docs/sessions/), written on session.idle.
// Facts only (branch, changed files, tokens, cost). An explicit /session-end
// handoff is never clobbered: LATEST.md is only overwritten while it still
// looks auto-generated.
// ────────────────────────────────────────────────────────────────────────────

function gitInfo() {
  const info = { branch: null, changed: [] }
  const opts = {
    cwd: process.cwd(),
    timeout: 1500,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }
  try {
    info.branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts).trim() || null
  } catch {
    /* not a git repo, or git missing */
  }
  try {
    const s = execFileSync("git", ["status", "--porcelain"], opts)
    info.changed = s
      .split("\n")
      .map((l) => l.replace(/\s+$/, ""))
      .filter(Boolean)
      .slice(0, 50)
  } catch {
    /* ignore */
  }
  return info
}

function snapshotName(acc) {
  if (acc.snapName) return acc.snapName
  const date = new Date().toISOString().slice(0, 10)
  const sid = String(acc.sessionID || "unknown").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "unknown"
  acc.snapName = `${date}-session-${sid}.md`
  return acc.snapName
}

function buildSnapshot(acc) {
  const now = new Date()
  const g = gitInfo()
  let tokensIn = 0
  let tokensOut = 0
  let cost = 0
  let hasCost = false
  let msgs = 0
  if (acc.msgs) {
    for (const m of acc.msgs.values()) {
      tokensIn += m.in || 0
      tokensOut += m.out || 0
      if (m.hasCost) {
        cost += m.cost || 0
        hasCost = true
      }
      msgs++
    }
  }
  const durMin = acc.startedAt ? Math.round((Date.now() - acc.startedAt) / 60000) : null
  const lines = []
  lines.push(`# Session ${acc.sessionID || "unknown"}`)
  lines.push("")
  lines.push(`- Date: ${now.toISOString()}`)
  lines.push(`- Branch: ${g.branch || "(no git)"}`)
  lines.push(`- Agent: ${acc.agent || "unknown"}`)
  lines.push(`- Model: ${acc.model || "unknown"}`)
  lines.push(`- Assistant messages: ${msgs}`)
  lines.push(`- Tokens: in ${tokensIn} / out ${tokensOut}`)
  lines.push(`- Cost: ${hasCost ? "$" + cost.toFixed(6) : "n/a"}`)
  if (durMin !== null) lines.push(`- Duration: ~${durMin} min`)
  lines.push("")
  lines.push("## Changed files (git status --porcelain)")
  lines.push("")
  lines.push("```")
  if (g.changed.length) for (const c of g.changed) lines.push(c)
  else lines.push("(none)")
  lines.push("```")
  lines.push("")
  lines.push("_Auto-snapshot on session idle by `cost-ledger.js` — facts only. Run `/session-end` for a narrated handoff._")
  return lines.join("\n") + "\n"
}

function writeSessionSnapshot(acc) {
  try {
    if (!acc || !acc.msgs || acc.msgs.size === 0) return
    const dir = path.join(process.cwd(), "docs", "sessions")
    fs.mkdirSync(dir, { recursive: true })
    const content = buildSnapshot(acc)
    fs.writeFileSync(path.join(dir, snapshotName(acc)), content, "utf8")
    const latest = path.join(dir, "LATEST.md")
    let clobber = true
    try {
      const cur = fs.readFileSync(latest, "utf8")
      clobber = cur.includes("generatedBy: cost-ledger.js") || cur.includes("Auto-snapshot on session idle")
    } catch {
      clobber = true
    }
    if (clobber) fs.writeFileSync(latest, content, "utf8")
  } catch {
    // Never crash the session over a snapshot write failure.
  }
}

module.exports = async () => {
  const sessions = new Map()

  return {
    event: async ({ event }) => {
      try {
        if (!event || typeof event.type !== "string") return
        const props = event.properties || {}

        if (event.type === "message.updated") {
          const info = props.info || {}
          if (info.role !== "assistant") return
          const a = ensureSession(sessions, props.sessionID || info.sessionID)
          if (info.providerID) a.provider = info.providerID
          if (info.modelID) a.model = info.modelID
          if (info.agent) a.agent = info.agent
          else if (info.mode && a.agent === "unknown") a.agent = info.mode

          const t = info.tokens
          const inTok = t && typeof t.input === "number" ? t.input : 0
          const outTok =
            t && typeof t === "object"
              ? (t.output || 0) + (t.reasoning || 0)
              : 0
          const hasCost = typeof info.cost === "number"
          if (typeof info.id === "string") {
            a.msgs.set(info.id, {
              in: inTok,
              out: outTok,
              cost: hasCost ? info.cost : 0,
              hasCost,
            })
          }
          return
        }

        if (event.type === "session.idle" || event.type === "session.deleted") {
          const sid =
            props.sessionID ||
            (props.session && props.session.id) ||
            props.id
          const acc = sessions.get(sid) || (sid ? { sessionID: sid } : null)
          writeLedger(acc)
          if (event.type === "session.idle") writeSessionSnapshot(acc)
          if (event.type === "session.deleted" && sid) sessions.delete(sid)
        }
      } catch {
        // Defensive: ignore any malformed event.
      }
    },

    // C5 — continuity at compaction. Appends a short instruction to the
    // compaction prompt so a handoff artifact survives context loss.
    "experimental.session.compacting": async (input, output) => {
      try {
        if (output && Array.isArray(output.context)) {
          output.context.push(
            "Continuity: this session is being compacted. Before the context is lost, " +
              "make sure a handoff exists — if real work happened, write or refresh a factual " +
              "snapshot under docs/sessions/ (branch, changed files, what was done, next steps) " +
              "and keep docs/sessions/LATEST.md current. Never commit."
          )
        }
      } catch {
        // Never crash compaction over a context append.
      }
    },
  }
}
