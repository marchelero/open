#!/usr/bin/env node
/**
 * policy-engine.js - declarative tool-call policy evaluator (zero-dep)
 *
 * The DATA lives in `.opencode/policy-rules.json`; this module is the only
 * place that knows how to turn it into a decision. It is required by
 * `.opencode/plugins/hookify.js` (runtime enforcement) and by
 * `.opencode/bin/lib/policy-selftest.js` (offline fixture runner).
 *
 * It is intentionally NOT a CLI: it lives under `bin/lib/` so `counts.js`
 * (which only scans top-level `bin/*.js`) keeps `clis` at 22.
 *
 * Design contract
 *   - CommonJS, Node 18 stdlib, Windows + Linux (path.join only).
 *   - Deterministic: same target + same rules => same severity.
 *   - Conservative default: only catastrophic/irreversible rules are `deny`.
 *   - Never logs secrets: targets are truncated and redacted before logging.
 *
 * Rule shape (see policy-rules.json):
 *   { id, severity: "warn"|"ask"|"deny", match: "<regex>", tool: "bash"
 *     | ["edit","write"], message: "<human text>", flags?: "i",
 *     ignore?: ["<regex>", ...] }
 */

"use strict"

const fs = require("node:fs")
const path = require("node:path")

// .opencode/bin/lib/policy-engine.js -> .opencode/policy-rules.json
const RULES_PATH = path.join(__dirname, "..", "..", "policy-rules.json")
const LOG_DIR = path.join(process.cwd(), ".opencode", "logs")
const LOG_FILE = path.join(LOG_DIR, "policy.log")

const SEVERITIES = ["warn", "ask", "deny"]
const MODES = ["enforce", "warn-only", "off"]
const RANK = { warn: 1, ask: 2, deny: 3 }

function rulesPath() {
  return RULES_PATH
}

function compileRule(raw) {
  if (!raw || typeof raw !== "object") return null
  if (typeof raw.id !== "string" || !raw.id) return null
  if (SEVERITIES.indexOf(raw.severity) === -1) return null
  if (typeof raw.match !== "string") return null
  let match
  try {
    match = new RegExp(raw.match, raw.flags || "")
  } catch {
    return null
  }
  const tools = Array.isArray(raw.tool) ? raw.tool : [raw.tool]
  const ignore = Array.isArray(raw.ignore)
    ? raw.ignore
        .map((s) => {
          try {
            return new RegExp(s)
          } catch {
            return null
          }
        })
        .filter(Boolean)
    : []
  return {
    id: raw.id,
    severity: raw.severity,
    tools,
    match,
    ignore,
    message: typeof raw.message === "string" ? raw.message : raw.id,
  }
}

/**
 * Read + parse + compile policy-rules.json. Always returns a shaped object,
 * never throws: a broken file degrades to an empty (allow-all) rule set so a
 * malformed edit can never crash a session.
 */
function loadRules(opts) {
  const p = (opts && opts.path) || RULES_PATH
  let raw
  try {
    raw = fs.readFileSync(p, "utf8")
  } catch (e) {
    return { ok: false, error: "no se pudo leer " + p, mode: "enforce", rules: [] }
  }
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: "JSON invalido: " + e.message, mode: "enforce", rules: [] }
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.rules)) {
    return { ok: false, error: "schema invalido: falta rules[]", mode: "enforce", rules: [] }
  }
  const mode = MODES.indexOf(data.mode) !== -1 ? data.mode : "enforce"
  const rules = data.rules.map(compileRule).filter(Boolean)
  return { ok: true, version: data.version, mode, rules }
}

// mtime cache so editing policy-rules.json takes effect without a restart and
// without re-reading the file on every tool call.
let cache = { mtimeMs: -1, loaded: null }

function cachedRules() {
  try {
    const st = fs.statSync(RULES_PATH)
    if (cache.loaded && cache.mtimeMs === st.mtimeMs) return cache.loaded
    const loaded = loadRules()
    cache = { mtimeMs: st.mtimeMs, loaded }
    return loaded
  } catch {
    if (cache.loaded) return cache.loaded
    return { ok: false, mode: "enforce", rules: [] }
  }
}

/** Extract the string a rule should match against, per tool. */
function extractTarget(tool, args) {
  if (!args || typeof args !== "object") return undefined
  if (tool === "bash") {
    return typeof args.command === "string" ? args.command : undefined
  }
  return args.filePath || args.file_path || args.path || args.file
}

/**
 * Pick the most severe matching rule. Returns
 * { severity: "allow"|"warn"|"ask"|"deny", rule, matches }.
 * `mode: "warn-only"` downgrades every deny to warn; `off` allows everything.
 */
function evaluate(tool, target, rules, mode) {
  const decision = { severity: "allow", rule: null, matches: [] }
  if (mode === "off") return decision
  if (typeof target !== "string" || target === "") return decision
  const list = Array.isArray(rules) ? rules : []
  const matched = []
  for (const r of list) {
    if (r.tools.indexOf("*") === -1 && r.tools.indexOf(tool) === -1) continue
    if (r.ignore.some((re) => re.test(target))) continue
    r.match.lastIndex = 0
    if (r.match.test(target)) matched.push(r)
  }
  if (matched.length === 0) return decision
  let best = matched[0]
  for (const m of matched) {
    if (RANK[m.severity] > RANK[best.severity]) best = m
  }
  let severity = best.severity
  if (mode === "warn-only" && severity === "deny") severity = "warn"
  return { severity, rule: best, matches: matched }
}

/** Truncate + redact a target so the audit log never stores a secret. */
function redact(target) {
  if (typeof target !== "string") return ""
  let s = target
  s = s.replace(/(--?(?:token|password|passwd|secret|api[-_]?key|auth)[=\s:]+)\S+/gi, "$1<redacted>")
  s = s.replace(/((?:TOKEN|PASSWORD|SECRET|API[_-]?KEY|AUTH)[A-Z_]*=)\S+/g, "$1<redacted>")
  s = s.replace(/(Authorization:\s*Bearer\s+)\S+/gi, "$1<redacted>")
  if (s.length > 500) s = s.slice(0, 500) + "...[truncated]"
  return s
}

/** Append one audit line: timestamp, rule id, severity, tool, redacted target. */
function logEvent(entry) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true })
    const ts = new Date().toISOString()
    const ruleId = (entry && entry.rule && entry.rule.id) || "policy"
    const severity = (entry && entry.severity) || "warn"
    const tool = (entry && entry.tool) || "?"
    const note = entry && entry.note ? " (" + entry.note + ")" : ""
    const target = redact(entry && entry.target)
    fs.appendFileSync(
      LOG_FILE,
      "[" + ts + "] [" + severity + "] [" + ruleId + "] [" + tool + "] " + target + note + "\n",
      "utf8"
    )
    return true
  } catch {
    return false
  }
}

module.exports = {
  rulesPath,
  loadRules,
  cachedRules,
  extractTarget,
  evaluate,
  redact,
  logEvent,
  SEVERITIES,
  MODES,
  RANK,
}
