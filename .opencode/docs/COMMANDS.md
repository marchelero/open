# COMMANDS

> 52 slash commands, agrupados por intención. Igual que `ROUTE.md` pero para comandos.
> El archivo JSON vive en `.opencode/commands/<nombre>.md` con frontmatter `description` y `agent`.

## "Quiero clarificar antes de implementar"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/prd` | Clarifica intención y escribe el PRD. **Primer paso obligatorio** en tareas no triviales. | build |
| `/plan` | Crea un plan de implementación a partir de un PRD, con archivos, dependencias y orden. | planner |
| `/orchestrate` | Flujo multi-agente completo. Phase 0 invoca automáticamente al `prd-agent`. | planner |
| `/model-route` | Recomienda el mejor modelo para la complejidad de la tarea. | build |
| `/harness-audit` | Auditoría determinista del repo y devuelve un scorecard priorizado. | build |
| `/aside` | Pregunta rápida sin cambiar el contexto de la sesión. | build |

## "Quiero validar cambios"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/verify` | Ejecuta el loop completo: revisión de código, seguridad, revisor por stack. | build |
| `/code-review` | Revisión de código puntual. | code-reviewer |
| `/security` | Auditoría de seguridad comprehensiva. | security-reviewer |
| `/security-scan` | Ejecuta AgentShield contra superficies de agente, hook, MCP, permiso y secreto. | security-reviewer |
| `/e2e` | Genera y ejecuta tests E2E con Playwright. | e2e-runner |
| `/test-coverage` | Analiza y mejora la cobertura de tests. | tdd-guide |
| `/tdd` | Fuerza el workflow TDD con 80%+ de cobertura. | tdd-guide |
| `/eval` | Ejecuta evaluación contra criterios de aceptación. | build |
| `/quality-gate` | Ejecuta el pipeline de calidad. | build |
| `/checkpoint` | Guarda el estado de verificación y checkpoint de progreso. | build |

## "Quiero revisar por stack"

### TypeScript/React

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/react-review` | Revisa código React/JSX. | react-reviewer |
| `/react-build` | Arregla errores de build de React. | react-build-resolver |
| `/react-test` | Ejecuta tests de React. | react-build-resolver |

### Flutter/Dart

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/flutter-review` | Revisa código Flutter/Dart. | flutter-reviewer |
| `/flutter-build` | Arregla errores de build de Flutter. | dart-build-resolver |
| `/flutter-test` | Ejecuta tests de Flutter. | dart-build-resolver |

### Go

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/go-review` | Revisa código Go. | go-reviewer |
| `/go-build` | Arregla errores de build y `vet` de Go. | go-build-resolver |
| `/go-test` | Workflow TDD de Go con tests table-driven. | tdd-guide |

### Rust

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/rust-review` | Revisa código Rust. | rust-reviewer |
| `/rust-build` | Arregla errores de build de Rust y borrow checker. | rust-build-resolver |
| `/rust-test` | Workflow TDD de Rust con unit y property tests. | tdd-guide |

### C++

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/cpp-review` | Revisa código C++. | cpp-reviewer |
| `/cpp-build` | Arregla errores de build de C++. | cpp-build-resolver |
| `/cpp-test` | Ejecuta tests de C++. | cpp-build-resolver |

### Kotlin

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/kotlin-review` | Revisa código Kotlin. | kotlin-reviewer |
| `/kotlin-build` | Arregla errores de build de Kotlin/Gradle. | kotlin-build-resolver |
| `/kotlin-test` | Ejecuta tests de Kotlin. | kotlin-build-resolver |

### Python

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/python-review` | Revisa código Python. | python-reviewer |

### Build genérico

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/build-fix` | Arregla errores de build y TypeScript con cambios mínimos. | build-error-resolver |

## "Quiero mantener la memoria entre sesiones"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/session-start` | Lee la Capa 1+2 de memoria y reporta un resumen compacto. Auto en señales de cierre. | build |
| `/session-end` | Escribe snapshot, actualiza `LATEST.md`, refresca `PROJECT.md`, extrae 1-3 instintos. | build |
| `/context` | Audita el presupuesto de contexto: skills, agentes, comandos, sesiones. | build |
| `/refresh-project` | Regenera `.agents/PROJECT.md` desde los archivos del proyecto. | build |

## "Quiero limpiar / refactorizar"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/refactor-clean` | Elimina código muerto y consolida duplicados. | refactor-cleaner |

## "Quiero mantener la documentación sincronizada"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/update-codemaps` | Actualiza los codemaps para navegación del codebase. | doc-updater |
| `/update-docs` | Actualiza la documentación por cambios recientes. | doc-updater |

## "Quiero aprender / iterar con instintos"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/learn` | Extrae patrones y aprendizajes de la sesión actual. | build |
| `/evolve` | Analiza instintos y sugiere o genera estructuras evolucionadas. | build |
| `/instinct-status` | Muestra los instintos aprendidos (proyecto + global) con su confianza. | build |
| `/instinct-export` | Exporta instintos para compartir. | build |
| `/instinct-import` | Importa instintos desde fuentes externas. | build |
| `/promote` | Promueve instintos del proyecto al ámbito global. | build |
| `/projects` | Lista proyectos registrados y conteos de instintos. | build |

## "Quiero mantener el setup"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/setup-pm` | Configura la preferencia de package manager. | build |
| `/skill-create` | Genera skills a partir del análisis de git history. | build |
