---
source: prueba real de instalación en /home/marcelo/dev/vuce2/documentacion
status: COMPLETE
created: 2026-10-08_1000
---

# Report: upgrade in-place del instalador — fixes del pack tras la prueba real

Prueba real: instalar el pack `open` sobre `/home/marcelo/dev/vuce2/documentacion`,
una **instalación vieja** (sin manifest) del fork MKY/agentes (77 agents, 79
commands, junctions legacy, `opencode.json` con MCP propio `parametrica`). La
prueba destapó 6 huecos; se corrigieron en el pack y se validaron.

Backup reversible: `/tmp/opencode/backup-vuce2-doc_20261008_094534.tar.gz`
(`.opencode/`, `.agents/`, `opencode.json` previos).

## Huecos encontrados y fixes

### F1 — `--prune` solo cubría `bin/manual/templates`
Los obsoletos de una versión vieja viven sobre todo en `agents/` y `commands/`
(aquí: 9 agents + 15 commands del fork viejo). `--prune` no los tocaba.
**Fix:** `--prune` ahora limpia **toda** la superficie `.opencode/` que el pack
nuevo ya no trae (agents/commands/plugins incluidos), imprimiendo cada borrado.
Nunca toca `.agents/skills/`, `docs/`, `node_modules/`, `logs/`, `state/`.
Además `--prune` ahora funciona **junto** al manifest (antes solo sin él).

### F2 — Junctions legacy no se eliminaban
El install viejo tenía `.opencode/agent -> agents` y `.opencode/skill -> ../.agents/skills` (symlinks legacy). El pack nuevo las removió y `smoke-test` las exige ausentes → el proyecto instalado fallaba `smoke-test`.
**Fix:** el instalador elimina `.opencode/agent` y `.opencode/skill` en cada
install (symlink → `unlink`; duplicado → `rm -rf`).

### F3 — Lockfile con drift (skills propias sin pinnear)
El `skills-lock.json` del pack tiene 108 skills; el proyecto quedó con 112
(108 + 4 propias) → `verify-lockfile` en rojo.
**Fix:** el instalador re-pinnea el lockfile del proyecto (FASE 5), como ya
regenera counts/índices.

### F4 — El merge conservador del lockfile rompía la idempotencia
`mergeJsonConservative` re-agregaba los agentes filtrados por stack y el re-pin
los quitaba → el lockfile cambiaba en cada corrida (T3 fallaba por el timestamp).
**Fix:** `skills-lock.json` **no se mergea**; se regenera autoritativamente con
`verify-lockfile --fix` (check-then-fix: solo reescribe si hay drift real).

### F5 — `postinstall` con path incorrecto
`.opencode/package.json` declaraba `postinstall: node .opencode/bin/install-plugins.js`.
npm ejecuta los scripts con cwd = `.opencode`, así que el path resolvía a
`.opencode/.opencode/bin/...` → `npm install` salía con código 1.
**Fix:** `postinstall: node bin/install-plugins.js` (relativo al package dir).

### F6 — `spawnNodeQuiet` trataba el exit no-cero como éxito
Devolvía `null` (éxito) ante cualquier status no nulo, así que el check de drift
del lockfile nunca detectaba drift. 
**Fix:** nuevo helper `runNodeStatus()` que devuelve el exit code real; el re-pin
lo usa.

## Verificación

### Pack (`/home/marcelo/dev/open`)
| Gate | Resultado |
|---|---|
| counts · frontmatter · lockfile | OK · 0/0 · CLEAN |
| lint-docs · smoke · wiring | R1–R8=0 · OK · OK |
| **installer-test** | **52/52** (T8 upgrade + T9 junctions/lockfile nuevos) |
| eval-static | 27/27 |
| gateguard · policy · stack-env selftests | 33/33 · 84/0 · 22/22 |

### Proyecto instalado (`/home/marcelo/dev/vuce2/documentacion`)
| Gate | Resultado |
|---|---|
| counts · verify-lockfile · smoke · wiring · frontmatter | OK · CLEAN · OK · OK · OK |
| gateguard · policy selftests | OK · OK |
| Conteos finales | **68 agents · 64 commands · 112 skills (108 pack + 4 propias) · 4 plugins · 22 bin** |
| MCP propio `parametrica` | **preservado** (merge conservador de `opencode.json`) |
| Skill propia `parametrica-sql` | **preservada** |
| Obsoletos del fork viejo | **eliminados** (p.ej. `seo-specialist`, `rust-build`) |
| Junctions legacy | **eliminadas** |
| `npm install` | **OK** (antes fallaba) |

## Notas

- **3 skills del pack viejo quedan** por diseño (las skills nunca se borran):
  `agent-router`, `skill-router`, `testing-patterns` (fusionadas en `router` /
  `testing`). Son redundantes, no propias del proyecto. Se pueden borrar a mano
  si se desea; el instalador no lo hace para no arriesgar skills del usuario.
- `lint-docs` y `eval-static` en el proyecto instalado no son gates relevantes:
  `eval-static.js` **no se copia** por diseño (SKIP_FILE_NAMES) y `lint-docs`
  reporta mojibake de docs propias del proyecto (ajenas al pack).

## Archivos del pack modificados

`init-opencode.js`, `.opencode/bin/installer-test.js`, `.opencode/package.json`,
este report. Sin cambio de counts. Nada commiteado.
