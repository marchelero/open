#!/usr/bin/env node
/**
 * setup-mcp.js — Optional MCP activation wizard
 *
 * Reads `.opencode/mcp.optional.json` (template of available opt-in MCPs),
 * asks the user which to enable, collects required secrets, and patches
 * `opencode.json` to make the chosen MCPs active. Reversible via
 * `setup-mcp.js disable <name>`.
 *
 * Zero deps. Node 18+ stdlib only.
 *
 * Usage:
 *   node .opencode/bin/setup-mcp.js                  Interactive wizard
 *   node .opencode/bin/setup-mcp.js --list           List available optional MCPs
 *   node .opencode/bin/setup-mcp.js activate <name>  Activate one (will prompt for secrets)
 *   node .opencode/bin/setup-mcp.js disable <name>   Remove from opencode.json
 *   node .opencode/bin/setup-mcp.js status           Show which optionals are currently active
 */

const fs = require("fs")
const path = require("path")
const readline = require("readline")
const crypto = require("crypto")

const ROOT = process.cwd()
const OPENCODE_JSON = path.join(ROOT, "opencode.json")
const OPTIONAL_TEMPLATE = path.join(ROOT, ".opencode", "mcp.optional.json")

// ---------- utilities ----------

function die(msg, code = 1) {
  console.error(`\n  error: ${msg}\n`)
  process.exit(code)
}

function loadJson(file, required = true) {
  if (!fs.existsSync(file)) {
    if (required) die(`file not found: ${file}`)
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (err) {
    die(`invalid JSON in ${file}: ${err.message}`)
  }
}

function saveJson(file, data) {
  // Detect existing indentation to preserve it (2 or 4 spaces, or tab)
  let indent = 2
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file, "utf8")
    const m = raw.match(/\n( +)"/) || raw.match(/\n(\t+)"/)
    if (m) {
      indent = m[1] === "\t" ? "\t" : m[1].length
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, indent) + "\n", "utf8")
}

function backup(file) {
  if (!fs.existsSync(file)) return null
  const ts = Date.now()
  const bak = `${file}.bak.${ts}`
  fs.copyFileSync(file, bak)
  return bak
}

function prompt(question, { silent = false, defaultValue = "" } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const def = defaultValue ? ` [${defaultValue}]` : ""
    const q = silent ? `${question}${def}: ` : `${question}${def}: `
    if (silent) {
      // mute output
      const stdin = process.openStdin()
      const mutedRl = readline.createInterface({ input: stdin, output: null })
      process.stdout.write(q)
      mutedRl.question("", (answer) => {
        mutedRl.close()
        rl.close()
        resolve(answer || defaultValue)
      })
      stdin.on("data", (char) => {
        const c = char + ""
        switch (c) {
          case "\n": case "\r": case "\u0004":
            process.stdout.write("\n")
            break
          default:
            process.stdout.write("*")
            break
        }
      })
    } else {
      rl.question(q, (answer) => {
        rl.close()
        resolve(answer || defaultValue)
      })
    }
  })
}

async function promptSecret(question) {
  return prompt(question, { silent: true })
}

// ---------- core ----------

function listOptionals(template) {
  return (template?.optional_mcps || []).map((m) => ({
    name: m.name,
    description: m.description,
    useWhen: m.use_when
  }))
}

function getMcpType(mcpDef, template) {
  return mcpDef.type || template?._meta?.defaults?.type || "local";
}

function categorize(mcpName, template) {
  const cats = template?._meta?.categories || {};
  for (const [cat, members] of Object.entries(cats)) {
    if (members.includes(mcpName)) return cat;
  }
  return "other";
}

function listActive(opencode) {
  const active = opencode?.mcp || {}
  return Object.keys(active).map((name) => ({
    name,
    command: active[name]?.command?.join(" ") || "(unknown)",
    type: active[name]?.type || "local"
  }))
}

function showList(template) {
  const optionals = listOptionals(template)
  if (optionals.length === 0) {
    console.log("\n  no optional MCPs defined in .opencode/mcp.optional.json\n")
    return
  }
  console.log("\n  Available optional MCPs:\n")
  // group by category for nicer UX
  const byCat = new Map()
  for (const m of optionals) {
    const cat = categorize(m.name, template)
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat).push(m)
  }
  for (const [cat, list] of byCat) {
    console.log(`  [${cat}]`)
    for (const m of list) {
      console.log(`    - ${m.name}`)
      console.log(`      ${m.description}`)
      console.log(`      Use when: ${m.useWhen}`)
    }
    console.log()
  }
  console.log("  Activate with: /setup-mcp <name>  (or `node .opencode/bin/setup-mcp.js activate <name>`)\n")
}

function showStatus(opencode, template) {
  const active = listActive(opencode)
  const optionals = listOptionals(template)
  console.log("\n  === MCP Status ===\n")
  console.log(`  Active MCPs (${active.length}):`)
  for (const a of active) {
    console.log(`    - ${a.name}  (${a.type})`)
  }
  console.log(`\n  Optional MCPs (${optionals.length}):`)
  // group by category
  const byCat = new Map()
  for (const o of optionals) {
    const cat = categorize(o.name, template)
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat).push(o)
  }
  for (const [cat, list] of byCat) {
    console.log(`  [${cat}]`)
    for (const o of list) {
      const isActive = active.some((a) => a.name === o.name)
      console.log(`    ${isActive ? "[x]" : "[ ]"}  ${o.name}`)
    }
  }
  console.log("")
}

async function activate(name, template, opencode) {
  const mcpDef = (template?.optional_mcps || []).find((m) => m.name === name)
  if (!mcpDef) {
    die(`unknown optional MCP: "${name}". Run \`/setup-mcp --list\` to see available.`)
  }

  // already active?
  if (opencode?.mcp?.[name]) {
    console.log(`\n  "${name}" is already active in opencode.json.`)
    const ans = await prompt('  Reconfigure? (y/n)', { defaultValue: "n" })
    if (ans.toLowerCase() !== "y") {
      console.log("  no changes made.\n")
      return
    }
  }

  console.log(`\n  Activating MCP: ${mcpDef.name}`)
  console.log(`  ${mcpDef.description}\n`)

  // collect env vars
  const env = {}
  for (const [key, spec] of Object.entries(mcpDef.env || {})) {
    const label = spec.secret ? `${key} (hidden)` : key
    const val = spec.secret
      ? await promptSecret(`  ${label}${spec.required ? "" : " (optional)"}`)
      : await prompt(`  ${label}${spec.required ? "" : " (optional)"}`, {
          defaultValue: spec.default || ""
        })
    if (val) env[key] = val
    else if (spec.required) die(`  ${key} is required. Aborting.`)
  }

  // resolve ${VAR} placeholders in command array
  const command = mcpDef.command.map((part) => {
    return part.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, v) => {
      if (!env[v]) die(`  command references \${${v}} but it was not provided.`)
      return env[v]
    })
  })

  // patch opencode.json
  const bak = backup(OPENCODE_JSON)
  if (!opencode.mcp) opencode.mcp = {}
  opencode.mcp[name] = {
    type: getMcpType(mcpDef, template),
    command,
    ...(Object.keys(env).length > 0 ? { env } : {})
  }

  // mark in the optional template that this one is active (for `--status`)
  if (template?._meta) template._meta[`_active_${name}`] = new Date().toISOString()
  // Persist both files
  saveJson(OPENCODE_JSON, opencode)
  saveJson(OPTIONAL_TEMPLATE, template)

  console.log(`\n  [ok] ${name} added to opencode.json`)
  if (bak) console.log(`  [ok] backup: ${path.basename(bak)}`)
  console.log(`\n  Restart opencode to activate: \`opencode .\`\n`)
}

async function disable(name, opencode, template) {
  if (!opencode?.mcp?.[name]) {
    console.log(`\n  "${name}" is not active. nothing to disable.\n`)
    return
  }
  // refuse to disable a default-active MCP (only opt-ins)
  const optionals = listOptionals(template).map((o) => o.name)
  if (!optionals.includes(name)) {
    die(`"${name}" is not an optional MCP. Edit opencode.json manually to remove default-active MCPs.`)
  }

  const bak = backup(OPENCODE_JSON)
  delete opencode.mcp[name]
  if (template?._meta) delete template._meta[`_active_${name}`]
  saveJson(OPENCODE_JSON, opencode)
  saveJson(OPTIONAL_TEMPLATE, template)

  console.log(`\n  [ok] ${name} removed from opencode.json`)
  if (bak) console.log(`  [ok] backup: ${path.basename(bak)}`)
  console.log(`  Restart opencode to apply.\n`)
}

async function interactive(template, opencode) {
  const optionals = listOptionals(template)
  if (optionals.length === 0) {
    console.log("\n  no optional MCPs available.\n")
    return
  }
  const active = listActive(opencode).map((a) => a.name)
  const inactive = optionals.filter((o) => !active.includes(o.name))

  if (inactive.length === 0) {
    console.log("\n  All optional MCPs are already active.\n")
    return
  }

  console.log("\n  Optional MCPs available to activate:\n")
  // group by category
  const byCat = new Map()
  inactive.forEach((m, i) => {
    const cat = categorize(m.name, template)
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat).push({ m, i })
  })
  let n = 0
  const flatIndex = new Map()
  for (const [cat, list] of byCat) {
    console.log(`  [${cat}]`)
    for (const { m, i } of list) {
      n++
      flatIndex.set(n, { m, originalIndex: i })
      console.log(`    ${n}) ${m.name}  —  ${m.description}`)
    }
    console.log()
  }
  console.log(`  d) disable an active one`)
  console.log(`  q) quit\n`)

  const choice = await prompt("  Choice (number / d / q)", { defaultValue: "q" })
  if (choice === "q" || choice === "") {
    console.log("  no changes.\n")
    return
  }
  if (choice === "d") {
    const activeList = active.filter((n) => listOptionals(template).some((o) => o.name === n))
    if (activeList.length === 0) {
      console.log("  no optional MCPs are currently active.\n")
      return
    }
    console.log("\n  Active optional MCPs:")
    activeList.forEach((n, i) => console.log(`  ${i + 1}) ${n}`))
    const c = await prompt("  Disable which? (number)", { defaultValue: "" })
    const idx = parseInt(c, 10) - 1
    if (Number.isNaN(idx) || idx < 0 || idx >= activeList.length) {
      console.log("  invalid choice. no changes.\n")
      return
    }
    await disable(activeList[idx], opencode, template)
    return
  }

  const idx = parseInt(choice, 10) - 1
  const picked = flatIndex.get(idx + 1)
  if (!picked) {
    console.log("  invalid choice. no changes.\n")
    return
  }
  await activate(picked.m.name, template, opencode)
}

// ---------- entrypoint ----------

async function main() {
  const args = process.argv.slice(2)
  const template = loadJson(OPTIONAL_TEMPLATE)
  const opencode = loadJson(OPENCODE_JSON)

  if (args.length === 0) {
    await interactive(template, opencode)
    return
  }

  const cmd = args[0]
  switch (cmd) {
    case "--list":
    case "list":
      showList(template)
      break
    case "--status":
    case "status":
      showStatus(opencode, template)
      break
    case "activate":
      if (!args[1]) die('usage: setup-mcp.js activate <name>')
      await activate(args[1], template, opencode)
      break
    case "disable":
    case "remove":
      if (!args[1]) die('usage: setup-mcp.js disable <name>')
      await disable(args[1], opencode, template)
      break
    case "--help":
    case "-h":
    case "help":
      console.log(`
  setup-mcp.js — Optional MCP activation wizard

  Usage:
    setup-mcp.js                       Interactive wizard
    setup-mcp.js --list                List available optional MCPs
    setup-mcp.js --status              Show active + optional MCPs
    setup-mcp.js activate <name>       Activate one (prompts for secrets)
    setup-mcp.js disable <name>        Remove from opencode.json
    setup-mcp.js --help                This help

  Optional MCPs defined in: .opencode/mcp.optional.json
  Active MCPs live in:      opencode.json > mcp
  Backups:                  opencode.json.bak.<timestamp>
`)
      break
    default:
      die(`unknown command: ${cmd}. Try \`--help\`.`)
  }
}

main().catch((err) => die(err.message || String(err)))
