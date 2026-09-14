---
description: "Generar o revisar design system del proyecto. Carga ui-ux-pro-max para palettes, tipografía, estilos, y patrones de diseño. Use para nuevos proyectos, refactoring visual, o consistencia de UI."
agent: code-reviewer
---

# Design System Command

Generar o revisar design system del proyecto: $ARGUMENTS

## Tu Task

1. **Cargar skill**: `ui-ux-pro-max` + `anthropic-frontend-design`
2. **Detectar stack** del proyecto (React/Vue/Svelte/Flutter/etc)
3. **Analizar UI existente** o **generar nuevo design system**

## Para Nuevo Proyecto

```bash
# Detectar stack
cat package.json | grep -E "react|vue|svelte|angular" 

# Generar design system
ui-ux-pro-max search "<product_type> <industry>" --design-system
```

## Para Proyecto Existente

1. Leer archivos CSS/SCSS/Tailwind/styled-components
2. Verificar consistencia de:
   - [ ] Colores semánticos (no hex hardcoded)
   - [ ] Tipografía (type scale consistente)
   - [ ] Espaciado (spacing tokens)
   - [ ] Border radius consistente
   - [ ] Shadow tokens
   - [ ] Breakpoints responsive

## Output

### Nuevo Design System
```markdown
## Color Palette
- Primary: #XXX
- Secondary: #XXX
- Neutrals: #XXX

## Typography
- Headings: Font Family
- Body: Font Family
- Scale: 12/14/16/20/24/32/48

## Spacing
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px
```

### Review de Existente
```
[CONSISTENCY] archivo:línea
Issue: Color hardcoded #D97757 en vez de token
Fix: Usar var(--color-primary)
```

## Arguments

$ARGUMENTS:
- "new" para generar nuevo design system
- "review" para revisar existente
- archivos específicos a analizar
