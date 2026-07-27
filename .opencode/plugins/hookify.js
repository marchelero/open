// .opencode/plugins/hookify.js
//
// Hookify — 2 production hooks for the opencode starter pack.
//
//   1. SecretBlocker       (tool.execute.before, edit/write)
//      Blocks the agent from writing to secret/credential files (.env,
//      *.key, *.pem, id_rsa*, .aws/credentials, secrets/, etc.).
//      Strict: throws on match. Use .env.example / .env.sample instead.
//
//   2. DestructiveWarner   (tool.execute.before, bash)
//      Detects destructive bash patterns (rm -rf /, git push --force,
//      git reset --hard, DROP TABLE, TRUNCATE, etc.) and logs them to
//      .opencode/logs/destructive.log. Soft: does NOT block execution.
//      Pairs with the AGENTS.md baseline rule that destructive ops
//      require explicit user consent — this hook is the audit trail.
//
// Both hooks are auto-loaded by opencode from .opencode/plugins/.
// No install step required. Disable a hook by removing its export.
//
// Format reference: https://opencode.ai/docs/plugins/

"use strict"

const { appendFileSync, mkdirSync } = require("node:fs")
const { join } = require("node:path")

// ────────────────────────────────────────────────────────────────────────────
// Hook 1: SecretBlocker
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

const SecretBlocker = async () => {
  return {
    "tool.execute.before": async (input, output) => {
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
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Hook 2: DestructiveWarner
// ────────────────────────────────────────────────────────────────────────────

const DESTRUCTIVE_PATTERNS = [
  // Filesystem destruction
  // rm -rf followed by an absolute path (root or anything under /).
  // Catches: rm -rf /, rm -rf /etc, rm -rf /var/log. Does NOT match
  // rm -rf build/ or rm -rf ./build (relative paths are user territory).
  { pattern: /\brm\s+(-\w*r\w*\s+)*-\w*f\w*\s+\/\S*/, label: "rm -rf /<absolute path>" },
  { pattern: /\brm\s+-\w*r\w*f\w*\s+~/, label: "rm -rf ~" },
  { pattern: /\brm\s+-\w*r\w*f\w*\s+\.\.\//, label: "rm -rf ../" },
  { pattern: /:\s*>\s*\/dev\/sd[a-z]/, label: "wipe /dev/sdX" },
  { pattern: /\bmkfs\./, label: "mkfs (format disk)" },
  { pattern: /\bdd\s+if=.*\s+of=\/dev\//, label: "dd to /dev/" },
  // Git destruction
  { pattern: /\bgit\s+push\s+(-\w+\s+)*--force(\s|$)/, label: "git push --force" },
  { pattern: /\bgit\s+push\s+(-\w+\s+)*-f(\s|$)/, label: "git push -f" },
  { pattern: /\bgit\s+reset\s+--hard/, label: "git reset --hard" },
  { pattern: /\bgit\s+clean\s+-\w*f\w*d\w*/, label: "git clean -fd" },
  { pattern: /\bgit\s+branch\s+-\w*D\w*/, label: "git branch -D" },
  { pattern: /\bgit\s+update-ref\s+-d/, label: "git update-ref -d" },
  // Database destruction
  { pattern: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, label: "DROP TABLE/DATABASE" },
  { pattern: /\bTRUNCATE(\s+TABLE)?\s+\w+/i, label: "TRUNCATE" },
  { pattern: /\bDELETE\s+FROM\s+\w+\s*;/i, label: "DELETE FROM (no WHERE)" },
  // System
  { pattern: /\bshutdown\b/, label: "shutdown" },
  { pattern: /\breboot\b/, label: "reboot" },
  { pattern: /\bhalt\b/, label: "halt" },
]

function findDestructive(command) {
  if (!command || typeof command !== "string") return null
  for (const { pattern, label } of DESTRUCTIVE_PATTERNS) {
    if (pattern.test(command)) return label
  }
  return null
}

function getLogPath() {
  return join(process.cwd(), ".opencode", "logs", "destructive.log")
}

function logDestructive(tool, command, label) {
  try {
    const logPath = getLogPath()
    mkdirSync(join(process.cwd(), ".opencode", "logs"), { recursive: true })
    const ts = new Date().toISOString()
    const truncated =
      command.length > 500 ? command.slice(0, 500) + "...[truncated]" : command
    appendFileSync(
      logPath,
      "[" + ts + "] [" + label + "] [" + tool + "] " + truncated + "\n",
      "utf8"
    )
  } catch {
    // Never crash the session over a log failure
  }
}

const DestructiveWarner = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const command = output && output.args && output.args.command
      const label = findDestructive(command)
      if (!label) return
      logDestructive(input.tool, command, label)
      // Soft warn via stderr (visible in TUI). Does NOT block — the user
      // still gets to confirm the command through opencode's normal flow.
      console.warn(
        "[hookify:DestructiveWarner] detected '" + label + "' — " +
          "logged to .opencode/logs/destructive.log. " +
          "If you didn't explicitly approve this, abort."
      )
    },
  }
}

module.exports = { SecretBlocker, DestructiveWarner }
