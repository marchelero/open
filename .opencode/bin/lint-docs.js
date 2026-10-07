#!/usr/bin/env node
/**
 * lint-docs.js - prose lint for the pack
 *
 * Adapted from the MKY/agentes fork (fase 1 de fusión de infraestructura).
 * Seven defect classes that `validate-frontmatter` and `smoke-test` both
 * passed while they were present in the repo, because neither of them reads
 * prose.
 *
 *   R1  unbalanced backticks   odd number of ` on a prose line
 *   R2  truncated sentence     dangling last word + trailing whitespace
 *   R3  outdated subagent syntax  `task { subagent: ... }` (without _type)
 *   R4  state.js empty path    `state.js update "" ...` (loses the file path)
 *   R5  non-numeric phase      `state.js update "$STATE" executing ...`
 *   R6  broken relative link   [text](path) whose target does not exist
 *   R7  mojibake               double-encoded UTF-8 or U+FFFD replacement char
 *   R8  dangerous invisible    zero-width / bidi-control / Unicode-tag codepoints
 *                              (prompt-injection smuggling vector named in the
 *                              AGENTS.md Prompt Defense Baseline)
 *
 * BASELINE (adapted for `open`)
 *   The pack carries two known-debt classes: R3 (V1 syntax in SDD flow
 *   commands) and R4 (`state.js update "" <phase>` — a doc bug inherited from
 *   the fork). Fixing them is deferred; they are recorded in a reviewed
 *   baseline fingerprint so CI only fails on NEW findings.
 *
 *   Fingerprint = sha1(rule | relpath | normalized line). Robust to line
 *   shifts, sensitive to content changes.
 *
 * Usage:
 *   node .opencode/bin/lint-docs.js                     # scan cwd, use baseline
 *   node .opencode/bin/lint-docs.js --dir DIR
 *   node .opencode/bin/lint-docs.js --quiet             # summary only
 *   node .opencode/bin/lint-docs.js --json
 *   node .opencode/bin/lint-docs.js --baseline <path>   # override baseline file
 *   node .opencode/bin/lint-docs.js --no-baseline       # ignore baseline
 *   node .opencode/bin/lint-docs.js --update-baseline   # rewrite baseline
 *   node .opencode/bin/lint-docs.js --strict            # fail on stale entries too
 *
 * Exit codes:
 *   0 = no NEW findings (only baselined, or none)
 *   1 = at least one new finding (or stale in --strict)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const argv = process.argv.slice(2);
const QUIET = argv.includes('--quiet');
const AS_JSON = argv.includes('--json');
const STRICT = argv.includes('--strict');
const NO_BASELINE = argv.includes('--no-baseline');
const UPDATE_BASELINE = argv.includes('--update-baseline');
const dirFlag = argv.indexOf('--dir');
const ROOT = dirFlag !== -1 && argv[dirFlag + 1]
  ? path.resolve(argv[dirFlag + 1])
  : process.cwd();
const baselineFlag = argv.indexOf('--baseline');
const DEFAULT_BASELINE = path.join(ROOT, '.opencode', 'bin', 'lint-docs.baseline.json');
const BASELINE_PATH = baselineFlag !== -1 && argv[baselineFlag + 1]
  ? path.resolve(argv[baselineFlag + 1])
  : DEFAULT_BASELINE;

// Never descend here: build output, vendored code, copies, local archives.
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'backup', 'dist', 'build', '.next',
]);

const SKIP_FILES = new Set(['PENDIENTES.md']);

const DANGLING = new Set([
  'the', 'a', 'an', 'of', 'to', 'as', 'with', 'from', 'for', 'and', 'or',
  'in', 'on', 'at', 'by', 'that', 'which', 'this', 'these', 'those', 'is',
  'are', 'was', 'were', 'be', 'been', 'into', 'onto', 'than', 'about',
  'before', 'after', 'during', 'between', 'against', 'without', 'within',
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'al', 'para', 'por',
  'con', 'sin', 'sobre', 'desde', 'hasta', 'entre', 'hacia', 'como', 'que',
  'se', 'es', 'son', 'está', 'están', 'hay', 'su', 'sus', 'este', 'esta',
]);

const V1_PATTERNS = [
  // Only the genuinely outdated form `task { subagent: ... }` (without _type).
  // `subagent_type` and the phrase "task tool" describe the CURRENT Task tool
  // API, so they are not defects and are deliberately NOT flagged.
  { re: /\btask\s*\{\s*subagent\b/i, what: 'task { subagent } (V1)' },
];

const LINK_RE = /\]\(([^)\s]+)\)/g;
const LINK_EXTERNAL = /^(?:https?:|mailto:|data:|tel:|javascript:)/i;

const MOJIBAKE_PATTERNS = [
  { re: /[\u00C2\u00C3][\u0080-\u00BF]/, what: 'UTF-8 doblemente codificada' },
  { re: /\u00E2\u20AC/, what: 'UTF-8 doblemente codificada (â..)' },
  { re: /\uFFFD/, what: 'caracter de reemplazo U+FFFD' },
];

// R8 — dangerous invisible codepoints. These have no legitimate use in prose or
// source and are the canonical vector for prompt-injection smuggling (hidden
// instructions, homoglyph confusables, "ASCII/Tag smuggling"). Emoji variation
// selectors U+FE00–U+FE0F are deliberately EXCLUDED: they are a normal part of
// emoji rendering and would false-positive on every ✅/🟡 in the reports.
const INVISIBLE_PATTERNS = [
  { re: /[\u200B-\u200D]/, what: 'zero-width space/joiner' },
  { re: /\u2060/, what: 'word joiner' },
  { re: /\uFEFF/, what: 'BOM / zero-width no-break space' },
  { re: /[\u202A-\u202E]/, what: 'bidi control' },
  { re: /[\u2066-\u2069]/, what: 'bidi isolate control' },
  { re: /[\u{E0000}-\u{E007F}]/u, what: 'Unicode Tag block (ASCII/Tag smuggling)' },
  { re: /\u180E/, what: 'Mongolian vowel separator' },
  { re: /[\u115F\u1160]/, what: 'Hangul filler (zero-width)' },
  { re: /[\u2061-\u2064]/, what: 'invisible math operator' },
  { re: /\u3164/, what: 'Hangul filler U+3164' },
  { re: /[\u{E0100}-\u{E01EF}]/u, what: 'variation selector (supplementary)' },
];

const STATE_SUB = '(?:init|update|complete|fail|list|archive)';
const STATE_EMPTY = new RegExp(`state\\.js\\s+${STATE_SUB}\\s+(?:""|'')`);
const STATE_PHASE = new RegExp(
  `state\\.js\\s+update\\s+("(?:[^"\\\\]|\\\\.)*"|'[^']*'|\\S+)\\s+("(?:[^"\\\\]|\\\\.)*"|'[^']*'|\\S+)`,
  'g'
);

function stripBlockquote(s) {
  return s.replace(/^(\s*(?:>\s*)+)/, '');
}

function fingerprint(rule, rel, lineText) {
  const norm = String(lineText || '').replace(/\s+$/, '');
  return crypto.createHash('sha1').update(`${rule}|${rel}|${norm}`, 'utf8').digest('hex');
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(full, out);
    } else if (e.isFile() && e.name.endsWith('.md')) {
      if (SKIP_FILES.has(e.name)) continue;
      out.push(full);
    }
  }
  return out;
}

function lintFile(file) {
  const hits = [];
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const dir = path.dirname(file);
  const isHistory = /CHANGE/i.test(path.basename(file));

  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = stripBlockquote(line);
    const trimmed = stripped.trim();
    const isFenceLine = /^\s*(`{3,}|~{3,})/.test(stripped);
    let local = null;
    const push = (rule, msg, text) => {
      if (!local) local = [];
      local.push({ rel, line: i + 1, rule, msg, fp: fingerprint(rule, rel, text) });
    };

    if (isFenceLine) {
      inFence = !inFence;
    } else if (trimmed !== '') {
      if (!inFence) {
        // R1
        const ticks = (stripped.match(/`/g) || []).length;
        if (ticks % 2 === 1 && !isHistory) {
          push('R1', 'backtick sin cerrar en la linea', stripped);
        }
        // R6
        LINK_RE.lastIndex = 0;
        let lm;
        while ((lm = LINK_RE.exec(stripped)) !== null) {
          const dest = lm[1];
          if (dest.startsWith('<') || LINK_EXTERNAL.test(dest)) continue;
          const target = dest.split('#')[0];
          if (!target) continue;
          if (path.isAbsolute(target)) continue;
          if (!fs.existsSync(path.resolve(dir, target))) {
            push('R6', `enlace roto -> ${dest}`, stripped);
          }
        }
        // R7
        const prose = stripped.replace(/`[^`]*`/g, '');
        for (const p of MOJIBAKE_PATTERNS) {
          if (p.re.test(prose)) {
            push('R7', p.what, stripped);
            break;
          }
        }
      }
      // R2
      if (/\s$/.test(line) && !trimmed.startsWith('|')) {
        const tail = trimmed.match(/(\p{L}+)$/u);
        if (tail && DANGLING.has(tail[1].toLowerCase())) {
          push('R2', `frase truncada en "${tail[1]}"`, line);
        }
      }
    }

    // R3
    if (!isHistory) {
      for (const p of V1_PATTERNS) {
        if (p.re.test(line)) { push('R3', p.what, line); break; }
      }
    }
    // R4
    if (STATE_EMPTY.test(line)) {
      push('R4', 'state.js recibe cadena vacia en vez de $STATE', line);
    }
    // R5
    STATE_PHASE.lastIndex = 0;
    let m;
    while ((m = STATE_PHASE.exec(line)) !== null) {
      const phase = m[2].replace(/^["']|["']$/g, '');
      if (phase.startsWith('<') && phase.endsWith('>')) continue;
      if (isHistory) continue;
      if (!/^-?\d+$/.test(phase)) {
        push('R5', `fase no numerica "${phase}"`, line);
      }
    }

    // R8 — dangerous invisible codepoints. Checked on every line, fences and
    // history included: smuggling can hide inside a code block too.
    for (const p of INVISIBLE_PATTERNS) {
      if (p.re.test(line)) { push('R8', p.what, line); break; }
    }

    if (local) for (const h of local) hits.push(h);
  }
  return hits;
}

function loadBaseline() {
  if (NO_BASELINE) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    const arr = Array.isArray(data) ? data : (data.findings || []);
    return new Set(arr.map((x) => (typeof x === 'string' ? x : x.fp)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function main() {
  const files = walk(ROOT);
  const all = [];
  for (const f of files) all.push(...lintFile(f));

  if (UPDATE_BASELINE) {
    const fps = [...new Set(all.map((h) => h.fp))].sort();
    const out = { generated: new Date().toISOString(), note: 'reviewed baseline (R3/R4 deuda heredada del fork)', findings: fps };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
    console.log(`lint-docs: baseline actualizada con ${fps.length} findings -> ${path.relative(ROOT, BASELINE_PATH).replace(/\\/g, '/')}`);
    return;
  }

  const baseline = loadBaseline();
  const currentFps = new Set(all.map((h) => h.fp));
  const newHits = all.filter((h) => !baseline.has(h.fp));
  const stale = [...baseline].filter((fp) => !currentFps.has(fp));

  const byRule = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, R6: 0, R7: 0, R8: 0 };
  for (const h of all) byRule[h.rule]++;

  const fail = newHits.length > 0 || (STRICT && stale.length > 0);

  if (AS_JSON) {
    console.log(JSON.stringify({
      ok: !fail,
      scanned: files.length,
      total: all.length,
      new: newHits.length,
      baselined: all.length - newHits.length,
      stale: stale.length,
      byRule,
      findings: all.map((h) => ({ rule: h.rule, rel: h.rel, line: h.line, msg: h.msg, baselined: baseline.has(h.fp) })),
    }, null, 2));
    process.exit(fail ? 1 : 0);
  }

  if (!QUIET) {
    for (const h of all) {
      console.log(`  ${h.rule}  ${h.rel}:${h.line}  ${h.msg}${baseline.has(h.fp) ? '  [baselined]' : '  [NEW]'}`);
    }
  }
  console.log(
    `lint-docs: ${files.length} .md scanned | ` +
    `R1=${byRule.R1} R2=${byRule.R2} R3=${byRule.R3} R4=${byRule.R4} R5=${byRule.R5} ` +
    `R6=${byRule.R6} R7=${byRule.R7} R8=${byRule.R8} | total=${all.length} | new=${newHits.length} baselined=${all.length - newHits.length}` +
    (STRICT ? ` stale=${stale.length}` : '')
  );
  process.exit(fail ? 1 : 0);
}

main();
