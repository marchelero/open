# open

Kit portable de opencode: agentes, skills, comandos e instrucciones. Copialo a cualquier proyecto y anda.

## Que tiene

```
open/
├── opencode.json              47 slash commands
├── instructions/
│   └── INSTRUCTIONS.md        Reglas globales que se cargan en cada sesion
├── AGENTS.md                  Reglas para agentes (caveman mode, etc)
├── STARTER.md                 Este archivo (rename: cada proyecto tiene su README)
└── .opencode/
    ├── agents/                64 subagentes (.md, mode: all)
    └── skills/                11 skills portables (SKILL.md)
```

Mas:
- **MCP servers (2)**: `context7` (docs search), `playwright` (browser automation)
- **Plugins (5)**: wakatime, dynamic-context-pruning, skillful, vibeguard, pty
- **Permission global**: `skill: allow` (todos los agentes pueden cargar skills)
- **Caveman mode**: default ON en AGENTS.md (respuestas tersas, ~75% menos tokens)

Sin dependencias npm en el root. Plugins usan Bun internamente (instala solo si esta).

## Como se usa

```bash
cp -r D:/dev/2026/open/.opencode      /path/a/tu/proyecto/
cp    D:/dev/2026/open/opencode.json  /path/a/tu/proyecto/
cp -r D:/dev/2026/open/instructions   /path/a/tu/proyecto/
cd /path/a/tu/proyecto
opencode .
```

Reinicia opencode con `Ctrl+C` + `opencode` despues de cualquier cambio.

## Que es cada cosa

### `opencode.json`

El config principal. Define:
- `default_agent` (cual agent corre por default)
- 47 slash commands bajo `command`
- `instructions` que apuntan a archivos `.md` que se inyectan en el system prompt
- MCP servers, plugins, permissions (ver secciones abajo)

**Importante**: NO incluye `model` ni `small_model`. Cada usuario configura el suyo segun su provider (anthropic, openai, opencode, ollama, etc). Para agregar:

```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

### `instructions/INSTRUCTIONS.md`

Reglas globales que opencode inyecta automaticamente al system prompt de **cada sesion**. Son cosas que aplican a todo: seguridad, estilo, git, testing, etc. Aca vivian en ECC y se traen como un solo archivo consolidado.

Si queres que aplique a todos los proyectos, copialo a tu repo y agregalo al array `instructions` del `opencode.json` (ya viene asi por default).

### `.opencode/agent/`

64 subagentes especializados (`.md`). Cada uno tiene un nombre, descripcion, prompt largo y permisos. Se invocan con `@nombre` desde la TUI o via Task tool.

Ejemplos: `@code-reviewer`, `@security-reviewer`, `@python-reviewer`, `@architect`, `@planner`, `@build-error-resolver`.

### `.opencode/skill/`

10 skills portables. Son instrucciones on-demand que opencode carga segun el contexto. No tienen modelo ni permisos propios, **amplian** al agente activo.

| Skill | Cuando se dispara |
| --- | --- |
| `api-design` | Disenar / revisar API REST |
| `coding-standards` | Convenciones de codigo |
| `documentation-lookup` | Buscar o generar docs |
| `error-handling` | Estrategia de manejo de errores |
| `git-workflow` | Branches, commits, PRs |
| `intent-driven-development` | Desarrollo guiado por intencion |
| `mcp-server-patterns` | Crear servers MCP |
| `security-review` | Review de seguridad |
| `tdd-workflow` | TDD: red, green, refactor |
| `verification-loop` | Verificacion post-cambio |

### Slash commands (47)

Se invocan con `/nombre`. Listado completo:

| Comando | Que hace | Agent |
| --- | --- | --- |
| `/aside` | Pregunta rápida sin cambiar contexto | build |
| `/build-fix` | Arreglar errores de build y TypeScript con cambios mínimos | build-error-resolver |
| `/checkpoint` | Guardar estado de verificación y checkpoint de progreso | build |
| `/code-review` | Revisar código por calidad, seguridad y mantenibilidad | code-reviewer |
| `/cpp-build` | Arreglar errores de build de C++ | cpp-build-resolver |
| `/cpp-review` | Revisar código C++ | cpp-reviewer |
| `/cpp-test` | Ejecutar tests de C++ | cpp-build-resolver |
| `/e2e` | Generar y ejecutar tests E2E con Playwright | e2e-runner |
| `/eval` | Ejecutar evaluación contra criterios de aceptación | build |
| `/evolve` | Analizar instintos y sugerir/ generar estructuras evolucionadas | build |
| `/flutter-build` | Arreglar errores de build de Flutter | dart-build-resolver |
| `/flutter-review` | Revisar código Flutter/Dart | flutter-reviewer |
| `/flutter-test` | Ejecutar tests de Flutter | dart-build-resolver |
| `/go-build` | Arreglar errores de build y vet de Go | go-build-resolver |
| `/go-review` | Revisar código Go por patrones idiomáticos | go-reviewer |
| `/go-test` | Workflow TDD de Go con tests table-driven | tdd-guide |
| `/harness-audit` | Auditoría determinista del repo y devolver scorecard priorizado | build |
| `/instinct-export` | Exportar instintos para compartir | build |
| `/instinct-import` | Importar instintos desde fuentes externas | build |
| `/instinct-status` | Mostrar instintos aprendidos (proyecto + global) con confianza | build |
| `/kotlin-build` | Arreglar errores de build de Kotlin/Gradle | kotlin-build-resolver |
| `/kotlin-review` | Revisar código Kotlin | kotlin-reviewer |
| `/kotlin-test` | Ejecutar tests de Kotlin | kotlin-build-resolver |
| `/learn` | Extraer patrones y aprendizajes de la sesión actual | build |
| `/model-route` | Recomendar mejor modelo para la complejidad de la tarea | build |
| `/orchestrate` | Orquestar múltiples agentes para tareas complejas | planner |
| `/plan` | Crear plan de implementación con evaluación de riesgos | planner |
| `/projects` | Listar proyectos registrados y conteos de instintos | build |
| `/promote` | Promover instintos del proyecto a scope global | build |
| `/python-review` | Revisar código Python | python-reviewer |
| `/quality-gate` | Ejecutar el pipeline de calidad de ECC | build |
| `/react-build` | Arreglar errores de build de React | react-build-resolver |
| `/react-review` | Revisar código React/JSX | react-reviewer |
| `/react-test` | Ejecutar tests de React | react-build-resolver |
| `/refactor-clean` | Remover código muerto y consolidar duplicados | refactor-cleaner |
| `/rust-build` | Arreglar errores de build de Rust y borrow checker | rust-build-resolver |
| `/rust-review` | Revisar código Rust por ownership, safety y patrones idiomáticos | rust-reviewer |
| `/rust-test` | Workflow TDD de Rust con tests unitarios y property tests | tdd-guide |
| `/security` | Ejecutar review comprehensivo de seguridad | security-reviewer |
| `/security-scan` | Ejecutar AgentShield contra superficies de agent, hook, MCP, permission y secret | security-reviewer |
| `/setup-pm` | Configurar preferencia de package manager | build |
| `/skill-create` | Generar skills desde análisis de git history | build |
| `/tdd` | Forzar workflow TDD con 80%+ cobertura | tdd-guide |
| `/test-coverage` | Analizar y mejorar cobertura de tests | tdd-guide |
| `/update-codemaps` | Actualizar codemaps para navegación del codebase | doc-updater |
| `/update-docs` | Actualizar documentación por cambios recientes | doc-updater |
| `/verify` | Ejecutar loop de verificación para validar implementación | build |

**Por categoria**:

- **Generales (20)**: `/aside`, `/build-fix`, `/checkpoint`, `/code-review`, `/e2e`, `/eval`, `/evolve`, `/harness-audit`, `/learn`, `/model-route`, `/orchestrate`, `/plan`, `/projects`, `/promote`, `/quality-gate`, `/refactor-clean`, `/setup-pm`, `/skill-create`, `/test-coverage`, `/verify`
- **TDD/Testing (3)**: `/tdd`, `/go-test`, `/rust-test`
- **Por stack (18)**: C++ (3), Flutter (3), Go (3), Kotlin (3), Python (1), React (3), Rust (3) — todos `/<lenguaje>-{build,review,test}`
- **Documentacion (2)**: `/update-codemaps`, `/update-docs`
- **Seguridad (2)**: `/security`, `/security-scan`
- **Instincts/loops (3)**: `/instinct-export`, `/instinct-import`, `/instinct-status`

---

## Caso real: app Flutter de quiz desde 0

**Pedido**: "app de Flutter con 10 preguntas multiple choice, scoring, animaciones, dark mode"

### Paso 1: vos arrancas con UN comando

```bash
/orchestrate "app Flutter de quiz: 10 preguntas multiple choice, scoring, animaciones, dark mode"
```

Que pasa:
1. opencode lee `.opencode/commands/orchestrate.md`
2. Frontmatter `agent: planner` → planner toma el control como primary
3. Body del .md (tabla agentes, patrones orquestacion) → inyectado como prompt a planner
4. Tambien inyecta `AGENTS.md` (caveman mode) y 10 skills auto-disponibles

### Paso 2: planner responde en CAVEMAN (~75% menos tokens)

```
plan: app flutter quiz
- arch: riverpod 2.x + go_router, 4 screens (home/quiz/result/settings)
- state: Question, QuizState, ScoreState (sealed)
- ui: AnimatedContainer transiciones, ThemeData light/dark
- test: widget tests + 1 integration_test
- folder: lib/{models,providers,screens,widgets,theme}
- 5 .dart + 2 test files
- risks: anim cost (no Rive), dark mode persist
- wait: ok para arrancar?
```

(sin caveman hubiera sido ~600 tokens con tablas markdown)

### Paso 3: vos aprobas y agregas detalle

vos: "dale, package name com.mi.qa.quiz, sin librerias raras"

### Paso 4: planner dispatch paralelo via task tool

```
planner
├─ task(@architect)                  → arch final (deps, folder layout)
├─ task(@flutter-reviewer)           → checklist flutter (a11y, const, build context)
├─ task(@tdd-guide)                  → estrategia tests (red→green)
└─ task(@intent-driven-development)  → 5 acceptance criteria
```

Todos en paralelo. Planner no espera a uno antes del otro. **Todos los sub-agents tambien escriben en caveman** (AGENTS.md inyectado via opencode.json > instructions).

### Paso 5: sub-agents responden (caveman, paralelo, ~10s total)

```
@architect (8s):
deps: flutter_riverpod ^2.5.0, go_router ^14.0.0
lib/
  main.dart               entry + ProviderScope
  app.dart                MaterialApp.router
  router.dart             GoRouter config
  models/question.dart    data class
  models/quiz_state.dart  sealed states
  providers/quiz_provider.dart  StateNotifier
  screens/{home,quiz,result}_screen.dart
  theme/app_theme.dart    light/dark
  widgets/answer_button.dart
test/
  widget_test.dart        smoke
  quiz_provider_test.dart logic

@flutter-reviewer (6s):
checklist:
- const constructors en widgets
- BuildContext async guarded (mounted check)
- a11y: semantic labels en buttons
- dark: Theme.of(context), no hardcoded colors
- dispose: providers notificado

@tdd-guide (5s):
1. test/models/question_test.dart        (data)
2. test/providers/quiz_provider_test.dart (states)
3. test/widget_test.dart                 (smoke)
red→green→refactor per file
coverage target 80%+

@intent-driven-development (4s):
AC-001: tap "Start" → quiz screen con pregunta 1
AC-002: tap respuesta correcta → score++, anim fade
AC-003: 10 respondidas → result screen con score
AC-004: tap "retry" → quiz screen reinicia
AC-005: toggle dark mode → theme cambia sin rebuild
verifiable: integration_test + screenshot
```

### Paso 6: planner sintetiza y arranca impl

planner:
```
listo. arranco:
1. flutter create com.mi.qa.quiz (15s, background)
2. pubspec: riverpod, go_router
3. models + tests (red)
4. provider (green)
5. screens + widgets
6. theme + dark mode
7. integration_test
8. /verify
```

Skills auto-activadas por contexto Flutter: `coding-standards`, `tdd-workflow`, `verification-loop`.

### Paso 7: implementacion (con sub-agents automaticos)

vos: "dale"

build (primary, caveman):
- flutter create com.mi.qa.quiz
- pubspec.yaml: flutter_riverpod ^2.5.0, go_router ^14.0.0
- escribe models/, providers/, screens/, theme/

mientras escribe, dispara paralelo:
- task(@flutter-reviewer) → revisa cada widget
- task(@tdd-guide)         → valida tests antes que impl

### Paso 8: /verify (validacion completa)

vos: "/verify"

verify (build agent) en paralelo:
- task(@code-reviewer)     → diff completo
- task(@security-reviewer)  → secrets, deps vulnerables, permisos
- task(@flutter-reviewer)   → perf, a11y, const, build context
- flutter analyze + flutter test + coverage

resultado:
```
verify
======
analyze: PASS (0 issues)
test: PASS (12/12)
coverage: 87%
flutter-review: 2 minor (const missing)
code-review: 1 med (QuizState.copyWith no exhaustivo)
security: 0 issues
overall: PASS-WITH-NITS

auto-fix:
- const widgets: 2 cambios
- QuizState.copyWith: switch exhaustivo
```

### Paso 9: commit

vos: "dale, commitea"

build usa skill `git-workflow` (auto-activada por contexto de commit):
- git add lib/ test/ pubspec.yaml
- commit: `feat(quiz): implement flutter quiz app with riverpod + go_router`

---

## Resumen del flujo

| Paso | Quien | Que usa | Output |
|------|-------|---------|--------|
| 1 | vos | `/orchestrate` | arranca planner |
| 2 | planner | caveman + 10 skills | plan terso |
| 3 | vos | "dale + detalle" | dispatch paralelo |
| 4-5 | planner + 4 sub-agents | task tool paralelo | planes por area |
| 6 | planner | skills auto | lista archivos |
| 7 | build | skills + 2 tasks | codigo + tests |
| 8 | vos | `/verify` | 3 sub-agents + report |
| 9 | vos | skill git-workflow | commit conventional |

**Agentes involucrados**: 7+ (planner, architect, flutter-reviewer, tdd-guide, intent-driven-development, code-reviewer, security-reviewer, build)
**Skills auto-activadas**: 4-5 segun contexto Flutter
**Comandos**: 2 (`/orchestrate`, `/verify`)
**Context preservado**: ves resumenes, no los 11 outputs raw. Cada sub-agent corre en su propio context.

## Lo que NO tuviste que pedir

| Cosa | Quien lo hizo | Cuando |
|------|---------------|--------|
| Tests | tdd-guide | auto en cada archivo nuevo |
| Security review | security-reviewer | auto en /verify |
| Best practices (coding-standards) | skill auto | en cada sesion |
| TDD red→green | tdd-guide | enforced |
| Accesibilidad (a11y) | flutter-reviewer | en /verify |
| Performance (const, build context) | flutter-reviewer | por archivo |
| Conventional commits | git-workflow skill | en commit |
| Acceptance criteria | intent-driven-development | en plan |
| Dark mode + theme sync | architect + flutter-reviewer | en plan + verify |

**Regla**: cada agente/skill tiene su especialidad. Si lo necesita, lo invoca. **Vos pedis la intencion** ("app de quiz"), el sistema se encarga del como.

## Diferencia entre comando, skill y agente

Los tres ejecutan prompts, pero en momentos y contextos distintos.

| | Comando | Skill | Agente |
| --- | --- | --- | --- |
| Como se invoca | `/nombre` (lo escribis vos) | Automatico segun el contexto | `@nombre` (lo escribis vos o lo invoca otro agente) |
| Quien corre el prompt | El agente activo (vos hablando con opencode) | El agente activo (amplia sus reglas) | Un sub-proceso nuevo con su propio system prompt |
| Modelo | El del agente activo | El del agente activo | El suyo (si esta definido), si no el del agente que lo invoco |
| Permisos | Los del agente activo | Los del agente activo | Los suyos (pueden ser mas restrictivos) |
| Caso de uso | "Ejecuta este prompt recurrente" | "Cuando el contexto sea X, aplica estas reglas" | "Quiero que un especialista resuelva esto en paralelo" |
| Persiste entre sesiones | Si, vive en el config | Si, se carga on-demand | Si, vive como archivo |
| Como se define | `command` en JSON o `.opencode/command/*.md` | `.opencode/skill/<nombre>/SKILL.md` | `.opencode/agent/<nombre>.md` o `agent` en JSON |

### Ejemplo 1: revisar cambios antes de un commit

```bash
# Slash command: corre un prompt pre-armado en el agente activo
/code-review

# Skill: si la skill git-workflow esta cargada, el agente ya sabe
#        las convenciones de commits y las aplica solo

# Agente: lanza un sub-proceso que solo lee y devuelve feedback
@code-reviewer revisa los cambios de src/api/users.ts
```

`/code-review` es rapido y simple. `@code-reviewer` es mas profundo porque es un sub-proceso con prompt especializado. La skill ni la invocas — se carga sola cuando el contexto lo amerita.

### Ejemplo 2: agregar un endpoint nuevo

```bash
# 1. Slash command: corre el agente planner con un prompt pre-armado
/plan "agregar endpoint GET /users/:id que devuelve el perfil"

# 2. Agente: despues de implementar, invoca al especialista en paralelo
@code-reviewer revisa lo nuevo en src/api/users/

# 3. Agente: audita seguridad
@security-reviewer audita src/api/users/

# 4. Skill: si estas editando archivos .ts, las skills error-handling
#    y verification-loop se cargan solas para que sigas las convenciones

# 5. Slash command: crea el commit con conventional commits
/commit
```

El comando arranca el flujo. Los agentes hacen el trabajo pesado en paralelo. Las skills aparecen solas y mejoran lo que el agente activo hace. Otro comando cierra el ciclo.

### Cuando usar cada uno

- **Comando**: tareas recurrentes que queres estandarizar (`/plan`, `/commit`, `/code-review`).
- **Skill**: conocimiento especializado que aplica a una situacion (`api-design` cuando hay endpoints, `tdd-workflow` cuando hay tests, `security-review` cuando hay cambios sensibles).
- **Agente**: tareas que queres delegar a un especialista o correr en paralelo sin contaminar el contexto principal.

## Como trabajan en conjunto

Los tres se combinan en tiempo real. El mecanismo que los conecta es el tool `task` (para agentes) y el tool `skill` (para skills).

### Quien invoca a quien

```
vos
 └─> agente primary (build / plan / general)
      ├─> tool: task { subagent_type: "code-reviewer" }  -> sub-agente
      ├─> tool: task { subagent_type: "security-reviewer" } -> sub-agente
      ├─> tool: skill { name: "api-design" }              -> skill on-demand
      └─> (skills automaticas via <available_skills> en el system prompt)

vos
 └─> @nombre  -> invoca un sub-agente directo
```

Un sub-agente tambien puede invocar a otros sub-agentes (si su `permission.task` lo permite).

### Permission `task`: control de a quien puede invocar

En el frontmatter de un agente podes restringir a que otros agentes puede invocar:

```yaml
---
description: Orquestador de tareas complejas
mode: primary
permission:
  task:
    "*": "deny"
    "code-reviewer": "ask"
    "security-reviewer": "ask"
    "test-runner": "allow"
---
```

Esto es un patron comun: un agente **orquestador** que solo puede delegar a un set cerrado de especialistas.

### Skills: automaticas vs on-demand

Hay dos formas en que una skill se carga:

1. **Automatica** — opencode anuncia `<available_skills>` en el system prompt con nombre y descripcion de cada skill. El agente las carga cuando el contexto lo amerita. Tu no haces nada.
2. **On-demand** — el agente (o vos) invoca `skill({ name: "api-design" })` explicitamente cuando sabe que la necesita.

En ambos casos, el contenido de la skill se inyecta al contexto del agente activo.

### Commands con `agent:` — el comando corre en un sub-agente

Cuando un command tiene `agent: nombre` en su frontmatter (o en el JSON), el comando se ejecuta en un sub-agente en vez del agente activo:

```json
{
  "command": {
    "code-review": {
      "description": "Review local changes",
      "template": "...",
      "agent": "code-reviewer",
      "subtask": true
    }
  }
}
```

Esto aisla el contexto: el agente `build` no se ensucia con el output del review, y el sub-agente `code-reviewer` corre con sus propios permisos (típicamente `edit: deny` para que no modifique nada).

### Ejemplo completo de orquestacion

```
vos:  "agrega un endpoint GET /users/:id que devuelva el perfil"
                                                                          
build (primary)                                                           
 ├─ ve <available_skills> con api-design, error-handling                  
 ├─ carga skill api-design automaticamente (contexto: REST endpoint)       
 ├─ implementa src/api/users/[id].ts                                     
 │                                                                       
 ├─ invoca task { subagent_type: "code-reviewer" }   --> corre en paralelo
 │   └─ code-reviewer (read-only) revisa y devuelve feedback             
 │                                                                       
 ├─ invoca task { subagent_type: "security-reviewer" }  --> en paralelo   
 │   └─ security-reviewer audita y devuelve findings                     
 │                                                                       
 └─ te devuelve un resumen consolidado                                   
                                                                          
vos:  /commit                                                            
 └─ build usa skill git-workflow (cargada automaticamente)                
 └─ corre git add, git commit con conventional commits                    
```

Todo esto pasa en una sola sesion, sin que tengas que cambiar de ventana.

## Como personalizar

**Agregar un comando**: en `opencode.json > command`, agregá un objeto con `description` y `template`. O crea `.opencode/command/<nombre>.md` con frontmatter.

**Agregar un agente**: crea `.opencode/agent/<nombre>.md` con frontmatter `name`, `description`, y opcional `permission`.

**Agregar una skill**: crea `.opencode/skill/<nombre>/SKILL.md` con frontmatter `name` y `description` (1-1024 chars, third person, "Use when...").

**Cambiar el modelo**: agrega `model` y `small_model` a `opencode.json` (el starter no los incluye). Ejemplo: `{"model": "anthropic/claude-sonnet-4-5", "small_model": "anthropic/claude-haiku-4-5"}`. Cada usuario elige segun su provider y budget.

**Cambiar las instrucciones**: edita `instructions/INSTRUCTIONS.md` o modifica el array `instructions` del config.

## Reiniciar

opencode carga la config una sola vez al arrancar. Despues de cualquier cambio:

```
Ctrl+C          # salir
opencode .      # volver
```

## Referencia

- Schema del config: <https://opencode.ai/config.json>
- Docs: <https://opencode.ai/docs>
- Agents: <https://opencode.ai/docs/agents/>
- Skills: <https://opencode.ai/docs/skills/>
- Commands: <https://opencode.ai/docs/commands/>
- Plugins: <https://opencode.ai/docs/plugins/>
