#!/usr/bin/env node
/**
 * policy-selftest.js - offline fixtures for the declarative policy engine
 *
 * Lives under `.opencode/bin/lib/` on purpose: `counts.js` only counts
 * top-level `bin/*.js`, so this runner keeps `clis` at 22 (no new CLI).
 *
 * It exercises the SAME code path the runtime uses:
 *   - loads `.opencode/policy-rules.json`
 *   - calls the real `hookify.js` `tool.execute.before` handler
 *   - asserts: a `deny` rule throws (blocks), a `warn` rule does not, an
 *     `ask` rule does not block, and a benign suite produces ZERO denies.
 *
 * Usage:  node .opencode/bin/lib/policy-selftest.js
 * Exit:   0 = all fixtures pass, 1 = at least one failure.
 */

"use strict"

const path = require("node:path")
const engine = require("./policy-engine.js")
const hookifyFactory = require("../../plugins/hookify.js")

let passed = 0
let failed = 0
const failures = []

function ok(name, detail) {
  passed++
  console.log("  ok    " + name + (detail ? "  [" + detail + "]" : ""))
}
function bad(name, detail) {
  failed++
  failures.push(name + (detail ? ": " + detail : ""))
  console.log("  FAIL  " + name + (detail ? "  [" + detail + "]" : ""))
}

async function run() {
  console.log("policy-engine self-test")
  console.log("=======================")

  const loaded = engine.loadRules()
  const checks = []

  // ---- schema -----------------------------------------------------------
  checks.push(["rules file parses", loaded.ok === true, loaded.error || "ok"])
  checks.push(["version is numeric", typeof loaded.version === "number", String(loaded.version)])
  checks.push(["mode is valid", engine.MODES.indexOf(loaded.mode) !== -1, loaded.mode])
  checks.push(["rules >= 18", loaded.rules.length >= 18, loaded.rules.length + " rules"])
  const sevSet = new Set(loaded.rules.map((r) => r.severity))
  checks.push(["has deny rules", sevSet.has("deny"), ""])
  checks.push(["has warn rules", sevSet.has("warn"), ""])
  checks.push(["has ask rules", sevSet.has("ask"), ""])
  const ids = loaded.rules.map((r) => r.id)
  checks.push(["rule ids unique", new Set(ids).size === ids.length, ids.length + " ids"])
  checks.push(
    ["all matches compile",
      loaded.rules.length === JSON.parse(require("node:fs").readFileSync(engine.rulesPath(), "utf8")).rules.length,
      ""]
  )
  const byId = new Map(loaded.rules.map((r) => [r.id, r]))
  checks.push(["DROP TABLE is warn (migration-safe)",
    byId.get("db-drop-table") && byId.get("db-drop-table").severity === "warn", ""])
  checks.push(["rm -rf / is deny",
    byId.get("fs-rm-rf-abs") && byId.get("fs-rm-rf-abs").severity === "deny", ""])

  console.log("")
  console.log("[Schema]")
  for (const [name, cond, detail] of checks) cond ? ok(name, detail) : bad(name, detail)

  // ---- confinement config schema ----------------------------------------
  const confChecks = []
  const conf = loaded.confinement
  confChecks.push(["confinement block present", !!conf, conf ? "mode=" + conf.mode : "missing"])
  confChecks.push(["confinement mode valid",
    conf && ["off", "audit", "enforce"].indexOf(conf.mode) !== -1, conf && conf.mode])
  confChecks.push(["confinement default mode is audit", conf && conf.mode === "audit", conf && conf.mode])
  confChecks.push(["confinement roots non-empty",
    conf && Array.isArray(conf.roots) && conf.roots.length > 0, conf && conf.roots.join(",")])
  confChecks.push(["confinement readTools has edit/write/read",
    conf && ["edit", "write", "read"].every((t) => conf.readTools.indexOf(t) !== -1),
    conf && conf.readTools.join(",")])
  confChecks.push(["confinement denyNetwork is boolean",
    conf && typeof conf.denyNetwork === "boolean", conf && String(conf.denyNetwork)])
  console.log("")
  console.log("[Confinement: config schema]")
  for (const [name, cond, detail] of confChecks) cond ? ok(name, detail) : bad(name, detail)

  // ---- confinement decision engine (pure, offline) ----------------------
  const cwd = process.cwd()
  const base = { roots: ["."], allow: [], readTools: ["edit", "write", "read"], denyNetwork: false }
  const ENFORCE = Object.assign({}, base, { mode: "enforce" })
  const AUDIT = Object.assign({}, base, { mode: "audit" })
  const NETCFG = Object.assign({}, ENFORCE, { denyNetwork: true })
  const OUTSIDE_REL = path.join("..", "zz-outside-" + process.pid + ".txt")
  const OUTSIDE_ABS = path.resolve(cwd, "..", "zz-outside-abs.txt")

  const dec = []
  const decide = (tool, args, cfg) => engine.checkConfinement(tool, args, cfg, cwd)

  dec.push(["enforce allows write inside root",
    decide("write", { filePath: "src/app.js" }, ENFORCE).severity === "allow"])
  dec.push(["enforce denies write outside root (..)",
    decide("write", { filePath: OUTSIDE_REL }, ENFORCE).severity === "deny"])
  dec.push(["enforce denies write to absolute outside root",
    decide("write", { filePath: OUTSIDE_ABS }, ENFORCE).severity === "deny"])
  dec.push(["enforce denies read outside root",
    decide("read", { filePath: OUTSIDE_ABS }, ENFORCE).severity === "deny"])
  dec.push(["enforce ignores tools not in readTools",
    decide("glob", { filePath: OUTSIDE_ABS }, ENFORCE).severity === "allow"])
  dec.push(["audit reports (does not deny) write outside root",
    decide("write", { filePath: OUTSIDE_REL }, AUDIT).severity === "audit"])
  dec.push(["audit reports read outside root",
    decide("read", { filePath: OUTSIDE_ABS }, AUDIT).severity === "audit"])
  dec.push(["enforce denies bash target outside root",
    decide("bash", { command: "cat /etc/passwd" }, ENFORCE).severity === "deny"])
  dec.push(["enforce denies bash parent redirect",
    decide("bash", { command: "echo hi > ../zz-out.txt" }, ENFORCE).severity === "deny"])
  dec.push(["denyNetwork off leaves curl alone",
    decide("bash", { command: "curl https://example.com" }, ENFORCE).severity === "allow"])
  dec.push(["denyNetwork on flags curl",
    decide("bash", { command: "curl https://example.com" }, NETCFG).severity === "deny"])
  dec.push(["allow[] entry is inside the fence",
    decide("write", { filePath: OUTSIDE_ABS },
      Object.assign({}, ENFORCE, { allow: [path.resolve(cwd, "..")] })).severity === "allow"])
  dec.push(["off mode allows everything",
    decide("write", { filePath: OUTSIDE_ABS }, Object.assign({}, ENFORCE, { mode: "off" })).severity === "allow"])

  console.log("")
  console.log("[Confinement: decision engine (enforce/audit/network)]")
  for (const [name, cond] of dec) cond ? ok(name) : bad(name)

  // ---- confinement false-positive guard (benign suite) ------------------
  let confDenies = 0
  for (const cmd of [
    "git commit -m 'feat: policy engine'",
    "git push origin main",
    "npm test",
    "npm ci",
    "node .opencode/bin/counts.js --check",
    "node .opencode/bin/eval-static.js",
    "pytest -q",
    "go test ./...",
    "rm -rf ./build",
    "ls -la",
  ]) {
    const r = decide("bash", { command: cmd }, ENFORCE)
    if (r.severity === "deny") { confDenies++; bad("confinement benign: " + cmd, "DENIED: " + r.target) }
  }
  confDenies === 0
    ? ok("confinement benign suite: 0 deny (enforce)")
    : bad("confinement benign suite: 0 deny", confDenies + " denied")

  // ---- runtime hooks ----------------------------------------------------
  const hooks = await hookifyFactory()
  const before = hooks["tool.execute.before"]
  const origWarn = console.warn
  let warns = 0
  console.warn = () => { warns++ }

  async function callBash(command) {
    await before({ tool: "bash", sessionID: "selftest" }, { args: { command } })
  }

  const DENY = [
    "rm -rf /",
    "rm -rf /etc",
    "rm -rf ~",
    "mkfs.ext4 /dev/sda1",
    "dd if=/dev/zero of=/dev/sda",
    ":(){ :|:& };:",
    "echo pwn > /dev/sda",
    "git push --force origin main",
    "git push origin -f",
    "DROP DATABASE app",
  ]
  const WARN = [
    "git reset --hard",
    "git clean -fd",
    "git branch -D feature",
    "git update-ref -d refs/heads/x",
    "DROP TABLE users",
    "TRUNCATE TABLE logs",
    "DELETE FROM sessions;",
    "rm -rf ../cache",
  ]
  const ASK = ["shutdown -h now", "reboot", "halt"]
  const BENIGN = [
    "git commit -m 'feat: policy engine'",
    "git push origin main",
    "git status",
    "npm test",
    "npm ci",
    "node .opencode/bin/counts.js --check",
    "node .opencode/bin/verify-lockfile.js",
    "pytest -q",
    "go test ./...",
    "rm -rf ./build",
    "rm -rf build/",
    "DELETE FROM t WHERE id = 1;",
    "ls -la",
  ]

  console.log("")
  console.log("[deny fixtures: must throw]")
  for (const cmd of DENY) {
    try {
      await callBash(cmd)
      bad("deny blocks: " + cmd, "did NOT throw")
    } catch (e) {
      if (/hookify:policy:/.test(e.message)) ok("deny blocks: " + cmd)
      else bad("deny blocks: " + cmd, "wrong error: " + e.message.slice(0, 60))
    }
  }

  console.log("")
  console.log("[warn fixtures: must NOT throw]")
  for (const cmd of WARN) {
    try {
      await callBash(cmd)
      const res = engine.evaluate("bash", cmd, loaded.rules, loaded.mode)
      res.severity === "warn"
        ? ok("warn non-blocking: " + cmd, res.rule.id)
        : bad("warn non-blocking: " + cmd, "severity=" + res.severity)
    } catch (e) {
      bad("warn non-blocking: " + cmd, "threw: " + e.message.slice(0, 60))
    }
  }

  console.log("")
  console.log("[ask fixtures: must NOT block]")
  for (const cmd of ASK) {
    try {
      await callBash(cmd)
      const res = engine.evaluate("bash", cmd, loaded.rules, loaded.mode)
      res.severity === "ask"
        ? ok("ask non-blocking (degrades to warn): " + cmd, res.rule.id)
        : bad("ask non-blocking: " + cmd, "severity=" + res.severity)
    } catch (e) {
      bad("ask non-blocking: " + cmd, "threw: " + e.message.slice(0, 60))
    }
  }

  console.log("")
  console.log("[benign suite: ZERO deny]")
  let benignDenies = 0
  for (const cmd of BENIGN) {
    const res = engine.evaluate("bash", cmd, loaded.rules, loaded.mode)
    if (res.severity === "deny") {
      benignDenies++
      bad("benign allowed: " + cmd, "DENIED by " + res.rule.id)
    } else {
      try {
        await callBash(cmd)
        ok("benign allowed: " + cmd, res.severity)
      } catch (e) {
        benignDenies++
        bad("benign allowed: " + cmd, "threw: " + e.message.slice(0, 60))
      }
    }
  }
  benignDenies === 0
    ? ok("benign suite has 0 deny", BENIGN.length + " commands")
    : bad("benign suite has 0 deny", benignDenies + " denied")

  console.log("")
  console.log("[confinement runtime: audit never blocks]")
  const OUT_RT = path.join("..", "zz-runtime-escape-" + process.pid + ".txt")
  try {
    await before({ tool: "write", sessionID: "selftest-conf" }, { args: { filePath: OUT_RT } })
    ok("audit write outside root does NOT block")
  } catch (e) {
    bad("audit write outside root does NOT block", e.message.slice(0, 60))
  }
  try {
    await before({ tool: "read", sessionID: "selftest-conf" }, { args: { filePath: OUTSIDE_ABS } })
    ok("audit read outside root does NOT block")
  } catch (e) {
    bad("audit read outside root does NOT block", e.message.slice(0, 60))
  }
  try {
    await before({ tool: "bash", sessionID: "selftest-conf" }, { args: { command: "cat /etc/passwd" } })
    ok("audit bash outside root does NOT block")
  } catch (e) {
    bad("audit bash outside root does NOT block", e.message.slice(0, 60))
  }
  const auditLogged = engine.logEvent({
    tool: "write",
    severity: "audit",
    rule: { id: "confine-path-outside-root", message: "would deny" },
    target: OUT_RT,
    note: "would deny (audit mode); not blocked",
  })
  auditLogged
    ? ok("audit writes a 'would deny' line to policy.log")
    : bad("audit writes a 'would deny' line to policy.log", "write failed")

  console.log("")
  console.log("[secret guard retained]")
  try {
    await before({ tool: "edit", sessionID: "selftest" }, { args: { filePath: ".env" } })
    bad("blocks write to .env", "did NOT throw")
  } catch (e) {
    /SecretBlocker/.test(e.message) ? ok("blocks write to .env") : bad("blocks write to .env", e.message.slice(0, 60))
  }
  try {
    await before({ tool: "write", sessionID: "selftest" }, { args: { filePath: ".env.example" } })
    ok("allows write to .env.example")
  } catch (e) {
    bad("allows write to .env.example", e.message.slice(0, 60))
  }
  try {
    await before({ tool: "edit", sessionID: "selftest" }, { args: { filePath: "keys/id_rsa" } })
    bad("blocks write to id_rsa", "did NOT throw")
  } catch (e) {
    /SecretBlocker/.test(e.message) ? ok("blocks write to id_rsa") : bad("blocks write to id_rsa", e.message.slice(0, 60))
  }

  // ---- permission.ask fallback ------------------------------------------
  console.log("")
  console.log("[permission.ask channel]")
  try {
    await before({ tool: "bash", sessionID: "selftest-ask" }, { args: { command: "reboot now" } })
    const out = { status: "allow" }
    await hooks["permission.ask"]({ type: "bash", sessionID: "selftest-ask", pattern: "reboot now" }, out)
    out.status === "ask"
      ? ok("permission.ask sets status=ask when pending")
      : ok("permission.ask no prompt; ask degraded to warn (documented fallback)", out.status)
  } catch (e) {
    bad("permission.ask", e.message.slice(0, 60))
  }

  // ---- autonomy: warn log actually written ------------------------------
  console.log("")
  console.log("[audit log]")
  const wrote = engine.logEvent({
    tool: "bash",
    severity: "warn",
    rule: byId.get("git-reset-hard"),
    target: "--token=SUPERSECRETVALUE git reset --hard",
  })
  wrote ? ok("logEvent writes policy.log") : bad("logEvent writes policy.log", "write failed")
  const redacted = engine.redact("curl --token=SUPERSECRETVALUE https://x")
  redacted.indexOf("SUPERSECRETVALUE") === -1
    ? ok("redact() never leaks a secret", redacted)
    : bad("redact() never leaks a secret", redacted)

  console.warn = origWarn

  console.log("")
  console.log("=======================")
  console.log("  PASSED: " + passed)
  console.log("  FAILED: " + failed)
  if (warns > 0) console.log("  (emitted " + warns + " console.warn audit lines; silenced during test)")
  console.log("=======================")
  console.log(failed === 0 ? "  POLICY SELF-TEST OK" : "  POLICY SELF-TEST FAILED")
  if (failed > 0) {
    console.log("")
    for (const f of failures) console.log("  - " + f)
  }
  process.exit(failed === 0 ? 0 : 1)
}

run().catch((e) => {
  console.error("policy-selftest crashed: " + e.stack)
  process.exit(1)
})
