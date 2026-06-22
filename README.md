# opencode starter kit

Kit portable para opencode. Copialo a cualquier proyecto y anda.

## Contenido

```
open/
├── opencode.json                 # Config: 33 slash commands
├── README.md                     # Este archivo
└── .opencode/
    ├── agent/   (64 archivos)    # Subagentes especializados (.md)
    └── skill/   (10 skills)     # Skills portables (SKILL.md)
```

**Total**: 75 archivos, ~600 KB. Sin dependencias npm, sin plugins, sin build step.

## Como usarlo

Copia todo a tu proyecto:

```bash
cp -r D:/dev/2026/open/.opencode /path/a/tu/proyecto/
cp D:/dev/2026/open/opencode.json /path/a/tu/proyecto/
```

Despues:

```bash
cd /path/a/tu/proyecto
opencode .
```

## Que hay dentro

### Commands (33)

Definidos en `opencode.json > command`. Se invocan con `/nombre`.

**Transversales (aplican a cualquier proyecto)**:
- `/plan` — crea plan con fases, dependencias, riesgos
- `/build-fix` — arregla errores de build incrementalmente
- `/code-review` — revisa cambios locales o PR de GitHub
- `/security-scan` — busca secrets, inyecciones, misconfigs
- `/refactor-clean` — remueve codigo muerto y duplicados
- `/quality-gate` — corre lint, typecheck, tests, coverage, security
- `/checkpoint` — guarda estado de verificacion
- `/test-coverage` — analiza y mejora cobertura (objetivo 80%+)
- `/learn` — extrae patrones de la sesion
- `/model-route` — recomienda tier de modelo segun complejidad
- `/setup-pm` — configura package manager preferido
- `/update-codemaps` — actualiza mapas del codebase
- `/update-docs` — actualiza docs por cambios recientes
- `/aside` — pregunta rapida sin cambiar contexto

**Por stack**:
- Flutter: `/flutter-review`, `/flutter-build`, `/flutter-test`
- React: `/react-review`, `/react-build`, `/react-test`
- Go: `/go-review`, `/go-build`, `/go-test`
- Rust: `/rust-review`, `/rust-build`, `/rust-test`
- Python: `/python-review`
- C++: `/cpp-review`, `/cpp-build`, `/cpp-test`
- Kotlin: `/kotlin-review`, `/kotlin-build`, `/kotlin-test`

### Agentes (64)

Definidos como `.md` en `.opencode/agent/`. Se invocan con `@nombre` desde la TUI o via Task tool.

Algunos destacados:
- `@architect` — diseno de sistemas, escalabilidad
- `@code-architect` — arquitectura de codigo
- `@security-reviewer` — auditoria de seguridad
- `@performance-optimizer` — optimizacion
- `@refactor-cleaner` — refactoring seguro
- `@tdd-guide` — TDD puro
- `@planner` — planificacion
- `@silent-failure-hunter` — busca catches silenciosos
- `@build-error-resolver` — resuelve errores de build
- `@typescript-reviewer`, `@python-reviewer`, `@react-reviewer`, `@rust-reviewer`, `@go-reviewer`, `@swift-reviewer`, `@php-reviewer` — revisores por lenguaje
- `@react-build-resolver`, `@rust-build-resolver`, `@pytorch-build-resolver`, `@swift-build-resolver` — resolvers de build por stack
- `marketing-agent`, `seo-specialist`, `network-architect`, `network-troubleshooter`, etc

Lista completa: `ls .opencode/agent/`.

### Skills (10)

Definidas como `SKILL.md` en `.opencode/skill/<nombre>/`. Se cargan on-demand segun el contexto.

| Skill                       | Cuando se dispara                                                |
| --------------------------- | ---------------------------------------------------------------- |
| `api-design`                | Disenar / revisar API REST.                                      |
| `error-handling`            | Implementar manejo de errores, decidir estrategias.              |
| `tdd-workflow`              | TDD: red, green, refactor.                                       |
| `security-review`           | Review de seguridad, threat modeling.                            |
| `git-workflow`              | Branches, commits, PRs, conflictos.                              |
| `coding-standards`          | Convenciones de codigo del equipo.                               |
| `verification-loop`         | Verificacion post-cambio.                                        |
| `intent-driven-development` | Desarrollo guiado por intencion del usuario.                     |
| `documentation-lookup`      | Buscar / generar documentacion.                                  |
| `mcp-server-patterns`       | Crear / mantener servers MCP.                                    |

## Por que la carpeta `ia` no andaba con opencode

`D:\dev\2026\ia` es un proyecto de otro sistema ("ECC") que no es opencode puro:

1. **Carpetas que opencode no entiende**: `.opencode/tools/` y `.opencode/instructions/` no existen en opencode — opencode auto-descubre `agent/`, `skill/`, `plugins/`, `commands/` pero no esas.
2. **Plugins con dependencias npm**: el `ecc-hooks.js` requiere `cd .opencode && npm install` previo. Si no se hace, el plugin falla al cargar y opencode puede fallar silencioso.
3. **Modelos de provider inexistentes**: varios agentes referencian `opencode-go/qwen3.7-max` y similares. Esos providers no existen en tu build (`opencode-go/minimax-m3`), asi que el agente no arranca.

Este kit (`open/`) resuelve los tres puntos:
- Sin `tools/` ni `instructions/` ni `plugins/` problematicos.
- Sin dependencias npm — todo es contenido estatico.
- Sin referencias a modelos externos.

## Notas sobre los agentes

Los agentes vienen de `ia` y fueron limpiados en una segunda pasada:

- `tools: { Read: true, Grep: true, ... }` (formato viejo con mayusculas) → convertido a `permission: { read: allow, grep: allow, ... }` con nombres lowercase y permisos estandar de opencode.
- `model: opencode-go/...` (cualquier valor) → eliminado. El modelo lo selecciona el usuario, no va hardcoded en cada agente.
- `color: info`/`accent`/etc → preservado, opencode lo soporta.

### Mapeo de tools

| Campo viejo (ia) | Campo nuevo (opencode) |
| ---------------- | ---------------------- |
| `Read: true`     | `read: allow`          |
| `Write: true`    | `edit: allow`          |
| `Edit: true`     | `edit: allow` (deduped)|
| `Grep: true`     | `grep: allow`          |
| `Glob: true`     | `glob: allow`          |
| `Bash: true`     | `bash: allow`          |
| `WebSearch: true`| `websearch: allow`     |
| `WebFetch: true` | `webfetch: allow`      |

`Write` y `Edit` colapsan en `edit: allow` (opencode los trata igual). Si queres permisos mas granulares por agente, editale el frontmatter a mano.

## Reiniciar opencode

Despues de cualquier cambio en config, agents, skills o commands:

```
Ctrl+C   # salir de la TUI
opencode .   # volver a entrar
```

opencode carga todo una sola vez al arrancar.

## Esquema de referencia

- Config schema: <https://opencode.ai/config.json>
- Docs: <https://opencode.ai/docs>
- Agents: <https://opencode.ai/docs/agents/>
- Skills: <https://opencode.ai/docs/skills/>
- Commands: <https://opencode.ai/docs/commands/>
- Plugins: <https://opencode.ai/docs/plugins/>
