// .opencode/plugins/gateguard.js
//
// GateGuard — cross-platform destructive-command detector for the open pack.
//
// WHY THIS EXISTS
//   The pack's declarative PolicyEngine (.opencode/policy-rules.json) matches
//   raw command strings with regexes. That is enough for the obvious cases but
//   misses two things:
//     1. Windows syntax (del /s /q, Remove-Item -Recurse -Force, rmdir /s,
//        format, diskpart, Stop-Computer) — the engine was POSIX-centric.
//     2. Obfuscated/quoted forms (`sh -c "rm -rf /"`,
//        `powershell -Command "Remove-Item -Recurse -Force C:\"`,
//        `cmd /c del /s /q`, `sudo`, `env VAR=...`).
//
//   GateGuard classifies the *unwrapped* command so both POSIX and Windows
//   destructive operations are caught on Linux and Windows alike.
//
// COMPLEMENTARY, NOT REDUNDANT
//   It runs alongside hookify.js. The PolicyEngine keeps the authoritative
//   `deny` for catastrophic POSIX cases; GateGuard adds cross-platform
//   coverage and a profile switch. Default is `warn` so it never double-blocks.
//
// PROFILES (env GATEGUARD_MODE)
//   warn  (default) — log + console.warn, never blocks
//   block           — deny severity throws (blocks the tool call)
//   off             — disabled
//
// Defensive by design: a global try/catch around the handler. This plugin
// NEVER crashes a session. Zero deps, CommonJS. Auto-loaded from .opencode/plugins/.
// Format reference: https://opencode.ai/docs/plugins/

"use strict"

const fs = require("node:fs")
const path = require("node:path")

// ────────────────────────────────────────────────────────────────────────────
// Rules — id, severity (deny|warn|ask), regex, why. Matched against the
// unwrapped command. Both POSIX and Windows syntaxes are covered.
// ────────────────────────────────────────────────────────────────────────────

const RULES = [
  // ── POSIX filesystem ──────────────────────────────────────────────────────
  { id: "posix-rm-rf-root", severity: "deny", re: /\brm\s+(-[a-z]*r[a-z]*\s+)*-[a-z]*f[a-z]*\s+(\/|\/\*|~|\$HOME)(\s|$)/i, why: "rm -rf on /, ~ or $HOME destroys the workspace or OS irreversibly." },
  { id: "posix-rm-rf-parent", severity: "warn", re: /\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+\.\.(\/|\s|$)/i, why: "rm -rf on a parent directory; confirm the target." },
  { id: "posix-mkfs", severity: "deny", re: /\bmkfs(\.[a-z0-9]+)?\b/i, why: "mkfs formats a filesystem and destroys its contents." },
  { id: "posix-dd-dev", severity: "deny", re: /\bdd\s+[^\n]*\bof=\/dev\//i, why: "dd writing to a raw device destroys the target." },
  { id: "posix-overwrite-dev", severity: "deny", re: />\s*\/dev\/(sd[a-z]|nvme\d+n\d+|disk)/i, why: "overwriting a raw block device destroys the disk." },
  { id: "posix-fork-bomb", severity: "deny", re: /:\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:/, why: "fork bomb; it will exhaust the machine." },

  // ── Windows filesystem ────────────────────────────────────────────────────
  { id: "win-del-recursive", severity: "deny", re: /\b(del|erase)\b[^\n]*\/s\b[^\n]*(\/q\b)?/i, why: "del/erase /s recursively deletes files; add /q and it is silent." },
  { id: "win-del-force-quiet", severity: "warn", re: /\b(del|erase)\b[^\n]*\/(f|q)\b[^\n]*/i, why: "del with /f or /q force-deletes or silences prompts; confirm the target." },
  { id: "win-remove-item-recurse", severity: "deny", re: /\b(remove-item|ri)\b[^\n]*-(recurse|r)\b[^\n]*/i, why: "Remove-Item -Recurse deletes a whole tree." },
  { id: "win-remove-item-force", severity: "warn", re: /\b(remove-item|ri)\b[^\n]*-(force|fo)\b[^\n]*/i, why: "Remove-Item -Force removes read-only/hidden files; confirm." },
  { id: "win-rmdir-s", severity: "deny", re: /\b(rmdir|rd)\b[^\n]*\/s\b/i, why: "rmdir /s deletes a directory tree." },
  { id: "win-format-drive", severity: "deny", re: /\bformat\s+[a-z]:/i, why: "format erases a drive." },
  { id: "win-diskpart", severity: "deny", re: /\bdiskpart\b/i, why: "diskpart can wipe partitions and disks." },
  { id: "win-clear-disk", severity: "deny", re: /\b(clear-disk|format-volume|remove-partition)\b/i, why: "PowerShell storage cmdlet that wipes a disk or partition." },
  { id: "win-cipher-wipe", severity: "warn", re: /\bcipher\b[^\n]*\/w\b/i, why: "cipher /w wipes free space; slow and irreversible for that space." },
  { id: "win-vssadmin-delete", severity: "deny", re: /\bvssadmin\b[^\n]*\bdelete\b[^\n]*\bshadows\b/i, why: "deleting shadow copies destroys backups/restore points." },
  { id: "win-bcdedit", severity: "warn", re: /\bbcdedit\b/i, why: "bcdedit edits boot configuration; a bad edit can brick the boot." },
  { id: "win-reg-delete", severity: "warn", re: /\breg\s+delete\b/i, why: "reg delete removes registry keys." },

  // ── Git (cross-platform) ──────────────────────────────────────────────────
  { id: "git-push-force", severity: "deny", re: /\bgit\s+push\b[^\n]*(--force(\s|$)|(^|\s)-f(\s|$))/i, why: "git push --force rewrites shared remote history." },
  { id: "git-reset-hard", severity: "warn", re: /\bgit\s+reset\s+--hard\b/i, why: "git reset --hard discards local changes." },
  { id: "git-clean-fd", severity: "warn", re: /\bgit\s+clean\b[^\n]*-[a-z]*f[a-z]*d/i, why: "git clean -fd deletes untracked files." },
  { id: "git-branch-force-delete", severity: "warn", re: /\bgit\s+branch\b[^\n]*-[a-z]*D/i, why: "git branch -D force-deletes a branch." },
  { id: "git-update-ref-d", severity: "warn", re: /\bgit\s+update-ref\s+-d\b/i, why: "git update-ref -d deletes a ref directly." },

  // ── Database (cross-platform) ─────────────────────────────────────────────
  { id: "db-drop-database", severity: "deny", re: /\bdrop\s+(database|schema)\b/i, why: "DROP DATABASE/SCHEMA destroys the whole schema." },
  { id: "db-drop-table", severity: "warn", re: /\bdrop\s+table\b/i, why: "DROP TABLE is legitimate in migrations; warn only." },
  { id: "db-truncate", severity: "warn", re: /\btruncate(\s+table)?\s+\w+/i, why: "TRUNCATE removes all rows." },
  { id: "db-delete-no-where", severity: "warn", re: /\bdelete\s+from\s+\w+\s*;/i, why: "DELETE FROM without WHERE deletes every row." },

  // ── System power (cross-platform) ─────────────────────────────────────────
  { id: "sys-shutdown", severity: "ask", re: /\b(shutdown|poweroff)\b/i, why: "shutdown stops the machine." },
  { id: "sys-reboot", severity: "ask", re: /\b(reboot|restart-computer)\b/i, why: "reboot restarts the machine." },
  { id: "sys-halt", severity: "ask", re: /\b(halt|stop-computer)\b/i, why: "halt/Stop-Computer powers off the machine." },
]

// Routine commands that must never trip the guard even if a rule substring
// appears (e.g. `git clean` inside a scratch dir is still warned, but reading
// `format.md` or `del` inside a variable name should not fire).
const ALLOWLIST = [
  /\bformat-(check|string|date)\b/i, // e.g. format-date, format-string (not the drive formatter)
  /\bdel(ete)?-?\w+/i, // identifiers like deleteFile, del-item-helper
  /\bgit\s+clean\b[^\n]*--dry-run/i, // dry run is safe
]

// ────────────────────────────────────────────────────────────────────────────
// Shell-aware unwrapping: collapse wrappers so the real command is inspected.
// ────────────────────────────────────────────────────────────────────────────

function stripOuterQuotes(s) {
  const t = s.trim()
  if (t.length >= 2) {
    const a = t[0]
    const b = t[t.length - 1]
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) return t.slice(1, -1).trim()
  }
  return t
}

function unwrap(command) {
  let cmd = String(command || "").trim()
  // Unwrap at most a few layers to avoid pathological input.
  for (let i = 0; i < 5; i++) {
    const before = cmd
    // sudo / doas
    cmd = cmd.replace(/^(sudo|doas)\s+/i, "")
    // env VAR=... VAR=...
    cmd = cmd.replace(/^env(\s+\w+=\S+)*\s+/i, "")
    // sh -c "..." / bash -c '...' / zsh -c ...
    let m = cmd.match(/^(?:sh|bash|zsh|dash)\s+-c\s+([\s\S]+)$/i)
    if (m) cmd = stripOuterQuotes(m[1])
    // cmd /c ... / cmd.exe /c ...
    m = cmd.match(/^cmd(?:\.exe)?\s+\/c\s+([\s\S]+)$/i)
    if (m) cmd = stripOuterQuotes(m[1])
    // powershell/pwsh -Command "..." / -c "..."
    m = cmd.match(/^(?:powershell|pwsh)(?:\.exe)?\s+-(?:command|c)\s+([\s\S]+)$/i)
    if (m) cmd = stripOuterQuotes(m[1])
    if (cmd === before) break
  }
  return cmd
}

function isAllowlisted(command) {
  return ALLOWLIST.some((re) => re.test(command))
}

/**
 * Classify a raw command string. Returns
 *   { severity: "allow"|"warn"|"ask"|"deny", rule: {id,why}|null, command }
 * Matching runs on both the raw command and the unwrapped command so an
 * obfuscated wrapper cannot hide the operation.
 */
function classify(rawCommand) {
  const raw = String(rawCommand || "")
  if (!raw.trim()) return { severity: "allow", rule: null, command: "" }
  const unwrapped = unwrap(raw)
  if (isAllowlisted(unwrapped) || isAllowlisted(raw)) {
    return { severity: "allow", rule: null, command: unwrapped }
  }
  let best = null
  for (const r of RULES) {
    if (r.re.test(unwrapped) || r.re.test(raw)) {
      if (!best || rank(r.severity) > rank(best.severity)) best = r
    }
  }
  return { severity: best ? best.severity : "allow", rule: best, command: unwrapped }
}

function rank(sev) {
  return sev === "deny" ? 3 : sev === "ask" ? 2 : sev === "warn" ? 1 : 0
}

// ────────────────────────────────────────────────────────────────────────────
// Runtime
// ────────────────────────────────────────────────────────────────────────────

function gateMode() {
  const m = String(process.env.GATEGUARD_MODE || "warn").toLowerCase()
  if (m === "off" || m === "block" || m === "warn") return m
  return "warn"
}

function redact(target) {
  let s = String(target || "")
  s = s.replace(/(--?(?:token|password|passwd|secret|api[-_]?key|auth)[=\s:]+)\S+/gi, "$1<redacted>")
  s = s.replace(/((?:TOKEN|PASSWORD|SECRET|API[_-]?KEY|AUTH)[A-Z_]*=)\S+/g, "$1<redacted>")
  s = s.replace(/(Authorization:\s*Bearer\s+)\S+/gi, "$1<redacted>")
  if (s.length > 500) s = s.slice(0, 500) + "...[truncated]"
  return s
}

function logEvent(severity, rule, target) {
  try {
    const dir = path.join(process.cwd(), ".opencode", "logs")
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(
      path.join(dir, "gateguard.log"),
      "[" + new Date().toISOString() + "] [" + severity + "] [" + rule.id + "] " + redact(target) + "\n",
      "utf8"
    )
  } catch {
    /* never crash over a log write */
  }
}

function commandFromArgs(args) {
  if (!args || typeof args !== "object") return undefined
  if (typeof args.command === "string") return args.command
  // Some shells pass an argv array instead of a string.
  if (Array.isArray(args.command)) return args.command.join(" ")
  return undefined
}

async function gateGuard(input, output) {
  const mode = gateMode()
  if (mode === "off") return
  if (!input || input.tool !== "bash") return
  const command = commandFromArgs(output && output.args)
  if (!command) return

  const res = classify(command)
  if (res.severity === "allow" || !res.rule) return

  const label = "[gateguard:" + res.rule.id + "]"

  if (res.severity === "deny" && mode === "block") {
    logEvent("deny", res.rule, command)
    throw new Error(
      label + " blocked '" + input.tool + "' call. " + res.rule.why + " " +
        "GateGuard is in block mode (GATEGUARD_MODE=block). If the operation is " +
        "intentional, the user must run it outside the agent or set " +
        "GATEGUARD_MODE=warn."
    )
  }

  const sev = res.severity === "deny" ? "warn" : res.severity
  logEvent(sev, res.rule, command)
  console.warn(
    label + " " + res.severity + " ('" + input.tool + "'): " + res.rule.why +
      " Logged to .opencode/logs/gateguard.log." +
      (res.severity === "deny" && mode === "warn" ? " (set GATEGUARD_MODE=block to enforce.)" : "")
  )
}

module.exports = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      try {
        await gateGuard(input, output)
      } catch (err) {
        // A deny in block mode must propagate (that is the whole point);
        // any other error must never crash the session.
        if (err && /^\[gateguard:/.test(err.message || "")) throw err
      }
    },
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Self-test — `node .opencode/plugins/gateguard.js --selftest`
// ────────────────────────────────────────────────────────────────────────────

function runSelfTest() {
  const cases = [
    // POSIX (expect detect)
    ["rm -rf /", true],
    ["sudo rm -rf ~", true],
    ["git push --force origin main", true],
    ["git reset --hard HEAD~3", true],
    ["sh -c \"rm -rf /\"", true],
    ["DROP DATABASE prod;", true],
    ["dd if=/dev/zero of=/dev/sda", true],
    ["mkfs.ext4 /dev/sdb1", true],
    // Windows (expect detect)
    ["del /s /q C:\\Users", true],
    ["Remove-Item -Recurse -Force C:\\Temp", true],
    ["rmdir /s /q C:\\data", true],
    ["format C:", true],
    ["diskpart", true],
    ["powershell -Command \"Remove-Item -Recurse -Force C:\\\"", true],
    ["cmd /c del /s /q C:\\temp", true],
    ["Stop-Computer", true],
    // Benign (expect no detect)
    ["ls -la", false],
    ["git status", false],
    ["npm run build", false],
    ["git clean -fd --dry-run", false],
    ["echo format-date", false],
  ]
  let pass = 0
  const fails = []
  for (const [cmd, shouldDetect] of cases) {
    const r = classify(cmd)
    const detected = r.severity !== "allow"
    if (detected === shouldDetect) pass++
    else fails.push(cmd + " -> " + r.severity + " (expected " + (shouldDetect ? "detect" : "allow") + ")")
  }
  console.log("gateguard self-test: " + pass + "/" + cases.length + " passed")
  if (fails.length) {
    for (const f of fails) console.log("  FAIL  " + f)
    process.exit(1)
  }
  process.exit(0)
}

if (require.main === module && process.argv.includes("--selftest")) {
  runSelfTest()
}
