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
 *
 * Confinement block (optional, same JSON):
 *   "confinement": { "mode": "off"|"audit"|"enforce", "roots": ["."],
 *                    "allow": [], "readTools": ["edit","write","read"],
 *                    "denyNetwork": false }
 *   A JSON without the block behaves exactly as before (logical confinement
 *   disabled). This is a LOGICAL boundary, not a kernel sandbox: it decides on
 *   the tool arguments only and can be evaded by obfuscation or child
 *   processes. See .opencode/manual/SANDBOX.md.
 */

"use strict"

const fs = require("node:fs")
const os = require("node:os")
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

const CONFINEMENT_MODES = ["off", "audit", "enforce"]
const DEFAULT_READ_TOOLS = ["edit", "write", "read"]

function asStringList(v) {
  if (!Array.isArray(v)) return null
  const out = v.filter((x) => typeof x === "string" && x.length > 0)
  return out.length === v.length ? out : null
}

/**
 * Normalize the optional `confinement` block. Returns null when the block is
 * absent or malformed (a malformed block degrades to "off", i.e. the behaviour
 * before this feature — it must never block a session by accident).
 */
function compileConfinement(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const mode = CONFINEMENT_MODES.indexOf(raw.mode) !== -1 ? raw.mode : "off"
  const roots = asStringList(raw.roots)
  const allow = Array.isArray(raw.allow) ? raw.allow.filter((x) => typeof x === "string") : []
  const readTools = asStringList(raw.readTools)
  return {
    mode,
    roots: roots && roots.length > 0 ? roots : ["."],
    allow,
    readTools: readTools || DEFAULT_READ_TOOLS.slice(),
    denyNetwork: raw.denyNetwork === true,
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
    return { ok: false, error: "no se pudo leer " + p, mode: "enforce", rules: [], confinement: null }
  }
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    return { ok: false, error: "JSON invalido: " + e.message, mode: "enforce", rules: [], confinement: null }
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.rules)) {
    return { ok: false, error: "schema invalido: falta rules[]", mode: "enforce", rules: [], confinement: null }
  }
  const mode = MODES.indexOf(data.mode) !== -1 ? data.mode : "enforce"
  const rules = data.rules.map(compileRule).filter(Boolean)
  const confinement = compileConfinement(data.confinement)
  return { ok: true, version: data.version, mode, rules, confinement }
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

// ────────────────────────────────────────────────────────────────────────────
// Confinement (LOGICAL boundary; not a kernel sandbox)
// ────────────────────────────────────────────────────────────────────────────

/** Best-effort real path: resolve symlinks when the path exists, otherwise
 *  realpath the nearest existing ancestor. Never throws. */
function realpathBest(p) {
  try {
    return fs.realpathSync(p)
  } catch {
    try {
      const dir = path.dirname(p)
      if (dir && dir !== p) return path.join(fs.realpathSync(dir), path.basename(p))
    } catch {
      /* keep the lexical path */
    }
    return p
  }
}

/** Expand a leading `~` to the home directory (POSIX shell convention). */
function expandHome(target) {
  if (typeof target !== "string") return target
  if (target === "~") return os.homedir()
  if (target.startsWith("~/") || target.startsWith("~\\")) {
    return path.join(os.homedir(), target.slice(2))
  }
  return target
}

/** True when `child` is `root` itself or lives beneath it (cross-drive safe). */
function isInside(child, root) {
  const rel = path.relative(root, child)
  if (rel === "") return true
  if (path.isAbsolute(rel)) return false
  // Only a real parent segment escapes: ".." or "../x", not a file named "...".
  return rel !== ".." && !rel.startsWith(".." + path.sep)
}

/**
 * Candidate destinations a tool would touch. Deliberately conservative:
 *  - edit/write/read: the declared file path, when the tool is in readTools.
 *  - bash: every non-flag, non-URL, non-single-letter-switch token. Plain
 *    words resolve inside the cwd and are allowed, so the benign suite stays
 *    clean; absolute/parent/`~` targets outside the roots are reported.
 */
function confinementTargets(tool, args, conf) {
  if (!args || typeof args !== "object") return []
  if (conf.readTools.indexOf(tool) !== -1) {
    const t = extractTarget(tool, args)
    return typeof t === "string" && t ? [t] : []
  }
  if (tool === "bash") {
    return bashPathCandidates(typeof args.command === "string" ? args.command : "")
  }
  return []
}

const BASH_TOKEN_RE = /"[^"]*"|'[^']*'|[^\s;&|<>()]+/g

function bashPathCandidates(command) {
  const out = []
  if (typeof command !== "string" || command === "") return out
  BASH_TOKEN_RE.lastIndex = 0
  let m
  while ((m = BASH_TOKEN_RE.exec(command)) !== null) {
    let tok = m[0]
    if (tok.length >= 2 && (tok[0] === '"' || tok[0] === "'")) tok = tok.slice(1, -1)
    if (!tok) continue
    if (tok.startsWith("-")) continue // option/flag
    if (tok.indexOf("://") !== -1) continue // URL, not a filesystem path
    if (/^\/[A-Za-z]$/.test(tok)) continue // Windows switch such as /S
    if (out.indexOf(tok) === -1) out.push(tok)
  }
  return out
}

/** Best-effort network egress detection (opt-in; never a real network fence). */
const NETWORK_RE = /(^|[\s;&|(])(curl|wget|scp|sftp|ssh|nc|ncat|netcat|telnet|ftp|rsync|socat|nslookup|dig|ping)(?=[\s;&|)]|$)/

function networkCommand(command) {
  if (typeof command !== "string") return null
  const m = NETWORK_RE.exec(command)
  return m ? m[2] : null
}

/** True when the resolved target is inside any root or allow entry. */
function isWithinRoots(target, conf, base) {
  const abs = realpathBest(path.resolve(base, expandHome(target)))
  const entries = conf.roots.concat(conf.allow)
  for (const entry of entries) {
    const root = realpathBest(path.resolve(base, expandHome(entry)))
    if (abs === root || isInside(abs, root)) return true
  }
  return false
}

/**
 * Decide the confinement boundary for one tool call. Pure and deterministic:
 * same tool + args + config + cwd => same decision.
 *   { severity: "allow"|"deny"|"audit", ruleId, message, target }
 * `enforce` blocks (deny); `audit` reports ("would deny") without blocking;
 * `off`/absent config allows everything.
 */
function checkConfinement(tool, args, conf, cwd) {
  const base = cwd || process.cwd()
  if (!conf || conf.mode === "off") return { severity: "allow" }
  const sev = conf.mode === "enforce" ? "deny" : "audit"
  for (const t of confinementTargets(tool, args, conf)) {
    if (!isWithinRoots(t, conf, base)) {
      return {
        severity: sev,
        ruleId: "confine-path-outside-root",
        message: "path resolves outside the confinement roots/allow list: " + t,
        target: t,
      }
    }
  }
  if (conf.denyNetwork && tool === "bash") {
    const cmd = typeof args.command === "string" ? args.command : ""
    const net = networkCommand(cmd)
    if (net) {
      return {
        severity: sev,
        ruleId: "confine-network-egress",
        message:
          "network egress command '" + net + "' (best-effort, opt-in; not a real network fence)",
        target: cmd,
      }
    }
  }
  return { severity: "allow" }
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
  compileConfinement,
  checkConfinement,
  isWithinRoots,
  bashPathCandidates,
  networkCommand,
  SEVERITIES,
  MODES,
  RANK,
}
