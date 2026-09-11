---
description: "Audita dependencias vulnerables (npm audit, pip-audit, cargo audit, govulncheck). Identifica CVEs, versiones comprometidas, y sugiere fixes. Use antes de releases o cuando se reportan vulnerabilidades."
agent: security-reviewer
---

# Deps Audit Command

Audit project dependencies for known vulnerabilities: $ARGUMENTS

## Your Task

1. **Detect stack** — identify package manager from lockfiles
2. **Run audit** — execute appropriate vulnerability scanner
3. **Analyze results** — categorize by severity (critical/high/medium/low)
4. **Suggest fixes** — recommend upgrades or workarounds
5. **Report** — summary with actionable items

## Detection

```bash
# Node.js (npm)
test -f package-lock.json && echo "npm"
test -f yarn.lock && echo "yarn"
test -f pnpm-lock.yaml && echo "pnpm"

# Python
test -f requirements.txt && echo "pip"
test -f poetry.lock && echo "poetry"
test -f Pipfile.lock && echo "pipenv"

# Rust
test -f Cargo.lock && echo "cargo"

# Go
test -f go.sum && echo "go"
```

## Audit Commands

### npm/yarn/pnpm

```bash
npm audit --json 2>/dev/null || true
npm audit 2>/dev/null || true
# Fix automatically (if possible)
npm audit fix --dry-run
```

### Python (pip-audit)

```bash
pip-audit 2>/dev/null || pip install pip-audit && pip-audit
# Check specific requirements file
pip-audit -r requirements.txt
```

### Rust (cargo-audit)

```bash
cargo install cargo-audit 2>/dev/null || true
cargo audit 2>/dev/null || echo "cargo-audit not installed"
```

### Go (govulncheck)

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest 2>/dev/null || true
govulncheck ./... 2>/dev/null || echo "govulncheck not installed"
```

## Output Format

```
Dependency Audit Report
=======================

Stack: npm (package-lock.json)
Total dependencies: 247

CRITICAL (2):
  CVE-2024-XXXXX  lodash@4.17.20  Prototype Pollution
    → Upgrade to: lodash@4.17.21
    → Fix: npm install lodash@4.17.21

  CVE-2024-YYYYY  axios@0.21.1  Server-Side Request Forgery
    → Upgrade to: axios@1.6.0
    → Fix: npm install axios@1.6.0

HIGH (3):
  ...

MEDIUM (5):
  ...

LOW (1):
  ...

Summary: 11 vulnerabilities (2 critical, 3 high, 5 medium, 1 low)
Recommended: npm audit fix
```

## Severity Levels

| Level | Action |
|-------|--------|
| CRITICAL | Fix immediately, block release |
| HIGH | Fix before next release |
| MEDIUM | Fix in regular maintenance |
| LOW | Monitor, fix when convenient |

## Auto-Fix

When possible, suggest automatic fixes:

```bash
# npm: auto-fix what's possible
npm audit fix

# npm: force fix (may include breaking changes)
npm audit fix --force

# Python: upgrade specific package
pip install --upgrade <package>
```

## When to Use

- Before releases or deployments
- When CI/CD flags vulnerabilities
- Periodic security maintenance (weekly/monthly)
- When users report security concerns
- After adding new dependencies

## When NOT to Use

- During active feature development (use `flow-feature` instead)
- When you need to review code quality (use `code-reviewer` instead)

## See Also

- `skill: security-review` — OWASP, injection, auth patterns
- `agent: security-reviewer` — full security audit
- `command: /security` — application security scan
