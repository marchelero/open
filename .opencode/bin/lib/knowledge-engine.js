#!/usr/bin/env node
/**
 * knowledge-engine.js — zero-dep lexical retrieval over knowledge entries
 * (CommonJS, Node 18).
 *
 * Ranks cross-project knowledge entries ({id,title,body,tags[],project,...})
 * against a free-text query using BM25 with field weighting:
 *   title (high) > tags (high) > body (medium).
 *
 * REUSE OF THE ROUTER TOKENIZER (deliberate choice)
 *   This module does NOT fork the tokenizer. It imports `tokenize` (and
 *   `singular`) straight from `route-engine.js`, the single source of truth
 *   for normalization. route-engine.js is otherwise untouched, so the output
 *   of route-match.js stays byte-identical and gate E16 remains intact.
 *
 * Deterministic: same entries + same query -> same ranking. No network, no
 * deps, no secrets. Lives in bin/lib/ on purpose: counts.js only counts
 * *.js directly under bin/ as CLIs, so this file does NOT change counts.clis.
 *
 * Exports:
 *   FIELD_DEFS
 *   tokenizeQuery(text)               -> [string]
 *   normalizeEntry(e)                 -> canonical entry shape
 *   buildIndex(entries, fieldDefs)    -> index
 *   rank(index, query, topN)          -> [{ entry, score, matched }]
 *   baselineScore(entry, query)       -> number
 *   baselineRank(entries, query, topN)-> [{ entry, score }]
 */

const { tokenize } = require('./route-engine.js');

const K1 = 1.2;
const B = 0.75;

// Field weights: title and tags dominate, body contributes less.
// Mirrors the router's FIELD_DEFS analogy (name/triggers/description).
const FIELD_DEFS = [
  { key: 'title', weight: 4 },
  { key: 'tags', weight: 3 },
  { key: 'body', weight: 2 },
];

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeEntry(e) {
  const src = e && typeof e === 'object' ? e : {};
  return {
    id: String(src.id || ''),
    title: String(src.title || ''),
    body: String(src.body || ''),
    tags: normalizeTags(src.tags),
    project: String(src.project || ''),
    created: src.created || '',
    updated: src.updated || '',
    source: src.source || '',
  };
}

function tokenizeQuery(text) {
  return [...new Set(tokenize(text))];
}

function entryFields(e) {
  return {
    title: tokenize(e.title || ''),
    tags: tokenize((e.tags || []).join(' ')),
    body: tokenize(e.body || ''),
  };
}

function buildIndex(entries, fieldDefs = FIELD_DEFS) {
  const docs = (entries || []).map((e) => ({ entry: e, fields: entryFields(e) }));
  const N = docs.length || 1;
  const df = new Map();
  const fieldAvg = {};
  for (const { key } of fieldDefs) fieldAvg[key] = 0;
  for (const d of docs) {
    const seen = new Set();
    for (const { key } of fieldDefs) {
      const toks = d.fields[key] || [];
      fieldAvg[key] += toks.length;
      for (const t of toks) seen.add(t);
    }
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  for (const { key } of fieldDefs) fieldAvg[key] = fieldAvg[key] / N || 1;
  return { docs, N, df, fieldAvg, fieldDefs };
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
    for (const { key, weight } of index.fieldDefs) {
      const toks = doc.fields[key] || [];
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

function rank(index, query, topN = 3) {
  const qTokens = tokenizeQuery(query);
  const scored = index.docs.map((d) => {
    const r = scoreDoc(index, d, qTokens);
    return { entry: d.entry, score: r.score, matched: r.matched };
  });
  scored.sort(
    (a, b) => b.score - a.score || String(a.entry.id).localeCompare(String(b.entry.id))
  );
  return scored.filter((s) => s.score > 0).slice(0, topN);
}

// Trivial baseline the engine must beat: count distinct query tokens that
// appear as substrings of the entry title (case-insensitive). No IDF, no BM25,
// no body/tags. This is the "substring in title" reference from the PRD.
function baselineScore(entry, query) {
  const title = String((entry && entry.title) || '').toLowerCase();
  if (!title) return 0;
  let c = 0;
  for (const t of tokenizeQuery(query)) {
    if (t && title.indexOf(t) !== -1) c++;
  }
  return c;
}

function baselineRank(entries, query, topN = 3) {
  const scored = (entries || []).map((e) => ({ entry: e, score: baselineScore(e, query) }));
  scored.sort(
    (a, b) => b.score - a.score || String(a.entry.id).localeCompare(String(b.entry.id))
  );
  return scored.filter((s) => s.score > 0).slice(0, topN);
}

module.exports = {
  K1,
  B,
  FIELD_DEFS,
  normalizeTags,
  normalizeEntry,
  tokenizeQuery,
  buildIndex,
  rank,
  baselineScore,
  baselineRank,
};
