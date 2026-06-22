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

## Caso real: 3+ agentes trabajando en conjunto

**Pedido**: "agregar endpoint `GET /api/users/:id` que devuelva el perfil con auth JWT"

### Paso 1: vos arrancas con 1 comando

```
/orchestrate "agregar endpoint GET /api/users/:id con auth JWT que devuelva el perfil"
```

El comando `/orchestrate` arranca el agent `planner` como primary slot.

### Paso 2: planner activa skills automaticamente

El system prompt ya anuncio `<available_skills>`. Planner lee el contexto y carga:
- `api-design` (contexto: REST endpoint)
- `error-handling` (contexto: codigo nuevo, manejo errores)
- `tdd-workflow` (va a haber tests)
- `verification-loop` (validar al final)

### Paso 3: planner invoca 4 sub-agentes en PARALELO via task tool

```
planner
├─ task(@planner-research)        -> busca patrones existentes en el repo
├─ task(@code-reviewer)           -> revisa diseno del endpoint
├─ task(@security-reviewer)        -> audita JWT handling, auth bypass
└─ task(@typescript-reviewer)     -> valida tipos de la API
```

Cada sub-agente corre con su propio system prompt y permisos. Planner NO espera a uno antes de empezar el otro (paralelo).

### Paso 4: sub-agentes ejecutan en paralelo

```
@planner-research        (background, 2-5 seg)
  -> "encontrar controllers similares, ver como manejan auth"

@code-reviewer          (background, paralelo)
  -> review del codigo propuesto, sugiere mejoras

@security-reviewer       (background, paralelo)
  -> valida JWT verification, no log de tokens, rate limiting

@typescript-reviewer    (background, paralelo)
  -> valida tipos de request/response
```

### Paso 5: planner resume y sintetiza

Planner recibe los 4 outputs, los prioriza, y te devuelve:

```markdown
## Resumen del diseno

### Validacion
- planner-research: hay 3 endpoints similares, seguir patron de /api/posts/:id
- code-reviewer: usar DTOs separados para input/output, no exponer password_hash
- security-reviewer: agregar rate limit + helmet, validar JWT con middleware existente
- typescript-reviewer: usar zod para runtime validation, evitar `any`

### Implementacion sugerida
1. Crear `src/api/users/[id].ts` con handler
2. Middleware JWT existente en `src/middleware/auth.ts`
3. DTOs en `src/api/users/dto.ts`
4. Test en `src/api/users/[id].test.ts`
5. Validar con /verify al final

### Riesgos
- Si el rate limit no existe, agregarlo antes de mergear
- Si el repo no tiene helmet, instalarlo
```

### Paso 6: vos implementas (con skills cargadas)

vos: "dale, implementa"

build (primary):
1. Carga `error-handling` para el handler
2. Carga `api-design` para los DTOs
3. Carga `tdd-workflow` para los tests
4. Escribe codigo
5. Ejecuta tests
6. `/verify` para validar

### Paso 7: verificacion con 2 sub-agentes MAS

vos: "/verify"

verify command (build agent):
├─ task(@code-reviewer)    -> revisa el diff completo
├─ task(@security-reviewer) -> audita cambios de seguridad
└─ task(@typescript-reviewer) -> valida tipos

Resultado: PASS/FAIL con findings especificos.

### Paso 8: commit con convenciones

vos: "/commit"

git-workflow skill auto-activada:
- diff muestra cambios en src/api/users/
- commit message: `feat(api): add GET /users/:id endpoint with JWT auth`
- incluye referencia a issues si hay

---

## Resumen del flujo

| Paso | Quien hace | Que usa | Output |
| --- | --- | --- | --- |
| 1 | vos | `/orchestrate` | arranca planner |
| 2 | planner | skills auto | contexto cargado |
| 3-4 | planner + 4 sub-agents | task tool en paralelo | 4 reviews |
| 5 | planner | sintetiza | resumen consolidado |
| 6 | vos | build + skills | implementacion |
| 7 | build | `/verify` + 3 sub-agents | PASS/FAIL |
| 8 | vos | `/commit` | commit con conventional |

**Total agentes involucrados**: 7+ (`planner`, `planner-research`, `code-reviewer`, `security-reviewer`, `typescript-reviewer`, `tdd-guide`, `build` + 64 disponibles)

**Skills activadas automaticamente**: 4-5 segun contexto

**Comandos usados**: 4 (`/orchestrate`, `/verify`, `/commit`, posiblemente `/tdd` o `/build-fix`)

**Context preservado**: tu ventana principal solo ve resumenes, no los 4 outputs raw. Cada sub-agente corre en su propio context.

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
