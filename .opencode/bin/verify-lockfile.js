#!/usr/bin/env node
/**
 * verify-lockfile.js — integrity check for skills + agents
 *
 * Pins a sha256 of every SKILL.md and every agent .md in skills-lock.json
 * (schema v2) and detects drift (accidental edits, manual tweaks, tampering).
 *
 * Hashes are computed over LF-normalized UTF-8 content, so a CRLF checkout on
 * Windows does NOT produce false drift versus an LF checkout. Real content
 * changes are always detected.
 *
 * Usage:
 *   node .opencode/bin/verify-lockfile.js            # check (exit 0 clean / 1 drift)
 *   node .opencode/bin/verify-lockfile.js --json      # JSON drift report
 *   node .opencode/bin/verify-lockfile.js --fix       # re-pin hashes (update lockfile)
 *   node .opencode/bin/verify-lockfile.js --help
 *
 * Zero deps, CommonJS, Windows + POSIX.
 */

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { listCatalog, ROOT } = require("./lib/catalog.js")

const LOCKFILE = path.join(ROOT, "skills-lock.json")

function hashFile(absPath) {
  const content = fs.readFileSync(absPath, "utf8").replace(/\r\n?/g, "\n")
  return crypto.createHash("sha256").update(content, "utf8").digest("hex")
}

function readLock() {
  try {
    return JSON.parse(fs.readFileSync(LOCKFILE, "utf8"))
  } catch {
    return null
  }
}

// v1 entries carried source/sourceType/skillPath/computedHash — keep them.
function provenanceMap(lock) {
  const prov = {}
  if (!lock || !lock.skills) return prov
  for (const [name, entry] of Object.entries(lock.skills)) {
    if (!entry || typeof entry !== "object") continue
    const keep = {}
    for (const k of ["source", "sourceType", "skillPath", "sourceUrl", "wellKnownDigest"]) {
      if (entry[k] !== undefined) keep[k] = entry[k]
    }
    if (Object.keys(keep).length > 0) prov[name] = keep
  }
  return prov
}

function computeEntries() {
  const cat = listCatalog()
  const skills = {}
  const agents = {}
  for (const s of cat.skills) {
    skills[s.name] = { path: s.path, sha256: hashFile(path.join(ROOT, s.path)) }
  }
  for (const a of cat.agents) {
    agents[a.name] = { path: a.path, sha256: hashFile(path.join(ROOT, a.path)) }
  }
  return { skills, agents }
}

function findDrift(lock, computed) {
  const drift = []
  if (!lock || !lock.skills || !lock.agents || lock.version !== 2) {
    drift.push({ type: "lockfile", path: "skills-lock.json", detail: "missing or not v2 (run --fix)" })
    return drift
  }
  for (const group of ["skills", "agents"]) {
    const want = lock[group] || {}
    const have = computed[group] || {}
    for (const [name, entry] of Object.entries(want)) {
      const cur = have[name]
      if (!cur) {
        drift.push({ type: "missing", group, name, path: entry.path, expected: entry.sha256 })
      } else if (cur.sha256 !== entry.sha256) {
        drift.push({ type: "changed", group, name, path: cur.path, expected: entry.sha256, actual: cur.sha256 })
      }
    }
    for (const [name, cur] of Object.entries(have)) {
      if (!want[name]) {
        drift.push({ type: "new", group, name, path: cur.path, actual: cur.sha256 })
      }
    }
  }
  drift.sort((a, b) => (a.path || "").localeCompare(b.path || ""))
  return drift
}

function fix(computed, prov) {
  const skills = {}
  for (const [name, e] of Object.entries(computed.skills)) {
    skills[name] = { path: e.path, sha256: e.sha256, ...(prov[name] || {}) }
  }
  const agents = {}
  for (const [name, e] of Object.entries(computed.agents)) {
    agents[name] = { path: e.path, sha256: e.sha256 }
  }
  const out = {
    version: 2,
    generated: new Date().toISOString(),
    skills,
    agents,
  }
  fs.writeFileSync(LOCKFILE, JSON.stringify(out, null, 2) + "\n", "utf8")
  return { skills: Object.keys(skills).length, agents: Object.keys(agents).length }
}

function main() {
  const args = process.argv.slice(2)
  const asJson = args.includes("--json")
  const doFix = args.includes("--fix")

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
  verify-lockfile.js — skills+agents integrity check

  Usage:
    verify-lockfile.js            Check (exit 0 clean, 1 drift)
    verify-lockfile.js --json     Machine-readable drift report
    verify-lockfile.js --fix      Re-pin hashes in skills-lock.json
    verify-lockfile.js --help

  After an intentional edit: node .opencode/bin/verify-lockfile.js --fix
`)
    return
  }

  const computed = computeEntries()

  if (doFix) {
    const prov = provenanceMap(readLock())
    const counts = fix(computed, prov)
    console.log(
      `verify-lockfile: re-pinned ${counts.skills} skills + ${counts.agents} agents -> skills-lock.json`
    )
    return
  }

  const lock = readLock()
  const drift = findDrift(lock, computed)
  const ok = drift.length === 0

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          ok,
          counts: {
            skills: Object.keys(computed.skills).length,
            agents: Object.keys(computed.agents).length,
          },
          drift,
        },
        null,
        2
      ) + "\n"
    )
    process.exit(ok ? 0 : 1)
  }

  console.log(
    `verify-lockfile: ${Object.keys(computed.skills).length} skills, ${Object.keys(computed.agents).length} agents`
  )
  if (ok) {
    console.log("CLEAN — lockfile matches the working tree.")
    process.exit(0)
  }
  console.log(`\nDRIFT DETECTED (${drift.length}):`)
  for (const d of drift) {
    if (d.type === "changed") {
      console.log(`  [changed] ${d.path}`)
      console.log(`            expected=${d.expected}`)
      console.log(`            actual  =${d.actual}`)
    } else if (d.type === "new") {
      console.log(`  [new]     ${d.path}  (not in lockfile; run --fix)`)
    } else if (d.type === "missing") {
      console.log(`  [missing] ${d.path}  (in lockfile, absent on disk)`)
    } else {
      console.log(`  [${d.type}] ${d.path}  ${d.detail || ""}`)
    }
  }
  console.log("\nIntentional change? Re-pin: node .opencode/bin/verify-lockfile.js --fix")
  process.exit(1)
}

main()
