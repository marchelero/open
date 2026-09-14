---
description: "Revisar UI/UX de archivos contra Web Interface Guidelines, accesibilidad, y mejores prácticas de diseño. Use cuando el usuario pida 'revisar mi UI', 'check accessibility', 'audit design', o 'check best practices'."
agent: code-reviewer
---

# UI Review Command

Revisar interfaces contra estándares de diseño y accesibilidad: $ARGUMENTS

## Tu Task

1. **Cargar skill**: `vercel-web-design` + `ui-ux-pro-max`
2. **Leer archivos** especificados (o detectar archivos de UI del proyecto)
3. **Aplicar reglas**: 100+ reglas de Web Interface Guidelines
4. **Generar reporte** por severidad

## Check Categories

### CRITICAL
- [ ] Contraste 4.5:1 mínimo
- [ ] Alt text en imágenes
- [ ] Navegación por teclado
- [ ] ARIA labels

### HIGH
- [ ] Touch targets 44×44px mínimo
- [ ] Loading feedback
- [ ] Responsive mobile-first
- [ ] Viewport meta tag

### MEDIUM
- [ ] Tipografía consistente
- [ ] Tokens de color semánticos
- [ ] Animaciones con reduced-motion
- [ ] Errores cerca del campo

## Output

```
[SEVERITY] archivo.línea
Issue: Descripción
Fix: Cómo arreglar
```

---

## Post-Review: Audit

Después de cerrar este review, si hubo un PRD origen (`docs/prds/{name}.prd.md`):

1. Guardar output como `docs/reports/{YYYY-MM-DD_HHMM}-ui-review.report.md`
2. Ofrecer: "¿Audito contra el PRD con `/audit-report {name}`?"

## Arguments

$ARGUMENTS:
- archivos o patrones a revisar
- flags opcionales (--accessibility, --responsive, --typography)
