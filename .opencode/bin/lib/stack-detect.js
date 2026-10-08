// .opencode/bin/lib/stack-detect.js
//
// Shared, filesystem-only stack detection for the open pack.
//
// Why this module exists: `refresh-project.js` computes stack facts to render
// `docs/PROJECT.md`, and the `stack-env` plugin needs the very same facts to
// export them as `OPENCODE_STACK_*` on every bash. Keeping two copies of the
// taxonomy would drift, so both consume this factory.
//
// Design:
//   - `createStackDetector(baseDir)` binds every probe to `baseDir` (never
//     `process.cwd()` implicitly) so the same detectors work for the repo root
//     and for the per-bash `cwd` handed to the plugin.
//   - Pure Node stdlib, CommonJS, zero deps, no network, no spawns. Only reads
//     marker filenames and manifest metadata (never `.env`/credential bodies).
//   - Located in `bin/lib/` on purpose: `counts.js` only counts `bin/*.js` at
//     the top level, so this is NOT a CLI.
//
// Contract preserved from `refresh-project.js` (same returned strings):
//   detectType -> 'flutter-app' | 'node-monorepo' | 'web-app' | 'api-service'
//                 | 'cli' | 'node-app' | 'python-app' | 'rust-app' | 'go-app'
//                 | 'java-app' | 'unknown'
//   detectStack -> { language, framework, runtime, package_manager }
//   detectMonorepo(stack) -> string | null
//   detectTestRunner() / detectLinter() / detectFormatter() -> string | null
// .NET (csproj/sln) is a new branch over the original refresh-project logic.

"use strict"

const fs = require("node:fs")
const path = require("node:path")

function createStackDetector(baseDir) {
  const root = path.resolve(baseDir || process.cwd())

  const at = (p) => path.join(root, p)
  const exists = (p) => fs.existsSync(at(p))
  const read = (p) => {
    try { return fs.readFileSync(at(p), "utf8") } catch { return "" }
  }
  const readJSON = (p) => {
    try { return JSON.parse(read(p)) } catch { return null }
  }
  const readYAML = (p) => {
    // Lightweight YAML parser for pubspec.yaml / pyproject.toml
    const txt = read(p)
    if (!txt) return null
    const out = {}
    for (const line of txt.split("\n")) {
      const m = line.match(/^([\w-]+):\s*(.+)$/)
      if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
    }
    return out
  }

  function hasDotNet() {
    try {
      return fs.readdirSync(root).some((f) => f.endsWith(".csproj") || f.endsWith(".sln"))
    } catch {
      return false
    }
  }

  function detectType() {
    if (exists("pubspec.yaml")) return "flutter-app"
    if (exists("package.json")) {
      const pkg = readJSON("package.json")
      if (pkg && pkg.workspaces) return "node-monorepo"
      if (pkg && pkg.dependencies && pkg.dependencies["next"]) return "web-app"
      if (pkg && pkg.dependencies && pkg.dependencies["express"]) return "api-service"
      if (pkg && pkg.bin) return "cli"
      return "node-app"
    }
    if (exists("turbo.json") || exists("nx.json") || exists("pnpm-workspace.yaml")) return "node-monorepo"
    if (exists("pyproject.toml") || exists("setup.py")) return "python-app"
    if (exists("Cargo.toml")) return "rust-app"
    if (exists("go.mod")) return "go-app"
    if (exists("pom.xml") || exists("build.gradle")) return "java-app"
    if (hasDotNet()) return "dotnet-app"
    if (exists("index.html")) return "web-app"
    return "unknown"
  }

  function detectStack(type) {
    const stack = { language: "?", framework: "?", runtime: "?", package_manager: "?" }
    if (exists("package.json")) {
      const pkg = readJSON("package.json") || {}
      stack.language = exists("tsconfig.json") ? "TypeScript" : "JavaScript"
      const deps = pkg.dependencies || {}
      const fw = []
      if (deps["next"]) fw.push(`Next.js ${deps["next"]}`)
      if (deps["react"] && !deps["next"]) fw.push(`React ${deps["react"]}`)
      if (deps["vue"]) fw.push(`Vue ${deps["vue"]}`)
      if (deps["svelte"]) fw.push(`Svelte ${deps["svelte"]}`)
      if (deps["@angular/core"]) fw.push(`Angular ${deps["@angular/core"]}`)
      if (deps["express"]) fw.push(`Express ${deps["express"]}`)
      if (deps["fastify"]) fw.push(`Fastify ${deps["fastify"]}`)
      if (deps["koa"]) fw.push(`Koa ${deps["koa"]}`)
      if (deps["hono"]) fw.push(`Hono ${deps["hono"]}`)
      if (deps["@nestjs/core"]) fw.push(`NestJS ${deps["@nestjs/core"]}`)
      if (deps["electron"]) fw.push(`Electron ${deps["electron"]}`)
      stack.framework = fw.length ? fw.join(" + ") : "(none)"
      stack.runtime = pkg.engines && pkg.engines.node ? `Node ${pkg.engines.node}` : "Node"
      stack.package_manager = exists("pnpm-lock.yaml") ? "pnpm" :
                             exists("yarn.lock") ? "yarn" :
                             exists("bun.lockb") ? "bun" :
                             exists("bun.lock") ? "bun" : "npm"
    } else if (exists("pubspec.yaml")) {
      const pub = readYAML("pubspec.yaml") || {}
      stack.language = "Dart"
      stack.framework = "Flutter"
      stack.runtime = "Dart SDK"
      stack.package_manager = "pub"
    } else if (exists("pyproject.toml")) {
      stack.language = "Python"
      stack.package_manager = exists("poetry.lock") ? "poetry" :
                             exists("uv.lock") ? "uv" :
                             exists("Pipfile.lock") ? "pipenv" : "pip"
    } else if (exists("Cargo.toml")) {
      stack.language = "Rust"
      stack.package_manager = "cargo"
    } else if (exists("go.mod")) {
      stack.language = "Go"
      stack.package_manager = "go mod"
    } else if (exists("pom.xml")) {
      stack.language = "Java"
      stack.package_manager = "maven"
    } else if (exists("build.gradle")) {
      stack.language = "Kotlin/Java"
      stack.package_manager = "gradle"
    } else if (hasDotNet()) {
      stack.language = "C#/.NET"
      stack.framework = "(none)"
      stack.runtime = ".NET"
      stack.package_manager = "nuget"
    }
    return stack
  }

  function detectMonorepo(stack) {
    if (exists("turbo.json")) return "Turbo"
    if (exists("nx.json")) return "Nx"
    if (exists("pnpm-workspace.yaml")) return "pnpm workspaces"
    if (exists("package.json")) {
      const pkg = readJSON("package.json")
      if (pkg && pkg.workspaces) {
        if (Array.isArray(pkg.workspaces)) return "npm workspaces"
        if (pkg.workspaces.packages) return "yarn workspaces"
      }
    }
    return null
  }

  function detectTestRunner() {
    if (exists("vitest.config.ts") || exists("vitest.config.js")) return "vitest"
    if (exists("jest.config.js") || exists("jest.config.ts") || exists("jest.config.cjs")) return "jest"
    if (exists("playwright.config.ts") || exists("playwright.config.js")) return "playwright"
    if (exists("pytest.ini") || exists("conftest.py")) return "pytest"
    if (exists("phpunit.xml") || exists("phpunit.xml.dist")) return "phpunit"
    // check package.json scripts
    if (exists("package.json")) {
      const pkg = readJSON("package.json") || {}
      const scripts = pkg.scripts || {}
      if (scripts.test) {
        if (scripts.test.includes("vitest")) return "vitest"
        if (scripts.test.includes("jest")) return "jest"
        if (scripts.test.includes("mocha")) return "mocha"
        if (scripts.test.includes("ava")) return "ava"
        return "npm test (custom)"
      }
    }
    return null
  }

  function detectLinter() {
    if (exists("eslint.config.js") || exists("eslint.config.mjs") || exists("eslint.config.cjs")) return "eslint (flat config)"
    if (exists(".eslintrc") || exists(".eslintrc.json") || exists(".eslintrc.js") || exists(".eslintrc.yml")) return "eslint"
    if (exists("biome.json") || exists("biome.jsonc")) return "biome"
    if (exists("ruff.toml") || exists(".ruff.toml")) return "ruff"
    if (exists(".pylintrc")) return "pylint"
    if (exists(".golangci.yml") || exists(".golangci.yaml")) return "golangci-lint"
    if (exists("clippy.toml")) return "clippy"
    return null
  }

  function detectFormatter() {
    if (exists(".prettierrc") || exists(".prettierrc.json") || exists(".prettierrc.js") ||
        exists(".prettierrc.yml") || exists("prettier.config.js") || exists("prettier.config.cjs")) return "prettier"
    if (exists("biome.json") || exists("biome.jsonc")) return "biome"
    if (exists("black.toml") || exists("pyproject.toml")) {
      const py = readYAML("pyproject.toml")
      if (py && (py["black"] || (py.tool && py.tool.black))) return "black"
    }
    if (exists(".rustfmt.toml")) return "rustfmt"
    if (exists(".gofmt")) return "gofmt"
    return null
  }

  return {
    exists,
    read,
    readJSON,
    readYAML,
    detectType,
    detectStack,
    detectMonorepo,
    detectTestRunner,
    detectLinter,
    detectFormatter,
  }
}

module.exports = { createStackDetector }
