---
description: "Revisar y optimizar performance de React/Next.js. Carga vercel-react-best-practices (70 reglas en 8 categorías). Use para rerender, bundle size, data fetching, server-side, y advanced patterns."
agent: code-reviewer
---

# React Performance Command

Revisar código React/Next.js contra 70 reglas de performance: $ARGUMENTS

## Tu Task

1. **Cargar skill**: `vercel-react-best-practices`
2. **Leer archivos** React/Next.js del proyecto
3. **Aplicar reglas** por prioridad:
   - CRITICAL: Waterfalls, Bundle size
   - HIGH: Server-side, Client data fetching
   - MEDIUM: Re-renders, Rendering, JS perf
   - LOW: Advanced patterns

## Quick Checks

### Waterfalls (CRITICAL)
- [ ] Cheap conditions before await
- [ ] Parallel independent operations (Promise.all)
- [ ] Suspense boundaries

### Bundle Size (CRITICAL)
- [ ] No barrel imports
- [ ] Dynamic imports for heavy components
- [ ] Defer third-party scripts

### Server-Side (HIGH)
- [ ] Auth in server actions
- [ ] React.cache() for dedup
- [ ] LRU cache for cross-request

### Re-renders (MEDIUM)
- [ ] No inline objects/functions in JSX
- [ ] useMemo/useCallback where needed
- [ ] React.memo for expensive components

## Output

```
[RULE-ID] archivo:línea
Impact: CRITICAL|HIGH|MEDIUM|LOW
Issue: Descripción
Fix: Regla específica + código de ejemplo
```

## Arguments

$ARGUMENTS:
- archivos o patrones a revisar
- flags (--waterfalls, --bundle, --server, --rerender)
