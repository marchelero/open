#!/usr/bin/env node
/**
 * measure-tokens.js — honest token estimate of the opencode pack
 *
 * Zero deps, Node 18+ stdlib only. CommonJS.
 *
 * Reports THREE components plus a total (not just a boot number vs a magic
 * constant):
 *   boot     = AGENTS.md + 400/MCP + plugins      (always loaded at boot)
 *   catalog  = frontmatter `description` bytes of every skill + agent
 *              (feeds the system prompt's skill/agent catalog)
 *   router   = `.agents/skills/router/SKILL.md`    (loaded on every dispatch)
 *
 * Baseline is measured from a git ref (default `HEAD`), NOT a hardcoded
 * constant. `--baseline=none` skips it. If git is unavailable a documented
 * emergency snapshot is used for the greeting scenario only.
 *
 * Usage:
 *   node .opencode/bin/measure-tokens.js
 *   node .opencode/bin/measure-tokens.js --json
 *   node .opencode/bin/measure-tokens.js --cap=2000
 *   node .opencode/bin/measure-tokens.js --baseline=HEAD~1
 *   node .opencode/bin/measure-tokens.js --baseline=none
 *   node .opencode/bin/measure-tokens.js --scenario=greeting
 */

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const {
  listCatalog,
  parseFrontmatter,
  estimateTokens,
  bytesPerToken,
} = require("./lib/catalog.js")

const ROOT = process.cwd()
const BYTES_PER_TOKEN = bytesPerToken // 4

const TOKENS_PER_MCP = 400
const DEFAULT_CAP = 2000
const DEFAULT_BASELINE_REF = "HEAD"

const AGENTS_MD = ".opencode/AGENTS.md"
const OPENCODE_JSON = "opencode.json"
const VIBEGUARD_CFG = ".opencode/vibeguard.config.json"
const DCP_CFG = ".opencode/dcp.json"
const ROUTER_MD = ".agents/skills/router/SKILL.md"

// Emergency snapshot used ONLY when git is unavailable (no repo / no commits).
// Documented historical pre-change state from PRD
// 2026-08-12-optimize-pack-token-consumption. Boot-only.
const EMERGENCY_BASELINE_BOOT =
  estimateTokens(7192) + 2 * TOKENS_PER_MCP + (150 + 150 + 50) // ~2948

// ------------------------------------------------------------------ helpers

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch {
    return null
  }
}

function fileBytes(p) {
  try {
    return fs.statSync(p).size
  } catch {
    return 0
  }
}

function byteLen(s) {
  return s ? Buffer.byteLength(s, "utf8") : 0
}

function git(args, { input } = {}) {
  const res = spawnSync("git", args, {
    cwd: ROOT,
    input,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  })
  if (res.error || res.status !== 0) return null
  return res.stdout
}

// ------------------------------------------------------------------ current

function fsComponents() {
  const opencode = readJsonSafe(path.join(ROOT, OPENCODE_JSON))
  const vibeguard = readJsonSafe(path.join(ROOT, VIBEGUARD_CFG))
  const dcp = readJsonSafe(path.join(ROOT, DCP_CFG))

  const mcpNames = opencode && opencode.mcp ? Object.keys(opencode.mcp) : []
  const plugins = opencode && Array.isArray(opencode.plugin) ? opencode.plugin : []
  const vibeguardOn = !!(vibeguard && vibeguard.enabled === true)
  const dcpManualMode = !!(dcp && dcp.manualMode && dcp.manualMode.enabled === true)

  const cat = listCatalog()
  let catalogDescBytes = 0
  for (const e of [...cat.skills, ...cat.agents]) {
    catalogDescBytes += byteLen(e.description)
  }

  return {
    agentsBytes: fileBytes(path.join(ROOT, AGENTS_MD)),
    mcpNames,
    mcpCount: mcpNames.length,
    plugins,
    vibeguardOn,
    dcpManualMode,
    catalogDescBytes,
    catalogCount: cat.skills.length + cat.agents.length,
    routerBytes: fileBytes(path.join(ROOT, ROUTER_MD)),
  }
}

function computeTokens(c) {
  const agentsTokens = estimateTokens(c.agentsBytes)
  const mcpTokens = c.mcpCount * TOKENS_PER_MCP
  const pluginTokens =
    (c.vibeguardOn ? 150 : 20) + (c.dcpManualMode ? 30 : 150) + 50
  const bootTokens = agentsTokens + mcpTokens + pluginTokens
  const catalogTokens = estimateTokens(c.catalogDescBytes)
  const routerTokens = estimateTokens(c.routerBytes)
  return {
    agentsTokens,
    mcpTokens,
    pluginTokens,
    bootTokens,
    catalogTokens,
    routerTokens,
    totalTokens: bootTokens + catalogTokens + routerTokens,
  }
}

// ------------------------------------------------------------------ baseline

function gitListTree(ref) {
  const out = git(["ls-tree", "-r", "--name-only", ref])
  if (out === null) return null
  return out.split(/\r?\n/).filter(Boolean)
}

// One `git cat-file --batch` process for every path (fast on Windows too).
function gitCatBatch(ref, paths) {
  if (paths.length === 0) return new Map()
  const input = paths.map((p) => `${ref}:${p}`).join("\n") + "\n"
  const res = spawnSync("git", ["cat-file", "--batch"], {
    cwd: ROOT,
    input,
    maxBuffer: 256 * 1024 * 1024,
  })
  if (res.error || res.status !== 0 || !res.stdout) return null
  const buf = res.stdout
  const map = new Map()
  let i = 0
  let idx = 0
  while (i < buf.length && idx < paths.length) {
    const nl = buf.indexOf(0x0a, i)
    if (nl === -1) break
    const header = buf.toString("utf8", i, nl)
    const parts = header.split(" ")
    if (parts.length < 3) {
      // "<path> missing"
      idx++
      i = nl + 1
      continue
    }
    const size = parseInt(parts[2], 10)
    const start = nl + 1
    const end = start + size
    if (!Number.isFinite(size) || end > buf.length) break
    map.set(paths[idx], buf.toString("utf8", start, end))
    i = end + 1 // skip the trailing LF
    idx++
  }
  return map
}

function gitComponents(ref) {
  const tree = gitListTree(ref)
  if (!tree) return null
  const skillPaths = tree.filter((p) =>
    /^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(p)
  )
  const agentPaths = tree.filter(
    (p) => /^\.opencode\/agents\/[^/]+\.md$/.test(p) && !p.endsWith("/INDEX.md")
  )
  const files = [
    AGENTS_MD,
    OPENCODE_JSON,
    VIBEGUARD_CFG,
    DCP_CFG,
    ROUTER_MD,
    ...skillPaths,
    ...agentPaths,
  ]
  const contents = gitCatBatch(ref, files)
  if (!contents) return null
  const get = (p) => (contents.has(p) ? contents.get(p) : null)

  let mcpCount = 0
  let plugins = []
  let vibeguardOn = false
  let dcpManualMode = false
  try {
    const o = JSON.parse(get(OPENCODE_JSON) || "{}")
    mcpCount = o.mcp ? Object.keys(o.mcp).length : 0
    plugins = Array.isArray(o.plugin) ? o.plugin : []
  } catch {}
  try {
    vibeguardOn = JSON.parse(get(VIBEGUARD_CFG) || "{}").enabled === true
  } catch {}
  try {
    const d = JSON.parse(get(DCP_CFG) || "{}")
    dcpManualMode = !!(d.manualMode && d.manualMode.enabled === true)
  } catch {}

  let catalogDescBytes = 0
  let catalogCount = 0
  for (const p of [...skillPaths, ...agentPaths]) {
    const c = get(p)
    if (!c) continue
    const fm = parseFrontmatter(c) || {}
    catalogDescBytes += byteLen((fm.description || "").trim())
    catalogCount++
  }

  const agentsContent = get(AGENTS_MD)
  const routerContent = get(ROUTER_MD)
  return {
    agentsBytes: byteLen(agentsContent),
    mcpNames: [],
    mcpCount,
    plugins,
    vibeguardOn,
    dcpManualMode,
    catalogDescBytes,
    catalogCount,
    routerBytes: byteLen(routerContent),
  }
}

// ------------------------------------------------------------------ report

function buildReport(curComp, baseComp, ref) {
  const current = computeTokens(curComp)
  const baseline = baseComp ? computeTokens(baseComp) : null
  const savingsPct = baseline
    ? Math.round(
        ((baseline.totalTokens - current.totalTokens) / baseline.totalTokens) * 100
      )
    : null
  return { current, baseline, savingsPct, baselineRef: ref }
}

function greetingReport(current, baseBootTokens, cap) {
  const userTokens = 2
  const minResponseTokens = 12
  const greetingTokens = current.bootTokens + userTokens + minResponseTokens
  const baselineGreeting = baseBootTokens + userTokens + minResponseTokens
  const savingsPct = Math.round(
    ((baselineGreeting - greetingTokens) / baselineGreeting) * 100
  )
  return {
    greetingTokens,
    baselineGreeting,
    savingsPct,
    userTokens,
    minResponseTokens,
    // Gate = absolute cap (PRD: "techo absoluto"), not a magic % vs a constant.
    pass: current.bootTokens <= cap,
  }
}

// ------------------------------------------------------------------ main

function main() {
  const args = process.argv.slice(2)
  const getArg = (name) =>
    args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1]
  const scenario = getArg("scenario") || "default"
  const cap = parseInt(getArg("cap") || String(DEFAULT_CAP), 10)
  const baselineRef = getArg("baseline") || DEFAULT_BASELINE_REF
  const asJson = args.includes("--json")

  // --- condensed catalog digest surface (same CLI, no new counted CLI) -----
  // `--digest`         regenerate .opencode/catalog-digest.json (derived cache)
  // `--digest --check` freshness gate (byte-exact, LF-normalized; exit 0/1)
  // `--catalog-report` descriptions ordered by length (+ totals)
  if (args.includes("--digest") || args.includes("--catalog-report")) {
    const digest = require("./lib/catalog-digest.js")
    if (args.includes("--catalog-report")) {
      const rep = digest.catalogReport()
      if (asJson) {
        process.stdout.write(JSON.stringify(rep, null, 2) + "\n")
      } else {
        process.stdout.write("catalog cost report (description bytes, longest first)\n")
        process.stdout.write("=========================================================\n")
        for (const r of rep.entries) {
          process.stdout.write(
            "  " + String(r.bytes).padStart(5) + " B  " + r.type.padEnd(5) + " " + r.name + "\n"
          )
        }
        process.stdout.write("\n")
        process.stdout.write(
          "  " + rep.count + " entries, " + rep.descriptionBytes + " B, ~" +
            rep.catalogTokens + " tok\n"
        )
      }
      process.exit(0)
    }
    if (args.includes("--check")) {
      const res = digest.checkDigest()
      if (asJson) {
        process.stdout.write(
          JSON.stringify(
            { ok: res.ok, path: path.relative(ROOT, res.path).split(path.sep).join("/") },
            null,
            2
          ) + "\n"
        )
      } else if (res.ok) {
        process.stdout.write("catalog-digest: FRESH (" + path.relative(ROOT, res.path).split(path.sep).join("/") + ")\n")
      } else {
        process.stdout.write("catalog-digest: STALE or missing — regenerate with `node .opencode/bin/measure-tokens.js --digest`\n")
      }
      process.exit(res.ok ? 0 : 1)
    }
    const res = digest.writeDigest()
    if (asJson) {
      process.stdout.write(
        JSON.stringify(
          { ok: true, path: path.relative(ROOT, res.path).split(path.sep).join("/"), count: res.count },
          null,
          2
        ) + "\n"
      )
    } else {
      process.stdout.write(
        "Wrote " + path.relative(ROOT, res.path).split(path.sep).join("/") + " (" + res.count + " entries)\n"
      )
    }
    process.exit(0)
  }

  const curComp = fsComponents()
  const useGit = baselineRef !== "none"
  const baseComp = useGit ? gitComponents(baselineRef) : null

  const rep = buildReport(curComp, baseComp, baseComp ? baselineRef : null)
  const bootStatus = rep.current.bootTokens <= cap ? "GREEN" : "RED"

  // Greeting needs a boot baseline for the informational reduction; fall back
  // to the emergency snapshot when git is unavailable.
  const baseBoot = rep.baseline
    ? rep.baseline.bootTokens
    : EMERGENCY_BASELINE_BOOT
  const greeting =
    scenario === "greeting" ? greetingReport(rep.current, baseBoot, cap) : null

  // Gate: absolute cap on boot (PRD "techo absoluto"). The greeting scenario
  // reports the reduction info, but its gate is the same absolute cap.
  const ok = bootStatus === "GREEN"

  if (asJson) {
    const out = {
      scenario,
      current: {
        agentsBytes: curComp.agentsBytes,
        agentsTokens: rep.current.agentsTokens,
        mcpNames: curComp.mcpNames,
        mcpCount: curComp.mcpCount,
        plugins: curComp.plugins,
        vibeguardOn: curComp.vibeguardOn,
        dcpManualMode: curComp.dcpManualMode,
        bootTokens: rep.current.bootTokens,
        catalogTokens: rep.current.catalogTokens,
        catalogCount: curComp.catalogCount,
        routerTokens: rep.current.routerTokens,
        totalTokens: rep.current.totalTokens,
      },
      baseline: rep.baseline
        ? {
            ref: rep.baselineRef,
            bootTokens: rep.baseline.bootTokens,
            catalogTokens: rep.baseline.catalogTokens,
            routerTokens: rep.baseline.routerTokens,
            totalTokens: rep.baseline.totalTokens,
          }
        : null,
      total: rep.current.totalTokens,
      savingsPct: rep.savingsPct,
      cap,
      bootStatus,
    }
    if (greeting) out.greeting = greeting
    process.stdout.write(JSON.stringify(out, null, 2) + "\n")
    process.exit(ok ? 0 : 1)
  }

  const line = (label, val) => `  ${label.padEnd(9)}: ${val}`
  console.log("openpack token measurement")
  console.log("=========================")
  console.log("")
  console.log("CURRENT")
  console.log(
    line("boot", `~${rep.current.bootTokens} tok  (AGENTS.md ${rep.current.agentsTokens} + MCP ${curComp.mcpCount}×400 + plugins ${rep.current.pluginTokens})`)
  )
  console.log(
    line("catalog", `~${rep.current.catalogTokens} tok  (${curComp.catalogCount} desc, ${curComp.catalogDescBytes} bytes)`)
  )
  console.log(line("router", `~${rep.current.routerTokens} tok`))
  console.log(line("TOTAL", `~${rep.current.totalTokens} tok`))
  console.log("")
  if (rep.baseline) {
    console.log(`BASELINE (git ${rep.baselineRef})`)
    console.log(line("boot", `~${rep.baseline.bootTokens} tok`))
    console.log(line("catalog", `~${rep.baseline.catalogTokens} tok`))
    console.log(line("router", `~${rep.baseline.routerTokens} tok`))
    console.log(line("TOTAL", `~${rep.baseline.totalTokens} tok`))
    console.log("")
    console.log(`SAVINGS: ${rep.savingsPct}% (TOTAL vs ${rep.baselineRef})`)
  } else {
    console.log("BASELINE: unavailable (git off or no commits; --baseline=none)")
  }
  console.log("")
  console.log(`BOOT vs cap ${cap}: ${bootStatus} (${rep.current.bootTokens} tok)`)
  console.log("")

  if (greeting) {
    console.log("SCENARIO greeting (first-turn cost: boot + user + minimal reply)")
    console.log(`  baseline       : ~${greeting.baselineGreeting} tok`)
    console.log(`  boot           : ~${rep.current.bootTokens} tok`)
    console.log(`  user "hola"    : ${greeting.userTokens} tok`)
    console.log(`  min response   : ${greeting.minResponseTokens} tok`)
    console.log(`  TOTAL          : ~${greeting.greetingTokens} tok`)
    console.log(`  reduction      : ${greeting.savingsPct}% (vs baseline, informational)`)
    console.log(`  gate           : boot <= cap ${cap} -> ${greeting.pass ? "PASS" : "FAIL"}`)
    console.log("")
  }

  process.exit(ok ? 0 : 1)
}

main()
