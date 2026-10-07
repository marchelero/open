#!/usr/bin/env node
/**
 * catalog-digest.js — condensed, regenerable catalog cache (zero deps, CommonJS)
 *
 * WHY
 *   The router (bin/lib/route-engine.js) only needs name + description +
 *   triggers to rank a request, yet `loadEntries()` re-reads and re-parses all
 *   145 SKILL.md / agent .md files on every dispatch. This module builds a
 *   single derived JSON artifact (the "digest") that the router can read in one
 *   file, and that CI can verify for freshness with a deterministic `--check`.
 *
 * DERIVED, NOT SOURCE
 *   The digest is generated from `bin/lib/catalog.js` (the enumerator). It is
 *   never authoritative: if it is missing or stale the router falls back to
 *   `listCatalog()`. Regenerate it in the same step that refreshes the indexes:
 *       node .opencode/bin/measure-tokens.js --digest
 *
 * DETERMINISM
 *   Output is serialized with LF newlines (JSON.stringify never emits CRLF),
 *   keys are inserted in a fixed order, entries are ordered skills-then-agents
 *   (each already sorted by name in catalog.js), and no timestamps are written.
 *   The same working tree therefore yields byte-identical output on Windows and
 *   Linux, so `--check` is safe as a CI gate.
 *
 * ENTRY SHAPE
 *   { name, type, path, summary, triggers, bytes, hash }
 *     name      skill dir name / agent file stem
 *     type      "skill" | "agent"
 *     path      posix path relative to ROOT (for route-match output)
 *     summary   1-line condensation of the frontmatter `description`
 *     triggers  normalized trigger tokens (routing signal)
 *     bytes     UTF-8 byte length of the collapsed description
 *     hash      sha256 of type+name+description+triggers (drift fingerprint)
 *
 * Lives in bin/lib/ on purpose: counts.js counts *.js directly under bin/ as
 * native CLIs (non-recursive), so this file does NOT change counts.clis.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { listCatalog, ROOT } = require('./catalog.js');

const DIGEST_PATH = path.join(ROOT, '.opencode', 'catalog-digest.json');
const VERSION = 1;

// A digest summary is a single line. After the description-slenderizing
// milestone no description exceeds TRIM_MAX, so SUMMARY_MAX is a safety bound
// only: it keeps the digest bounded if a long description slips back in.
const SUMMARY_MAX = 200;

// Target ceiling for slenderizing the frontmatter `description` fields.
const TRIM_MAX = 150;

function byteLen(s) {
  return s ? Buffer.byteLength(s, 'utf8') : 0;
}

function collapse(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/\s+/g, ' ')
    .trim();
}

// Cut on a word boundary, never leaving a dangling separator.
function truncateWords(s, maxBytes) {
  if (byteLen(s) <= maxBytes) return s;
  let cut = s;
  while (byteLen(cut) > maxBytes && cut.indexOf(' ') > 0) {
    cut = cut.slice(0, cut.lastIndexOf(' '));
  }
  return cut.replace(/[\s,;:.-]+$/, '');
}

// First sentence end, skipping abbreviation dots (e.g. "e.g." / initials):
// a punctuation mark only ends a sentence when the word before it is longer
// than one letter and it is followed by whitespace or end-of-string.
function firstSentence(s) {
  const re = /[.!?](?=\s|$)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const before = s.slice(0, m.index);
    const lastWord = (before.match(/([A-Za-z]+)$/) || [])[1] || '';
    if (lastWord.length <= 1) continue;
    return s.slice(0, m.index + 1);
  }
  return s;
}

// Deterministically condense a description to one actionable line <= maxBytes.
// Strategy: keep the whole (collapsed) text when it already fits; otherwise
// keep its first sentence when that fits; otherwise keep the leading words that
// fit. No model, no heuristics beyond punctuation, fully reproducible.
function condenseDescription(desc, maxBytes) {
  const max = maxBytes || TRIM_MAX;
  const s = collapse(desc);
  if (byteLen(s) <= max) return s;
  const first = firstSentence(s);
  if (byteLen(first) <= max) return first;
  return truncateWords(s, max);
}

// The digest stores a single-line view of the description. For every entry the
// router cares about this equals the frontmatter description (post-trim), so
// ranking is identical to parsing the source directly.
function summaryOf(desc) {
  const s = collapse(desc);
  if (byteLen(s) <= SUMMARY_MAX) return s;
  return truncateWords(s, SUMMARY_MAX);
}

function hashEntry(type, name, description, triggers) {
  const payload = [type, name, collapse(description), (triggers || []).join('|')].join('\n');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function makeEntry(type) {
  return (e) => {
    const triggers = e.triggers || [];
    return {
      name: e.name,
      type,
      path: e.path,
      summary: summaryOf(e.description),
      triggers,
      bytes: byteLen(collapse(e.description)),
      hash: hashEntry(type, e.name, e.description, triggers),
    };
  };
}

function buildDigest() {
  const cat = listCatalog();
  const entries = [
    ...cat.skills.map(makeEntry('skill')),
    ...cat.agents.map(makeEntry('agent')),
  ];
  let descriptionBytes = 0;
  for (const e of entries) descriptionBytes += e.bytes;
  return { version: VERSION, count: entries.length, descriptionBytes, entries };
}

// Deterministic serialization: JSON.stringify with 2-space indent uses LF and
// preserves the insertion order above, so identical trees -> identical bytes.
function serializeDigest(digest) {
  return JSON.stringify(digest, null, 2) + '\n';
}

function digestJson() {
  return serializeDigest(buildDigest());
}

function writeDigest() {
  const json = digestJson();
  fs.mkdirSync(path.dirname(DIGEST_PATH), { recursive: true });
  fs.writeFileSync(DIGEST_PATH, json, 'utf8');
  return { path: DIGEST_PATH, count: buildDigest().count };
}

function loadDigest() {
  try {
    const data = JSON.parse(fs.readFileSync(DIGEST_PATH, 'utf8'));
    if (!data || data.version !== VERSION || !Array.isArray(data.entries)) return null;
    return data;
  } catch {
    return null;
  }
}

// Freshness gate: compares the on-disk artifact against what the working tree
// would emit, byte for byte (LF-normalized by construction).
function checkDigest() {
  let actual = null;
  try {
    actual = fs.readFileSync(DIGEST_PATH, 'utf8');
  } catch {
    actual = null;
  }
  const expected = digestJson();
  // Normalize line endings on both sides: a CRLF checkout (Windows, autocrlf)
  // must not read as stale versus the LF output regenerated here.
  const normalize = (s) => (s === null ? null : s.replace(/\r\n?/g, '\n'));
  return { ok: normalize(actual) === normalize(expected), path: DIGEST_PATH, actual, expected };
}

// Cost report: every entry ordered by description byte length (descendants
// first) so a maintainer sees exactly which descriptions dominate the catalog.
function catalogReport() {
  const digest = buildDigest();
  const rows = digest.entries
    .map((e) => ({ name: e.name, type: e.type, bytes: e.bytes }))
    .sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
  return {
    count: digest.count,
    descriptionBytes: digest.descriptionBytes,
    catalogTokens: Math.round(digest.descriptionBytes / 4),
    entries: rows,
  };
}

module.exports = {
  DIGEST_PATH,
  VERSION,
  SUMMARY_MAX,
  TRIM_MAX,
  byteLen,
  collapse,
  truncateWords,
  firstSentence,
  condenseDescription,
  summaryOf,
  buildDigest,
  serializeDigest,
  digestJson,
  writeDigest,
  loadDigest,
  checkDigest,
  catalogReport,
};
