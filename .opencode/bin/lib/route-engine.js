#!/usr/bin/env node
/**
 * route-engine.js — zero-dep lexical router engine (CommonJS, Node 18)
 *
 * Ranks the skills+agents catalog against a free-text request using BM25 with
 * field weighting: name (high) > triggers (high) > description (medium). No
 * network, no dependencies, fully deterministic (same input -> same output).
 *
 * Lives in bin/lib/ on purpose: counts.js counts *.js directly under bin/ as
 * native CLIs (non-recursive), so this engine does NOT change counts.clis.
 *
 * Optional embeddings mode (Capa B / M4) is OPT-IN and degradable. The sync
 * route() stays 100% lexical/zero-network. The async routeAsync() used by the
 * CLI tries lib/embeddings.js ONLY when OPEN_ROUTER_EMBEDDINGS=1 (plus URL+KEY)
 * and silently falls back to lexical with degraded:true on ANY failure. Neither
 * path ever reads, prints or logs the key.
 *
 * Exports:
 *   loadEntries()            -> [Entry]  (type/path/command/description/triggers)
 *   tokenize(text)           -> [string]
 *   buildIndex(entries)      -> index
 *   rank(index, request, n)  -> [{ entry, score, matched }]
 *   baselineRank(entries, request, n) -> [{ name, score }]
 *   route(request)           -> { request, mode, degraded, recommended, alternatives }   (sync, lexical)
 *   routeAsync(request)      -> Promise<same>  (opt-in embeddings, silent fallback)
 */

const { listCatalog } = require('./catalog.js');

// Optional condensed catalog cache. Loaded lazily and defensively: if the
// digest module or artifact is unavailable/stale, loadEntries() falls back to
// listCatalog() (145 reads) so routing never breaks on a missing cache.
let digestLib = null;
try {
  digestLib = require('./catalog-digest.js');
} catch {
  digestLib = null;
}

const K1 = 1.2;
const B = 0.75;

// Field weights: name and triggers dominate, description contributes less.
const FIELD_DEFS = [
  { key: 'name', weight: 4 },
  { key: 'triggers', weight: 3 },
  { key: 'description', weight: 1 },
];

// Short EN + ES stopword list (kept intentionally small and inline).
const STOPWORDS = new Set([
  // EN
  'the', 'and', 'for', 'with', 'you', 'your', 'this', 'that', 'these', 'those',
  'from', 'into', 'over', 'under', 'about', 'when', 'what', 'which', 'how',
  'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'does', 'did',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must',
  'not', 'but', 'all', 'any', 'our', 'their', 'its', 'his', 'her', 'him',
  'she', 'they', 'them', 'use', 'using', 'used', 'need', 'needs', 'want',
  'wants', 'get', 'got', 'make', 'made', 'let', 'also', 'than', 'then',
  'there', 'here', 'where', 'who', 'why', 'some', 'more', 'most', 'much',
  'very', 'just', 'like', 'well', 'out', 'off', 'per', 'via', 'new', 'old',
  // ES
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
  'y', 'o', 'u', 'que', 'qué', 'con', 'por', 'para', 'en', 'es', 'son', 'se',
  'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'lo', 'le', 'les', 'me', 'te', 'nos',
  'como', 'cómo', 'más', 'mas', 'pero', 'sin', 'sobre', 'entre', 'este',
  'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'hay', 'muy',
  'ya', 'no', 'si', 'sí', 'donde', 'cuando', 'porque', 'todo', 'toda',
]);

function foldDiacritics(s) {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

// Minimal suffix normalization: plural (-ies/-s) + common EN/ES derivational
// suffixes (-ation/-acion) so cognates like migration/migracion collapse.
function singular(t) {
  let w = t;
  if (w.length > 4 && w.endsWith('ies')) w = w.slice(0, -3) + 'y';
  else if (w.length > 3 && w.endsWith('s') && !/(?:ss|us|is)$/.test(w)) w = w.slice(0, -1);
  w = w
    .replace(/(?:aciones|acion|iciones|icion|uciones|ucion)$/, '')
    .replace(/(?:ations|ation|itions|ition|utions|ution)$/, '');
  return w;
}

function tokenize(text) {
  if (text === undefined || text === null) return [];
  let s = foldDiacritics(String(text));
  // camelCase / PascalCase boundaries (kebab is handled by the split below).
  s = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  s = s.toLowerCase();
  const out = [];
  for (const raw of s.split(/[^a-z0-9]+/)) {
    if (!raw) continue;
    let t = raw;
    if (STOPWORDS.has(t)) continue;
    t = singular(t);
    if (!t || t.length < 2) continue;
    if (STOPWORDS.has(t)) continue;
    out.push(t);
  }
  return out;
}

function entryFromSkill(s) {
  return {
    name: s.name,
    type: 'skill',
    path: s.path,
    description: s.description || '',
    triggers: s.triggers || [],
    command: 'load skill ' + s.name,
  };
}

function entryFromAgent(a) {
  return {
    name: a.name,
    type: 'agent',
    path: a.path,
    description: a.description || '',
    triggers: a.triggers || [],
    command: '@' + a.name,
  };
}

function entryFromDigest(e) {
  return {
    name: e.name,
    type: e.type,
    path: e.path,
    description: e.summary || '',
    triggers: e.triggers || [],
    command: e.type === 'agent' ? '@' + e.name : 'load skill ' + e.name,
  };
}

// Single-file fast path: read the derived digest (1 file) instead of
// re-reading + parsing 145 SKILL.md/agent files. Any problem degrades silently
// to the authoritative source so the router stays correct.
function loadEntries() {
  if (digestLib) {
    const digest = digestLib.loadDigest();
    if (digest && digest.entries.length > 0) {
      return digest.entries.map(entryFromDigest);
    }
  }
  const cat = listCatalog();
  return [...cat.skills.map(entryFromSkill), ...cat.agents.map(entryFromAgent)];
}

function buildIndex(entries) {
  const docs = entries.map((e) => ({
    entry: e,
    fields: {
      name: tokenize(e.name),
      triggers: tokenize((e.triggers || []).join(' ')),
      description: tokenize(e.description || ''),
    },
  }));
  const N = docs.length || 1;
  const df = new Map();
  const fieldAvg = {};
  for (const { key } of FIELD_DEFS) fieldAvg[key] = 0;
  for (const d of docs) {
    const seen = new Set();
    for (const { key } of FIELD_DEFS) {
      const toks = d.fields[key];
      fieldAvg[key] += toks.length;
      for (const t of toks) seen.add(t);
    }
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  for (const { key } of FIELD_DEFS) fieldAvg[key] = fieldAvg[key] / N || 1;
  return { docs, N, df, fieldAvg };
}

function idf(dfv, N) {
  return Math.log(1 + (N - dfv + 0.5) / (dfv + 0.5));
}

function scoreDoc(index, doc, qTokens) {
  let score = 0;
  const matched = [];
  for (const t of qTokens) {
    const dfv = index.df.get(t);
    if (!dfv) continue;
    const idfv = idf(dfv, index.N);
    let contrib = 0;
    for (const { key, weight } of FIELD_DEFS) {
      const toks = doc.fields[key];
      let tf = 0;
      for (const x of toks) if (x === t) tf++;
      if (!tf) continue;
      const len = toks.length;
      const avg = index.fieldAvg[key] || 1;
      const denom = tf + K1 * (1 - B + (B * len) / avg);
      contrib += weight * idfv * ((tf * (K1 + 1)) / denom);
    }
    if (contrib > 0) {
      score += contrib;
      matched.push({ term: t, score: contrib });
    }
  }
  matched.sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));
  return { score, matched: matched.map((m) => m.term) };
}

function rank(index, request, topN = 3) {
  const qTokens = [...new Set(tokenize(request))];
  const scored = index.docs.map((d) => {
    const r = scoreDoc(index, d, qTokens);
    return { entry: d.entry, score: r.score, matched: r.matched };
  });
  scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
  return scored.filter((s) => s.score > 0).slice(0, topN);
}

// Keyword baseline the router must beat: exact token overlap against
// triggers + name only (no description, no IDF, no BM25).
function baselineScore(entry, qTokens) {
  const pool = new Set(tokenize(entry.name + ' ' + (entry.triggers || []).join(' ')));
  let c = 0;
  for (const t of qTokens) if (pool.has(t)) c++;
  return c;
}

function baselineRank(entries, request, topN = 3) {
  const qTokens = [...new Set(tokenize(request))];
  const scored = entries.map((e) => ({ name: e.name, score: baselineScore(e, qTokens) }));
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.filter((s) => s.score > 0).slice(0, topN);
}

function embeddingsRequested() {
  // Opt-in signal only. This never reads URL/key and never logs anything; the
  // actual attempt (and its silent degradation) lives in routeAsync() +
  // lib/embeddings.js.
  return process.env.OPEN_ROUTER_EMBEDDINGS === '1';
}

// Shape ranked results into the stable output contract. Shared by the lexical
// and embeddings paths so route-match.js output stays identical.
function formatRoute(request, results, mode, degraded) {
  const recommended = results[0]
    ? {
        name: results[0].entry.name,
        type: results[0].entry.type,
        path: results[0].entry.path,
        command: results[0].entry.command,
        score: round(results[0].score),
        matched: results[0].matched,
      }
    : null;
  const alternatives = results.slice(1).map((r) => ({
    name: r.entry.name,
    type: r.entry.type,
    path: r.entry.path,
    command: r.entry.command,
    score: round(r.score),
    matched: r.matched,
  }));
  return { request, mode, degraded, recommended, alternatives };
}

function route(request, { topN = 3, entries, index, degraded } = {}) {
  const ents = entries || loadEntries();
  const idx = index || buildIndex(ents);
  const results = rank(idx, request, topN);
  const deg = degraded === undefined ? embeddingsRequested() : degraded;
  return formatRoute(request, results, 'lexical', deg);
}

// Async entry point used by the CLI. In the default environment (no opt-in env
// vars) it is exactly route(): lexical, degraded:false, zero network. With the
// opt-in set it tries embeddings and silently falls back to lexical with
// degraded:true on ANY failure. It never throws for embeddings problems; a
// genuinely unreadable catalog still propagates so the CLI can exit 1.
async function routeAsync(request, { topN = 3, entries, index } = {}) {
  const ents = entries || loadEntries();
  const idx = index || buildIndex(ents);
  if (!embeddingsRequested()) {
    return formatRoute(request, rank(idx, request, topN), 'lexical', false);
  }
  let emb = null;
  try {
    const embeddings = require('./embeddings.js');
    emb = await embeddings.rankWithEmbeddings(request, ents, { topN });
  } catch {
    emb = null;
  }
  if (emb && Array.isArray(emb.results)) {
    return formatRoute(request, emb.results, 'embeddings', false);
  }
  return formatRoute(request, rank(idx, request, topN), 'lexical', true);
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

module.exports = {
  loadEntries,
  tokenize,
  singular,
  buildIndex,
  rank,
  baselineScore,
  baselineRank,
  embeddingsRequested,
  formatRoute,
  route,
  routeAsync,
  round,
  FIELD_DEFS,
};
