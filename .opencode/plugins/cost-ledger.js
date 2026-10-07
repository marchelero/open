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
 * Defensive by design: a global try/catch around every handler, exactly like
 * hookify.js. This plugin NEVER crashes a session.
 *
 * Zero deps, CommonJS. Auto-loaded from .opencode/plugins/.
 */

const fs = require("fs")
const path = require("path")

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
    }
    sessions.set(id, a)
  }
  return a
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
          writeLedger(sessions.get(sid) || (sid ? { sessionID: sid } : null))
          if (event.type === "session.deleted" && sid) sessions.delete(sid)
        }
      } catch {
        // Defensive: ignore any malformed event.
      }
    },
  }
}
