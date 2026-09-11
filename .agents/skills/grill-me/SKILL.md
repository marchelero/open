---
name: grill-me
description: Use when the user's request is ambiguous, has multiple interpretations, or lacks critical details. Activates iterative questioning to clarify requirements before implementation. Asks the user whether to use this deep-clarification mode or proceed with minimal questions first.
---

# Grill Me Skill

Iterative clarification for ambiguous requests. Activates when requirements are unclear.

## Activation Logic

```
IF request is ambiguous OR has multiple interpretations OR lacks critical details:
  1. ASK user: "¿Abordar de manera específica (haciendo preguntas) o tradicional (mínimo)?"
  2. IF específicas → activate grill-me mode (iterative questioning)
  3. IF tradicional → proceed with minimal assumptions, flag uncertainties
ELSE:
  → proceed normally (no activation)
```

## Detection Triggers

Activate when request contains:
- Multiple possible interpretations
- Vague scope ("arreglarlo", "mejorar", "hacer algo")
- Missing critical details (which feature? which bug? which file?)
- Conflicting requirements
- No clear success criteria

## Mode Selection Prompt

```
Tu request tiene varias interpretaciones posibles:

1. [Interpretación A]: [descripción breve]
2. [Interpretación B]: [descripción breve]
3. [Interpretación C]: [descripción breve]

¿Cómo prefieres que proceda?

a) **Específicas** — Te hago preguntas una por vez hasta entender completamente (más lento, más preciso)
b) **Tradicional** — Procedo con supuestos mínimos y te muestro resultados rápido (más rápido, menos preciso)
```

## Grill Mode (Específicas)

### Rules
1. **One question at a time** — don't overwhelm
2. **Closed questions prefer** — "A o B?" with trade-offs
3. **Concrete examples** — show what each option means
4. **Track answers** — build understanding incrementally
5. **Max 5 rounds** — then synthesize and confirm

### Question Format

```
Pregunta 1 de N:

[Tu pregunta aquí]

Opciones:
a) [Opción A] — [consecuencia]
b) [Opción B] — [consecuencia]
c) [Opción C] — [consecuencia]

Responde con letra o describe tu preferencia.
```

### Example Flow

```
User: "Arregla el login"

Agent: Tu request "arregla el login" puede significar:

1. Login no funciona (error visible)
2. Login es lento (performance)
3. Login tiene bugs de seguridad
4. Login necesita UX mejorada

¿Cómo prefieres que proceda?
a) Específicas — te hago preguntas
b) Tradicional — asumo que es error visible y pruebo

User: a

Agent: Pregunta 1/3:
¿Qué error ves cuando intentas loguearte?

a) Mensaje de error visible
b) Spinner infinito
c) Redirect falla
d) No sé exactamente

User: c

Agent: Pregunta 2/3:
¿El redirect falla después de credenciales correctas o incorrectes?

[continues until clear]
```

## Traditional Mode (Mínimo)

### Rules
1. **Make reasonable assumptions** — based on common patterns
2. **Document assumptions** — list what you assumed
3. **Show plan first** — let user correct before implementing
4. **Flag uncertainties** — mark items that need verification

### Output Format

```
Voy a proceder con las siguientes suposiciones:

1. [Suposición 1] — basado en [evidencia]
2. [Suposición 2] — basado en [patrón común]
3. [Suposición 3] — marcar como incierto

Plan:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

¿Corrijo algo antes de empezar?
```

## Hybrid Approach

For complex requests, combine both:

1. **Quick triage** — 1-2 key questions (grill-lite)
2. **Assumption scan** — list what's assumed
3. **Plan preview** — show approach before code
4. **Iterate** — refine as user provides feedback

## Integration with Pack

### PRD-First Flow

```
IF grill-me activated:
  1. Run grill-me (clarify requirements)
  2. Feed clarified requirements to @prd-agent
  3. PRD reflects actual intent (not assumptions)
ELSE:
  1. @prd-agent directly (standard flow)
```

### Router Integration

```
IF request ambiguous AND grill-me available:
  → Suggest grill-me mode first
ELSE IF request clear:
  → Route normally
```

## When to Use

- User says "arregla esto" without context
- Feature request with vague scope
- Bug report without reproduction steps
- Multiple valid interpretations
- Critical decisions with trade-offs

## When NOT to Use

- Clear, specific requests
- Urgent fixes (just do it)
- User explicitly says "skip questions"
- Q&A only (no implementation)

## See Also

- `skill: intent-driven-development` — clarify before building
- `skill: prd-agent` — structured requirements
- `agent: planner` — break down clarified requirements
