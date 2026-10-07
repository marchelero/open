---
source: docs/audits/2026-10-07_1625-pack-full-review.audit.md (items A1–A4)
status: COMPLETE
created: 2026-10-07_1647
---

# Report: Lote 3 — cerrar CI, limpiar warnings y drift

Cierra los 4 huecos detectados en la revisión completa. Todo son mejoras de
infraestructura/documentación: **0 cambios de comportamiento**, 0 deriva de counts.

## Qué se hizo

### A1 — CI corre los self-tests de los plugins

`.github/workflows/ci.yml` (Windows + Linux) corría la batería pero **no** los
self-tests de los plugins, así que todo el Lote 1 (reglas nuevas, escaneo
shell-substitution/heredoc) estaba sin red de seguridad. Añadidos 2 steps por job:

```yaml
- name: "gateguard self-test"
  run: node .opencode/plugins/gateguard.js --selftest
- name: "policy self-test"
  run: node .opencode/bin/lib/policy-selftest.js
```

`install-plugins --check` se **omitió** a propósito: CI no corre `npm install`, así
que sin `node_modules` fallaría (no es CI-safe). Header del workflow actualizado
(tiers 1–4).

### A2 — `counts --check` cubre los 2 archivos que faltaban

CI chequeaba solo 3 archivos con bloque `## Counts`. Se agregaron
`.opencode/CHANGELOG.md` y `.opencode/AGENTS_INDEX.md` (también lo tienen) → drift
ahí ahora se detecta.

### A3 — Los 2 warnings de frontmatter resueltos

`ui-ux-pro-max` y `vercel-react-best-practices` tenían descripciones que no
arrancaban con "Use when...". Reescritas para respetar la convención.
`validate-frontmatter` ahora: **0 fail / 0 warnings**.

### A4a — Sección fuera de lugar eliminada de `pack-reference`

La skill `pack-reference` (referencia del pack) contenía una "Communication Triage
Pattern" (email/Slack/Jira) cuyo checklist incluía **"Knowledge files — Git commit
all changes"** — contradecía la conducta obligatoria #3 (git consent) y la
invariante E1. Se eliminó la sección completa.

### A4b — `docs/PROJECT.md` regenerado (y bug de refresh arreglado)

`refresh-project.js` tenía un bug real: al preservar secciones manuales usaba el
flag `m`, con lo que `$` matcheaba fin de línea y **solo preservaba el comentario
`<!-- manual -->`, descartando el cuerpo** (p. ej. `- **License**: MIT`). Además,
`Glossary` y `Token / MCP Opt-in` no estaban en la lista de secciones preservadas
→ se perdían enteras.

Arreglado:
- `reFor` sin flag `m` (el `$` vuelve a ser fin de documento).
- `preserveManualSections` ahora preserva **toda** sección `## X` cuyo cuerpo
  lleve `<!-- manual` (no solo 3 hardcodeadas) y la **re-inserta** si el template
  no la regenera.
- Doc del script actualizada.

Luego se regeneró `docs/PROJECT.md` (backup automático en `docs/PROJECT.md.bak.*`, gitignored). Verificado: `Non-Negotiables` (con `- **License**: MIT`), `Architecture Notes`, `Open Questions`, `Glossary` y `Token / MCP Opt-in` conservan su cuerpo.
El doc ya no arrastra los counts stale (72/65/21).

## Verificación

| Gate | Resultado |
|---|---|
| `counts --check` | exit 0 |
| `validate-frontmatter` | **0 fail / 0 warnings** (antes 2) |
| `verify-lockfile` | CLEAN (108+68) — re-pinneado tras A3 |
| `lint-docs` | R1–R8 = 0, new=0 |
| `smoke-test` · `wiring-test` · `installer-test` | PASSED · 8/8 · 43/43 |
| `eval-static` | 25/25 |
| `gateguard --selftest` · `policy-selftest` | 33/33 · 84/0 |
| `.github/workflows/ci.yml` | YAML válido · 2 jobs × 14 steps |

## Archivos

**Modificados**: `.github/workflows/ci.yml`, `.agents/skills/ui-ux-pro-max/SKILL.md`,
`.agents/skills/vercel-react-best-practices/SKILL.md`,
`.agents/skills/pack-reference/SKILL.md`, `.opencode/bin/refresh-project.js`,
`docs/PROJECT.md`, `skills-lock.json`, este report.
**Generados** (gitignored): `docs/PROJECT.md.bak.*`.

## Pendientes

Del roadmap de mejoras quedan solo los candidatos "Lote 3 largo" (features ECC):
C8 (`shell.env` con stack), C10 (`/aside`), C7 (auto-resume en `session.created`),
C12 (codemaps deterministas), C13/C14 (routing por modelo — riesgo alto).
Ninguno commiteado — espera verbo explícito.
