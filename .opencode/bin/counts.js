#!/usr/bin/env node
/**
 * counts.js - single source of truth for pack surface-area numbers
 *
 * Scans the filesystem to compute exact counts of agents, commands,
 * skills, plugins, MCPs, and CLIs. Output as JSON (--json) or as a
 * markdown "## Counts" block (--update <files...>).
 *
 * Usage:
 *   node .opencode/bin/counts.js --json              # JSON to stdout
 *   node .opencode/bin/counts.js --update <file...>  # inject/replace ## Counts block
 *   node .opencode/bin/counts.js --check             # exit 1 if any tracked file is stale
 *
 * The --update mode replaces a fenced `## Counts` block (auto-managed)
 * between the markers `<!-- COUNTS-START -->` and `<!-- COUNTS-END -->`.
 * Files without those markers are left untouched (use the marker pair
 * to opt in). This is the durable fix for H1 (skill/agent count drift
 * across 4+ README surfaces).
 *
 * Zero deps, CommonJS, Windows + POSIX.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const COMMANDS_DIR = path.join(ROOT, '.opencode', 'commands');
const SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const BIN_DIR = path.join(__dirname); // this script's dir
const PLUGINS_DIR = path.join(ROOT, '.opencode', 'plugins');
const PKG = path.join(__dirname, '..', 'package.json');
const ROOT_OPENCODE = path.join(ROOT, 'opencode.json');
const MCP_OPTIONAL = path.join(__dirname, '..', 'mcp.optional.json');

function countMdFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'INDEX.md').length;
}

function countSkillDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => {
    try { return fs.statSync(path.join(dir, f)).isDirectory(); } catch { return false; }
  }).length;
}

function countJsFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).length;
}

function readJsonSafe(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return null; }
}

function compute() {
  // CLIs = bin/ .js files MINUS this script (counts.js itself is meta, not a CLI)
  const clis = countJsFiles(BIN_DIR) - 1;

  // NPM plugins = package.json dependencies matching opencode plugin convention
  const pkgJson = readJsonSafe(PKG);
  let npmPlugins = 0;
  if (pkgJson) {
    const all = Object.assign({}, pkgJson.dependencies || {}, pkgJson.devDependencies || {});
    npmPlugins = Object.keys(all).filter(k => /opencode/i.test(k) && k !== '@opencode-ai/plugin').length;
  }

  // Local plugins = .js files in .opencode/plugins/
  const localPlugins = countJsFiles(PLUGINS_DIR);

  // Active MCPs = keys in root opencode.json mcp section
  const oc = readJsonSafe(ROOT_OPENCODE);
  let activeMcps = 0;
  if (oc && oc.mcp && typeof oc.mcp === 'object') activeMcps = Object.keys(oc.mcp).length;

  // Optional MCPs = items in .opencode/mcp.optional.json optional_mcps array
  const mcpOpt = readJsonSafe(MCP_OPTIONAL);
  let optionalMcps = 0;
  if (mcpOpt && Array.isArray(mcpOpt.optional_mcps)) optionalMcps = mcpOpt.optional_mcps.length;

  return {
    agents: countMdFiles(AGENTS_DIR),
    commands: countMdFiles(COMMANDS_DIR),
    skills: countSkillDirs(SKILLS_DIR),
    clis: Math.max(0, clis),
    plugins_npm: npmPlugins,
    plugins_local: localPlugins,
    mcps_active: activeMcps,
    mcps_optional: optionalMcps,
  };
}

function renderMarkdown(c) {
  const lines = [];
  lines.push('<!-- COUNTS-START -->');
  lines.push('## Counts');
  lines.push('');
  lines.push('> Auto-managed by `.opencode/bin/counts.js`. Do not edit by hand.');
  lines.push('> Regenerate: `node .opencode/bin/counts.js --update <files...>`');
  lines.push('');
  lines.push(`- **${c.agents}** agents (.opencode/agents)`);
  lines.push(`- **${c.commands}** commands (.opencode/commands)`);
  lines.push(`- **${c.skills}** skills (.agents/skills)`);
  lines.push(`- **${c.clis}** native CLIs (.opencode/bin)`);
  lines.push(`- **${c.plugins_npm}** npm plugins + **${c.plugins_local}** local plugin(s)`);
  lines.push(`- **${c.mcps_active}** active MCPs + **${c.mcps_optional}** optional MCP(s)`);
  lines.push('<!-- COUNTS-END -->');
  return lines.join('\n');
}

function updateFile(file, block) {
  const text = fs.readFileSync(file, 'utf8');
  const start = '<!-- COUNTS-START -->';
  const end = '<!-- COUNTS-END -->';
  const startIdx = text.indexOf(start);
  const endIdx = text.indexOf(end);
  if (startIdx === -1 || endIdx === -1) {
    return { ok: false, reason: 'no markers' };
  }
  const before = text.slice(0, startIdx);
  const after = text.slice(endIdx + end.length);
  const next = before + block + after;
  fs.writeFileSync(file, next, 'utf8');
  return { ok: true };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const check = args.includes('--check');
  const updateIdx = args.indexOf('--update');
  const updateFiles = updateIdx >= 0 ? args.slice(updateIdx + 1).filter(a => !a.startsWith('--')) : [];

  const counts = compute();

  if (asJson) {
    process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
    return;
  }

  const block = renderMarkdown(counts);

  if (updateFiles.length > 0) {
    for (const f of updateFiles) {
      const res = updateFile(f, block);
      if (res.ok) {
        process.stdout.write(`Updated ${f}\n`);
      } else {
        process.stdout.write(`Skipped ${f} (${res.reason})\n`);
      }
    }
    return;
  }

  if (check) {
    // Verify each candidate file matches what counts.js would emit
    const files = args.filter(a => !a.startsWith('--') && fs.existsSync(a));
    let bad = 0;
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      if (!text.includes('<!-- COUNTS-START -->') || !text.includes('<!-- COUNTS-END -->')) continue;
      if (!text.includes(block)) {
        process.stdout.write(`STALE: ${f}\n`);
        bad++;
      }
    }
    process.exit(bad > 0 ? 1 : 0);
  }

  // default: print the markdown block
  process.stdout.write(block + '\n');
}

module.exports = { compute, renderMarkdown, updateFile };

if (require.main === module) {
  main();
}
