---
name: llm-as-judge
description: "Use when you must score the QUALITY (not just pass/fail) of an agent output, artifact, diff, or report against explicit criteria — rubric-based grading with a stable verdict schema, on-demand via /eval, using the session model (no API key)."
triggers: [llm as judge, judge output, rubric, rubric grading, grade output, quality score, evaluate quality, score artifact, content quality, judge verdict, calibration, hallucination risk, anti leniency]
origin: starter-pack
---

# LLM-as-judge de calidad

Tercera capa de verificacion del pack. No reemplaza a las otras dos; las completa:

```
eval-static (estructura)  ->  agent-evals (comportamiento/wiring)  ->  llm-as-judge (calidad de output)
```

`eval-static` prueba que el pack esta bien *construido* y *cableado*. `agent-evals` prueba *decisiones y forma* (binario, determinista) y declara la calidad de prosa fuera de alcance. Esta skill cubre exactamente ese hueco: **correccion, cobertura y adherencia a criterios de contenido**, con una rubrica ponderada y un veredicto parseable.

## When to Activate

- Quieres saber si un output de agente es *bueno*, no solo si compila.
- Hay que puntuar un artefacto arbitrario (codigo, diff, report, prompt) sin PRD que lo respalde.
- Un criterio de PRD es cualitativo y `/audit-report` necesita una senal de calidad.
- `skill-optimizer` / `harness-optimizer` piden un *quality signal* por rubrica.
- Se invoca `/eval` en su modo rubric grader.

## Do Not Activate For

- Gate de build/tests ("compila?", "pasan los tests?") -> `verification-loop`.
- Invariantes estaticas del pack -> `eval-static`.
- Decisiones/forma/wiring de prompts -> `agent-evals`.
- Gate de CI pass/fail con modelo en vivo: **prohibido** (no determinista + coste).
- Correr en el hot path de dispatch o automaticamente en `/verify`: **prohibido**.

## Rubric Catalog (built-in)

Cuatro rubricas reutilizables. Cada criterio se puntua 0-10 y se pondera; las notas deben citar evidencia concreta.

| Rubric | Use for | Criteria (weighted) |
|--------|---------|---------------------|
| `code-correctness` | Codigo, diffs, patches | correccion, manejo de errores, seguridad, mantenibilidad |
| `spec-coverage` | Output contra PRD/spec | cobertura de criterios, adherencia, alcance, evidencia |
| `report-quality` | Reports, auditorias, docs | completitud, trazabilidad, claridad, verificabilidad |
| `prompt-quality` | Prompts, skills, instrucciones de agente | claridad, especificidad, robustez, no-ambiguedad |

Reglas del catalogo:

- Si el usuario provee una rubrica ad-hoc inline, usarla tal cual (Q2=A). El catalogo es el default, no una camisa de fuerza.
- Nunca autogenerar la rubrica a ciegas: una rubrica inventada por el propio juez sesga el resultado.
- Si dos rubricas aplican, elegir la de criterio mas especifico y declarar la eleccion en `verdict`.

## Verdict Schema (stable shape)

El **esquema** es determinista; los **valores** no. La maquina de CI valida solo la forma (ver `evals/judge/verdict.schema.json` + E18); el juicio en vivo es on-demand.

```json
{
  "schema_version": 1,
  "rubric": "code-correctness",
  "target": { "kind": "file", "ref": "src/total.js" },
  "criteria": [
    { "name": "correccion", "pass": true, "weight": 0.5, "score": 9, "note": "suma acumulada correcta; sin off-by-one" },
    { "name": "manejo-de-errores", "pass": false, "weight": 0.2, "score": 4, "note": "no valida entradas no numericas" }
  ],
  "score": 82,
  "band": "PASS | PASS-WITH-NITS | FAIL",
  "confidence": "high | medium | low",
  "flags": ["hallucination-risk"],
  "verdict": "una linea: veredicto + accion concreta",
  "judged_by": "quality-judge",
  "judged_at": "ISO-8601"
}
```

Campos obligatorios: `target`, `rubric`, `criteria`, `score`, `band`, `verdict`. Cada `criteria[]` exige `name`, `pass`, `note` (`weight` y `score` son recomendados).

## Method

1. **Resolve target** — `kind` es `file | inline | output | diff | report`; `ref` es la ruta o una etiqueta; para inline, adjuntar el contenido.
2. **Pick rubric** — built-in del catalogo o inline provista; declarar pesos.
3. **Score each criterion** — `pass` booleano + `score` 0-10 + `note` con evidencia ("linea 42", "no cubre el caso X").
4. **Aggregate** — `score = round(sum(score_i * weight_i) / sum(weight_i) * 10)`; redondear a entero 0-100.
5. **Band** — `FAIL` si algun criterio central falla; `PASS-WITH-NITS` si todo pasa pero hay nits; `PASS` solo si todos los criterios pasan sin reservas.
6. **Confidence + flags** — `low` si falta contexto; `flags` como `hallucination-risk`, `insufficient-evidence`, `rubric-mismatch`.
7. **Emit** — JSON (bloque de codigo json) + seccion Markdown legible.

## Anti-leniency discipline

Un juez "blando" es peor que no juzgar. Reglas duras:

- **Ancla con extremos.** Comparar contra un ejemplo known-good y uno known-bad; si el target no se distingue del known-bad, no puede ser `PASS`.
- **Evidencia o no cuenta.** Una `note` sin referencia concreta (archivo/linea/cita) no puede sostener un `pass: true`.
- **Score 10 reservado.** Un 10 en un criterio implica ausencia total de hallazgo; en la duda, 9.
- **No promediar y olvidar.** Un criterio central en `false` fuerza `FAIL`, aunque el promedio sea alto.
- **Confianza explicita.** Si faltan datos para decidir, bajar `confidence` y marcar `insufficient-evidence`, no inventar.

## Invocation (on-demand, never hot path)

- Via el comando **existente** `/eval` (modo rubric grader) -> delega en el subagent `quality-judge`. **0 commands nuevos.**
- Tie-in **opcional** desde `/audit-report`: si un criterio del PRD es cualitativo, `report-auditor` puede delegar su evaluacion al juez; el veredicto base del auditor no cambia.
- **Nunca** corre automaticamente en el dispatch del router, ni en `/verify`, ni como gate pass/fail de CI.
- **Sin API key ni red por defecto**: usa el modelo de la sesion via el subagent; el juicio cuesta tokens solo al invocarlo.

## Rules

- Salida siempre en el esquema estable; nunca prosa suelta sin JSON.
- Una rubrica por veredicto; si necesitas varias, emite varios veredictos.
- El veredicto es **input** de `skill-optimizer` / `harness-optimizer`, no un bloqueo silencioso: registrar el porque.
- No editar el target al juzgar: el juez es read-only (persistir el veredicto, si acaso, con `ask`).
- Mantener `evals/judge/golden-verdict.json` como fixture replayable; no llamar al modelo en CI.

## Anti-Patterns

- Usar el juez como gate de CI pass/fail (no determinista -> falsos rojos).
- Juzgar a partir de la afirmacion del propio output ("dice que lo hizo") en vez de evidencia.
- Promediar un criterio central fallido hacia un `PASS`.
- Reutilizar el veredicto entre targets distintos sin re-evaluar.
- Delegar criterios binarios (compila/no) al juez en vez de a un gate determinista.

## Integration

- Related skills: `agent-evals` (capa de comportamiento), `verification-loop` (gates binarios), `intent-driven-development` (de donde salen los criterios), `coding-standards` (floor de calidad de codigo).
- Related agents: `quality-judge` (el juez), `report-auditor` (verifica evidencia documental; puede delegar lo cualitativo), `code-reviewer` y `{stack}-reviewer` (revision determinista), `skill-optimizer` / `harness-optimizer` (consumen la senal).
- Related commands: `/eval` (host on-demand), `/audit-report` (tie-in opcional).
