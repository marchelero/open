// .opencode/plugins/hookify.js
//
// Hookify — runtime security for the open pack. A single plugin factory with
// three responsibilities (so `plugins_local` stays at 2 — no new plugin):
//
//   1. SecretBlocker       (tool.execute.before, edit/write)
//      Blocks the agent from writing to secret/credential files (.env,
//      *.key, *.pem, id_rsa*, .aws/credentials, secrets/, etc.).
//      Strict: throws on match. Use .env.example / .env.sample instead.
//      This guard is retained verbatim from the previous version.
//
//   2. PolicyEngine        (tool.execute.before, all tools)
//      Loads .opencode/policy-rules.json and applies declared severities:
//        deny -> throw (blocks the tool call, logged with rule id)
//        warn -> console.warn + append to .opencode/logs/policy.log
//        ask  -> permission.ask status:"ask" when it fires, otherwise it
//                degrades to a visible warn (never a silent block)
//      Editing the JSON changes behaviour without touching this file
//      (mtime cache reloads it live).
//
//   3. PermissionAsk       (permission.ask)
//      Surfaces a native confirmation prompt when the engine requested an
//      `ask` and the native event fires for the tool call.
//
// All hooks are auto-loaded by opencode from .opencode/plugins/.
// Format reference: https://opencode.ai/docs/plugins/

"use strict"

const { appendFileSync, mkdirSync } = require("node:fs")
const { join } = require("node:path")
const engine = require("../bin/lib/policy-engine.js")

// ────────────────────────────────────────────────────────────────────────────
// Hook 1: SecretBlocker (retained guard, unchanged behaviour)
// ────────────────────────────────────────────────────────────────────────────

const SECRET_PATH_PATTERNS = [
  // .env and variants (but allow .env.example / .env.sample / .env.template)
  /(^|\/)\.env(\.[^/]+)?$/,
  // Private keys
  /(^|\/)[^/]*\.pem$/,
  /(^|\/)[^/]*\.key$/,
  /(^|\/)[^/]*\.pfx$/,
  /(^|\/)[^/]*\.p12$/,
  /(^|\/)id_rsa(\.[^/]+)?$/,
  /(^|\/)id_ed25519(\.[^/]+)?$/,
  /(^|\/)id_dsa(\.[^/]+)?$/,
  /(^|\/)id_ecdsa(\.[^/]+)?$/,
  // Credential stores
  /(^|\/)\.npmrc$/,
  /(^|\/)\.pypirc$/,
  /(^|\/)\.netrc$/,
  /(^|\/)credentials(\.[^/]+)?$/,
  /(^|\/)\.aws\/credentials$/,
  /(^|\/)\.gcloud\/application_default_credentials\.json$/,
  /(^|\/)\.config\/gcloud\/.*\.json$/,
  /(^|\/)\.ssh\/config$/,
  /(^|\/)secrets?\//,
  /(^|\/)\.kube\/config$/,
]

const SECRET_PATH_ALLOWLIST = [
  // Convention: commit .env.example so new contributors know what vars to set
  /(^|\/)\.env\.(example|sample|template|dist)$/,
  /(^|\/)\.env\.local\.example$/,
]

function isSecretPath(filePath) {
  if (!filePath) return false
  // Allowlist first (so .env.example doesn't trip the blocker)
  if (SECRET_PATH_ALLOWLIST.some((re) => re.test(filePath))) return false
  return SECRET_PATH_PATTERNS.some((re) => re.test(filePath))
}

function extractFilePath(output) {
  if (!output || !output.args) return undefined
  return (
    output.args.filePath ||
    output.args.file_path ||
    output.args.path ||
    output.args.file
  )
}

async function secretBlocker(input, output) {
  if (input.tool !== "edit" && input.tool !== "write") return
  const filePath = extractFilePath(output)
  if (isSecretPath(filePath)) {
    throw new Error(
      "[hookify:SecretBlocker] blocked write to '" + filePath + "'. " +
        "Refusing to write to secret/credential files from inside a session. " +
        "If this is intentional, edit the file directly outside opencode " +
        "or rename the target (e.g. '.env' -> '.env.example')."
    )
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Hook 2: PolicyEngine (declarative rules)
// ────────────────────────────────────────────────────────────────────────────

// Outstanding `ask` requests, keyed by session, consumed by permission.ask.
const pendingAsk = new Map()
const ASK_TTL_MS = 10000

function rememberAsk(sessionID, entry) {
  if (!sessionID) return
  pendingAsk.set(sessionID, {
    rule: entry.rule,
    tool: entry.tool,
    target: entry.target,
    ts: Date.now(),
  })
  // Opportunistic GC so a never-consumed entry cannot live forever.
  for (const [sid, e] of pendingAsk) {
    if (Date.now() - e.ts > ASK_TTL_MS) pendingAsk.delete(sid)
  }
}

function takeAsk(sessionID) {
  if (!sessionID) return null
  const e = pendingAsk.get(sessionID)
  if (!e) return null
  pendingAsk.delete(sessionID)
  if (Date.now() - e.ts > ASK_TTL_MS) return null
  return e
}

async function policyEngine(input, output) {
  const loaded = engine.cachedRules()
  if (!loaded || loaded.mode === "off") return
  const args = output && output.args
  const target = engine.extractTarget(input.tool, args)
  const res = engine.evaluate(input.tool, target, loaded.rules, loaded.mode)
  if (res.severity === "allow" || !res.rule) return
  const rule = res.rule

  if (res.severity === "deny") {
    engine.logEvent({ tool: input.tool, severity: "deny", rule, target })
    throw new Error(
      "[hookify:policy:" + rule.id + "] denied '" + input.tool + "' call. " +
        rule.message + " " +
        "This rule is enforced by .opencode/policy-rules.json. " +
        "If the operation is intentional and safe, the user must run it " +
        "outside the agent or relax the rule."
    )
  }

  if (res.severity === "ask") {
    rememberAsk(input.sessionID, { rule, tool: input.tool, target })
    // Degrade-safe: always leave a visible, audited trail. If the native
    // permission.ask event fires, PermissionAsk also shows the prompt.
    engine.logEvent({
      tool: input.tool,
      severity: "ask",
      rule,
      target,
      note: "confirmation requested; degrades to warn if no native prompt",
    })
    console.warn(
      "[hookify:policy:" + rule.id + "] ask ('" + input.tool + "'): " +
        rule.message + " Confirmation requested; treated as a warning if no " +
        "native prompt appears."
    )
    return
  }

  // warn
  engine.logEvent({ tool: input.tool, severity: "warn", rule, target })
  console.warn(
    "[hookify:policy:" + rule.id + "] warn ('" + input.tool + "'): " +
      rule.message + " Logged to .opencode/logs/policy.log."
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Hook 3: PermissionAsk (native confirmation channel)
// ────────────────────────────────────────────────────────────────────────────

function targetFromPermission(input) {
  if (!input) return undefined
  const p = input.pattern
  if (typeof p === "string" && p) return p
  if (Array.isArray(p) && typeof p[0] === "string") return p[0]
  const md = input.metadata || {}
  if (typeof md.command === "string") return md.command
  if (typeof input.title === "string" && input.title) return input.title
  return undefined
}

async function permissionAsk(input, output) {
  try {
    if (!output) return
    const sid = input && input.sessionID
    const pending = takeAsk(sid)
    if (pending && pending.rule) {
      output.status = "ask"
      engine.logEvent({
        tool: pending.tool,
        severity: "ask",
        rule: pending.rule,
        target: pending.target,
        note: "native permission prompt shown",
      })
      return
    }
    // The event can fire before tool.execute.before recorded the request.
    // Best effort: evaluate the permission payload itself and ask on match.
    const loaded = engine.cachedRules()
    if (!loaded || loaded.mode === "off") return
    const target = targetFromPermission(input)
    const tool = input && input.type ? String(input.type) : "bash"
    const res = engine.evaluate(tool, target, loaded.rules, loaded.mode)
    if (res.severity === "ask" && res.rule) {
      output.status = "ask"
      engine.logEvent({
        tool,
        severity: "ask",
        rule: res.rule,
        target,
        note: "native permission prompt shown (payload match)",
      })
    }
  } catch {
    // Never crash the session over a permission hook.
  }
}

module.exports = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      await secretBlocker(input, output)
      await policyEngine(input, output)
    },
    "permission.ask": permissionAsk,
  }
}
