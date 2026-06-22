# open

Kit portable de opencode: agentes, skills, comandos e instrucciones. Copialo a cualquier proyecto y anda.

## Que tiene

```
open/
├── opencode.json              47 slash commands
├── instructions/
│   └── INSTRUCTIONS.md        Reglas globales que se cargan en cada sesion
├── README.md                  Este archivo
└── .opencode/
    ├── agent/                 64 subagentes (.md)
    └── skill/                 10 skills portables (SKILL.md)
```

77 archivos, sin dependencias npm, sin plugins, sin build step.

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
- `model` y `small_model` (provider/model-id)
- 47 slash commands bajo `command`
- `instructions` que apuntan a archivos `.md` que se inyectan en el system prompt

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

Se invocan con `/nombre`. Algunos destacados:

**Generales**:
`/plan`, `/build-fix`, `/code-review`, `/security`, `/refactor-clean`, `/quality-gate`, `/tdd`, `/e2e`, `/verify`, `/eval`, `/test-coverage`, `/checkpoint`, `/learn`, `/model-route`, `/update-codemaps`, `/update-docs`, `/setup-pm`, `/harness-audit`, `/aside`, `/orchestrate`.

**Por stack**:
Flutter `/flutter-*`, React `/react-*`, Go `/go-*`, Rust `/rust-*`, Python `/python-review`, C++ `/cpp-*`, Kotlin `/kotlin-*`.

**Instincts / loops** (requieren setup de continuous-learning):
`/instinct-status`, `/instinct-import`, `/instinct-export`, `/evolve`, `/promote`, `/projects`, `/loop-start`, `/loop-status`, `/skill-create`.

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

**Cambiar el modelo**: edita `model` y `small_model` en `opencode.json`.

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
