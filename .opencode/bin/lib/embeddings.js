#!/usr/bin/env node
/**
 * embeddings.js — OPT-IN embeddings route for the router (zero-dep, Node 18).
 *
 * CAPA B / M4. This module is only reached when the lexical router asks for it
 * via `routeAsync()`; the default (BM25) path never imports it.
 *
 * Activation (ALL three required):
 *   OPEN_ROUTER_EMBEDDINGS=1
 *   OPEN_ROUTER_EMBEDDINGS_URL=<OpenAI-compatible /embeddings endpoint>
 *   OPEN_ROUTER_EMBEDDINGS_KEY=<bearer token>
 * Optional:
 *   OPEN_ROUTER_EMBEDDINGS_MODEL=<model id>   (default text-embedding-3-small)
 *   OPEN_ROUTER_EMBEDDINGS_TIMEOUT=<ms>        (default 5000, clamped 1..60000)
 *
 * Behaviour:
 *   - POSTs `{model, input:[...]}` to the endpoint with Bearer auth via Node's
 *     stdlib http/https (no fetch dependency, no npm package).
 *   - Caches catalog vectors in `.opencode/embeddings-cache.json`, keyed by an
 *     endpoint fingerprint (sha256 of URL+model, never the raw URL) and a
 *     per-entry text hash, so catalog drift only re-embeds changed entries.
 *   - Ranks by cosine similarity.
 *
 * DEGRADATION CONTRACT
 *   Any failure (missing creds, bad URL, timeout, HTTP != 2xx, invalid JSON,
 *   network error) makes `rankWithEmbeddings` resolve to `null`. It NEVER
 *   throws, NEVER logs, and NEVER surfaces the URL or the key. The caller then
 *   falls back to BM25 and reports `degraded:true`.
 *
 * SECURITY
 *   The key lives only in the in-process `authorization` header. It is never
 *   written to the cache, to stdout/stderr, or to any error message. HTTP and
 *   network errors are re-thrown as constants ('http_error', 'network_error',
 *   'timeout') with no request detail attached.
 *
 * Lives in bin/lib/ on purpose: counts.js counts *.js directly under bin/ as
 * native CLIs (non-recursive), so this file does NOT change counts.clis.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { tokenize } = require('./route-engine.js');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CACHE_PATH = path.join(ROOT, '.opencode', 'embeddings-cache.json');
const CACHE_VERSION = 1;
const DEFAULT_MODEL = 'text-embedding-3-small';
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 60000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;

function config() {
  const enabled = process.env.OPEN_ROUTER_EMBEDDINGS === '1';
  const url = String(process.env.OPEN_ROUTER_EMBEDDINGS_URL || '').trim();
  const key = String(process.env.OPEN_ROUTER_EMBEDDINGS_KEY || '').trim();
  const model = String(process.env.OPEN_ROUTER_EMBEDDINGS_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  let timeout = parseInt(process.env.OPEN_ROUTER_EMBEDDINGS_TIMEOUT || '', 10);
  if (!Number.isFinite(timeout) || timeout <= 0) timeout = DEFAULT_TIMEOUT_MS;
  timeout = Math.min(timeout, MAX_TIMEOUT_MS);
  return { enabled, url, key, model, timeout };
}

// All three env vars must be present. Deliberately does not expose key in any
// returned shape beyond the internal config object.
function available() {
  const c = config();
  return c.enabled && c.url !== '' && c.key !== '';
}

function sha256(s) {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function entryId(e) {
  return (e && e.type ? e.type : '?') + ':' + ((e && (e.path || e.name)) || '');
}

function entryText(e) {
  const triggers = e && Array.isArray(e.triggers) ? e.triggers.join(', ') : '';
  return [String((e && e.name) || ''), triggers, String((e && e.description) || '')]
    .join('\n')
    .trim();
}

// Fingerprint of the endpoint+model, stored INSTEAD of the raw URL. Changing
// the URL or model invalidates the whole cache without persisting secrets.
function endpointFingerprint(c) {
  return sha256(c.url + '\n' + c.model).slice(0, 24);
}

function readCache(fp) {
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    if (!data || data.version !== CACHE_VERSION) return {};
    if (data.endpoint !== fp || !data.entries || typeof data.entries !== 'object') return {};
    return data.entries;
  } catch {
    return {};
  }
}

function writeCache(fp, entries) {
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(
      CACHE_PATH,
      JSON.stringify({ version: CACHE_VERSION, endpoint: fp, entries }, null, 2) + '\n',
      'utf8'
    );
  } catch {
    /* best effort: a read-only cache dir must not break routing */
  }
}

function postEmbeddings(c, inputs) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(c.url);
    } catch {
      return reject(new Error('bad_endpoint'));
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return reject(new Error('bad_protocol'));
    }
    const lib = u.protocol === 'http:' ? http : https;
    const payload = JSON.stringify({ model: c.model, input: inputs });
    let settled = false;
    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };

    let req;
    try {
      req = lib.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || undefined,
          path: (u.pathname || '/') + (u.search || ''),
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(payload),
            // Secret lives ONLY here and is never echoed anywhere.
            authorization: 'Bearer ' + c.key,
          },
        },
        (res) => {
          let raw = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            raw += chunk;
            if (raw.length > MAX_RESPONSE_BYTES) req.destroy();
          });
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return done(reject, new Error('http_error'));
            }
            done(resolve, raw);
          });
          res.on('error', () => done(reject, new Error('network_error')));
        }
      );
    } catch {
      return reject(new Error('request_error'));
    }

    // Generic error: no err object propagated (it could carry the host).
    req.on('error', () => done(reject, new Error('network_error')));
    req.setTimeout(c.timeout, () => req.destroy());
    try {
      req.write(payload);
      req.end();
    } catch {
      done(reject, new Error('request_error'));
    }
  });
}

// Validate the OpenAI-compatible shape and return vectors ordered by `index`.
function parseEmbeddings(raw, expected) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const arr = data && Array.isArray(data.data) ? data.data : null;
  if (!arr || arr.length !== expected) return null;
  const out = new Array(expected);
  for (const item of arr) {
    if (!item || !Array.isArray(item.embedding) || item.embedding.length === 0) return null;
    const idx = Number.isInteger(item.index) ? item.index : -1;
    if (idx < 0 || idx >= expected) return null;
    const v = item.embedding;
    for (let i = 0; i < v.length; i++) {
      if (typeof v[i] !== 'number' || !Number.isFinite(v[i])) return null;
    }
    out[idx] = v;
  }
  for (let i = 0; i < expected; i++) if (!out[i]) return null;
  return out;
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Embeddings have no lexical terms: derive the `why` tokens from the entry's
// own text so the CLI output keeps the stable `matched [...]` contract.
function lexicalMatched(queryTokens, e) {
  const triggers = e && Array.isArray(e.triggers) ? e.triggers.join(' ') : '';
  const pool = new Set(tokenize([String((e && e.name) || ''), triggers, String((e && e.description) || '')].join(' ')));
  const hits = [];
  for (const t of queryTokens) if (pool.has(t)) hits.push(t);
  return hits.slice(0, 8);
}

/**
 * Rank the catalog against `request` by cosine similarity.
 * Resolves to `{ results: [{ entry, score, matched }] }` on success, or `null`
 * on ANY failure (never throws, never logs, never leaks creds).
 */
async function rankWithEmbeddings(request, entries, { topN = 3 } = {}) {
  try {
    if (!available()) return null;
    const c = config();
    const list = Array.isArray(entries) ? entries : [];
    if (list.length === 0) return null;

    const fp = endpointFingerprint(c);
    const cache = readCache(fp);

    const texts = list.map(entryText);
    const ids = list.map(entryId);
    const hashes = texts.map(sha256);

    const missingIdx = [];
    for (let i = 0; i < list.length; i++) {
      const hit = cache[ids[i]];
      if (!hit || hit.h !== hashes[i] || !Array.isArray(hit.v)) missingIdx.push(i);
    }

    const inputs = missingIdx.map((i) => texts[i]);
    const reqPos = inputs.length;
    inputs.push(String(request));

    const raw = await postEmbeddings(c, inputs);
    const vectors = parseEmbeddings(raw, inputs.length);
    if (!vectors) return null;

    if (missingIdx.length > 0) {
      for (let k = 0; k < missingIdx.length; k++) {
        const i = missingIdx[k];
        cache[ids[i]] = { h: hashes[i], v: vectors[k] };
      }
      writeCache(fp, cache);
    }

    const queryVec = vectors[reqPos];
    const qTokens = tokenize(request);
    const scored = list
      .map((e, i) => {
        const hit = cache[ids[i]];
        const vec = hit && Array.isArray(hit.v) ? hit.v : null;
        return { entry: e, score: vec ? cosine(queryVec, vec) : 0, matched: lexicalMatched(qTokens, e) };
      })
      .filter((s) => s.score > 0);
    scored.sort((a, b) => b.score - a.score || String(a.entry.name).localeCompare(String(b.entry.name)));
    return { results: scored.slice(0, topN) };
  } catch {
    return null;
  }
}

module.exports = {
  CACHE_PATH,
  DEFAULT_MODEL,
  config,
  available,
  entryText,
  cosine,
  parseEmbeddings,
  rankWithEmbeddings,
};
