---
description: "Run end-to-end tests with Playwright or Cypress. Captures screenshots, traces, and videos. Use when validating user flows, testing deployments, or debugging UI issues."
agent: e2e-runner
---

# E2E Test Runner

Run end-to-end tests with comprehensive reporting: $ARGUMENTS

## Usage

`/e2e-run [--browser chrome|firefox|webkit] [--headed] [--debug] [--trace] [--report]`

- `--browser`: target browser (default: chrome)
- `--headed`: run with visible browser
- `--debug`: step through tests
- `--trace`: capture trace for debugging
- `--report`: generate HTML report

## Your Task

1. **Detect E2E framework**: Playwright, Cypress, Puppeteer
2. **Run tests** with specified options
3. **Capture artifacts**: Screenshots, traces, videos
4. **Generate report**: HTML report with test results
5. **Upload artifacts** if CI environment detected

## Framework Detection

```bash
# Playwright
ls playwright.config.* 2>/dev/null
cat package.json | grep -q "playwright"

# Cypress
ls cypress.config.* 2>/dev/null
ls cypress/ 2>/dev/null

# Puppeteer
cat package.json | grep -q "puppeteer"
```

## Playwright Commands

### Run Tests

```bash
# All tests
npx playwright test

# Specific file
npx playwright test tests/login.spec.ts

# Specific test
npx playwright test -g "should login"

# Parallel
npx playwright test --workers=4

# Debug mode
npx playwright test --debug

# Trace recording
npx playwright test --trace on
```

### Browser Options

```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium,firefox,webkit
```

### Visual Testing

```bash
# Update snapshots
npx playwright test --update-snapshots

# Compare screenshots
npx playwright test --update-snapshots=false
```

## Cypress Commands

### Run Tests

```bash
# Headless
npx cypress run

# Headed
npx cypress run --headed

# Specific browser
npx cypress run --browser firefox

# Specific spec
npx cypress run --spec "cypress/e2e/login.cy.ts"

# Interactive mode
npx cypress open
```

### Debugging

```bash
# Debug mode
npx cypress run --debug

# Video recording
npx cypress run --record

# Screenshots on failure
npx cypress run --config screenshotOnRunFailure=true
```

## Artifact Collection

### Screenshots

```typescript
// Playwright
await page.screenshot({ path: 'screenshots/after-test.png' });

// Cypress
cy.screenshot('login-success');
```

### Traces

```bash
# Playwright trace
npx playwright show-trace trace.zip

# View in browser
npx playwright open-trace trace.zip
```

### Videos

```typescript
// Playwright
const browser = await chromium.launch();
const context = await browser.newContext({
  recordVideo: {
    dir: 'videos/',
    size: { width: 1280, height: 720 }
  }
});
```

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Artifacts Upload

```yaml
# Screenshots
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: screenshots
    path: test-results/

# Traces
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: traces
    path: traces/

# HTML Report
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: e2e-report
    path: playwright-report/
```

## Debugging Failed Tests

### Playwright Debug

```bash
# Step through test
npx playwright test --debug

# Open trace
npx playwright show-trace trace.zip

# headed mode
npx playwright test --headed
```

### Cypress Debug

```bash
# Open in browser
npx cypress open

# Time travel
# Click on commands in test runner to see state
```

## Anti-Patterns

1. **Flaky tests** → Random failures, not deterministic
2. **Slow tests** → Too many tests, not parallelized
3. **Missing artifacts** → No screenshots on failure
4. **Hardcoded waits** → `setTimeout` instead of proper waits
5. **No retry logic** → Single attempt fails on network issues

## Arguments

$ARGUMENTS:
- optional browser choice
- optional flags (--headed, --debug, --trace, --report)
