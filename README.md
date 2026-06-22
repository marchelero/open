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
