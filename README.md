# open — pack portátil de agentes para opencode

**Un equipo completo de agents, commands y skills que convierte a opencode en un flujo de desarrollo guiado por especificación y verificado en cada paso.**

No es una aplicación: es configuración + prompts + herramientas que se copian a cualquier proyecto. Los CLIs usan solo el estándar de Node (cero dependencias).

Aplicado a tu día a día, el pack cubre **cuatro prácticas** a la vez:

| Práctica | Cómo la cubre |
|---|---|
| **Spec-driven** | Especificar antes de construir y demostrar al cerrar: `/prd` → `/plan` → `/tasks` → `/verify` → `/audit-report` → `/definition-of-done` |
| **Context engineering** | Las skills se cargan **solo cuando hacen falta**; `AGENTS.md` se mantiene corto para no inflar cada turno |
| **Verification gate** | 8 verificadores automáticos (CI en Windows + Linux) que no dejan pasar una regresión |
| **Eval-driven** | Un dataset de invariantes de comportamiento (`eval-static`) que protege las reglas del pack |

<!-- COUNTS-START -->
## Counts

> Auto-managed by `.opencode/bin/counts.js`. Do not edit by hand.
> Regenerate: `node .opencode/bin/counts.js --update <files...>`

- **68** agents (.opencode/agents)
- **64** commands (.opencode/commands)
- **108** skills (.agents/skills)
- **22** native CLIs (.opencode/bin)
- **3** npm plugins + **4** local plugin(s)
- **1** active MCPs + **13** optional MCP(s)
<!-- COUNTS-END -->

## Qué hace

Especificar antes de construir, y demostrar con evidencia que lo construido cumple.

| Componente | Función |
|---|---|
| **Agents** | *Quién* hace el trabajo: roles especializados (`code-reviewer`, `security-reviewer`, `build-error-resolver`, `tdd-guide`, revisores por lenguaje, `architect`, `manual-writer`...) |
| **Commands** | *Qué escribes tú*: `/prd`, `/plan`, `/tasks`, `/verify`, `/route`... El `AGENTS.md` global obliga a pasos verificables |
| **Skills** | *Conocimiento que se carga solo cuando hace falta*: patrones, checklists, marcos. No ocupan contexto permanente |
| **CLIs** | *La máquina que valida*: frontmatter, prosa, wiring, smoke, conteos, integridad, instalación, tokens y routing |
| **MCPs / plugins** | Conexiones externas: `context7` activo; 13 más en opt-in (`supabase`, `vercel`, `stripe`, `playwright`...), cada uno con `/mcp-on` |

## Cómo empezar

### 1. Instala el pack en tu proyecto

Requisito único: **Node.js 18+** en el PATH.

```bash
# Windows / Linux / macOS — en la carpeta del proyecto:
node init-opencode.js --project-path "C:\mi-proyecto"

# o en el directorio actual:
node init-opencode.js
```

El instalador **detecta el stack** del proyecto (`package.json` → node, `pyproject.toml` → python, `pubspec.yaml` → flutter...) y **descarta los agents de lenguajes que no aplican** (las skills se conservan todas). Es **idempotente**: repetirlo actualiza sin duplicar ni pisar tu config.

#### Actualizar un proyecto que ya tiene el pack

Volver a correr el instalador **reemplaza** los archivos del pack por la versión nueva y **conserva tus skills** (las propias del proyecto se detectan y se reportan). Además limpia los obsoletos de una versión vieja:

- **Con manifest** (`.opencode/.pack-manifest.json`, lo escribe cada instalación): el borrado de archivos obsoletos es automático.
- **Sin manifest** (una versión anterior a esta feature): una pasada con `--prune` limpia los obsoletos de `.opencode/` (agents/commands incluidos). Nunca toca `.agents/skills/`, `docs/`, ni tu `opencode.json`/`.gitignore`.

```bash
node init-opencode.js --project-path "C:\mi-proyecto" --prune
```

### 2. Arranca opencode

```bash
cd C:\mi-proyecto
opencode .
```

### 3. Empieza a trabajar

| Si... | Escribe |
|---|---|
| no sabes por dónde empezar | `/route "lo que quiero, en lenguaje normal"` |
| es una feature nueva | `/flow-feature "…"` |
| es un bug reproducible | `/flow-bugfix "pasos"` |
| es una pregunta normal | **nada** — se responde directo |

> **`/route` es read-only**: recomienda, no ejecuta. Te dice qué escribir y lo lanzas tú.

## El ciclo SDD (Spec-Driven Development)

```text
/prd ─► /spec-lint ─► /plan ─► /tasks ─► implementar
                                             │
   /definition-of-done ◄─ /trace ◄─ /audit-report ◄─ /verify
                                             ▲
                               /change-request (cambio de alcance)
```

1. **`/prd`** — requerimiento con criterios de aceptación (`AC-NN`).
2. **`/spec-lint`** — puntúa la especificación; si es débil, no pasa.
3. **`/plan`** — diseño técnico, fases y reversibilidad.
4. **`/tasks`** — desglose atado a los criterios.
5. **Implementar** — con `tdd-guide`, `code-reviewer`, `security-reviewer`.
6. **`/verify`** — corre tests, linters y builds reales.
7. **`/audit-report` → `/trace`** — evidencia: qué criterio cubre qué tarea y qué test.
8. **`/definition-of-done`** — cierre formal.

Complementos: `/orchestrate` (ciclo multi-agente completo), `/spec-to-tests`, `/quick-prd`.

## Verificación (8 gates, CI en Windows + Linux)

Córrelo desde la raíz del pack:

| Chequeo | Comando |
|---|---|
| Conteos exactos | `node .opencode/bin/counts.js --check` |
| Frontmatter de agents/skills/commands | `node .opencode/bin/validate-frontmatter.js` |
| Integridad de skills+agents (sha256) | `node .opencode/bin/verify-lockfile.js` |
| Cableado command → agent → skill | `node .opencode/bin/wiring-test.js` |
| Prosa: enlaces y encoding | `node .opencode/bin/lint-docs.js --dir .` |
| Salud general | `node .opencode/bin/smoke-test.js` |
| Invariantes de comportamiento | `node .opencode/bin/eval-static.js` |
| El instalador no rompe nada | `node .opencode/bin/installer-test.js` |

Y **`node .opencode/bin/measure-tokens.js`** para vigilar el coste de arranque (informativo).

## Router semántico

`/route` y `node .opencode/bin/route-match.js "tu request"` usan un motor de scoring léxico
(BM25) sobre el catálogo: devuelve el **agent/skill más probable + 2 alternativas + el comando exacto**.
Funciona sin red ni secretos; con `/route` como punto de entrada.

## Estructura

```text
.
├── init-opencode.js           Instalador (Windows / Linux / macOS)
├── init-opencode.ps1 / .sh     Lanzadores finos (llaman al instalador Node)
├── opencode.json              Configuración (plugins, MCPs)
├── skills-lock.json           Integridad de skills+agents (sha256)
├── .github/workflows/ci.yml   Gate de CI (Windows + Linux)
├── evals/                     Casos de regresión (invariantes + routing)
├── docs/                      PRDs, planes, reports, auditorías, sesiones
├── .agents/skills/            Skills + el router (dispatcher)
└── .opencode/
    ├── AGENTS.md              Reglas globales de comportamiento (la "ley")
    ├── agents/                Agents
    ├── commands/              Slash commands
    ├── bin/                   CLIs de validación y utilidades
    ├── manual/                Documentación de referencia
    ├── plugins/               Hooks (hookify, cost-ledger)
    └── templates/             Plantillas
```
