---
name: git-hooks
description: Use this skill when setting up Git hooks with Husky, lint-staged, or custom scripts. Covers pre-commit, pre-push, commit-msg hooks, linting, formatting, type-checking, and automated testing.
triggers: [git hooks, husky, lint-staged, pre-commit, pre-push, commit-msg, commit lint, commitlint]
origin: starter-pack
---

# Git Hooks Patterns

Patterns for setting up Git hooks with Husky, lint-staged, and custom scripts.

## When to Activate

- Setting up Husky for the first time
- Adding pre-commit hooks for linting/formatting
- Configuring commit message validation
- Adding pre-push checks
- Customizing hook behavior per project

## Husky Setup

### Installation

```bash
# npm
npx husky init
npm install -D husky

# pnpm
pnpm exec husky init
pnpm add -D husky
```

### Package.json Configuration

```json
{
  "scripts": {
    "prepare": "husky",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.{ts,tsx}": ["tsc --noEmit"]
  }
}
```

## Pre-Commit Hook

### Basic Lint & Format

```bash
# .husky/pre-commit
npx lint-staged
```

### Advanced Pre-Commit

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Lint staged files
npx lint-staged

# Check for secrets
if git diff --cached --name-only | xargs grep -l "sk-\|api_key\|secret\|password" 2>/dev/null; then
  echo "❌ Potential secrets found in staged files"
  exit 1
fi

# Check for TODO/FIXME in production code
if git diff --cached --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null; then
  echo "⚠️  TODO/FIXME found in staged files"
  echo "Consider creating an issue instead"
fi

echo "✅ Pre-commit checks passed"
```

### Language-Specific Hooks

#### TypeScript

```bash
# .husky/pre-commit
npx lint-staged
npx tsc --noEmit
```

#### Python

```bash
# .husky/pre-commit
npx lint-staged

# Python linting
if git diff --cached --name-only | grep -q "\.py$"; then
  poetry run ruff check .
  poetry run black --check .
fi
```

#### Go

```bash
# .husky/pre-commit
npx lint-staged

if git diff --cached --name-only | grep -q "\.go$"; then
  golangci-lint run
  go vet ./...
fi
```

## Pre-Push Hook

### Basic Pre-Push

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-push checks..."

# Run tests
npm test

# Check build
npm run build

echo "✅ Pre-push checks passed"
```

### Advanced Pre-Push

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# Type check
echo "🔍 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# Lint
echo "🧹 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed"
  exit 1
fi

# Check for secrets in committed code
echo "🔒 Checking for secrets..."
if git log --oneline -10 | xargs git show | grep -q "sk-\|api_key\|secret\|password"; then
  echo "⚠️  Potential secrets found in recent commits"
  echo "Review before pushing"
  exit 1
fi

echo "✅ All pre-push checks passed"
```

## Commit Message Hook

### Commitlint

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

### Commitlint Config

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting (no code change)
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Tests
        'build',    // Build system
        'ci',       // CI configuration
        'chore',    // Other changes
        'revert'    // Revert
      ]
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

### Custom Commit Message Hook

```bash
# .husky/commit-msg
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

commit_msg=$(cat "$1")

# Check for conventional commit format
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"; then
  echo "❌ Commit message must start with: feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"
  echo "Example: feat: add user authentication"
  exit 1
fi

# Check for issue reference
if ! echo "$commit_msg" | grep -qE "#[0-9]+"; then
  echo "⚠️  Consider adding an issue reference: feat: add auth #123"
fi

echo "✅ Commit message valid"
```

## Commit Message Enforcement

### GitHub Actions (Server-Side)

```yaml
# .github/workflows/commitlint.yml
name: Lint Commits
on:
  pull_request:
    branches: [main]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: wagoid/commitlint-github-action@v5
```

## Husky Commands

```bash
# Add a hook
npx husky add .husky/pre-commit "npm test"

# Remove a hook
rm .husky/pre-commit

# Skip hooks (emergency only)
git commit --no-verify -m "emergency fix"

# List hooks
ls .husky/
```

## Skip Hooks

```bash
# Skip pre-commit
git commit --no-verify -m "skip hooks"

# Skip pre-push
git push --no-verify

# Environment variable
HUSKY=0 git commit -m "skip hooks"
```

## Custom Hooks

### Post-Merge (Auto-Install)

```bash
# .husky/post-merge
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Auto-install dependencies after merge
npm install
```

### Pre-Rebase

```bash
# .husky/pre-rebase
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before rebase
npm test
```

## Anti-Patterns

1. **Skipping hooks** → `--no-verify` defeats the purpose
2. **Slow hooks** → Developers skip them
3. **No CI enforcement** → Server-side validation missing
4. **Hardcoded paths** → Not portable across environments
5. **Missing `.husky/_/husky.sh`** → Hook doesn't run

## Related Skills

- `coding-standards` — for lint rules
- `testing-patterns` — for test strategy
- `git-workflow` — for branch strategy

## Related Agents

- `code-quality-analyzer` — for code quality checks
