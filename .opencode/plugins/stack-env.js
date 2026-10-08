// .opencode/plugins/stack-env.js
//
// StackEnv — provision the detected project stack into the environment of every
// bash an agent runs, via opencode's `shell.env` hook. The agent then uses the
// right runner (pnpm vs npm, cargo vs npm, vitest vs jest) without guessing.
//
// Why a dedicated plugin (and not hookify/cost-ledger): this is env
// provisioning, a different concern from security/policy and session ledger.
// A single responsibility keeps each self-test independent and leaves the
// `deny`/`permission.ask` paths of hookify/gateguard untouched.
//
// Contract (opencode `shell.env`):
//   (input: {cwd, sessionID?, callID?}, output: {env: Record<string,string>})
//   => mutates `output.env` in place; must never throw.
//
// Rules:
//   - Facts come from the shared `../bin/lib/stack-detect.js` (same taxonomy
//     that renders docs/PROJECT.md), so detection never drifts.
//   - Only `OPENCODE_STACK_*` keys are written; undetected facts are OMITTED
//     (never "?"), so callers can test with `[ -n "$VAR" ]`.
//   - No-clobber: a key already present in `output.env` is respected.
//   - No secrets: only marker filenames and manifest metadata are read.
//   - Cache per cwd (TTL), try/catch global: a bash must always run.
//   - Opt-out: `OPENCODE_STACK_ENV=0|false|off` makes the hook a no-op.
//
// Self-test: `node .opencode/plugins/stack-env.js --selftest`

"use strict"

const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { createStackDetector } = require("../bin/lib/stack-detect.js")

const CACHE_TTL_MS = 5000
const cache = new Map() // cwd -> { env, ts }

// Values that mean "not a usable fact" and must never be exported.
const NON_FACTS = new Set(["?", "unknown", "unspecified", "(none)", "(not detected)", "(no description)"])

function isDisabled(env) {
  const v = String((env && env.OPENCODE_STACK_ENV) || "").trim().toLowerCase()
  return v === "0" || v === "false" || v === "off"
}

function sanitize(value) {
  if (value === undefined || value === null) return undefined
  const s = String(value).replace(/\s+/g, " ").trim()
  if (!s || NON_FACTS.has(s)) return undefined
  return s.length > 200 ? s.slice(0, 200) : s
}

function computeFacts(baseDir) {
  const d = createStackDetector(baseDir)
  const type = d.detectType()
  const stack = d.detectStack(type)
  return {
    OPENCODE_STACK_TYPE: type,
    OPENCODE_STACK_LANGUAGE: stack.language,
    OPENCODE_STACK_FRAMEWORK: stack.framework,
    OPENCODE_STACK_RUNTIME: stack.runtime,
    OPENCODE_STACK_PACKAGE_MANAGER: stack.package_manager,
    OPENCODE_STACK_MONOREPO: d.detectMonorepo(stack),
    OPENCODE_STACK_TEST_RUNNER: d.detectTestRunner(),
    OPENCODE_STACK_LINTER: d.detectLinter(),
    OPENCODE_STACK_FORMATTER: d.detectFormatter(),
  }
}

// Facts map (sanitized) plus the `OPENCODE_STACK_ENV=1` marker when anything was
// detected. Returns {} for an unrecognized stack so nothing is injected there.
function buildEnv(baseDir) {
  const facts = computeFacts(baseDir)
  const env = {}
  for (const key of Object.keys(facts)) {
    const v = sanitize(facts[key])
    if (v !== undefined) env[key] = v
  }
  if (Object.keys(env).length === 0) return {}
  env.OPENCODE_STACK_ENV = "1"
  return env
}

function getCached(cwd) {
  const now = Date.now()
  const hit = cache.get(cwd)
  if (hit && now - hit.ts < CACHE_TTL_MS) return hit.env
  const env = buildEnv(cwd)
  cache.set(cwd, { env, ts: now })
  return env
}

async function shellEnv(input, output) {
  try {
    if (!output || output.env == null) return
    if (isDisabled(process.env)) return
    const cwd = input && input.cwd
    if (!cwd || !fs.existsSync(cwd)) return
    const env = getCached(cwd)
    for (const key of Object.keys(env)) {
      if (!Object.prototype.hasOwnProperty.call(output.env, key)) output.env[key] = env[key]
    }
  } catch {
    // Never break a bash: fail silently and leave output.env untouched.
  }
}

module.exports = async () => {
  return {
    "shell.env": shellEnv,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Self-test — `node .opencode/plugins/stack-env.js --selftest`
// ────────────────────────────────────────────────────────────────────────────

function runSelfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stack-env-selftest-"))
  const results = []
  const check = (id, ok, detail) => results.push({ id, ok, detail: detail || "" })
  const mk = (name, files) => {
    const dir = path.join(root, name)
    fs.mkdirSync(dir, { recursive: true })
    for (const [f, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, f), body)
    }
    return dir
  }
  const runHook = async (cwd, seed) => {
    const output = { env: Object.assign({}, seed || {}) }
    await shellEnv({ cwd }, output)
    return output.env
  }

  ;(async () => {
    try {
      // Node + pnpm + TS + vitest + biome
      const nodeDir = mk("node-pnpm", {
        "package.json": JSON.stringify({
          name: "fixture",
          dependencies: { react: "18.3.1" },
          scripts: { test: "vitest run" },
        }),
        "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
        "tsconfig.json": "{}",
        "vitest.config.ts": "export default {}\n",
        "biome.json": "{}\n",
      })
      const n = await runHook(nodeDir)
      check("node: package_manager=pnpm", n.OPENCODE_STACK_PACKAGE_MANAGER === "pnpm", n.OPENCODE_STACK_PACKAGE_MANAGER)
      check("node: language=TypeScript", n.OPENCODE_STACK_LANGUAGE === "TypeScript", n.OPENCODE_STACK_LANGUAGE)
      check("node: test_runner=vitest", n.OPENCODE_STACK_TEST_RUNNER === "vitest", n.OPENCODE_STACK_TEST_RUNNER)
      check("node: linter=biome", n.OPENCODE_STACK_LINTER === "biome", n.OPENCODE_STACK_LINTER)
      check("node: formatter=biome", n.OPENCODE_STACK_FORMATTER === "biome", n.OPENCODE_STACK_FORMATTER)
      check("node: type=node-app", n.OPENCODE_STACK_TYPE === "node-app", n.OPENCODE_STACK_TYPE)
      check("node: marker=1", n.OPENCODE_STACK_ENV === "1", n.OPENCODE_STACK_ENV)

      // Rust
      const rustDir = mk("rust-cargo", { "Cargo.toml": "[package]\nname = \"x\"\n" })
      const r = await runHook(rustDir)
      check("rust: language=Rust", r.OPENCODE_STACK_LANGUAGE === "Rust", r.OPENCODE_STACK_LANGUAGE)
      check("rust: package_manager=cargo", r.OPENCODE_STACK_PACKAGE_MANAGER === "cargo", r.OPENCODE_STACK_PACKAGE_MANAGER)
      check("rust: type=rust-app", r.OPENCODE_STACK_TYPE === "rust-app", r.OPENCODE_STACK_TYPE)

      // Dart / Flutter
      const dartDir = mk("flutter", { "pubspec.yaml": "name: fixture\n" })
      const d = await runHook(dartDir)
      check("dart: language=Dart", d.OPENCODE_STACK_LANGUAGE === "Dart", d.OPENCODE_STACK_LANGUAGE)
      check("dart: framework=Flutter", d.OPENCODE_STACK_FRAMEWORK === "Flutter", d.OPENCODE_STACK_FRAMEWORK)
      check("dart: package_manager=pub", d.OPENCODE_STACK_PACKAGE_MANAGER === "pub", d.OPENCODE_STACK_PACKAGE_MANAGER)

      // .NET
      const netDir = mk("dotnet", { "App.csproj": "<Project></Project>\n" })
      const net = await runHook(netDir)
      check("dotnet: language=C#/.NET", net.OPENCODE_STACK_LANGUAGE === "C#/.NET", net.OPENCODE_STACK_LANGUAGE)
      check("dotnet: package_manager=nuget", net.OPENCODE_STACK_PACKAGE_MANAGER === "nuget", net.OPENCODE_STACK_PACKAGE_MANAGER)
      check("dotnet: type=dotnet-app", net.OPENCODE_STACK_TYPE === "dotnet-app", net.OPENCODE_STACK_TYPE)

      // Empty directory -> nothing injected
      const emptyDir = mk("empty", {})
      const e = await runHook(emptyDir)
      check("empty: no OPENCODE_STACK_* vars", Object.keys(e).length === 0, JSON.stringify(e))

      // No-clobber: pre-existing key wins
      const seeded = await runHook(nodeDir, { OPENCODE_STACK_PACKAGE_MANAGER: "mystery" })
      check("no-clobber: seed wins", seeded.OPENCODE_STACK_PACKAGE_MANAGER === "mystery", seeded.OPENCODE_STACK_PACKAGE_MANAGER)

      // Missing cwd -> no-op, no throw
      const missing = await runHook(path.join(root, "does-not-exist"))
      check("missing cwd: no-op", Object.keys(missing).length === 0, JSON.stringify(missing))

      // Opt-out
      const prev = process.env.OPENCODE_STACK_ENV
      process.env.OPENCODE_STACK_ENV = "off"
      const off = await runHook(nodeDir)
      check("opt-out: disabled is no-op", Object.keys(off).length === 0, JSON.stringify(off))
      if (prev === undefined) delete process.env.OPENCODE_STACK_ENV
      else process.env.OPENCODE_STACK_ENV = prev

      // Cache: second call for same cwd returns same object identity
      cache.clear()
      const a = await runHook(nodeDir)
      const b = await runHook(nodeDir)
      check("cache: repeated cwd stable", a.OPENCODE_STACK_PACKAGE_MANAGER === b.OPENCODE_STACK_PACKAGE_MANAGER)

      // buildEnv contract: unrecognized stack yields {}
      check("buildEnv: empty -> {}", Object.keys(buildEnv(emptyDir)).length === 0)
    } finally {
      try { fs.rmSync(root, { recursive: true, force: true }) } catch {}
    }

    const failures = results.filter((r) => !r.ok)
    console.log("stack-env self-test: " + (results.length - failures.length) + "/" + results.length + " passed")
    for (const f of failures) console.log("  FAIL  " + f.id + (f.detail ? "  [" + f.detail + "]" : ""))
    process.exit(failures.length ? 1 : 0)
  })()
}

if (require.main === module && process.argv.includes("--selftest")) {
  runSelfTest()
}
