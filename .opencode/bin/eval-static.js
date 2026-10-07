#!/usr/bin/env node
/**
 * eval-static.js - eval-driven development: static regression cases
 *
 * WHY THIS EXISTS
 *   The pack already ships verifiers that check *structure* (lint-docs,
 *   counts, wiring-test, validate-frontmatter, smoke-test). None of them
 *   checks *behaviour rules*. On 2026-10-06 AGENTS.md contradicted itself
 *   (auto-checkpoint vs behaviors 3 and 5) and nothing would have caught it
 *   coming back: the rules are prose, and no verifier reads prose for
 *   meaning.
 *
 *   This runner closes that gap. Each case in evals/cases/*.json states an
 *   invariant of the pack. If a change breaks one, the run fails and CI
 *   refuses the change.
 *
 * DESIGN
 *   - Cases are DATA, not code. Adding a regression = adding an object to
 *     evals/cases/*.json. No runner change needed.
 *   - Zero dependencies, Node stdlib only. Same contract as the other CLIs:
 *     ASCII output, --json, exit 0 = pass / 1 = fail.
 *   - Root is process.cwd() so it works identically locally and in CI.
 *
 * CASE KINDS
 *   files    every path in `files` must exist
 *   present  `pattern` must match >= `min` times across `files`
 *   absent   `pattern` must match 0 times across `files`
 *   count    matches of `pattern` across `files` must satisfy
 *            `equals` | `gte` | `lte`
 *   every    every file in `dir` matching `glob` must contain `pattern`
 *   heading  every `SECTION` reference found via `pattern` in `file` must
 *            resolve to a heading in `target`
 *   orphan   strict reachability scan: 0 agents/skills/commands may be
 *            reachable only through a catalog
 *   metric   run a sibling CLI with --json and assert on `field`
 *   verdict  deterministic shape check of a golden JSON verdict against a
 *            compact schema (offline, no model) + surface files exist +
 *            rubric catalog has >= minRubrics entries
 *   policy   offline shape check of `.opencode/policy-rules.json`: valid JSON,
 *            version/mode, and a compilable {id,severity,match,tool,message}
 *            per rule (no plugin execution, no commands run)
 *
 * Usage:
 *   node .opencode/bin/eval-static.js              # run all cases
 *   node .opencode/bin/eval-static.js --json       # machine readable
 *   node .opencode/bin/eval-static.js --quiet      # summary only
 *
 * Exit codes:
 *   0 = every case passed
 *   1 = at least one case failed, or the dataset is unreadable
 */

const fs = require('fs');
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = process.cwd()
const CASES_DIR = path.join(ROOT, 'evals', 'cases')
const QUIET = process.argv.includes('--quiet')
const AS_JSON = process.argv.includes('--json')

const results = []
let failures = 0

function record(c, ok, detail) {
  if (!ok) failures++
  results.push({ id: c.id, kind: c.kind, title: c.title, ok, detail: detail || '' })
}

function read(p) {
  try { return fs.readFileSync(p, 'utf8') } catch { return null }
}

/** Resolve `files` entries relative to ROOT. Missing files are reported. */
function readAll(files) {
  const missing = []
  const parts = []
  for (const f of files || []) {
    const t = read(path.join(ROOT, f))
    if (t === null) missing.push(f)
    else parts.push(t)
  }
  return { text: parts.join('\n'), missing }
}

function countMatches(text, re) {
  if (re.invalid) return 0
  // String.match only returns the first hit unless the regex is global.
  const g = new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags)
  const m = text.match(g)
  return m ? m.length : 0
}

function newRegex(pattern, flags, multi) {
  let f = flags || ''
  if (multi && f.indexOf('m') === -1) f += 'm'
  try { return new RegExp(pattern, f) } catch (e) { return { invalid: e.message } }
}

// ---------------------------------------------------------------------------
// kinds
// ---------------------------------------------------------------------------

function kFiles(c) {
  const missing = (c.files || []).filter(f => !fs.existsSync(path.join(ROOT, f)))
  if (missing.length) return { ok: false, detail: 'faltan: ' + missing.join(', ') }
  return { ok: true, detail: (c.files || []).length + ' ficheros' }
}

function kPresent(c) {
  const { text, missing } = readAll(c.files)
  if (missing.length) return { ok: false, detail: 'faltan: ' + missing.join(', ') }
  const re = newRegex(c.pattern, c.flags, true)
  if (re.invalid) return { ok: false, detail: 'regex invalida: ' + re.invalid }
  const n = countMatches(text, re)
  const min = c.min === undefined ? 1 : c.min
  return { ok: n >= min, detail: n + ' >= ' + min }
}

function kAbsent(c) {
  const { text, missing } = readAll(c.files)
  if (missing.length) return { ok: false, detail: 'faltan: ' + missing.join(', ') }
  const re = newRegex(c.pattern, c.flags, true)
  if (re.invalid) return { ok: false, detail: 'regex invalida: ' + re.invalid }
  const n = countMatches(text, re)
  if (n === 0) return { ok: true, detail: '0 coincidencias' }
  const first = (text.match(re) || ['?'])[0]
  return { ok: false, detail: n + ' prohibidas (ej: "' + first.slice(0, 48) + '")' }
}

function kCount(c) {
  const { text, missing } = readAll(c.files)
  if (missing.length) return { ok: false, detail: 'faltan: ' + missing.join(', ') }
  const re = newRegex(c.pattern, c.flags, true)
  if (re.invalid) return { ok: false, detail: 'regex invalida: ' + re.invalid }
  const n = countMatches(text, re)
  if (c.equals !== undefined) return { ok: n === c.equals, detail: n + ' === ' + c.equals }
  if (c.gte !== undefined) return { ok: n >= c.gte, detail: n + ' >= ' + c.gte }
  if (c.lte !== undefined) return { ok: n <= c.lte, detail: n + ' <= ' + c.lte }
  return { ok: false, detail: 'case sin equals/gte/lte' }
}

function kEvery(c) {
  const dir = path.join(ROOT, c.dir || '')
  let names = []
  try { names = fs.readdirSync(dir) } catch { return { ok: false, detail: 'no existe ' + c.dir } }
  const globRe = newRegex('^' + (c.glob || '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  const targets = names.filter(n => globRe.test && globRe.test(n))
  if (!targets.length) return { ok: false, detail: '0 ficheros en ' + c.dir }
  const re = newRegex(c.pattern, c.flags)
  if (re.invalid) return { ok: false, detail: 'regex invalida: ' + re.invalid }
  const bad = targets.filter(n => {
    const t = read(path.join(dir, n))
    return t === null || !re.test(t)
  })
  if (bad.length) return { ok: false, detail: bad.length + '/' + targets.length + ' sin el patron: ' + bad.slice(0, 6).join(', ') }
  return { ok: true, detail: targets.length + '/' + targets.length + ' cumplen' }
}

function kHeading(c) {
  let src = null
  if (c.dir) {
    // Concat every matching file in a directory: pointers are spread, not
    // concentrated in one document.
    let names = []
    try { names = fs.readdirSync(path.join(ROOT, c.dir)) } catch { return { ok: false, detail: 'no existe ' + c.dir } }
    const globRe = newRegex('^' + (c.glob || '*').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
    const targets = names.filter(n => globRe.test(n))
    src = targets.map(n => read(path.join(ROOT, c.dir, n)) || '').join('\n')
  } else {
    src = read(path.join(ROOT, c.file))
  }
  if (src === null || src === '') return { ok: false, detail: 'sin fuente' }
  const tgt = read(path.join(ROOT, c.target))
  if (tgt === null) return { ok: false, detail: 'no existe ' + c.target }
  const re = newRegex(c.pattern, c.flags, true)
  if (re.invalid) return { ok: false, detail: 'regex invalida: ' + re.invalid }
  const refs = []
  let m
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  while ((m = global.exec(src)) !== null) refs.push((m[1] || '').trim())
  if (!refs.length) return { ok: false, detail: '0 referencias encontradas' }
  const headings = tgt.split(/\r?\n/).filter(l => /^#{1,6}\s/.test(l)).map(l => l.replace(/^#{1,6}\s*/, '').trim())
  // Pointers abbreviate: "§ Prompt Defense Baseline (GLOBAL)" targets the
  // heading "Prompt Defense Baseline (GLOBAL - all agents)". Match on the
  // reference with its closing parens trimmed, not on exact equality.
  const bad = []
  for (const r of refs) {
    const key = r.replace(/\)+$/, '')
    if (headings.some(h => h === r || h.indexOf(key) === 0)) continue
    if (bad.indexOf(r) === -1) bad.push(r)
  }
  if (bad.length) return { ok: false, detail: bad.length + ' sin resolver: ' + bad.slice(0, 5).join(' | ') }
  return { ok: true, detail: refs.length + '/' + refs.length + ' resueltas' }
}

// Catalogs are discovery surfaces, not dispatch surfaces: an entry that only
// appears there has no automatic path. Same exclusion strict_orphans uses.
const CATALOG_COMMANDS = ['list-agents', 'list-skills', 'list-mcps', 'start-here']
const CATALOG_FILES = [
  '.opencode/AGENTS_INDEX.md',
  '.agents/skills/INDEX.md',
  'README.md',
  '.opencode/manual/COMMANDS.md',
]

function kOrphan() {
  const agentsDir = path.join(ROOT, '.opencode', 'agents')
  const commandsDir = path.join(ROOT, '.opencode', 'commands')
  const skillsDir = path.join(ROOT, '.agents', 'skills')
  const listMd = (d) => { try { return fs.readdirSync(d).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')) } catch { return [] } }

  const agents = listMd(agentsDir)
  const commands = listMd(commandsDir)
  let skills = []
  try { skills = fs.readdirSync(skillsDir).filter(d => fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))) } catch { skills = [] }

  const rd = (p) => read(p) || ''
  const tierA = [
    rd(path.join(skillsDir, 'router', 'SKILL.md')),
    rd(path.join(ROOT, '.opencode', 'AGENTS.md')),
    rd(path.join(ROOT, '.opencode', 'manual', 'ROUTE.md')),
    ...commands.filter(c => CATALOG_COMMANDS.indexOf(c) === -1).map(c => rd(path.join(commandsDir, c + '.md'))),
    ...agents.map(a => rd(path.join(agentsDir, a + '.md'))),
    ...skills.map(s => rd(path.join(skillsDir, s, 'SKILL.md'))),
  ].join('\n')
  const tierB = [
    ...CATALOG_COMMANDS.map(c => rd(path.join(commandsDir, c + '.md'))),
    ...CATALOG_FILES.map(f => rd(path.join(ROOT, f))),
  ].join('\n')

  // Agents and skills need an automatic dispatch path. Commands do not: the
  // user types them, so appearing only in the commands manual is legitimate.
  const scan = (names) => names.filter(n => tierA.indexOf(n) === -1 && tierB.indexOf(n) !== -1)
  const dead = (names) => names.filter(n => tierA.indexOf(n) === -1 && tierB.indexOf(n) === -1)

  const badAgents = scan(agents).concat(dead(agents))
  const badSkills = scan(skills).concat(dead(skills))
  const badCommands = dead(commands)
  const total = badAgents.length + badCommands.length + badSkills.length
  const detail = total === 0
    ? agents.length + ' agents / ' + skills.length + ' skills / ' + commands.length + ' commands'
    : ['agents: ' + badAgents.join(','), 'commands: ' + badCommands.join(','), 'skills: ' + badSkills.join(',')].filter(s => !/:$/.test(s)).join(' | ')
  return { ok: total === 0, detail }
}

function kMetric(c) {
  const bin = path.join(ROOT, '.opencode', 'bin', (c.tool || '') + '.js')
  if (!fs.existsSync(bin)) return { ok: false, detail: 'no existe ' + c.tool }
  let out
  try {
    out = execFileSync(process.execPath, [bin, '--json'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    // A red metric is a legitimate, documented state: parse stdout anyway.
    out = String(e.stdout || '')
    if (!out) return { ok: false, detail: c.tool + ' sin salida: ' + e.message }
  }
  let data
  try { data = JSON.parse(out) } catch { return { ok: false, detail: c.tool + ' --json no es JSON valido' } }
  const v = data[c.field]
  if (v === undefined) return { ok: false, detail: 'sin campo "' + c.field + '"' }
  if (c.equals !== undefined) return { ok: v === c.equals, detail: String(v) + ' === ' + c.equals }
  if (c.gte !== undefined) return { ok: v >= c.gte, detail: String(v) + ' >= ' + c.gte }
  if (c.lte !== undefined) return { ok: v <= c.lte, detail: String(v) + ' <= ' + c.lte }
  return { ok: false, detail: 'case sin equals/gte/lte' }
}

function loadJsonAbs(absPath) {
  const t = read(absPath)
  const rel = path.relative(ROOT, absPath).split(path.sep).join('/')
  if (t === null) return { error: 'no existe ' + rel }
  try { return { value: JSON.parse(t) } } catch (e) { return { error: 'JSON invalido en ' + rel + ' (' + e.message + ')' } }
}

function jsonType(v) {
  if (Array.isArray(v)) return 'array'
  if (v === null) return 'null'
  return typeof v
}

// Validate only the SHAPE of a verdict against the compact declarative schema in
// evals/judge/verdict.schema.json. No model, no network: the judge is
// non-deterministic, so CI guards the contract, never the values.
function validateVerdictShape(instance, schema) {
  const errors = []
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
  if (!isObj(instance)) return ['el veredicto no es un objeto JSON']
  for (const key of schema.required || []) {
    if (!(key in instance)) errors.push('falta "' + key + '"')
  }
  for (const [key, t] of Object.entries(schema.types || {})) {
    if (key in instance && jsonType(instance[key]) !== t) {
      errors.push('"' + key + '" debe ser ' + t + ' (es ' + jsonType(instance[key]) + ')')
    }
  }
  for (const [key, subKeys] of Object.entries(schema.objects || {})) {
    if (!(key in instance)) continue
    if (!isObj(instance[key])) { errors.push('"' + key + '" debe ser un objeto'); continue }
    for (const sk of subKeys) {
      if (!(sk in instance[key])) errors.push('falta "' + key + '.' + sk + '"')
    }
  }
  for (const [key, allowed] of Object.entries(schema.enums || {})) {
    if (key in instance && allowed.indexOf(instance[key]) === -1) {
      errors.push('"' + key + '" fuera de ' + allowed.join('|'))
    }
  }
  for (const [key, range] of Object.entries(schema.numberRange || {})) {
    if (!(key in instance)) continue
    const v = instance[key]
    if (typeof v !== 'number' || v < range[0] || v > range[1]) {
      errors.push('"' + key + '" fuera de [' + range[0] + ',' + range[1] + ']')
    }
  }
  if (schema.criteria) {
    const arr = instance.criteria
    if (!Array.isArray(arr) || arr.length === 0) {
      errors.push('"criteria" debe ser un array no vacio')
    } else {
      arr.forEach((c, i) => {
        if (!isObj(c)) { errors.push('criteria[' + i + '] no es objeto'); return }
        for (const rk of schema.criteria.required || []) {
          if (!(rk in c)) errors.push('criteria[' + i + '].' + rk + ' falta')
        }
        for (const [k, t] of Object.entries(schema.criteria.types || {})) {
          if (k in c && jsonType(c[k]) !== t) errors.push('criteria[' + i + '].' + k + ' debe ser ' + t)
        }
      })
    }
  }
  return errors
}

function kVerdict(c) {
  const missing = (c.surface || []).filter(f => !fs.existsSync(path.join(ROOT, f)))
  if (missing.length) return { ok: false, detail: 'faltan superficies: ' + missing.join(', ') }

  const s = loadJsonAbs(path.join(ROOT, c.schema))
  if (s.error) return { ok: false, detail: 'schema: ' + s.error }
  const i = loadJsonAbs(path.join(ROOT, c.instance))
  if (i.error) return { ok: false, detail: 'fixture: ' + i.error }

  const errors = validateVerdictShape(i.value, s.value)

  if (c.rubricFile) {
    const t = read(path.join(ROOT, c.rubricFile))
    if (t === null) {
      errors.push('rubricFile ausente: ' + c.rubricFile)
    } else {
      const re = newRegex(c.rubricPattern, 'gm')
      if (re.invalid) errors.push('rubricPattern invalida: ' + re.invalid)
      else {
        const n = countMatches(t, re)
        const min = c.minRubrics || 1
        if (n < min) errors.push('rubricas ' + n + ' < ' + min)
      }
    }
  }

  if (errors.length) return { ok: false, detail: errors.slice(0, 6).join('; ') }
  return { ok: true, detail: 'esquema + superficie OK' }
}

// Validate the declarative policy-rules.json SHAPE offline: JSON parses and
// every rule carries {id, severity, match, tool, message} with a compilable
// regex and a valid severity. Does NOT execute the plugin or run any command.
const POLICY_SEVERITIES = ['warn', 'ask', 'deny']
const POLICY_MODES = ['enforce', 'warn-only', 'off']

function kPolicy(c) {
  const file = c.file || '.opencode/policy-rules.json'
  const raw = read(path.join(ROOT, file))
  if (raw === null) return { ok: false, detail: 'no existe ' + file }
  let data
  try { data = JSON.parse(raw) } catch (e) { return { ok: false, detail: 'JSON invalido: ' + e.message } }

  const errors = []
  if (typeof data.version !== 'number') errors.push('version debe ser number')
  if (typeof data.mode !== 'string' || POLICY_MODES.indexOf(data.mode) === -1) {
    errors.push('mode invalido (esperado: ' + POLICY_MODES.join('|') + ')')
  }
  if (!Array.isArray(data.rules)) {
    errors.push('rules debe ser un array')
    return { ok: false, detail: errors.join('; ') }
  }
  const ids = new Set()
  data.rules.forEach((r, i) => {
    const tag = 'rules[' + i + ']'
    if (!r || typeof r !== 'object' || Array.isArray(r)) { errors.push(tag + ' no es objeto'); return }
    if (typeof r.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(r.id)) errors.push(tag + '.id invalido')
    else if (ids.has(r.id)) errors.push('id duplicado: ' + r.id)
    else ids.add(r.id)
    if (POLICY_SEVERITIES.indexOf(r.severity) === -1) errors.push(tag + '.severity invalido')
    if (typeof r.match !== 'string') {
      errors.push(tag + '.match debe ser string')
    } else {
      try { new RegExp(r.match, r.flags || '') } catch (e) { errors.push(tag + '.match regex invalida') }
    }
    const toolOk = typeof r.tool === 'string' ||
      (Array.isArray(r.tool) && r.tool.length > 0 && r.tool.every(t => typeof t === 'string'))
    if (!toolOk) errors.push(tag + '.tool invalido')
    if (typeof r.message !== 'string' || r.message.length < 8) errors.push(tag + '.message invalido')
  })
  if (data.rules.length < 18) errors.push('rules.length ' + data.rules.length + ' < 18')
  if (!data.rules.some(r => r && r.severity === 'deny')) errors.push('sin regla deny')
  if (!data.rules.some(r => r && r.severity === 'warn')) errors.push('sin regla warn')
  if (!data.rules.some(r => r && r.severity === 'ask')) errors.push('sin regla ask')

  if (errors.length) return { ok: false, detail: errors.slice(0, 6).join('; ') }
  return { ok: true, detail: data.rules.length + ' reglas, mode=' + data.mode }
}

const KINDS = {
  files: kFiles,
  present: kPresent,
  absent: kAbsent,
  count: kCount,
  every: kEvery,
  heading: kHeading,
  orphan: kOrphan,
  metric: kMetric,
  verdict: kVerdict,
  policy: kPolicy,
}

// ---------------------------------------------------------------------------
// dataset
// ---------------------------------------------------------------------------

function loadCases() {
  let names = []
  try { names = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json')) }
  catch { return { cases: [], error: 'no existe el directorio evals/cases' } }
  const cases = []
  const errors = []
  for (const n of names) {
    const raw = read(path.join(CASES_DIR, n))
    if (raw === null) { errors.push(n + ': ilegible'); continue }
    let data
    try { data = JSON.parse(raw) } catch (e) { errors.push(n + ': JSON invalido (' + e.message + ')'); continue }
    const list = Array.isArray(data) ? data : [data]
    for (const c of list) {
      if (!c || !c.id || !c.kind) { errors.push(n + ': case sin id/kind'); continue }
      cases.push(c)
    }
  }
  return { cases, error: errors.length ? errors.join('; ') : null }
}

function run() {
  const { cases, error } = loadCases()
  if (error && !cases.length) {
    const msg = 'dataset ilegible: ' + error
    if (AS_JSON) console.log(JSON.stringify({ ok: false, error: msg, results: [], failures: 1 }))
    else console.log('EVAL-STATIC FAIL  ' + msg)
    process.exit(1)
  }

  for (const c of cases) {
    const fn = KINDS[c.kind]
    if (!fn) { record(c, false, 'kind desconocido: ' + c.kind); continue }
    let r
    try { r = fn(c) } catch (e) { r = { ok: false, detail: 'excepcion: ' + e.message } }
    record(c, r.ok !== false, r.detail)
  }

  const okCount = results.length - failures
  if (AS_JSON) {
    console.log(JSON.stringify({ ok: failures === 0, cases: results.length, failures, results }, null, 2))
  } else {
    if (!QUIET) for (const r of results) console.log('  ' + (r.ok ? 'PASS' : 'FAIL') + '  ' + r.id.padEnd(6) + ' ' + r.title + (r.detail ? '  [' + r.detail + ']' : ''))
    console.log('')
    console.log('eval-static: ' + okCount + '/' + results.length + ' cases passed | failures=' + failures)
    if (error) console.log('warning: ' + error)
  }
  process.exit(failures === 0 ? 0 : 1)
}

run()
