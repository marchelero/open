---
description: "Detect the project build system and fix build/type errors with minimal changes. Use when `npm run build`, `tsc --noEmit`, `cargo build`, `go build`, `mvn compile` or similar fails, or when imports/resolve/type errors block the build."
agent: build-error-resolver
---

# Build Fix Command

Detect the build system, run it, and fix errors incrementally with minimal, safe changes: $ARGUMENTS

## Step 1 — Detect the build system

Pick the first indicator that exists at the repo root (or the nearest workspace root), then use its command:

| Indicator | Build command |
|-----------|---------------|
| `package.json` with a `build` script | `npm run build` (or the detected package manager) |
| `tsconfig.json` (no build script) | `npx tsc --noEmit` |
| `Cargo.toml` | `cargo build 2>&1` |
| `go.mod` | `go build ./...` |
| `pom.xml` | `mvn -q compile` |
| `build.gradle` / `build.gradle.kts` | `./gradlew compileJava` (or `compileKotlin`) |
| `pyproject.toml` | `python -m compileall -q .` or `mypy .` |
| `pubspec.yaml` | `flutter analyze` |
| `Package.swift` | `swift build` |

Package manager: honor `package.json` `packageManager`, else the lockfile (`package-lock.json`→npm, `pnpm-lock.yaml`→pnpm, `yarn.lock`→yarn, `bun.lockb`/`bun.lock`→bun), else `npm`.

## Step 2 — Route to the stack-specific resolver

Once the stack is known, delegate the fix loop to the matching agent with the `task` tool:

| Stack | Agent |
|-------|-------|
| TypeScript / JS / generic | `build-error-resolver` |
| React | `react-build-resolver` |
| Angular | `angular-build-resolver` |
| Go | `go-build-resolver` |
| Rust | `rust-build-resolver` |
| C++ | `cpp-build-resolver` |
| Java | `java-build-resolver` |
| Kotlin | `kotlin-build-resolver` |
| Dart / Flutter | `dart-build-resolver` |
| Django / Python | `django-build-resolver` |
| PyTorch | `pytorch-build-resolver` |
| Swift | `swift-build-resolver` |

If no specific resolver exists for the stack, stay on `build-error-resolver` and follow the loop below yourself. Do **not** use the generic resolver first when a stack-specific one exists — the specific one is faster and more accurate.

## Step 3 — Parse and group errors

1. Run the build command and capture stderr.
2. Group errors by file path.
3. Order the fixes: imports/resolve → types → syntax → logic.
4. Count total errors so progress is measurable (N fixed / M remaining).

## Step 4 — Fix loop (one error at a time)

For each error:
1. **Read** ~10 lines around the error for context.
2. **Diagnose** the root cause (missing import, wrong type, syntax, version mismatch).
3. **Fix minimally** with `edit` — smallest change that resolves it.
4. **Re-run the build** to confirm the error is gone and no new error appeared.
5. **Next** — continue until the build is green.

## Step 5 — Guardrails (stop and ask)

Stop and ask the user when:
- A fix introduces **more errors than it resolves**.
- The **same error persists after 3 attempts** (likely a deeper issue).
- The fix requires an **architectural change** (not just a build fix).
- Errors stem from **missing dependencies** (need `npm install` / `cargo add` / `go get` — confirm before installing).
- The build command itself is misconfigured (read the config; compare with working defaults).

### DO
- Fix types, imports, syntax, resolve paths.
- Make minimal diffs; preserve existing behavior.
- Re-run the build after each change.

### DON'T
- Refactor, add features, or change architecture.
- Sprinkle `any`, `@ts-ignore`, or `# type: ignore` to silence errors.
- Change business logic.
- Weaken a linter/formatter config to make the build pass (see `policy-rules.json` `protect-linter-config`).

## Step 6 — Summary

Report: errors fixed (with paths), errors remaining, new errors introduced (must be 0), and next steps for anything unresolved.

---

**IMPORTANT**: Get the build green with a minimal diff. No refactoring, no improvements, no architectural changes.
