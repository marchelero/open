#!/usr/bin/env node
/**
 * knowledge.js — cross-project knowledge memory CLI (zero-dep, Node 18).
 *
 * Stores reusable learnings (title/body/tags/project) in a global, per-user
 * JSON file and retrieves them by relevance with the BM25 lexical engine in
 * bin/lib/knowledge-engine.js (which reuses the router tokenizer).
 *
 * Store (global by default):   ~/.config/opencode/knowledge/knowledge.json
 * Test/CI override:            OPENCODE_KNOWLEDGE_HOME=<dir>  (-> <dir>/knowledge.json)
 * Nothing is ever written to the real home when the override is set.
 *
 * Usage:
 *   knowledge.js add    --title "..." --body "..." [--tags a,b] [--project X] [--source manual] [--json]
 *   knowledge.js search "<query>" [--top N] [--tag X] [--project Y] [--json]
 *   knowledge.js list   [--project X] [--tag Y] [--json]
 *   knowledge.js export [--output FILE] [--json]
 *   knowledge.js import FILE [--merge|--replace] [--json]
 *   knowledge.js stats  [--json]
 *   knowledge.js --eval [--json]      # run evals/knowledge/cases.json (gate)
 *   knowledge.js help
 *
 * Exit codes: 0 = ok / gate passed; 1 = usage error, empty store, secret
 * rejected, bad import, or eval gate failed. ASCII output, no network.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const engine = require('./lib/knowledge-engine.js');

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'evals', 'knowledge', 'cases.json');

const TOP1_DELTA = 20; // percentage points over the substring-in-title baseline
const TOP3_MIN = 80; // percent

// Obvious secret shapes: refuse to persist them rather than leak credentials
// into a global store. Deliberately conservative; no content is ever logged.
const SECRET_PATTERNS = [
  { re: /sk-[A-Za-z0-9]{10,}/, what: 'api key (sk-...)' },
  { re: /AKIA[0-9A-Z]{12,}/, what: 'aws access key (AKIA...)' },
  { re: /BEGIN[ A-Z]*PRIVATE KEY/, what: 'private key block' },
  { re: /password\s*[=:]/i, what: 'inline password' },
  { re: /[A-Za-z0-9_-]{32,}/, what: 'long opaque token' },
];

const VALUE_FLAGS = new Set([
  '--title', '--body', '--tags', '--source', '--project', '--top', '--tag', '--output',
]);

function knowledgeHome() {
  const override = process.env.OPENCODE_KNOWLEDGE_HOME;
  if (override && override.trim()) return path.resolve(override.trim());
  return path.join(os.homedir(), '.config', 'opencode', 'knowledge');
}

function storePath() {
  return path.join(knowledgeHome(), 'knowledge.json');
}

function parseArgs(args) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      if (VALUE_FLAGS.has(a)) {
        flags[a.slice(2)] = args[i + 1];
        i++;
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

function findSecret(text) {
  for (const p of SECRET_PATTERNS) if (p.re.test(text)) return p.what;
  return null;
}

function emptyStore() {
  return { version: 1, entries: [] };
}

function loadStore() {
  const p = storePath();
  if (!fs.existsSync(p)) return { store: emptyStore(), exists: false };
  let data;
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { store: null, exists: true, error: 'store invalido: ' + e.message };
  }
  if (!data || typeof data !== 'object') return { store: null, exists: true, error: 'store invalido' };
  if (!Array.isArray(data.entries)) data.entries = [];
  if (!data.version) data.version = 1;
  return { store: data, exists: true };
}

function writeStore(store) {
  const p = storePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

function out(asJson, obj, textLines) {
  if (asJson) {
    process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
  } else {
    process.stdout.write((textLines || []).join('\n') + '\n');
  }
}

function fail(msg, asJson) {
  if (asJson) process.stdout.write(JSON.stringify({ ok: false, error: msg }, null, 2) + '\n');
  else process.stderr.write('knowledge: ' + msg + '\n');
  process.exit(1);
}

const round = (n) => Math.round(n * 1000) / 1000;

// --------------------------------------------------------------------- add

function cmdAdd(args, asJson) {
  const { flags } = parseArgs(args);
  const title = flags.title;
  const body = flags.body;
  if (!title || !body) fail('add requiere --title y --body', asJson);

  const secret = findSecret(String(title) + '\n' + String(body));
  if (secret) fail('rechazado: parece contener un secreto (' + secret + ')', asJson);

  const { store, error } = loadStore();
  if (error) fail(error, asJson);

  const now = new Date().toISOString();
  const tags = engine.normalizeTags(flags.tags || '');
  const project = flags.project || path.basename(process.cwd());
  const entry = {
    id: 'kb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    title: String(title),
    body: String(body),
    tags,
    project,
    created: now,
    updated: now,
    source: flags.source || 'manual',
  };
  store.entries.push(entry);
  writeStore(store);

  out(asJson, { ok: true, id: entry.id, title: entry.title, project, tags, created: now }, [
    'Added ' + entry.id + ' (' + project + ')',
  ]);
  process.exit(0);
}

// ------------------------------------------------------------------ search

function filterEntries(entries, flags) {
  let list = entries;
  if (flags.tag) {
    const tag = String(flags.tag).toLowerCase();
    list = list.filter((e) => (e.tags || []).some((t) => String(t).toLowerCase() === tag));
  }
  if (flags.project) {
    const proj = String(flags.project);
    list = list.filter((e) => String(e.project) === proj);
  }
  return list;
}

function cmdSearch(args, asJson) {
  const { flags, positionals } = parseArgs(args);
  const query = positionals.join(' ').trim();
  if (!query) fail('search requiere una query', asJson);

  const top = Math.max(1, parseInt(flags.top || '3', 10) || 3);
  const { store, error } = loadStore();
  if (error) fail(error, asJson);
  const filtered = filterEntries(store.entries || [], flags);
  if (filtered.length === 0) {
    out(asJson, { query, count: 0, mode: 'lexical', results: [] }, [
      'No entries in the store (query: ' + query + ')',
    ]);
    process.exit(1);
  }

  const index = engine.buildIndex(filtered);
  const results = engine.rank(index, query, top).map((r) => ({
    id: r.entry.id,
    title: r.entry.title,
    score: round(r.score),
    matched: r.matched,
    tags: r.entry.tags || [],
    project: r.entry.project || '',
  }));

  out(asJson, { query, count: results.length, mode: 'lexical', results }, [
    '[knowledge] "' + query + '" (' + results.length + ')',
    ...results.map(
      (r, i) => '  ' + (i + 1) + '. ' + r.id + '  ' + r.score + '  ' + r.title
    ),
  ]);
  process.exit(results.length > 0 ? 0 : 1);
}

// -------------------------------------------------------------------- list

function cmdList(args, asJson) {
  const { flags } = parseArgs(args);
  const { store, error } = loadStore();
  if (error) fail(error, asJson);
  const entries = filterEntries(store.entries || [], flags).slice().sort((a, b) =>
    String(b.updated || '').localeCompare(String(a.updated || '')) ||
    String(a.id).localeCompare(String(b.id))
  );
  const rows = entries.map((e) => ({
    id: e.id,
    title: e.title,
    tags: e.tags || [],
    project: e.project || '',
    created: e.created || '',
    updated: e.updated || '',
    source: e.source || '',
  }));
  out(asJson, { count: rows.length, entries: rows }, [
    entries.length + ' entrie(s) in ' + storePath(),
    ...rows.map((r) => '  ' + r.id + '  [' + r.project + ']  ' + r.title),
  ]);
  process.exit(entries.length > 0 ? 0 : 1);
}

// ------------------------------------------------------------------ export

function cmdExport(args, asJson) {
  const { flags } = parseArgs(args);
  const { store, error } = loadStore();
  if (error) fail(error, asJson);
  if (flags.output) {
    const abs = path.resolve(String(flags.output));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(store, null, 2) + '\n', 'utf8');
    out(asJson, { ok: true, output: abs, count: store.entries.length }, [
      'Exported ' + store.entries.length + ' entrie(s) -> ' + abs,
    ]);
  } else {
    process.stdout.write(JSON.stringify(store, null, 2) + '\n');
  }
  process.exit(0);
}

// ------------------------------------------------------------------ import

function cmdImport(args, asJson) {
  const { flags, positionals } = parseArgs(args);
  const src = positionals[0];
  if (!src) fail('import requiere un FILE', asJson);
  const abs = path.resolve(src);
  if (!fs.existsSync(abs)) fail('archivo no encontrado: ' + src, asJson);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    return fail('JSON invalido: ' + e.message, asJson);
  }
  const incomingRaw = Array.isArray(data) ? data : data && data.entries;
  if (!Array.isArray(incomingRaw)) return fail('formato invalido: falta entries[]', asJson);

  const { store, error } = loadStore();
  if (error) fail(error, asJson);

  const incoming = incomingRaw.map(engine.normalizeEntry).filter((e) => e.title);
  const replace = flags.replace === true;
  let imported = 0;
  let skipped = 0;

  if (replace) {
    store.entries = incoming.map((e) => ({
      ...e,
      id: e.id || 'kb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    }));
    imported = store.entries.length;
  } else {
    const seen = new Set(store.entries.map((e) => e.id).filter(Boolean));
    for (const e of incoming) {
      const id = e.id || 'kb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      if (seen.has(id)) {
        skipped++;
        continue;
      }
      seen.add(id);
      store.entries.push({ ...e, id });
      imported++;
    }
  }
  writeStore(store);

  out(asJson, { ok: true, imported, skipped, total: store.entries.length, mode: replace ? 'replace' : 'merge' }, [
    'Import (' + (replace ? 'replace' : 'merge') + '): imported=' + imported + ' skipped=' + skipped + ' total=' + store.entries.length,
  ]);
  process.exit(0);
}

// ------------------------------------------------------------------- stats

function cmdStats(args, asJson) {
  const { store, error } = loadStore();
  if (error) fail(error, asJson);
  const entries = store.entries || [];
  const byProject = {};
  const byTag = {};
  let latest = '';
  for (const e of entries) {
    const p = e.project || '(none)';
    byProject[p] = (byProject[p] || 0) + 1;
    for (const t of e.tags || []) byTag[t] = (byTag[t] || 0) + 1;
    if (e.updated && e.updated > latest) latest = e.updated;
  }
  const stats = {
    version: store.version || 1,
    count: entries.length,
    projects: byProject,
    tags: byTag,
    latest: latest || null,
    home: knowledgeHome(),
  };
  out(asJson, stats, [
    'entries : ' + stats.count,
    'home    : ' + stats.home,
    'latest  : ' + (stats.latest || 'n/a'),
    'projects: ' + Object.keys(byProject).map((k) => k + '=' + byProject[k]).join(', '),
  ]);
  process.exit(0);
}

// -------------------------------------------------------------------- eval

function loadFixture() {
  let raw;
  try {
    raw = fs.readFileSync(FIXTURE, 'utf8');
  } catch {
    return { error: 'no existe evals/knowledge/cases.json' };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { error: 'cases.json invalido: ' + e.message };
  }
  const entries = Array.isArray(data.entries) ? data.entries.map(engine.normalizeEntry) : null;
  const cases = Array.isArray(data.cases) ? data.cases : null;
  if (!entries || !cases || cases.length === 0) return { error: 'cases.json sin entries[]/cases[]' };
  return { entries, cases };
}

function cmdEval(asJson) {
  const { entries, cases, error } = loadFixture();
  if (error) {
    if (asJson) process.stdout.write(JSON.stringify({ mode: 'eval', ok: false, gate: false, error }, null, 2) + '\n');
    else process.stderr.write('[knowledge-eval] ERROR: ' + error + '\n');
    process.exit(1);
  }

  const index = engine.buildIndex(entries);
  const byId = new Set(entries.map((e) => e.id));
  const byTitle = new Map(entries.map((e) => [e.title, e.id]));
  const n = cases.length;
  let top1 = 0;
  let top3 = 0;
  let baselineTop1 = 0;
  const failures = [];

  for (const c of cases) {
    const expected = c.expected_id || byTitle.get(c.expected_title);
    const ranked = engine.rank(index, c.query, 3).map((r) => r.entry.id);
    const base = engine.baselineRank(entries, c.query, 3).map((r) => r.entry.id);
    if (ranked[0] === expected) top1++;
    if (ranked.slice(0, 3).indexOf(expected) !== -1) top3++;
    if (base[0] === expected) baselineTop1++;
    if (ranked[0] !== expected) {
      failures.push({ query: c.query, expected: expected || null, got: ranked[0] || null });
    }
    if (expected && !byId.has(expected)) {
      failures.push({ query: c.query, expected, got: 'unknown-id' });
    }
  }

  const pct = (x) => Math.round((x / n) * 100);
  const top1Pct = pct(top1);
  const top3Pct = pct(top3);
  const baselinePct = pct(baselineTop1);
  const delta = top1Pct - baselinePct;
  const gate = delta >= TOP1_DELTA && top3Pct >= TOP3_MIN;

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        {
          mode: 'eval',
          cases: n,
          entries: entries.length,
          top1: top1Pct,
          top3: top3Pct,
          baseline_top1: baselinePct,
          delta,
          thresholds: { top1_delta: TOP1_DELTA, top3: TOP3_MIN },
          gate,
          ok: gate,
          failures,
        },
        null,
        2
      ) + '\n'
    );
  } else {
    process.stdout.write('[knowledge-eval] cases=' + n + ' entries=' + entries.length + '\n');
    process.stdout.write('  top1          = ' + top1Pct + '%  (' + top1 + '/' + n + ')\n');
    process.stdout.write('  top3          = ' + top3Pct + '%  (' + top3 + '/' + n + ')\n');
    process.stdout.write('  baseline_top1 = ' + baselinePct + '%  (' + baselineTop1 + '/' + n + ')\n');
    process.stdout.write('  delta         = ' + delta + ' pts (need >= ' + TOP1_DELTA + ')\n');
    process.stdout.write('  top3 gate     = ' + top3Pct + '% (need >= ' + TOP3_MIN + '%)\n');
    process.stdout.write('  verdict       = ' + (gate ? 'PASS' : 'FAIL') + '\n');
    if (!gate && failures.length) {
      process.stdout.write('  misses (expected -> got):\n');
      for (const f of failures.slice(0, 10)) {
        process.stdout.write('    "' + f.query + '" ' + f.expected + ' -> ' + f.got + '\n');
      }
    }
  }
  process.exit(gate ? 0 : 1);
}

// -------------------------------------------------------------------- help

function usage() {
  process.stdout.write(
    [
      'knowledge.js - cross-project knowledge memory (BM25, zero-dep)',
      '',
      'Usage:',
      '  knowledge.js add    --title "..." --body "..." [--tags a,b] [--project X] [--source manual] [--json]',
      '  knowledge.js search "<query>" [--top N] [--tag X] [--project Y] [--json]',
      '  knowledge.js list   [--project X] [--tag Y] [--json]',
      '  knowledge.js export [--output FILE] [--json]',
      '  knowledge.js import FILE [--merge|--replace] [--json]',
      '  knowledge.js stats  [--json]',
      '  knowledge.js --eval [--json]',
      '  knowledge.js help',
      '',
      'Store: ' + storePath(),
      'Override: OPENCODE_KNOWLEDGE_HOME=<dir>',
      '',
    ].join('\n')
  );
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const cmd = argv.find((a) => !a.startsWith('--'));

  if (argv.includes('--eval') || argv.includes('help') || argv.includes('--help') || argv.includes('-h')) {
    if (argv.includes('--eval') || (asJson && !cmd)) return cmdEval(asJson);
    usage();
    return;
  }
  // `--json` with no subcommand is the metric gate (mirrors route-match.js).
  if (asJson && !cmd) return cmdEval(true);
  if (!cmd) {
    usage();
    process.exit(1);
  }

  switch (cmd) {
    case 'add':
      return cmdAdd(argv.slice(argv.indexOf('add') + 1), asJson);
    case 'search':
      return cmdSearch(argv.slice(argv.indexOf('search') + 1), asJson);
    case 'list':
      return cmdList(argv.slice(argv.indexOf('list') + 1), asJson);
    case 'export':
      return cmdExport(argv.slice(argv.indexOf('export') + 1), asJson);
    case 'import':
      return cmdImport(argv.slice(argv.indexOf('import') + 1), asJson);
    case 'stats':
      return cmdStats(argv.slice(argv.indexOf('stats') + 1), asJson);
    default:
      process.stderr.write('Unknown command: ' + cmd + '\n');
      usage();
      process.exit(1);
  }
}

main();
