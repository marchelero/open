# Audit: revisión completa del pack `open`

**Fecha:** 2026-10-07 16:25
**Objeto:** pack `open` completo (`.opencode/`, `.agents/skills/`, `evals/`, `docs/`, `opencode.json`)
**Método:** batería completa de gates + self-tests de plugins + chequeo de sintaxis JS + verificación de counts contra el filesystem + escaneo de secretos + revisión de drift de documentación.
**Contexto:** verificar el estado tras los Lotes 1 y 2 (policy hardening, continuidad, unicode, cost report) y confirmar que nada se rompió.

---

## 1. Veredicto

**PASS — el pack está sano.** 9/9 gates verdes, 0 fallos, 0 secretos, 0 regresiones.
Se corrigieron 3 drift de documentación detectados (pre-existentes, no causados por los Lotes).
Quedan 2 items abiertos que necesitan tu decisión (no bloquean nada).

---

## 2. Gates (todos verdes)

| Gate | Resultado |
|---|---|
| `counts --check` | exit 0 |
| `validate-frontmatter` | 0 fail / 2 warnings (pre-existentes) |
| `verify-lockfile` | CLEAN — 108 skills + 68 agents |
| `lint-docs` | 497 .md · R1–R8 = 0 · new = 0 |
| `smoke-test` | PASSED |
| `wiring-test` | 8/8 |
| `installer-test` | 43/43 |
| `eval-static` | 25/25 |
| `gateguard --selftest` | 33/33 |
| `policy-selftest` | 84/0 |
| `install-plugins --check` | OK (4 plugins presentes) |
| `measure-tokens` | boot 1519 / 2000 → **GREEN** |
| `security-audit` (secrets) | passed (0 findings) |
| Sintaxis JS (bin + plugins) | todos parsean |
| Carga de plugins (hookify/gateguard/cost-ledger) | OK |

## 3. Counts vs filesystem

| Métrica | Esperado | Real |
|---|---|---|
| agents | 68 | 68 |
| commands | 64 | 64 |
| skills | 108 | 108 |
| CLIs | 22 | 22 (de 23 archivos; 1 excluido por diseño) |
| plugins npm / local | 3 / 3 | 3 / 3 |
| MCPs activos / opcionales | 1 / 13 | 1 / 13 |

`AGENTS.md` sin cambios → el presupuesto de boot no se movió.

## 4. Integridad de lo agregado

- 29 skills Tier 1: **29/29** presentes en `INDEX.md` y en `skills-lock.json`; todas con body no vacío; frontmatter válido.
- 7 tools nativas + `changed-files-store.ts`: presentes (E21).
- 4 skills homónimas fusionadas: estructura de headings coherente (frontend 11 · backend 13 · database 9 · docker 11 secciones).
- `router` incluye las 29 filas nuevas; E16 (router lexico) sigue verde.
- Invariantes E23–E25 (continuidad, unicode R8, cost) presentes y verdes.

## 5. Drift de documentación corregido en esta revisión

Todo **pre-existente en HEAD** (no introducido por los Lotes):

1. `.agents/skills/pack-reference/SKILL.md`
   - árbol: `72 subagentes` → **68**; `10 CLIs` → **22**.
   - junctions legacy (`.opencode/agent`, `.opencode/skill`) listadas como obligatorias → **removidas** (contradecía `.gitignore` líneas 28-30: "removed; opencode >=1.14 usa rutas plurales nativas").
   - sección Plugins describía un `DestructiveWarner` + `destructive.log` que ya no existen → reescrita con los 3 plugins reales (hookify/gateguard/cost-ledger) y `policy.log`/`gateguard.log`.
2. `.opencode/README.md` — decía que `install-plugins.js` "skip si node_modules existe"; el script es ahora auto-reparable. Corregido.
3. `.opencode/manual/README.md` — listaba solo `hookify.js` como plugin local. Corregido a los 3.

`skills-lock.json` re-pinneado tras editar `pack-reference`.

## 6. Items abiertos (necesitan decisión, no bloquean)

1. **`pack-reference` § "Communication Triage Pattern" (líneas ~88-107)** — contenido fuera de lugar (email/Slack/Jira, tiers de triage) para una skill de referencia del pack. Su item 6 **"Knowledge files — Git commit all changes"** contradice la conducta obligatoria #3 del pack (git consent) y la invariante E1. **Recomendación: eliminar la sección.** No la borré sin tu OK porque es contenido, no un dato factual.
2. **`docs/PROJECT.md` desactualizado** (72 agents / 65 commands / 21 skills; generado 2026-07-27). Se arregla con `refresh-project` (preserva secciones manuales). No lo toqué para no arriesgar ediciones manuales.

## 7. Observaciones menores (pre-existentes, sin acción)

- 2 warnings de frontmatter: `ui-ux-pro-max` y `vercel-react-best-practices` (description no arranca con "Use when..."). Cosmético.
- `.agents/skills/docx/scripts/office/__pycache__/` — basura de un skill de terceros (untracked).
- Untracked ajenos al pack: docx/md de VUCE, `docs/media/` — no relacionados.

## 8. Conclusión

Nada se rompió: los Lotes 1 y 2 no introdujeron regresiones y todos los invariantes del pack se mantienen. El único hallazgo real de fondo es la sección de triage en `pack-reference` (item 6.1), que conviene remover.
