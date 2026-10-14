// .opencode/plugins/deps-guard.js
//
// Startup dependency guard.
//
// PROBLEM IT SOLVES
//   The pack declares npm deps in .opencode/package.json and ships custom
//   tools (.opencode/tools/*.ts) that `import ... from "@opencode-ai/plugin"`.
//   `.opencode/node_modules` is gitignored, so a fresh clone/copy has no deps.
//   Some opencode builds (e.g. the desktop's embedded 1.19.0) then fail at
//   prompt time with ERR_MODULE_NOT_FOUND and the UI shows NOTHING — the user
//   sees "the chat does not respond" with no error. opencode's own background
//   dependency install can also fail silently.
//
// WHAT IT DOES
//   On load — module top-level, so it runs on ANY opencode version that imports
//   the file — it checks that every declared dependency is present under
//   node_modules/. If any is missing it kicks off `bin/install-plugins.js`
//   DETACHED (non-blocking) and logs loudly. It never blocks startup and never
//   crashes the session. Once the install finishes, the next open is healthy.
//
// DUAL PLUGIN API
//   Exported as an object with BOTH `server()` (opencode v1, e.g. desktop
//   1.19.0) and `setup()` (opencode v2, e.g. CLI 2.0.29). The check is a
//   top-level side effect, so it runs regardless of which API the host uses.

const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const PKG = path.join(ROOT, "package.json")
const NODE_MODULES = path.join(ROOT, "node_modules")
const INSTALLER = path.join(ROOT, "bin", "install-plugins.js")
const LOCK = path.join(ROOT, ".deps-guard.lock")
const LOCK_TTL_MS = 10 * 60 * 1000

function declaredDeps() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"))
    return Object.keys(pkg.dependencies || {})
  } catch {
    return []
  }
}

function isPresent(dep) {
  return fs.existsSync(path.join(NODE_MODULES, dep, "package.json"))
}

function recentlyHealed() {
  try {
    const ts = Number(fs.readFileSync(LOCK, "utf8"))
    return Number.isFinite(ts) && Date.now() - ts < LOCK_TTL_MS
  } catch {
    return false
  }
}

function guard() {
  const deps = declaredDeps()
  if (deps.length === 0) return

  const missing = deps.filter((d) => !isPresent(d))
  if (missing.length === 0) return
  if (recentlyHealed()) return

  try {
    fs.writeFileSync(LOCK, String(Date.now()))
  } catch {
    // Best effort: if the lock cannot be written, still attempt one heal.
  }

  console.error(
    "[deps-guard] .opencode/node_modules is missing " +
      missing.length +
      " declared dependency(ies): " +
      missing.join(", ")
  )
  console.error(
    "[deps-guard] self-healing in the background via bin/install-plugins.js. " +
      "Custom tools may fail until it finishes — restart opencode afterwards."
  )

  try {
    const child = spawn(process.execPath, [INSTALLER], {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
    })
    child.on("error", () => {})
    child.unref()
  } catch (err) {
    console.error(
      "[deps-guard] could not start the installer (" +
        (err && err.message ? err.message : err) +
        "). Run manually: cd " +
        ROOT +
        " && npm install"
    )
  }
}

try {
  guard()
} catch {
  // Never let the guard crash plugin loading.
}

const hooks = () => ({})

const plugin = {
  id: "deps-guard",
  setup: async () => hooks(),
}

plugin.server = plugin.setup
module.exports = plugin
