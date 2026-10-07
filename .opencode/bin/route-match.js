#!/usr/bin/env node
/**
 * route-match.js — semantic-ish router CLI (zero deps, Node 18, CommonJS)
 *
 * Given a free-text request, prints the single best skill/agent + 2
 * alternatives + the exact invocation, backed by the BM25 lexical engine in
 * bin/lib/route-engine.js. Deterministic, no network, no secrets.
 *
 * Usage:
 *   node .opencode/bin/route-match.js "<request>"
 *   node .opencode/bin/route-match.js "<request>" --json
 *   node .opencode/bin/route-match.js --eval [--json]
 *   node .opencode/bin/route-match.js --json      # (no request) runs the eval
 *
 * Exit codes:
 *   0 = a recommendation was produced, or the eval gate passed
 *   1 = no request/usage error, unreadable catalog, no match, or eval gate failed
 *
 * The eval (`--eval`) runs evals/routing/cases.json and reports top1 / top3 /
 * baseline_top1. `--json` with no request emits the eval as JSON including a
 * boolean `gate` field (consumed by evals/cases/static.json, kind "metric").
 */

const fs = require('fs');
const path = require('path');
const engine = require('./lib/route-engine.js');

const ROOT = path.resolve(__dirname, '..', '..');
const CASES = path.join(ROOT, 'evals', 'routing', 'cases.json');

const TOP1_DELTA = 15; // percentage points over the keyword baseline
const TOP3_MIN = 80; // percent

function usage() {
  process.stderr.write(
    [
      'route-match.js — route a request to the best skill/agent',
      '',
      'Usage:',
      '  route-match.js "<request>" [--json]',
      '  route-match.js --eval [--json]',
      '',
    ].join('\n')
  );
}

function why(matched) {
  if (!matched || matched.length === 0) return 'no token overlap';
  return 'matched ' + matched.slice(0, 5).map((m) => '"' + m + '"').join(', ');
}

function printRoute(res) {
  const mode = res.degraded ? 'lexical(degraded)' : res.mode;
  process.stdout.write('[route] "' + res.request + '"\n');
  process.stdout.write('mode: ' + mode + '\n');
  if (!res.recommended) {
    process.stdout.write('No match found for the request.\n');
    return;
  }
  const r = res.recommended;
  process.stdout.write('-> Recommended: ' + r.name + ' (' + r.type + ')\n');
  process.stdout.write('  score: ' + r.score + '   why: ' + why(r.matched) + '\n');
  process.stdout.write('  path: ' + r.path + '\n');
  process.stdout.write('  run: ' + r.command + '\n');
  res.alternatives.forEach((a, i) => {
    process.stdout.write(
      '  Alt' + (i + 1) + ': ' + a.name + ' (' + a.score + ', ' + a.type + ') - ' + why(a.matched) + '\n'
    );
  });
}

function loadCases() {
  let raw;
  try {
    raw = fs.readFileSync(CASES, 'utf8');
  } catch {
    return { error: 'no existe ' + path.relative(ROOT, CASES).split(path.sep).join('/') };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { error: 'cases.json invalido: ' + e.message };
  }
  const list = Array.isArray(data) ? data : data.cases;
  if (!Array.isArray(list)) return { error: 'cases.json sin array de casos' };
  const cases = list.filter((c) => c && c.request && c.expected);
  if (cases.length === 0) return { error: 'cases.json sin casos validos' };
  return { cases };
}

function runEval(asJson) {
  const { cases, error } = loadCases();
  if (error) {
    if (asJson) {
      process.stdout.write(JSON.stringify({ mode: 'eval', ok: false, gate: false, error }) + '\n');
    } else {
      process.stdout.write('[route-eval] ERROR: ' + error + '\n');
    }
    process.exit(1);
  }

  const entries = engine.loadEntries();
  const index = engine.buildIndex(entries);
  const n = cases.length;
  let top1 = 0;
  let top3 = 0;
  let baselineTop1 = 0;
  let ambiguous = 0;
  const failures = [];

  for (const c of cases) {
    if (c.ambiguous) ambiguous++;
    const ranked = engine.rank(index, c.request, 3).map((r) => r.entry.name);
    const base = engine.baselineRank(entries, c.request, 3).map((r) => r.name);
    if (ranked[0] === c.expected) top1++;
    if (ranked.slice(0, 3).indexOf(c.expected) !== -1) top3++;
    if (base[0] === c.expected) baselineTop1++;
    if (ranked[0] !== c.expected) {
      failures.push({ request: c.request, expected: c.expected, got: ranked[0] || null });
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
          ambiguous,
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
    process.stdout.write('[route-eval] cases=' + n + ' ambiguous=' + ambiguous + '\n');
    process.stdout.write('  top1          = ' + top1Pct + '%  (' + top1 + '/' + n + ')\n');
    process.stdout.write('  top3          = ' + top3Pct + '%  (' + top3 + '/' + n + ')\n');
    process.stdout.write('  baseline_top1 = ' + baselinePct + '%  (' + baselineTop1 + '/' + n + ')\n');
    process.stdout.write('  delta         = ' + delta + ' pts (need >= ' + TOP1_DELTA + ')\n');
    process.stdout.write('  top3 gate     = ' + top3Pct + '% (need >= ' + TOP3_MIN + '%)\n');
    process.stdout.write('  verdict       = ' + (gate ? 'PASS' : 'FAIL') + '\n');
    if (!gate && failures.length) {
      process.stdout.write('  misses (expected -> got):\n');
      for (const f of failures.slice(0, 10)) {
        process.stdout.write('    "' + f.request + '" ' + f.expected + ' -> ' + f.got + '\n');
      }
    }
  }
  process.exit(gate ? 0 : 1);
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const evalFlag = argv.includes('--eval');
  const request = argv.filter((a) => !a.startsWith('--')).join(' ').trim();

  // Eval mode: explicit --eval, or --json with no request (metric gate).
  if (evalFlag || (asJson && !request)) {
    return runEval(asJson);
  }

  if (!request) {
    usage();
    process.exit(1);
  }

  let res;
  try {
    res = engine.route(request);
  } catch (e) {
    process.stderr.write('route-match: error al leer el catalogo: ' + e.message + '\n');
    process.exit(1);
  }

  if (asJson) {
    process.stdout.write(JSON.stringify(res, null, 2) + '\n');
    process.exit(res.recommended ? 0 : 1);
  }

  printRoute(res);
  process.exit(res.recommended ? 0 : 1);
}

main();
