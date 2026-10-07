#!/usr/bin/env node
/**
 * catalog.js — shared enumerator for skills + agents (zero deps, CommonJS)
 *
 * SINGLE SOURCE OF TRUTH for "what skills/agents exist, how big are they, and
 * what does their frontmatter description say". Consumed by:
 *   - .opencode/bin/measure-tokens.js   (catalog token estimate)
 *   - .opencode/bin/verify-lockfile.js  (sha256 drift check)
 *
 * NOTE: lives in bin/lib/ (not bin/) on purpose. counts.js counts *.js files
 * directly under bin/ as "native CLIs" (non-recursive), so a file in lib/ is
 * intentionally NOT a CLI and does not change the counts block.
 *
 * Exports:
 *   listCatalog()        -> { skills:[Entry], agents:[Entry] }
 *   listCommands()       -> [Entry]   (optional; commands have no triggers)
 *   parseFrontmatter(s)  -> object|null
 *   estimateTokens(b, n) -> round(b / n)   (n default 4)
 *   ROOT, relPosix
 *
 * Entry = { name, path (posix, relative to ROOT), description, triggers, bytes }
 *
 * NOTE (additive): `triggers` was added for the semantic router
 * (.opencode/bin/lib/route-engine.js). Consumers that read only `description`
 * (measure-tokens) or `path` (verify-lockfile) are unaffected; the {skills,
 * agents} shape is unchanged.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const AGENTS_DIR = path.join(ROOT, '.opencode', 'agents');
const COMMANDS_DIR = path.join(ROOT, '.opencode', 'commands');

const BYTES_PER_TOKEN = 4;

function relPosix(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}

function estimateTokens(bytes, bytesPerToken = BYTES_PER_TOKEN) {
  if (!bytes) return 0;
  return Math.round(bytes / bytesPerToken);
}

// Frontmatter parser (handles leading HTML comments, quotes and inline arrays).
// Line endings are normalized first: on CRLF checkouts `slice` leaves a stray
// `\r` on the last field, and `.` in a regex does not match `\r`, which silently
// dropped the `description` when it was the last frontmatter key.
function parseFrontmatter(content) {
  if (!content) return null;
  const stripped = content.replace(/^(?:<!--[^-]*(?:-[^-]+)*-->\s*\n)+/, '');
  if (!stripped.startsWith('---')) return null;
  const end = stripped.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = stripped.slice(3, end).replace(/\r\n?/g, '\n');
  const out = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-z_]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (v.startsWith('[') && v.endsWith(']')) {
      try {
        out[m[1].toLowerCase()] = JSON.parse(v.replace(/'/g, '"'));
      } catch {
        out[m[1].toLowerCase()] = v
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    } else {
      out[m[1].toLowerCase()] = v;
    }
  }
  return out;
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

// `triggers:` is stored as an inline array (`[a, b, "c d"]`). parseFrontmatter
// already JSON.parses it when possible; otherwise it falls back to a comma
// split. Normalize either shape (and a bare string) to a clean string array.
function normalizeTriggers(v) {
  if (v === undefined || v === null) return [];
  let arr = v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.startsWith('[') && s.endsWith(']')) arr = s.slice(1, -1).split(',');
    else arr = s.split(',');
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => String(x).replace(/^["']+|["']+$/g, '').trim())
    .filter(Boolean);
}

function listSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => isDir(path.join(SKILLS_DIR, f)))
    .map((dirName) => {
      const skillFile = path.join(SKILLS_DIR, dirName, 'SKILL.md');
      if (!fs.existsSync(skillFile)) return null;
      const stat = fs.statSync(skillFile);
      const content = fs.readFileSync(skillFile, 'utf8');
      const fm = parseFrontmatter(content) || {};
      return {
        name: dirName,
        path: relPosix(skillFile),
        description: (fm.description || '').trim(),
        triggers: normalizeTriggers(fm.triggers),
        bytes: stat.size,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function listAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'INDEX.md')
    .map((f) => {
      const full = path.join(AGENTS_DIR, f);
      const stat = fs.statSync(full);
      const content = fs.readFileSync(full, 'utf8');
      const fm = parseFrontmatter(content) || {};
      return {
        name: f.replace(/\.md$/, ''),
        path: relPosix(full),
        description: (fm.description || '').trim(),
        triggers: normalizeTriggers(fm.triggers),
        bytes: stat.size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Optional: commands are NOT scored by the router (mapped by /route tables),
// but exposing them keeps catalog.js a complete enumerator for other consumers.
function listCommands() {
  if (!fs.existsSync(COMMANDS_DIR)) return [];
  return fs
    .readdirSync(COMMANDS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'INDEX.md')
    .map((f) => {
      const full = path.join(COMMANDS_DIR, f);
      const stat = fs.statSync(full);
      const content = fs.readFileSync(full, 'utf8');
      const fm = parseFrontmatter(content) || {};
      return {
        name: f.replace(/\.md$/, ''),
        path: relPosix(full),
        description: (fm.description || '').trim(),
        triggers: normalizeTriggers(fm.triggers),
        bytes: stat.size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function listCatalog() {
  return { skills: listSkills(), agents: listAgents() };
}

module.exports = {
  listCatalog,
  listSkills,
  listAgents,
  listCommands,
  normalizeTriggers,
  parseFrontmatter,
  estimateTokens,
  bytesPerToken: BYTES_PER_TOKEN,
  ROOT,
  relPosix,
};
