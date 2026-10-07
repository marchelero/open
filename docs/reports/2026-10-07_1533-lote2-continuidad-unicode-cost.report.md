---
source: docs/reports/2026-10-07_1426-lote1-policy-hardening.report.md (propuesta "Lote 2")
status: COMPLETE
created: 2026-10-07_1533
---

# Report: Lote 2 — continuidad, unicode-safety y cost report (ECC → open)

Cierra los 4 candidatos del "Lote 2". Todos usan hooks/archivos ya existentes:
**0 archivos nuevos de código, 0 deriva de counts** (los únicos archivos nuevos
son este report y snapshots runtime de `docs/sessions/`).

## Qué se hizo

### C2 — Scanner de unicode peligroso (`lint-docs.js`, regla **R8**)

El Prompt Defense Baseline de `AGENTS.md` nombra "unicode, homoglyphs, invisible
or zero-width characters" pero nada lo verificaba. Nueva regla **R8** (read-only,
sin `--write`) sobre cada línea, fences incluidos:

- zero-width space/joiner `U+200B–200D`, word joiner `U+2060`, BOM `U+FEFF`
- controles bidi `U+202A–202E` e isolates `U+2066–2069`
- **Unicode Tag block `U+E0000–E007F`** (vector de "ASCII/Tag smuggling")
- `U+180E`, `U+115F/1160`, operadores invisibles `U+2061–2064`, `U+3164`,
  variation selectors suplementarios `U+E0100–E01EF`

Excluye deliberadamente `U+FE00–FE0F` (variation selectors de emoji): el pack usa
✅/🟡/🟢 en sus reportes y marcarlos sería un falso positivo masivo. Verificado:
0 hits en el repo actual; un `U+200B` y un tag-block inyectados → detectados.

### C5 — Hook de continuidad en compaction (`cost-ledger.js`)

`experimental.session.compacting` (hook que estaba libre) añade una instrucción
al prompt de compaction: antes de perder el contexto, dejar un handoff factual en
`docs/sessions/` y mantener `LATEST.md`, nunca commitear. Antes esto era solo
prosa en AGENTS.md, sin garantía en runtime.

### C6 — Auto-snapshot factual en `session.idle` (`cost-ledger.js`)

En cada `session.idle` (si hubo ≥1 mensaje del asistente) escribe
`docs/sessions/<YYYY-MM-DD>-session-<id>.md` con: fecha, branch, agente, modelo,
nº de mensajes, tokens in/out, costo, duración, y `git status --porcelain`
(timeout 1.5 s). Un archivo por sesión, refrescado en cada idle (idempotente).

`LATEST.md` solo se sobreescribe mientras siga pareciendo auto-generado → un
handoff narrado de `/session-end` **nunca** es pisado por un idle. Verificado en
un repo temporal: snapshot + ledger escritos; LATEST narrado preservado.

> Nota: la regla 4 (session memory) no estaba disparando — `docs/sessions/` tenía
> solo `README.md`. Este hook la hace efectiva sin depender del prompt.

### C9 — Surfacear el cost ledger (`context.js --cost`)

`cost-ledger.js` escribía `docs/state/cost-*.json` y **ningún lector** los leía
(solo el prompt de `/session-end` los listaba). Nuevo `context.js --cost`:
totales de sesiones/tokens/costo + desglose **por día** y **por modelo**; marca
`estimated` y costo parcial. El reporte completo (`/context-budget`) muestra una
línea de costo inline. Cero cambio de count (flag en un CLI existente).

## Verificación

| Gate | Resultado |
|---|---|
| `counts --check` | exit 0 (sin cambios de count) |
| `validate-frontmatter` | 0 fail (2 warnings pre-existentes) |
| `verify-lockfile` | CLEAN (108+68) |
| `lint-docs` | R1–R8 = 0, new=0 |
| `smoke-test` | PASSED |
| `wiring-test` | 8/8 |
| `installer-test` | 43/43 |
| `eval-static` | **25/25** (E23–E25 nuevas) |
| `gateguard --selftest` | 33/33 |
| `policy-selftest` | 84/0 |

Invariantes nuevas (`evals/cases/static.json`):
- **E23** — `experimental.session.compacting` + `writeSessionSnapshot` presentes.
- **E24** — scanner "Unicode Tag block" presente en `lint-docs.js`.
- **E25** — `--cost` presente en `context.js`.

Pruebas runtime (fuera del repo, en `/tmp`): `context.js --cost` agrega por
día/modelo; `cost-ledger.js` escribe snapshot + ledger y respeta LATEST narrado;
R8 detecta zero-width y tag-block.

## Archivos

**Modificados**: `.opencode/bin/lint-docs.js`, `.opencode/plugins/cost-ledger.js`,
`.opencode/bin/context.js`, `.opencode/commands/context-budget.md`,
`docs/sessions/README.md`, `evals/cases/static.json`, este report.

## Notas de seguridad

- R8 es **read-only**: no se portó el `--write` sanitizer de ECC (reescribir
  archivos del usuario desde un linter es exactamente el tipo de acción que el
  pack evita).
- C6 escribe solo bajo `docs/sessions/` y nunca commitea (respeta E1).
- C5 solo hace `output.context.push(...)`; si el hook no dispara, no pasa nada.
- Todo con try/catch: ningún handler puede tumbar la sesión.

## Pendientes

Ninguno del roadmap ECC original (Lotes 1 y 2 cerrados). Sin commitear — espera
verbo explícito.
