---
name: pack-governance
description: "Use when the session is compacted or resumed, when coordinating a multi-agent flow (handoffs between PRD, plan, implementation and review), or when a"
triggers: [compact, compaction, recover, resume, session start, session end, handoff, continuity, gobernanza, continuidad, retomar, compactacion]
---

# Pack Governance

Gobernanza del pack que se carga **bajo demanda** (para no inflar el boot). `AGENTS.md` mantiene solo un puntero corto. Cubre cuatro cosas: recuperación tras compactación, coordinación/handoff entre agentes, disponibilidad de agentes según el stack instalado, y continuidad de sesión.

## When to use

- Tras una **compactación** de contexto o al **retomar** una sesión.
- Al **coordinar** varios agentes (handoff PRD → plan → implementación → revisión).
- Cuando un **agente pedido por nombre** podría no estar instalado (el instalador filtra por stack).

## 1. Recovery post-compaction (checklist)

Si estás leyendo esto tras una compactación o al arrancar una sesión:

1. Re-lee `.opencode/AGENTS.md` (la ley del pack): confirma que tienes activas las **9 conductas obligatorias** y la Prompt Defense Baseline.
2. Carga `router` (para dispatchar) y `pack-reference` (layout del pack, rutas de docs) si hacen falta.
3. Revisa `docs/sessions/LATEST.md` y el PRD/plan en curso (`docs/prds/`, `docs/plans/`).
4. Revisa `docs/state/*.json`; si hay un estado activo, ofrece **reanudar** desde `currentPhase`.
5. NO reinicies trabajo ya hecho: confirma primero qué está DONE / IN-PROGRESS / BLOCKED.
6. **Context cut-off**: si el contexto se va a cortar SIN compactación, deja siempre un resumen: qué se hizo, qué queda pendiente y dónde continuar. Nunca cortes sin dejar contexto para el próximo turno.

## 2. Agent coordination & handoff

- Cada agente deja su salida como **artefacto en disco**: `docs/reports/`, `docs/audits/`, `docs/plans/`, `docs/prds/` (con timestamp `YYYY-MM-DD_HHMM`).
- El siguiente agente **busca el artefacto más reciente** del paso anterior; si no lo encuentra, **lo pide** antes de continuar.
- Un flujo tiene un **único cierre** (artefacto final + report). No dupliques autoría.
- `report-auditor` valida un report contra su PRD origen (`/audit-report`).
- El **PRD es el contrato**, el **plan es la estrategia**, el **código es la implementación**. No se implementa sin PRD en tareas no triviales.

## 3. Agent availability (instalación filtrada por stack)

El instalador `init-opencode.js` puede haber **filtrado** agents de lenguajes que no aplican (marca `.opencode/.stack`).

- Antes de invocar un agente **por nombre**, confirma que existe `.opencode/agents/<nombre>.md`.
- Si **no existe → NO lo inventes y NO te detengas**. Asume tú la responsabilidad o baja al genérico:
  - revisión de código → `code-reviewer` (con instrucción explícita del lenguaje)
  - error de compilación/tipos → `build-error-resolver`
  - nunca rutees a un resolver/reviewer de un lenguaje distinto al del proyecto.
- Los agentes de **proceso** (`prd-agent`, `planner`, `report-auditor`, `security-reviewer`, `tdd-guide`, `doc-updater`) **siempre** están instalados: el ciclo SDD nunca queda a medias.

## 4. Session continuity

- **Arranque** (`/session-start`): lee `docs/PROJECT.md`, `docs/sessions/LATEST.md` y `docs/state/*.json`; si hay un plan en curso (`status: in-progress`) ofrece continuar.
- **Cierre** (`/session-end`): escribe el snapshot en `docs/sessions/`, actualiza `LATEST.md`, refresca `docs/PROJECT.md` y extrae 1–3 instintos (`node .opencode/bin/instinct.js add …`).
- **Estado de flujos**: `state.js` persiste el progreso de flujos multi-agente en `docs/state/` (`init` / `update` / `complete` / `fail`); `/session-start` ofrece reanudar.
- **Memoria cross-proyecto** (`knowledge.js`): al arrancar un task no trivial, busca lecciones previas con `node .opencode/bin/knowledge.js search "<query>" --json` (read-only, offline, cero red). Al cerrar, si hubo un aprendizaje reutilizable, ingiere 1-3 entradas con `add`. Store global por usuario en `~/.config/opencode/knowledge/`; en tests/CI usa el override `OPENCODE_KNOWLEDGE_HOME=<tmp>` para no tocar el home real.
- **Regla dura**: nunca hagas commit/push sin verbo explícito del usuario ese mismo turno (conducta 3).

## See also

- `pack-reference` — layout del pack, rutas y convenciones.
- `router` — mapa de dispatch agent/skill.
- `verification-loop` — qué se corre al cerrar un flujo.
