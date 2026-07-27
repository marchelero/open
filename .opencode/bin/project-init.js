#!/usr/bin/env node
/**
 * project-init.js - generate / refresh docs/PROJECT.md from the pack template
 *
 * Source of truth: pack-resident `.opencode/templates/PROJECT.md.template` (v2.1).
 * Detects data from 5 sources: project files, git, docs/, pack catalog,
 * opencode-pack heuristic. Manual sections (Non-Negotiables, Architecture
 * Notes, Open Questions, Glossary) and user overrides (Build & Run,
 * Conventions) are preserved across refreshes.
 *
 * Usage:
 *   node .opencode/bin/project-init.js --init         # create PROJECT.md (overwrite)
 *   node .opencode/bin/project-init.js --refresh      # re-detect, keep manual sections
 *   node .opencode/bin/project-init.js --status       # show freshness, no write
 *   node .opencode/bin/project-init.js --check        # exit 1 if stale/missing
 *   node .opencode/bin/project-init.js --ensure       # check + bootstrap if needed (auto-run)
 *   node .opencode/bin/project-init.js --dry-run      # print to stdout, no write
 *   node .opencode/bin/project-init.js --append-event TYPE NAME [meta]
 *
 * Modes are mutually exclusive (--init takes precedence if both given).
 * --ensure: AGENTS.md behavior #9 trigger. Runs --check; if missing → --init;
 * if stale → --refresh. Always exits 0 (the ensure succeeds if the doc is
 * fresh OR after bootstrap). Output goes to stderr so it doesn't pollute
 * agent stdout.
 *
 * Zero deps, CommonJS, Windows + POSIX.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const TEMPLATE = path.join(ROOT, '.opencode', 'templates', 'PROJECT.md.template');
const OUT = path.join(ROOT, 'docs', 'PROJECT.md');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const COMMANDS_DIR = path.join(ROOT, '.opencode', 'commands');
const SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const BIN_DIR = path.join(__dirname); // .opencode/bin
const PLUGINS_DIR = path.join(ROOT, '.opencode', 'plugins');
const DOCS_DIR = path.join(ROOT, 'docs');

// ---------- arg parsing ----------

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = { _: [], mode: null, dryRun: false, force: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--init') out.mode = 'init';
    else if (a === '--refresh') out.mode = 'refresh';
    else if (a === '--status') out.mode = 'status';
    else if (a === '--check') out.mode = 'check';
    else if (a === '--ensure') out.mode = 'ensure';
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force' || a === '-f') out.force = true;
    else if (a === '--append-event') {
      out.mode = 'append';
      out.appendType = args[++i];
      out.appendName = args[++i];
      out.appendMeta = args[++i] || '';
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      out._.push(a);
    }
  }
  return out;
}

// ---------- utils ----------

function readIfExists(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function listDir(p, filter = () => true) {
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p).filter(filter);
}

function tryReadFirst(p, candidates) {
  for (const c of candidates) {
    const f = path.join(p, c);
    if (fs.existsSync(f)) return readIfExists(f);
  }
  return null;
}

function safeExec(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

function ageDays(isoDate) {
  if (!isoDate) return Infinity;
  const then = new Date(isoDate).getTime();
  if (isNaN(then)) return Infinity;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function nowISO() { return new Date().toISOString(); }

// ---------- detection ----------

const MANIFEST_FILES = [
  { name: 'package.json',  type: 'package.json' },
  { name: 'pyproject.toml', type: 'pyproject' },
  { name: 'Cargo.toml',    type: 'cargo' },
  { name: 'go.mod',        type: 'go' },
  { name: 'pubspec.yaml',  type: 'pubspec' },
  { name: 'pom.xml',       type: 'maven' },
  { name: 'build.gradle',  type: 'gradle' },
  { name: '*.csproj',      type: 'csproj' },
];

function detectManifest() {
  for (const m of MANIFEST_FILES) {
    if (m.name.includes('*')) {
      // glob-ish: list ./*.csproj
      const matches = listDir(ROOT, f => f.endsWith('.csproj'));
      if (matches.length > 0) {
        return { type: m.type, file: matches[0], data: readJson(path.join(ROOT, matches[0])) || {} };
      }
    } else {
      // Check both root and .opencode/ (opencode pack convention)
      const roots = [ROOT];
      if (fs.existsSync(path.join(ROOT, '.opencode'))) roots.push(path.join(ROOT, '.opencode'));
      for (const r of roots) {
        const p = path.join(r, m.name);
        if (fs.existsSync(p)) {
          if (m.type === 'package.json' || m.type === 'csproj') {
            return { type: m.type, file: path.relative(ROOT, p), data: readJson(p) || {} };
          }
          return { type: m.type, file: path.relative(ROOT, p), data: readIfExists(p) || '' };
        }
      }
    }
  }
  return null;
}

function detectOpencodePack() {
  // Heuristic: .opencode/ + .agents/ + opencode.json + (AGENTS.md or opencode.jsonc)
  if (!fs.existsSync(path.join(ROOT, '.opencode'))) return false;
  if (!fs.existsSync(path.join(ROOT, '.agents'))) return false;
  if (!readIfExists(path.join(ROOT, 'opencode.json'))) return false;
  // At least one pack artifact
  return listDir(AGENTS_DIR, f => f.endsWith('.md')).length > 0
      || listDir(COMMANDS_DIR, f => f.endsWith('.md')).length > 0
      || listDir(SKILLS_DIR).length > 0;
}

function detect() {
  const manifest = detectManifest();
  const isPack = detectOpencodePack();

  const data = {
    name: null,
    type: isPack ? 'opencode-pack' : null,
    description: null,
    repo: null,
    primaryLanguage: null,
    stack: { language: null, framework: null, runtime: null, packageManager: null, database: null, deployment: null },
    tooling: { testRunner: null, coverage: null, linter: null, formatter: null, ci: null, container: null, envVars: null },
    buildRun: { install: null, dev: null, test: null, lint: null, build: null, deploy: null },
    conventions: { naming: null, fileStructure: null, errorHandling: null, commits: null, branching: null, prReview: null },
    entryPoints: [],
    directoryLayout: [],
    domainMap: [],
    dataModel: { detected: false, entities: [] },
    apiSurface: { detected: false, http: [], exports: [], cli: [] },
    dependencies: { detected: false, items: [] },
    glossary: [],
    nonNegotiables: [],
    architectureNotes: [],
    openQuestions: [],
    recentActivity: [],
  };

  // ---- package.json path (most common + covers opencode pack) ----
  if (manifest && manifest.type === 'package.json') {
    const p = manifest.data;
    // For opencode packs, prefer the directory name over the .opencode/package.json name
    if (isPack) {
      data.name = path.basename(ROOT);
      data.description = `opencode starter pack — ${p.description || 'agents, skills, commands, CLIs for the opencode harness'}`;
    } else {
      data.name = p.name || path.basename(ROOT);
      data.description = p.description || null;
    }
    data.primaryLanguage = 'JavaScript/TypeScript';
    data.stack.language = p.type === 'module' ? 'JavaScript (ESM)' : 'JavaScript';
    if (p.dependencies && Object.keys(p.dependencies).some(k => k.startsWith('next'))) data.stack.framework = `Next.js ${p.dependencies.next || ''}`.trim();
    else if (p.dependencies && Object.keys(p.dependencies).some(k => k.startsWith('react'))) data.stack.framework = `React ${p.dependencies.react || ''}`.trim();
    else if (p.dependencies && Object.keys(p.dependencies).some(k => k.startsWith('vue'))) data.stack.framework = `Vue ${p.dependencies.vue || ''}`.trim();
    else if (p.dependencies && Object.keys(p.dependencies).some(k => k.startsWith('express'))) data.stack.framework = `Express ${p.dependencies.express || ''}`.trim();
    data.stack.runtime = p.engines?.node ? `node ${p.engines.node.replace(/[^\d.]/g, '')}` : 'node';
    data.stack.packageManager = fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml')) ? 'pnpm'
      : fs.existsSync(path.join(ROOT, 'yarn.lock')) ? 'yarn'
      : fs.existsSync(path.join(ROOT, 'package-lock.json')) ? 'npm' : 'npm';
    // scripts
    const s = p.scripts || {};
    data.buildRun.install = `npm install${data.stack.packageManager !== 'npm' ? ` (or ${data.stack.packageManager})` : ''}`;
    if (s.dev) data.buildRun.dev = `npm run dev`;
    if (s.test) data.buildRun.test = `npm test`;
    if (s.lint) data.buildRun.lint = `npm run lint`;
    if (s.build) data.buildRun.build = `npm run build`;
    // tooling
    if (p.devDependencies?.vitest) data.tooling.testRunner = 'vitest';
    else if (p.devDependencies?.jest) data.tooling.testRunner = 'jest';
    if (p.devDependencies?.['c8'] || p.devDependencies?.['@vitest/coverage-v8']) data.tooling.coverage = 'c8 / v8';
    if (p.devDependencies?.eslint) data.tooling.linter = 'eslint';
    else if (p.devDependencies?.biome) data.tooling.linter = 'biome';
    if (p.devDependencies?.prettier) data.tooling.formatter = 'prettier';
    // CI
    const gh = listDir(path.join(ROOT, '.github', 'workflows'), f => f.endsWith('.yml') || f.endsWith('.yaml'));
    if (gh.length > 0) data.tooling.ci = `GitHub Actions (${gh.length} workflow${gh.length > 1 ? 's' : ''})`;
    if (fs.existsSync(path.join(ROOT, 'Dockerfile'))) data.tooling.container = 'Dockerfile';
    // entry points
    if (p.main) data.entryPoints.push(`${p.main} — package main`);
    if (p.bin) {
      const bin = typeof p.bin === 'string' ? { '': p.bin } : p.bin;
      for (const [name, file] of Object.entries(bin)) data.entryPoints.push(`${file} — CLI binary${name ? ` (${name})` : ''}`);
    }
    if (data.entryPoints.length === 0) {
      ['src/index.ts', 'src/index.js', 'app.ts', 'app.js', 'cmd/main.go', 'src/main.rs', 'main.py'].forEach(c => {
        if (fs.existsSync(path.join(ROOT, c))) data.entryPoints.push(`${c} — main entry`);
      });
    }
    // dependencies
    const all = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
    data.dependencies.detected = Object.keys(all).length > 0;
    data.dependencies.items = Object.entries(all)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([name, ver]) => {
        const clean = String(ver).replace(/[\^~]/g, '').trim();
        return { name, version: clean === '*' || clean === '' ? '(any)' : clean };
      });
    // type
    if (isPack) data.type = 'opencode-pack';
    else if (p.bin) data.type = 'cli';
    else if (data.stack.framework?.includes('Next') || data.stack.framework?.includes('React') || data.stack.framework?.includes('Vue')) data.type = 'web-app';
    else data.type = 'library';
  } else if (isPack) {
    // opencode pack without package.json — fill from pack catalog
    data.name = path.basename(ROOT);
    data.type = 'opencode-pack';
    data.primaryLanguage = 'Markdown + JavaScript';
    data.stack.language = 'JavaScript (CLIs) + Markdown (agents/skills/commands)';
    data.stack.framework = 'opencode';
    data.stack.runtime = 'node 20+ (for CLIs)';
    data.stack.packageManager = 'npm (peer plugins)';
  } else if (manifest && manifest.type === 'pyproject') {
    data.primaryLanguage = 'Python';
    data.type = 'library';
    // minimal pyproject parse
    const py = manifest.data;
    const nameMatch = py.match(/^name\s*=\s*["']([^"']+)["']/m);
    if (nameMatch) data.name = nameMatch[1];
    const descMatch = py.match(/^description\s*=\s*["']([^"']+)["']/m);
    if (descMatch) data.description = descMatch[1];
    data.stack.runtime = 'python';
    data.stack.packageManager = fs.existsSync(path.join(ROOT, 'poetry.lock')) ? 'poetry'
      : fs.existsSync(path.join(ROOT, 'Pipfile.lock')) ? 'pipenv'
      : fs.existsSync(path.join(ROOT, 'uv.lock')) ? 'uv' : 'pip';
  } else if (manifest && manifest.type === 'cargo') {
    data.primaryLanguage = 'Rust';
    data.type = 'cli';
    const ct = manifest.data;
    const nameMatch = ct.match(/^name\s*=\s*"([^"]+)"/m);
    if (nameMatch) data.name = nameMatch[1];
    const descMatch = ct.match(/^description\s*=\s*"([^"]+)"/m);
    if (descMatch) data.description = descMatch[1];
    data.stack.runtime = 'rust';
    data.stack.packageManager = 'cargo';
  } else if (manifest && manifest.type === 'go') {
    data.primaryLanguage = 'Go';
    data.type = 'cli';
    const g = manifest.data;
    const nameMatch = g.match(/^module\s+(\S+)/m);
    if (nameMatch) data.name = nameMatch[1].split('/').pop();
    data.stack.runtime = 'go';
    data.stack.packageManager = 'go mod';
  }

  // env vars
  const envEx = path.join(ROOT, '.env.example');
  if (fs.existsSync(envEx)) {
    const envContent = readIfExists(envEx) || '';
    const envLines = envContent.split('\n').filter(l => /^[A-Z_][A-Z0-9_]*=/.test(l));
    if (envLines.length > 0) data.tooling.envVars = envLines.length;
  }

  // git remote
  data.repo = safeExec('git config --get remote.origin.url') || 'local only';

  // conventions — read from CONTRIBUTING.md / commit history
  const contributing = readIfExists(path.join(ROOT, 'CONTRIBUTING.md'));
  if (contributing) {
    if (/conventional commit/i.test(contributing)) data.conventions.commits = 'conventional commits';
    if (/git[- ]?flow/i.test(contributing)) data.conventions.branching = 'git-flow';
    else if (/trunk[- ]based/i.test(contributing)) data.conventions.branching = 'trunk-based';
    else if (/GitHub flow/i.test(contributing)) data.conventions.branching = 'GitHub flow';
  }
  // commits from history
  const recentCommits = safeExec('git log --oneline -20 --pretty=format:"%s"');
  if (recentCommits) {
    if (/^(feat|fix|chore|docs|refactor|test|perf|build|ci)(\(.+\))?!?:/.test(recentCommits.split('\n').find(Boolean) || '')) {
      data.conventions.commits = data.conventions.commits || 'conventional commits';
    }
  }

  // directory layout
  const topDirs = listDir(ROOT, f => fs.statSync(path.join(ROOT, f)).isDirectory() && !f.startsWith('.') && f !== 'node_modules');
  const known = {
    'src': 'application code',
    'lib': 'library code',
    'app': 'application code',
    'tests': 'test suites',
    'test': 'test suites',
    'docs': 'project documentation (this file lives here)',
    'scripts': 'dev scripts',
    'bin': 'CLI binaries',
    'public': 'static assets',
    'static': 'static assets',
  };
  for (const d of topDirs) {
    if (known[d]) data.directoryLayout.push(`\`${d}/\` — ${known[d]}`);
  }
  // Add opencode-pack subdirs
  if (isPack) {
    if (fs.existsSync(AGENTS_DIR)) data.directoryLayout.push('`.opencode/agents/` — sub-agent definitions (72)');
    if (fs.existsSync(COMMANDS_DIR)) data.directoryLayout.push('`.opencode/commands/` — slash commands (64)');
    if (fs.existsSync(SKILLS_DIR)) data.directoryLayout.push('`.agents/skills/` — knowledge skills (20)');
    if (fs.existsSync(BIN_DIR)) data.directoryLayout.push('`.opencode/bin/` — native CLIs (13, zero deps)');
    if (fs.existsSync(PLUGINS_DIR)) data.directoryLayout.push('`.opencode/plugins/` — local plugins');
  }

  // domain map (opencode pack)
  if (isPack) {
    data.domainMap = [
      { module: 'agents', desc: '72 sub-agents (reviewers, resolvers, planners, specialists)' },
      { module: 'commands', desc: '64 slash commands (workflows + dispatchers)' },
      { module: 'skills', desc: '20 knowledge skills (patterns, processes, security)' },
      { module: 'bin', desc: '13 native CLIs (zero deps, CommonJS, cross-platform)' },
      { module: 'plugins', desc: '4 plugins (3 npm + 1 local hookify.js)' },
    ];
  }

  // ---- docs/ inventory → Recent Activity ----
  if (fs.existsSync(DOCS_DIR)) {
    const recent = [];
    for (const sub of ['prds', 'plans', 'audits', 'reports', 'sessions']) {
      const dir = path.join(DOCS_DIR, sub);
      if (!fs.existsSync(dir)) continue;
      for (const f of listDir(dir, f => f.endsWith('.md'))) {
        const stat = fs.statSync(path.join(dir, f));
        recent.push({
          type: sub.replace(/s$/, ''),  // 'prds' → 'prd'
          file: `docs/${sub}/${f}`,
          title: f.replace(/^\d{4}-\d{2}-\d{2}_\d{4}-/, '').replace(/\.\w+$/, '').replace(/[-_]/g, ' '),
          date: stat.mtime.toISOString().slice(0, 10),
        });
      }
    }
    data.recentActivity = recent.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }

  return data;
}

// ---------- template rendering ----------

function statusIndicator(existing) {
  if (!existing) return { emoji: '⚪', label: 'no project context', age: '—' };
  // Look for the Init: / Refresh: line
  const m = existing.match(/\*\*Init\*\*:\s*(\S+).*?\*\*Refresh\*\*:\s*(\S+)/s);
  const ref = m ? m[2] : null;
  if (!ref) return { emoji: '⚪', label: 'no timestamp', age: '—' };
  const d = ageDays(ref);
  let emoji, label;
  if (d <= 3) { emoji = '🟢'; label = 'fresh'; }
  else if (d <= 7) { emoji = '🟡'; label = 'aging'; }
  else { emoji = '🔴'; label = 'stale'; }
  const ageText = d < 1 ? `${Math.round(d * 24)}h ago` : `${Math.round(d)}d ago`;
  return { emoji, label, age: ageText };
}

// Extract manual sections from existing PROJECT.md: content between
// "## Section" heading and the next "## " heading.
function extractManualSections(existing) {
  if (!existing) return {};
  const sections = {};
  // Strip frontmatter/comments to avoid spurious matches
  const lines = existing.split('\n');
  let current = null;
  let buf = [];
  const manualSections = new Set(['Glossary', 'Non-Negotiables', 'Architecture Notes', 'Open Questions']);
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      if (current && manualSections.has(current)) {
        const content = buf.join('\n').trim();
        // Treat placeholder/empty content (e.g. "```", "TBD", "...") as no content
        const isPlaceholder = /^[`'.~\-*\s]*$/.test(content) || /^(tbd|todo|wip|n\/a|placeholder)$/i.test(content);
        if (content && !isPlaceholder) sections[current] = content;
      }
      current = m[1].trim();
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current && manualSections.has(current)) {
    const content = buf.join('\n').trim();
    const isPlaceholder = /^[`'.~\-*\s]*$/.test(content) || /^(tbd|todo|wip|n\/a|placeholder)$/i.test(content);
    if (content && !isPlaceholder) sections[current] = content;
  }
  return sections;
}

// Extract override section: content after "<!-- Override -->" comment in
// Build & Run and Conventions sections.
function extractOverrides(existing) {
  if (!existing) return {};
  const out = {};
  const sections = ['Build & Run', 'Conventions'];
  for (const sec of sections) {
    const re = new RegExp(`##\\s+${sec}[\\s\\S]*?(?=\\n##\\s|$)`);
    const m = existing.match(re);
    if (!m) continue;
    const block = m[0];
    const ov = block.indexOf('<!-- Override');
    if (ov >= 0) {
      const after = block.slice(ov).split('\n').slice(1).join('\n').trim();
      if (after.length > 0) out[sec] = after;
    }
  }
  return out;
}

function buildRecentActivityBlock(detected, existing) {
  const lines = [];
  if (existing) {
    // Extract existing Recent Activity entries (lines starting with `- 20` or `- [` or `- YYYY`)
    const re = /##\s+Recent Activity\s+([\s\S]*?)(?=\n##\s|$)/;
    const m = existing.match(re);
    if (m) {
      // Keep only lines that look like entries
      const kept = m[1].split('\n').filter(l => /^-\s/.test(l) || l.trim() === '');
      // Drop trailing blanks
      while (kept.length > 0 && kept[kept.length - 1].trim() === '') kept.pop();
      if (kept.length > 0) lines.push(kept.join('\n'));
    }
  }
  // Append newly detected events (dedup by file)
  const seen = new Set();
  if (lines.length > 0) {
    for (const l of lines.join('\n').split('\n')) {
      const m = l.match(/\[(\w+)\]\(([^)]+)\)/);
      if (m) seen.add(m[2]);
    }
  }
  for (const ev of detected.recentActivity) {
    if (seen.has(ev.file)) continue;
    lines.push(`- ${ev.date} — [${ev.type}](${ev.file}): "${ev.title}"`);
  }
  return lines.length > 0 ? lines.join('\n') : '<!-- (no activity detected yet) -->';
}

function render(template, detected, manual, overrides, opts) {
  const now = nowISO();
  const initDate = opts.initDate || todayISO();
  const status = statusIndicator(opts.existing);

  let out = template;

  // Header substitutions
  out = out.replace('{NAME}', detected.name || path.basename(ROOT));
  out = out.replace('{STATUS_EMOJI}', status.emoji);
  out = out.replace('{STATUS_LABEL}', status.label);
  out = out.replace('{AGE_TEXT}', status.age);
  out = out.replace('{INIT_DATE}', initDate);
  out = out.replace('{REFRESH_DATE}', todayISO());

  // Identity
  out = out.replace(/- \*\*Name\*\*: \{name\}/, `- **Name**: ${detected.name || path.basename(ROOT)}`);
  out = out.replace(/- \*\*Type\*\*: \{web-app \| api-service \| cli \| library \| monorepo \| opencode-pack \| \.\.\.\}/,
    `- **Type**: ${detected.type || 'not detected'}`);
  out = out.replace(/- \*\*Description\*\*: \{one-line from README or package\.json\}/,
    `- **Description**: ${detected.description || '— (run `--init` after adding description)'}`);
  out = out.replace(/- \*\*Repo\*\*: \{git remote URL or "local only"\}/,
    `- **Repo**: ${detected.repo}`);
  out = out.replace(/- \*\*Primary language\*\*: \{language\}/,
    `- **Primary language**: ${detected.primaryLanguage || '—'}`);

  // Stack
  const s = detected.stack;
  out = out.replace(/- \*\*Language\*\*: \{lang\}/, `- **Language**: ${s.language || '—'}`);
  out = out.replace(/- \*\*Framework\*\*: \{framework \+ version\}/, `- **Framework**: ${s.framework || '—'}`);
  out = out.replace(/- \*\*Runtime \/ Build\*\*: \{node 20, python 3\.12, rust stable, \.\.\.\}/, `- **Runtime / Build**: ${s.runtime || '—'}`);
  out = out.replace(/- \*\*Package manager\*\*: \{npm \| pnpm \| yarn \| poetry \| cargo \| go mod \| pub \| gradle\}/, `- **Package manager**: ${s.packageManager || '—'}`);
  out = out.replace(/- \*\*Database\*\*: \{postgres \| sqlite \| mongodb \| \.\.\. \| none detected\}/, `- **Database**: ${s.database || 'none detected'}`);
  out = out.replace(/- \*\*Deployment\*\*: \{vercel \| aws \| docker \| fly\.io \| \.\.\. \| not detected\}/, `- **Deployment**: ${s.deployment || 'not detected'}`);

  // Tooling
  const t = detected.tooling;
  out = out.replace(/- \*\*Test runner\*\*: \{vitest \| jest \| pytest \| go test \| \.\.\.\}/, `- **Test runner**: ${t.testRunner || '—'}`);
  out = out.replace(/- \*\*Coverage\*\*: \{c8 \| codecov \| \.\.\. \| not detected\}/, `- **Coverage**: ${t.coverage || 'not detected'}`);
  out = out.replace(/- \*\*Linter\*\*: \{eslint \| biome \| ruff \| golangci-lint \| \.\.\.\}/, `- **Linter**: ${t.linter || '—'}`);
  out = out.replace(/- \*\*Formatter\*\*: \{prettier \| biome \| black \| rustfmt \| gofmt\}/, `- **Formatter**: ${t.formatter || '—'}`);
  out = out.replace(/- \*\*CI\*\*: \{GitHub Actions \(3 workflows\) \| GitLab CI \| \.\.\.\}/, `- **CI**: ${t.ci || 'not detected'}`);
  out = out.replace(/- \*\*Container\*\*: \{Dockerfile \| docker-compose \| \.\.\.\}/, `- **Container**: ${t.container || '—'}`);
  out = out.replace(/- \*\*Env vars\*\*: \{12 detected — see \.env\.example\}/,
    `- **Env vars**: ${t.envVars ? `${t.envVars} detected — see .env.example` : 'not detected'}`);

  // Build & Run — apply override if present
  const br = detected.buildRun;
  const brOverride = overrides['Build & Run'];
  const brBlock = brOverride
    ? brOverride
    : [
        `- **Install**: \`${br.install || '—'}\``,
        `- **Dev**: \`${br.dev || '—'}\``,
        `- **Test**: \`${br.test || '—'}\``,
        `- **Lint**: \`${br.lint || '—'}\``,
        `- **Build**: \`${br.build || '—'}\``,
        `- **Deploy**: \`${br.deploy || '—'}\``,
        '',
        '<!-- Override the detected commands above. Refresh keeps your edits. -->',
      ].join('\n');
  out = out.replace(/- \*\*Install\*\*: `npm install`[\s\S]*?(?=\n##\s)/,
    brBlock + '\n');

  // Conventions
  const cv = detected.conventions;
  const cvOverride = overrides['Conventions'];
  const cvBlock = cvOverride
    ? cvOverride
    : [
        `- **Naming**: ${cv.naming || '—'}`,
        `- **File structure**: ${cv.fileStructure || '—'}`,
        `- **Error handling**: ${cv.errorHandling || '—'}`,
        `- **Commits**: ${cv.commits || '—'}`,
        `- **Branching**: ${cv.branching || '—'}`,
        `- **PR review**: ${cv.prReview || '—'}`,
        '',
        '<!-- Override auto-detected values below. Refresh keeps your edits. -->',
      ].join('\n');
  out = out.replace(/- \*\*Naming\*\*: \{[\s\S]*?(?=\n##\s)/,
    cvBlock + '\n');

  // Entry Points
  if (detected.entryPoints.length > 0) {
    out = out.replace(/- `src\/index\.ts` — main entry\s*- `bin\/cli\.js` — CLI binary/,
      detected.entryPoints.map(e => `- \`${e}\``).join('\n'));
  } else {
    out = out.replace(/- `src\/index\.ts` — main entry\s*- `bin\/cli\.js` — CLI binary/,
      '- (no entry points detected)');
  }

  // Directory Layout
  if (detected.directoryLayout.length > 0) {
    out = out.replace(/- `src\/` — application code[\s\S]*?(?=\n##\s)/,
      detected.directoryLayout.join('\n') + '\n');
  }

  // Domain Map
  if (detected.domainMap.length > 0) {
    out = out.replace(/- \*\*\{module\}\*\*: \{one-line purpose\}[\s\S]*?(?=\n##\s|\n<!-- conditional)/,
      detected.domainMap.map(d => `- **${d.module}**: ${d.desc}`).join('\n') + '\n');
  }

  // ---- Conditional sections ----

  // Data Model
  if (!detected.dataModel.detected) {
    // Remove the whole block (markers + heading + body) and any trailing blank lines
    out = out.replace(/<!-- conditional:data-model -->[\s\S]*?<!-- \/conditional -->\n*/g, '');
  }

  // API Surface
  if (!detected.apiSurface.detected) {
    out = out.replace(/<!-- conditional:api-surface -->[\s\S]*?<!-- \/conditional -->\n*/g, '');
  }

  // Dependencies
  if (detected.dependencies.detected && detected.dependencies.items.length > 0) {
    const depLines = detected.dependencies.items.map(d => `- **${d.name}** \`${d.version}\``);
    out = out.replace(/- \*\*\{dep\} \{version\}\*\*: \{why chosen\}[\s\S]*?(?=\n##\s|\n<!-- conditional)/,
      depLines.join('\n') + '\n');
  } else {
    out = out.replace(/<!-- conditional:dependencies -->[\s\S]*?<!-- \/conditional -->\n*/g, '');
  }

  // ---- Manual sections (preserved from existing or templates) ----
  for (const sec of ['Glossary', 'Non-Negotiables', 'Architecture Notes', 'Open Questions']) {
    const re = new RegExp(`(##\\s+${sec}\\s+<!-- manual[^>]*-->)\\n[\\s\\S]*?(?=\\n##\\s|$)`);
    if (manual[sec]) {
      out = out.replace(re, `$1\n\n${manual[sec]}\n`);
    }
    // else: keep template placeholders
  }

  // ---- Recent Activity (auto-managed) ----
  const activityBlock = buildRecentActivityBlock(detected, opts.existing);
  out = out.replace(/##\s+Recent Activity\s+<!-- auto-managed[\s\S]*$/m,
    `## Recent Activity\n<!-- auto-managed: appended by project-init.js. Do not edit by hand. -->\n\n${activityBlock}\n`);

  return out;
}

// ---------- main ----------

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    process.stdout.write(fs.readFileSync(__filename, 'utf8')
      .split('\n')
      .filter(l => l.startsWith(' *') || l.startsWith('// '))
      .join('\n') + '\n');
    return;
  }

  const template = readIfExists(TEMPLATE);
  if (!template) {
    process.stderr.write(`ERROR: template not found at ${TEMPLATE}\n`);
    process.exit(1);
  }
  const existing = readIfExists(OUT);

  if (args.mode === 'status') {
    const s = statusIndicator(existing);
    process.stdout.write(`Status: ${s.emoji} ${s.label} (${s.age})\n`);
    if (existing) process.stdout.write(`Path:   ${OUT}\n`);
    else process.stdout.write(`Path:   ${OUT} (does not exist — run --init)\n`);
    return;
  }

  if (args.mode === 'check') {
    if (!existing) { process.stderr.write('STALE: PROJECT.md missing\n'); process.exit(1); }
    const s = statusIndicator(existing);
    if (s.label === 'stale') { process.stderr.write(`STALE: ${s.age}\n`); process.exit(1); }
    process.stdout.write(`OK: ${s.emoji} ${s.label} (${s.age})\n`);
    return;
  }

  if (args.mode === 'ensure') {
    // AGENTS.md behavior #9: check PROJECT.md, bootstrap if missing/stale.
    // All output to stderr so it doesn't pollute agent stdout.
    args.quiet = true;
    const log = (msg) => process.stderr.write(`[project-init --ensure] ${msg}\n`);

    if (!existing) {
      log('PROJECT.md missing → bootstrapping with --init');
      args.mode = 'init';
      args.force = true; // ensure always writes, never refuses
    } else {
      const s = statusIndicator(existing);
      if (s.label === 'stale') {
        log(`PROJECT.md stale (${s.age}) → refreshing with --refresh`);
        args.mode = 'refresh';
      } else {
        log(`PROJECT.md ${s.emoji} ${s.label} (${s.age}) — no action`);
        return;
      }
    }
    // fall through to the init/refresh path below
  }

  if (args.mode === 'append') {
    if (!existing) { process.stderr.write('ERROR: PROJECT.md does not exist; run --init first\n'); process.exit(1); }
    if (!args.appendType || !args.appendName) {
      process.stderr.write('ERROR: --append-event requires TYPE and NAME\n');
      process.exit(1);
    }
    const entry = `- ${todayISO()} — [${args.appendType}](${args.appendName})${args.appendMeta ? ': ' + args.appendMeta : ''}`;
    const re = /(##\s+Recent Activity[\s\S]*?)(?=\n##\s|$)/;
    const m = existing.match(re);
    if (!m) {
      // append at end
      fs.writeFileSync(OUT, existing.trimEnd() + '\n\n' + entry + '\n', 'utf8');
    } else {
      // insert after the comment block, before first entry (or at end)
      const block = m[1];
      const lines = block.split('\n');
      // find first `- ` line
      const idx = lines.findIndex(l => /^-\s/.test(l));
      const newBlock = idx >= 0
        ? [...lines.slice(0, idx), entry, ...lines.slice(idx)].join('\n')
        : block.trimEnd() + '\n' + entry;
      fs.writeFileSync(OUT, existing.replace(re, newBlock), 'utf8');
    }
    process.stdout.write(`Appended: ${entry}\n`);
    return;
  }

  // init or refresh
  const detected = detect();
  const manual = extractManualSections(existing);
  const overrides = extractOverrides(existing);

  // Preserve init date from existing
  let initDate = todayISO();
  if (existing) {
    const m = existing.match(/\*\*Init\*\*:\s*(\S+)/);
    if (m) initDate = m[1];
  }

  const output = render(template, detected, manual, overrides, { existing, initDate });

  if (args.dryRun || (!args.mode && args._.length === 0)) {
    process.stdout.write(output);
    if (!args.dryRun) {
      process.stderr.write('\n(Refusing to write without --init or --refresh. Use --dry-run to preview, --init to overwrite, --refresh to update.)\n');
      process.exit(1);
    }
    return;
  }

  if (args.mode === 'init' && existing && !args.force) {
    process.stderr.write(`PROJECT.md already exists. Use --refresh to update, or pass --force to overwrite.\n`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output, 'utf8');
  if (args.quiet) {
    // --ensure: log to stderr only
    process.stderr.write(`Wrote ${OUT} (${output.length} bytes, ${detected.recentActivity.length} activity entries)\n`);
  } else {
    process.stdout.write(`Wrote ${OUT} (${output.length} bytes, ${detected.recentActivity.length} activity entries)\n`);
  }
}

main();
