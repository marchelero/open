# COMMANDS

> 64 slash commands, agrupados por intención. Igual que `ROUTE.md` pero para comandos.
> El archivo vive en `.opencode/commands/<nombre>.md` con frontmatter `description` y `agent`.

## "Quiero clarificar antes de implementar"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/prd` | Clarifica intención y escribe el PRD. **Primer paso obligatorio** en tareas no triviales. | prd-agent |
| `/quick-prd` | Mini-PRD de 10 lineas para bugs, fixes o one-liners. Auto-regenera a PRD completo si crece. | build |
| `/spec-lint` | Linter PREVENTIVO del spec: valida un PRD contra vaguedad y criterios no medibles antes de `/plan`. | prd-agent |
| `/change-request` | Gestiona un cambio de spec tras aprobar el PRD (impacto + CR-NN + propagación al plan). | prd-agent |
| `/plan` | Crea un plan de implementación a partir de un PRD, con archivos, dependencias y orden. | planner |
| `/tasks` | Desglosa un plan aprobado en tareas atómicas ligadas a cada AC. Genera `docs/tasks/`. | planner |
| `/orchestrate` | Flujo multi-agente completo. Phase 0 invoca automáticamente al `prd-agent`. | planner |
| `/route` | Sugiere el mejor sub-agente + skills para un request libre. Útil como consulta antes de dispatchar. | build |

## "Quiero validar cambios"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/verify` | Ejecuta el loop completo: revisión de código, seguridad, revisor por stack. | build |
| `/eval` | Ejecuta evaluación contra criterios de aceptación. | build |
| `/quality-gate` | Ejecuta el pipeline de calidad. | build |
| `/spec-to-tests` | Genera tests desde los Success Criteria del PRD (`AC-NN`); marca los no automatizables. | testing-auto |
| `/trace` | Trazabilidad bidireccional spec <-> código. Matriz completa con `/trace --matrix`. | planner |
| `/definition-of-done` | Gate único de cierre: cruza `/verify` + `/audit-report` + `/trace` en un veredicto. | report-auditor |
| `/audit-report` | Cruza un report contra su PRD origen. Veredicto PASS / PASS-WITH-NITS / FAIL. | report-auditor |
| `/checkpoint` | Guarda el estado de verificación y checkpoint de progreso. | build |

## "Quiero revisar por stack / dominio"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/code-review` | Revisión de código puntual. | code-reviewer |
| `/security` | Auditoría de seguridad comprehensiva. | security-reviewer |
| `/security-scan` | Ejecuta AgentShield contra superficies de agente, hook, MCP, permiso y secreto. | security-reviewer |
| `/ci-audit` | Auditoría de eficiencia de GitHub Actions (minutos y coste). | ci-cd-reviewer |
| `/deps-audit` | Auditoría de dependencias y vulnerabilidades. | security-reviewer |
| `/deps-health` | Diagnóstico de salud de dependencias. | code-explorer |
| `/design-system` | Revisión de consistencia del sistema de diseño. | code-reviewer |
| `/react-perf` | Revisión de rendimiento React / Next.js. | code-reviewer |
| `/ui-review` | Revisión de UI/UX y accesibilidad. | code-reviewer |
| `/api-docs` | Genera/actualiza la documentación de la API. | code-explorer |
| `/build-fix` | Arregla errores de build y TypeScript con cambios mínimos. | build-error-resolver |
| `/go-test` | Workflow TDD de Go con tests table-driven. | tdd-guide |

## "Quiero testear"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/tdd` | Fuerza el workflow TDD con 80%+ de cobertura. | tdd-guide |
| `/test-coverage` | Analiza y mejora la cobertura de tests. | tdd-guide |
| `/e2e` | Genera y ejecuta tests E2E con Playwright. | e2e-runner |
| `/e2e-run` | Ejecuta la suite E2E existente. | e2e-runner |

## "Quiero limpiar / refactorizar"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/refactor-clean` | Elimina código muerto y consolida duplicados. | code-quality-analyzer |

## "Quiero mantener la memoria entre sessions"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/session-start` | Lee la Capa 1+2 de memoria y reporta un resumen compacto. Auto en señales de cierre. | build |
| `/session-end` | Escribe snapshot, actualiza `LATEST.md`, refresca `PROJECT.md`, extrae 1-3 instintos. | build |
| `/context-budget` | Audita el presupuesto de contexto: skills, agentes, comandos, sessions. | build |
| `/project-status` | Check freshness de `docs/PROJECT.md` sin escribir. Exit 0/1 (CI-friendly). | build |
| `/project-init` | Inicializa la estructura de `docs/` y `PROJECT.md` en un proyecto. | build |
| `/refresh-project` | Regenera `docs/PROJECT.md` desde los archivos del proyecto. Soporta `--status`, `--auto`, `--dry-run`, `--check`. | build |
| `/self-reflect` | Reflexión de cierre: aprendizajes y mejoras. | build |

## "Quiero mantener la documentación sincronizada"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/update-codemaps` | Actualiza los codemaps para navegación del codebase. | doc-updater |
| `/update-docs` | Actualiza la documentación por cambios recientes. | doc-updater |

## "Quiero mantener el setup"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/setup-pm` | Configura la preferencia de package manager. | build |
| `/env-sync` | Sincroniza `.env.example` con las variables reales detectadas en el código. | build |
| `/skill-create` | Genera skills a partir del análisis de git history. | build |
| `/mcp-on` | Activa un MCP opcional. | build |
| `/mcp-off` | Desactiva un MCP. | build |
| `/setup-mcp` | Wizard para activar MCPs opcionales. | build |
| `/tone` | Ajusta el modo de comunicación (caveman / normal). | build |

## "Quiero descubrir el pack"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/help` | Overview del pack: comandos principales, agentes, skills, convenciones. | build |
| `/start-here` | Onboarding: primeros pasos tras instalar el pack. | build |
| `/list-agents` | Lista los 67 agents con descripción y triggers. Filtros: keyword, categoría. | build |
| `/list-skills` | Lista las 64 skills con descripción y triggers. Filtros: keyword. | build |
| `/list-mcps` | Lista MCPs activos y opcionales. | build |
| `/pack-doctor` | Diagnostica la salud del pack (frontmatter, duplicados, permalinks, etc). | build |

## "Quiero usar un workflow pre-hecho"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/flow-bugfix` | Bug fix end-to-end: `/quick-prd` → fix → `/verify` → report → audit. | build |
| `/flow-feature` | Feature nueva end-to-end: `/orchestrate` → implement → `/verify` → report → audit. | build |
| `/flow-refactor` | Refactor end-to-end: `/plan` → refactor → `/verify` → report → audit. | build |
| `/flow-security` | Security review end-to-end: `/security` → fix → `/verify` → report → audit. | build |

## "Quiero colaborar via PR"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/pr-review` | Review de un PR de GitHub con dispatch paralelo a 5 reviewers. Veredicto: APPROVE / WARN / BLOCK. | build |
| `/merge-conflict` | Analiza conflictos de merge, los clasifica y propone resolución. | build |

## "Quiero scaffoldear (extender el pack)"

| Comando | Qué hace | Agent |
|---------|----------|-------|
| `/new-project` | Scaffold de un proyecto nuevo: `docs/{prds,plans,reports,audits,sessions,state,instincts}/` + `PROJECT.md` template + `docs/README.md` index. Flags: `--help`, `--dry-run`, `--force`. | build |
| `/new-skill` | Scaffold de un skill nuevo en `.agents/skills/<name>/SKILL.md`. Genera frontmatter (name, description, triggers) + 8 secciones de body template. Flags: `--help`, `--dry-run`, `--force`, `--triggers <csv>`. | build |
| `/new-agent` | Scaffold de un agent nuevo en `.opencode/agents/<name>.md`. Genera frontmatter (description, mode, permission block) + prompt-defense reference + body template. Flags: `--help`, `--dry-run`, `--force`, `--mode <subagent|primary>`. | build |
