---
source: docs/reports/2026-10-08_0409-shell-env.report.md (trabajo de otro equipo) + pedido del usuario
status: COMPLETE
created: 2026-10-08_0914
---

# Report: revisión del pack + upgrade in-place del instalador

## Parte 1 — Revisión tras el trabajo del otro equipo

El otro equipo completó el candidato **C8 (`shell.env`)** del backlog
(`docs/reports/2026-10-08_0409-shell-env.report.md`) y **commiteó todo** (git
limpio). Verificado: **nada se rompió**.

Cambios suyos detectados:
- Nuevo `.opencode/bin/lib/stack-detect.js` (factory `createStackDetector` + branch .NET) y `.opencode/plugins/stack-env.js` (4º plugin local, hook `shell.env`, opt-out `OPENCODE_STACK_ENV`).
- `refresh-project.js` refactorizado para consumir la lib.
- Invariantes **E26/E27**, step de CI `stack-env self-test`, `plugins_local` 3→4.

Batería completa (toda verde):

| Gate | Resultado |
|---|---|
| `counts --check` | OK (`plugins_local=4`) |
| `validate-frontmatter` | 0 fail / 0 warn |
| `verify-lockfile` | CLEAN (108 skills + 68 agents) |
| `lint-docs` | R1–R8 = 0 |
| `smoke-test` · `wiring-test` | PASSED · 8/8 |
| `installer-test` | **49/49** (43 + T8 nuevo) |
| `eval-static` | **27/27** (E26/E27 incluidos) |
| `gateguard --selftest` · `policy-selftest` · `stack-env --selftest` | 33/33 · 84/0 · 22/22 |

## Parte 2 — Upgrade in-place del instalador (`init-opencode.js`)

### Análisis previo (empírico)

Se instaló el pack en un directorio temporal, se simuló una "versión vieja"
(skill propia + archivos obsoletos + edición de un archivo del pack) y se
re-instaló. Comportamiento **antes** del cambio:

- ✅ Re-instalar sobre una ruta existente **no rompe**: sobrescribe los archivos del pack con la versión nueva.
- ✅ Las **skills propias del proyecto se conservan** (el copiado solo agrega/sobrescribe; no borra).
- ❌ Los **archivos obsoletos** (que el pack ya no trae) **quedaban** → conflictos y conteos inflados.
- ❌ No se **detectaban/reportaban** las skills propias del proyecto.

### Cambio implementado

- **Manifest de upgrade**: cada instalación escribe `.opencode/.pack-manifest.json`
  con los archivos pack-managed realmente instalados bajo `.opencode/`. En la
  **siguiente** instalación, los archivos del manifest que el pack nuevo ya no
  trae se eliminan (obsoletos), y se limpian las carpetas que queden vacías.
  Es seguro: solo borra lo que el propio instalador registró antes → **nunca**
  toca archivos del usuario.
- **`--prune`**: limpieza forzada para una instalación vieja **sin manifest**,
  limitada a directorios pack-owned (`bin/`, `manual/`, `templates/`, `lib/`).
  **Nunca** toca `agents/`, `commands/`, `plugins/` (extensibles por el usuario).
- **`.agents/skills/` NUNCA se poda**: las skills del pack se refrescan; las
  skills propias del proyecto se conservan y se **reportan**.
- Mensajería: `[UPGRADE] ... obsoletos eliminados`, `[INFO] Skills propias del proyecto conservadas (N)`, y aviso de manifest en el resumen.

### Comportamiento resultante (requisito del usuario)

| Acción al aplicar sobre una ruta con el pack | Resultado |
|---|---|
| Archivos del pack (agents, commands, bin, manual, plugins, config) | **reemplazados** por la versión nueva |
| Ediciones del usuario sobre archivos del pack | reemplazadas (el pack manda) |
| Archivos obsoletos de una versión vieja (con manifest) | **eliminados** |
| Archivos obsoletos (sin manifest, `--prune`) | eliminados en dirs pack-owned |
| **Skills del pack** | actualizadas, **nunca borradas** |
| **Skills propias del proyecto** | **conservadas** y reportadas |
| `opencode.json` / `skills-lock.json` / `.gitignore` | merge conservador (el proyecto manda) |
| Archivos propios del usuario en `.opencode/` | intactos (no están en el manifest) |

### Prueba empírica (post-cambio)

- Upgrade con manifest: obsoleto `bin/legacy-tool.js` **eliminado**, skill propia
  conservada y reportada, manifest regenerado sin el obsoleto.
- `--prune` sin manifest: obsoleto pack-owned eliminado; comando propio
  (`.opencode/commands/my-cmd.md`) y skill propia **conservados**.
- `installer-test` **T8** agregado y verde (49/49) — blinda el comportamiento en CI.

### Nota de compatibilidad

La primera re-instalación sobre una versión **sin manifest** no puede podar
obsoletos automáticamente (no hay registro de qué era pack-managed). Se resuelve
con `--prune` (una vez); a partir de ahí el manifest lo hace automático.

## Archivos

**Modificados**: `init-opencode.js`, `.opencode/bin/installer-test.js`, este report.
Ningún cambio de counts (ambos están fuera de `.opencode/bin/*` contables / son el
propio test). Nada commiteado — espera verbo explícito.
