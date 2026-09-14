---
description: "Audit CI/CD pipelines for security, performance, and reliability. Checks GitHub Actions, GitLab CI, Jenkins, and Travis CI configurations. Use when reviewing pipeline changes, setting up new pipelines, or optimizing build times."
agent: ci-cd-reviewer
---

# CI/CD Audit Command

Audit CI/CD pipelines for security, performance, and reliability: $ARGUMENTS

## Usage

`/ci-audit [path] [--format text|json] [--fix]`

- `path` (optional): defaults to current project
- `--format`: output format (default: text)
- `--fix`: suggest auto-fixes

## Your Task

1. **Detect CI platform**: Scan for `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`, `.travis.yml`
2. **Run available linters**: `actionlint`, `gitlab-ci-lint`, `ansible-lint`
3. **Analyze each workflow** for issues
4. **Generate structured report**
5. **Provide actionable recommendations**

## Check Categories

### Security (CRITICAL)
- [ ] Secrets hardcoded in workflow
- [ ] Unpinned actions by tag
- [ ] Script injection via untrusted input
- [ ] Excessive permissions
- [ ] Pull request target with checkout
- [ ] Missing `persist-credentials: false`

### Performance (HIGH)
- [ ] Missing dependency caching
- [ ] Full checkout when shallow suffices
- [ ] Large runner for small jobs
- [ ] No matrix with fail-fast
- [ ] Missing artifact retention policy

### Reliability (HIGH)
- [ ] Missing concurrency controls
- [ ] No timeout-minutes
- [ ] Missing retry for flaky tests
- [ ] Hardcoded branch names
- [ ] Missing needs dependencies

### Correctness (MEDIUM)
- [ ] Workflow >500 lines
- [ ] Duplicated steps
- [ ] Missing workflow name
- [ ] Secrets not defined
- [ ] Missing artifact upload/download

## Report Format

For each issue found:

```
[SEVERITY] workflow.yml:42
Issue: [Description]
Fix: [How to fix]
```

## Decision

- **CRITICAL issues**: Block, require fixes
- **HIGH issues**: Recommend fixes before merge
- **MEDIUM issues**: Optional improvements

---

**Post-Review: Audit**

After closing this audit, if there was an originating PRD (`docs/prds/{name}.prd.md`):

1. Save the audit output as `docs/reports/{YYYY-MM-DD_HHMM}-{name}.report.md`.
2. Offer to user: "¿Audito against the PRD with `/audit-report {name}`? (y/n)"

## Arguments

$ARGUMENTS:
- optional target path
- optional flags (--format, --fix)
