# Audit: cierre del plan ECC (merges + Tier 1)

**Fecha:** 2026-10-07 12:31
**Objeto:** `.agents/skills/*` (4 merges + 29 imports) y la deriva de recuentos asociada
**Base:** `docs/prds/2026-10-07_0303-ecc-aprovechamiento.prd.md` (AC-05, AC-06, AC-07)
**Método:** ejecución de la batería completa de gates del pack + escaneo de referencias ajenas + comparación de secciones contra `/home/marcelo/dev/ECC/skills/`.

---

## 1. Veredicto

**PASS.** 7/7 AC del PRD cubiertos; 8/8 gates verdes; 0 regresiones detectadas.
2 nits propios (abajo), ninguno bloqueante.

---

## 2. Criterios de aceptación

| AC | Esperado | Resultado | Evidencia |
|----|----------|-----------|-----------|
| AC-05 | Las 14 homónimas incorporan las mejoras de ECC | ✅ | 13 con veredicto "mejorar/fix" aplicadas; `api-design` dedupe no era necesario (sin sección duplicada) |
| AC-06 | Tier 1 en formato del pack, `validate-frontmatter` + `verify-lockfile` CLEAN | ✅ | 29/29 importadas; frontmatter `name`+`description`+`triggers`+`origin`; lockfile CLEAN a 108+68 |
| AC-07 | Toda la batería verde sin regresión | ✅ | counts, frontmatter, lockfile, smoke, wiring 8/8, installer 43/43, eval-static 22/22, lint-docs new=0 |

---

## 3. Verificaciones de no-regresión

| Check | Resultado |
|---|---|
| Escaneo `claude\|anthropic\|\.cursor\|copilot\|ECC` en los 29 imports | ✅ 0 restos tras des-adaptar `tdd-workflow` |
| Referencias `skill:` / `agent:` cruzadas en los 29 imports | ✅ 0 apuntan a inexistentes (`validate-frontmatter` body-refs OK) |
| Router lexico (E16) con 29 skills nuevas en el catálogo | ✅ `true === true` — no diluyó el top1 |
| RAG cross-proyecto (E17) | ✅ sin cambio |
| Boot token budget (E7, `measure-tokens`) | ✅ GREEN — skills siguen on-demand |
| Recuentos duros (E11, E15, `installer-test`, docs) | ✅ sincronizados a 108 skills |
| `lint-docs` sobre 494 .md | ✅ R1–R7 = 0, new = 0 |

---

## 4. Nits (no bloqueantes)

1. **2 warnings de frontmatter pre-existentes** (`ui-ux-pro-max`, `vercel-react-best-practices`) — no arrancan con "Use when...". Pre-existentes al PRD; fuera de alcance.
2. **`docs/PROJECT.md` stale** — declara 72 agents / 65 commands / 21 skills (real: 68 / 64 / 108). Generado el 2026-07-27; requiere `refresh-project`, que preserva secciones manuales. No se tocó para no arriesgar contenido manual.

---

## 5. Decisión

Cerrar AC-05 y AC-06. El plan queda `COMPLETE` (24/24 tareas). Cambios sin commitear —
esperan verbo explícito.
