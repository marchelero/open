#!/usr/bin/env node
/**
 * context.js - opencode context budget report
 *
 * Shows context hygiene: available skills, recent files, project size,
 * and recommendations for keeping the token window lean.
 *
 * Cannot read the LLM's actual context window (that's internal to opencode),
 * but can report on the local environment + the size of files that COULD
 * be loaded. The agent uses this output to decide when to delegate, prune,
 * or use targeted queries.
 *
 * Usage:
 *   node .opencode/bin/context.js              # full report
 *   node .opencode/bin/context.js --skills     # only skills inventory
 *   node .opencode/bin/context.js --files      # only recent file sizes
 *   node .opencode/bin/context.js --recommend  # only recommendations
 *   node .opencode/bin/context.js --cost       # cost/token report from docs/state/cost-*.json
 */

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const HOME = require('os').homedir();

function exists(p) { return fs.existsSync(p); }
function readDir(p) { try { return fs.readdirSync(p, { withFileTypes: true }); } catch { return []; } }
function countFiles(p, filter) {
  if (!exists(p)) return 0;
  let n = 0;
  const walk = (dir) => {
    for (const f of readDir(dir)) {
      if (f.name.startsWith('.')) continue;
      if (f.isDirectory()) walk(path.join(dir, f.name));
      else if (!filter || filter(f)) n++;
    }
  };
  walk(p);
  return n;
}
function dirSize(p) {
  if (!exists(p)) return 0;
  let total = 0;
  const walk = (dir) => {
    for (const f of readDir(dir)) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full);
      else {
        try { total += fs.statSync(full).size; } catch {}
      }
    }
  };
  walk(p);
  return total;
}
function estimateTokens(bytes) {
  return Math.round(bytes / 4);
}
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function skillsReport() {
  const userSkills = exists(path.join(CWD, '.agents', 'skills')) ? readDir(path.join(CWD, '.agents', 'skills')).filter(d => d.isDirectory()).map(d => d.name) : [];
  const globalSkills = exists(path.join(HOME, '.config', 'opencode', 'skills')) ? readDir(path.join(HOME, '.config', 'opencode', 'skills')).filter(d => d.isDirectory()).map(d => d.name) : [];
  const all = [...new Set([...userSkills, ...globalSkills])].sort();
  return { user: userSkills, global: globalSkills, all };
}

function agentsReport() {
  const agentsDir = path.join(CWD, '.opencode', 'agents');
  if (!exists(agentsDir)) return { count: 0, totalBytes: 0 };
  const files = readDir(agentsDir).filter(f => f.isFile() && f.name.endsWith('.md') && f.name !== 'INDEX.md');
  let total = 0;
  for (const f of files) { try { total += fs.statSync(path.join(agentsDir, f.name)).size; } catch {} }
  return { count: files.length, totalBytes: total };
}

function commandsReport() {
  const cmdsDir = path.join(CWD, '.opencode', 'commands');
  if (!exists(cmdsDir)) return { count: 0, totalBytes: 0 };
  const files = readDir(cmdsDir).filter(f => f.isFile() && f.name.endsWith('.md'));
  let total = 0;
  for (const f of files) { try { total += fs.statSync(path.join(cmdsDir, f.name)).size; } catch {} }
  return { count: files.length, totalBytes: total };
}

function sessionReport() {
  const sessDir = path.join(CWD, 'docs', 'sessions');
  if (!exists(sessDir)) return { count: 0, latest: null };
  const files = readDir(sessDir).filter(f => f.isFile() && f.name.endsWith('.md') && f.name !== 'LATEST.md' && f.name !== 'README.md');
  files.sort((a, b) => b.name.localeCompare(a.name));
  const latest = files[0] ? { name: files[0].name, date: files[0].name.split('-').slice(0, 3).join('-') } : null;
  return { count: files.length, latest };
}

function recommend(skills, agents, cmds, sessions) {
  const recs = [];
  if (skills.all.length > 8) recs.push('Many skills available (' + skills.all.length + '). Trust <available_skills> catalog; only load via skill tool when actually needed.');
  if (agents.count > 50) recs.push('Large agent library (' + agents.count + '). Use Task tool to delegate to specialists — keeps their context isolated.');
  if (cmds.totalBytes > 50_000) recs.push('Command library is ' + fmtBytes(cmds.totalBytes) + '. /orchestrate and /prd already wire up the right sub-agents; trust the system.');
  if (sessions.latest) recs.push('Last session: ' + sessions.latest.date + ' — run /session-start to resume with minimal context load.');
  else recs.push('No prior sessions. First time on this project — consider running /session-end after this work.');
  recs.push('Tool output discipline: use `grep -m 50`, `head -n 100`, and the Read tool with line limits. Cap bash results to last 30 lines.');
  recs.push('Sub-agents inherit context from primary. Don\'t re-read a file in a sub-agent if the primary already has it — pass the path, not the content.');
  return recs;
}

function full() {
  const skills = skillsReport();
  const agents = agentsReport();
  const cmds = commandsReport();
  const sessions = sessionReport();
  const recs = recommend(skills, agents, cmds, sessions);
  const totalBytes = agents.totalBytes + cmds.totalBytes;
  const projectSize = dirSize(CWD) - dirSize(path.join(CWD, '.git')) - dirSize(path.join(CWD, '.opencode', 'node_modules'));

  console.log('Context Budget Report');
  console.log('=====================');
  console.log('');
  console.log('Skills available:', skills.all.length);
  console.log('  local (.agents/skills):  ', skills.user.length, skills.user.join(', ') || '(none)');
  console.log('  global (~/.config/...):  ', skills.global.length, skills.global.join(', ') || '(none)');
  console.log('');
  console.log(`Agents: ${agents.count} (${fmtBytes(agents.totalBytes)}, ~${estimateTokens(agents.totalBytes)} tokens if all loaded -- DO NOT load all; trust the description-trigger)`);
  console.log(`Commands: ${cmds.count} (${fmtBytes(cmds.totalBytes)})`);
  console.log('Sessions:', sessions.count, sessions.latest ? '(latest: ' + sessions.latest.date + ')' : '(no prior sessions)');
  const cost = costReport();
  if (cost.files > 0) {
    const t = cost.totals;
    console.log(`Cost (last ${t.sessions} session(s)): $${t.costUsd.toFixed(6)} — full breakdown: context.js --cost`);
  }
  console.log('');
  console.log('Project (excluding .git and .opencode/node_modules):', fmtBytes(projectSize));
  console.log('');
  console.log('Recommendations:');
  for (const r of recs) console.log('  -', r);
}

function onlySkills() {
  const s = skillsReport();
  console.log('Skills (' + s.all.length + '):');
  for (const n of s.all) console.log('  ' + n);
}

function onlyRecommend() {
  const skills = skillsReport();
  const agents = agentsReport();
  const cmds = commandsReport();
  const sessions = sessionReport();
  for (const r of recommend(skills, agents, cmds, sessions)) console.log('-', r);
}

// C9 — surface the per-session ledger that cost-ledger.js writes on session idle.
function costReport() {
  const dir = path.join(CWD, 'docs', 'state');
  const files = exists(dir) ? readDir(dir).filter(f => f.isFile() && /^cost-.*\.json$/.test(f.name)) : [];
  const byDay = new Map();
  const byModel = new Map();
  const totals = { sessions: 0, tokensIn: 0, tokensOut: 0, costUsd: 0, estimated: 0, withCost: 0 };
  for (const f of files) {
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f.name), 'utf8')); } catch { continue; }
    totals.sessions++;
    totals.tokensIn += d.tokensIn || 0;
    totals.tokensOut += d.tokensOut || 0;
    if (typeof d.costUsd === 'number') { totals.costUsd += d.costUsd; totals.withCost++; }
    if (d.estimated) totals.estimated++;
    const day = String(d.timestamp || '').slice(0, 10) || 'unknown';
    const model = d.model || 'unknown';
    const dayAgg = byDay.get(day) || { sessions: 0, cost: 0, hasCost: false };
    dayAgg.sessions++; if (typeof d.costUsd === 'number') { dayAgg.cost += d.costUsd; dayAgg.hasCost = true; }
    byDay.set(day, dayAgg);
    const mAgg = byModel.get(model) || { sessions: 0, cost: 0, hasCost: false, tokensIn: 0, tokensOut: 0 };
    mAgg.sessions++; mAgg.tokensIn += d.tokensIn || 0; mAgg.tokensOut += d.tokensOut || 0;
    if (typeof d.costUsd === 'number') { mAgg.cost += d.costUsd; mAgg.hasCost = true; }
    byModel.set(model, mAgg);
  }
  return { files: files.length, totals, byDay, byModel };
}

function onlyCost() {
  const r = costReport();
  console.log('Cost Report (docs/state/cost-*.json)');
  console.log('===================================');
  if (r.files === 0) {
    console.log('No ledger files yet. cost-ledger.js writes one on each session idle.');
    return;
  }
  const t = r.totals;
  console.log(`Sessions: ${t.sessions}  (estimated: ${t.estimated}, with cost: ${t.withCost})`);
  console.log(`Tokens: in ${t.tokensIn} / out ${t.tokensOut}`);
  console.log(`Cost: $${t.costUsd.toFixed(6)}${t.withCost < t.sessions ? ' (partial — some sessions expose no cost)' : ''}`);
  console.log('');
  console.log('By day:');
  for (const [day, a] of [...r.byDay.entries()].sort()) {
    console.log(`  ${day}  sessions=${a.sessions}  cost=${a.hasCost ? '$' + a.cost.toFixed(6) : 'n/a'}`);
  }
  console.log('');
  console.log('By model:');
  for (const [model, a] of [...r.byModel.entries()].sort((x, y) => y[1].cost - x[1].cost)) {
    console.log(`  ${model}  sessions=${a.sessions}  tokens=${a.tokensIn + a.tokensOut}  cost=${a.hasCost ? '$' + a.cost.toFixed(6) : 'n/a'}`);
  }
}

const arg = process.argv[2];
if (arg === '--skills') onlySkills();
else if (arg === '--recommend') onlyRecommend();
else if (arg === '--cost') onlyCost();
else full();
