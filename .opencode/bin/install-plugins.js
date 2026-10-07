#!/usr/bin/env node
// .opencode/bin/install-plugins.js
//
// Installs the optional opencode plugins declared in .opencode/package.json.
//
// Idempotent AND self-healing: it does NOT skip just because node_modules/
// exists. It checks that every declared dependency is actually present, and
// installs when any is missing (the previous "skip if node_modules exists"
// behaviour could not recover from a partial install and left opencode to hang
// at boot when a plugin was declared in opencode.json but absent on disk).
//
// Usage:
//   node .opencode/bin/install-plugins.js           # install missing deps
//   node .opencode/bin/install-plugins.js --check    # report only, exit 1 if missing
//   node .opencode/bin/install-plugins.js --force    # reinstall regardless

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const nodeModulesPath = path.join(root, 'node_modules');

const CHECK_ONLY = process.argv.includes('--check');
const FORCE = process.argv.includes('--force');

if (!fs.existsSync(pkgPath)) {
  console.error('[install-plugins] ERROR: package.json not found at', pkgPath);
  process.exit(1);
}

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('[install-plugins] ERROR: package.json is not valid JSON:', e.message);
  process.exit(1);
}

const deps = Object.keys(pkg.dependencies || {});

function depPresent(name) {
  const dir = path.join(nodeModulesPath, name);
  if (!fs.existsSync(dir)) return false;
  // A directory with no package.json is a broken/partial install.
  return fs.existsSync(path.join(dir, 'package.json'));
}

const missing = deps.filter((d) => !depPresent(d));

if (missing.length === 0 && !FORCE) {
  console.log('[install-plugins] OK: all ' + deps.length + ' declared plugins present.');
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error('[install-plugins] MISSING (' + missing.length + '/' + deps.length + '): ' + missing.join(', '));
  console.error('  Run `node .opencode/bin/install-plugins.js` to install.');
  process.exit(1);
}

console.log('[install-plugins] ' + (FORCE ? 'Reinstalling' : 'Installing missing') + ' plugins...');
if (missing.length) console.log('  Missing: ' + missing.join(', '));
console.log('  This may take 30-60 seconds on first run.');

try {
  // --ignore-scripts: skip postinstall hooks (some plugins require bun, deno, etc.)
  // Remove this flag if a plugin's postinstall is required for it to work.
  execSync('npm install --no-audit --no-fund --ignore-scripts', {
    cwd: root,
    stdio: 'inherit',
  });
  const stillMissing = deps.filter((d) => !depPresent(d));
  if (stillMissing.length) {
    console.error('\n[install-plugins] FAILED: still missing after install: ' + stillMissing.join(', '));
    process.exit(1);
  }
  console.log('\n[install-plugins] OK. Restart opencode to load the plugins.');
} catch (err) {
  console.error('\n[install-plugins] FAILED:', err.message);
  console.error('  Check your network connection and try again.');
  process.exit(1);
}
