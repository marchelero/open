---
description: "Auto-reflexión post-tarea. Evalúa el propio trabajo, detecta errores, y guarda learnings en memoria persistente. Use cuando una tarea falle, el usuario te corrija, o descubras un mejor approach."
agent: build
---

# Self-Reflect Command

Auto-evaluar trabajo reciente y guardar learnings: $ARGUMENTS

## Tu Task

1. **Cargar skill**: `self-improving`
2. **Evaluar** la última tarea completada
3. **Detectar** errores, mejoras, o correcciones del usuario
4. **Guardar** en memoria persistente

## Checklist de Reflexión

### ¿Qué salió bien?
- [ ] Tarea completada exitosamente
- [ ] Usuario satisfecho con resultado
- [ ] Enfoque correcto desde el inicio

### ¿Qué se puede mejorar?
- [ ] Errores cometidos durante la ejecución
- [ ] Correcciones del usuario
- [ ] Mejores approaches descubiertos
- [ ] Knowledge gaps identificados

### ¿Qué aprender?
- [ ] Nuevo patrón descubierto
- [ ] Preferencia del usuario
- [ ] Error a evitar en el futuro
- [ ] Mejor herramienta/approach

## Output

```markdown
## Self-Reflection — {fecha}

### Tarea evaluada
{descripción de la tarea}

### Resultado
- Estado: ✅ Éxito / ⚠️ Parcial / ❌ Fallo
- Calidad: 1-5 estrellas

### Learnings
- **Pattern**: {patrón descubierto}
- **Preference**: {preferencia del usuario}
- **Avoid**: {error a evitar}

### Acción
- [ ] Actualizar memoria con learning
- [ ] Ajustar approach para próxima vez
```

## Memoria

Los learnings se guardan en `.agents/skills/self-improving/memory.md` con estructura tiered:
- **HOT** (≤100 líneas): siempre cargada
- **WARM** (por proyecto): en `docs/sessions/`
- **COLD** (archivada): en `docs/sessions/archive/`

## Arguments

$ARGUMENTS:
- "last" para evaluar la última tarea
- "correction" si el usuario te corrigió
- "full" para reflexión completa
