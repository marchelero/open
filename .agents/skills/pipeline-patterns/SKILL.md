---
name: pipeline-patterns
description: Use this skill when setting up, reviewing, or optimizing CI/CD pipelines. Covers GitHub Actions, GitLab CI, CircleCI, Jenkins, and Travis CI patterns for caching, matrix builds, concurrency, secrets management, and cost optimization.
triggers: [CI, CD, pipeline, workflow, github actions, gitlab ci, jenkins, deploy, build, test, publish]
origin: starter-pack
---

# CI/CD Pipeline Patterns

Comprehensive patterns for building reliable, secure, and cost-efficient CI/CD pipelines.

## When to Activate

- Setting up a new CI/CD pipeline
- Reviewing pipeline configuration
- Optimizing build times or costs
- Adding caching, matrix builds, or concurrency controls
- Securing pipeline secrets and permissions
- Debugging flaky pipeline failures

## Platform Detection

Detect platform from file paths:
- `.github/workflows/*.yml` → GitHub Actions
- `.gitlab-ci.yml` → GitLab CI
- `.circleci/config.yml` → CircleCI
- `Jenkinsfile` → Jenkins
- `.travis.yml` → Travis CI

## GitHub Actions Patterns

### Caching

```yaml
# Node.js caching
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # Auto-detects package-lock.json

# Generic caching
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/pip
      node_modules
    key: ${{ runner.os }}-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-
```

### Matrix Builds with Fail-Fast

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]
  fail-fast: true  # Cancel other jobs on first failure
```

### Concurrency Controls

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

### Security Hardening

```yaml
permissions:
  contents: read
  pull-requests: write
  # Never: write-all, admin

# Persist credentials only when pushing
- uses: actions/checkout@v4
  with:
    persist-credentials: false

# Pin actions to SHA
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

### Script Injection Prevention

```yaml
# BAD - vulnerable to injection
- run: echo "${{ github.event.issue.title }}"

# GOOD - use environment variable
- run: echo "$TITLE"
  env:
    TITLE: ${{ github.event.issue.title }}
```

## GitLab CI Patterns

### Caching

```yaml
cache:
  key:
    files:
      - package-lock.json
    prefix: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
```

### Multi-Stage Pipeline

```yaml
stages:
  - lint
  - test
  - build
  - deploy

lint:
  stage: lint
  script: npm run lint

test:
  stage: test
  script: npm test
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
```

## Cost Optimization

### Runner Selection

| Job Type | Recommended Runner |
|----------|-------------------|
| Lint/format | `ubuntu-latest` (2 cores) |
| Unit tests | `ubuntu-latest` (2 cores) |
| Integration tests | `ubuntu-latest-4-cores` |
| E2E tests | `ubuntu-latest-8-cores` |
| Build/deploy | `ubuntu-latest` (2 cores) |

### Artifact Retention

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: dist/
    retention-days: 7  # PR artifacts, not releases
```

## Reusable Workflows

```yaml
# .github/workflows/reusable-build.yml
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
    secrets:
      npm-token:
        required: true

# Caller workflow
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '22'
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}
```

## Monitoring & Alerting

```yaml
# Post-deploy notification
- uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployed ${{ github.sha }} to production"
      }
  if: success()
```

## Anti-Patterns

1. **No `timeout-minutes`** → Jobs hang forever
2. **`continue-on-error: true`** → Masks failures
3. **No branch protection** → Direct pushes to main
4. **Hardcoded secrets** → Exposed in logs
5. **Unpinned actions** → Supply chain risk
6. **Full checkout for lint** → Wasted bandwidth
7. **No retry for flaky tests** → Manual reruns
8. **`fetch-depth: 0`** → Full git history when shallow suffices

## Related Skills

- `docker-patterns` — for container builds in pipelines
- `security-review` — for secrets management
- `tdd-workflow` — for test strategy in CI

## Related Agents

- `ci-cd-reviewer` — for pipeline review
- `docker-reviewer` — for Dockerfile in pipeline
