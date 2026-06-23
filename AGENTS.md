# AGENTS.md

Reglas del proyecto para opencode cuando trabaja en este repo.

## Que es esto

Starter pack portable de opencode. El "producto" son los 47 comandos, 64 agentes y 11 skills en `.opencode/`. No es codigo de aplicacion — es config + prompts + un CLI de instincts en `.opencode/bin/instinct.js`.

## Estructura

```
.
├── opencode.json          Config principal (commands, instructions, permission, mcp, plugin)
├── STARTER.md             Guia de uso del starter (rename: cada proyecto tiene su README)
├── AGENTS.md              Este archivo (reglas para agentes)
├── STARTER-AGENTS.md      Reglas starter-specific (opcional, solo este repo)
├── instructions/
│   └── INSTRUCTIONS.md    Reglas globales (seguridad, estilo, git) que se inyectan en cada sesion
├── .agents/skills/        Skills custom del usuario (ej: caveman via npx skills add)
└── .opencode/
    ├── agents/            64 subagentes (.md, frontmatter: description + mode + permission)
    ├── skills/            11 skills portables (<name>/SKILL.md, frontmatter: name + description)
    ├── agent -> agents    JUNCTION oculta (backwards compat opencode 1.17.x)
    └── skill -> skills    JUNCTION oculta (backwards compat opencode 1.17.x)
```

## Convenciones obligatorias

1. **Nombres de carpetas en PLURAL** (`.opencode/agents/`, `.opencode/skills/`). Es el standard oficial. No renombrar a singular.
2. **NO borrar las junctions ocultas** (`.opencode/agent`, `.opencode/skill`). opencode 1.17.x las escanea por backwards compat. Son punteros de 0 bytes, no ocupan nada.
3. **Frontmatter minimo para agentes custom**: `description` (required), `mode: subagent` (required), `permission:` (recomendado). El `name` se infiere del nombre de archivo.
4. **Frontmatter minimo para skills**: `name` y `description`. `description` debe ser third person, 1-1024 chars, "Use when...".
5. **Slash commands en JSON**, no en archivos `.md`. Usar el campo `agent` para enrutar a un especialista.

## Que NO hacer

- No agregar dependencias npm. Este proyecto es zero-deps por diseño.
- No crear `package.json`, `tsconfig.json`, ni archivos de build.
- No committear el `.opencode/.gitignore` modificado sin actualizarlo (ignora `node_modules`, `package.json`, etc. por si opencode intenta instalar plugins).
- No incluir `model` ni `small_model` en opencode.json (cada usuario configura el suyo). Si lo agregas, sera el default para los 64 agentes — avisar antes.

## Skills y agentes custom del usuario

Si el usuario hace `npx skills add <owner>/<repo>@<skill>`:
- Las skills se instalan en `.agents/skills/<name>/SKILL.md` (path global reconocido).
- opencode las descubre automaticamente via `<available_skills>`.
- El `permission.skill: "allow"` global en `opencode.json` garantiza que los agentes puedan cargarlas.

## Comportamientos obligatorios (no opt-in)

Estos 4 comportamientos los hace el agent SIEMPRE, sin que el usuario lo pida. Son enforced, no recomendados.

### 1. Caveman mode (estilo)

Todas las respuestas en este proyecto van en **caveman mode** por default para reducir ~75% el consumo de tokens.

**Estilo**:
- Drop articulos (a/an/the), filler (just/really/basically), pleasantries (sure/certainly/happy to), hedging.
- Fragments OK. Sinonimos cortos (fix no "implement a solution for").
- Sin narration de tool-calls, sin tablas decorativas, sin emojis, sin dump de logs largos salvo que pidan.
- Patron: `[thing] [action] [reason]. [next step].`
- Standard tech acronyms OK (DB/API/HTTP); nunca inventar abreviaturas que el lector no pueda decodificar.
- Terminos tecnicos, code blocks, errores quoted exact — siempre verbatim.
- Preservar el idioma del usuario (escribe en español → respondo en español caveman).

**Intensidad default: full**. Switch via `/caveman lite|full|ultra` o `/caveman wenyan-full`.

**Auto-claridad (salir de caveman cuando)**:
- Security warnings.
- Confirmaciones de acciones irreversibles (DROP TABLE, force push, rm -rf, etc).
- Secuencias multi-paso donde el orden de fragmentos pueda malinterpretarse.
- Cuando la compresion cree ambiguedad tecnica real.
- Cuando el usuario pida clarificacion o repita la pregunta.

**Como desactivar**: "stop caveman" / "normal mode" / "habla normal" → vuelve a estilo completo. Reactivar: "caveman mode" o `/caveman`.

### 2. PRD-first (cualquier task no-trivial)

**Regla**: cuando el usuario pide una feature / task / proyecto nuevo, el agent SIEMPRE invoca `@prd-agent` PRIMERO. No propone soluciones directas.

**Triggers** (cualquiera activa el flujo):
- "build X", "create Y", "agregar Z", "implementar W", "hazme una app de..."
- "necesito una funcionalidad que..."
- "quiero un sistema de..."
- "/plan X" sin PRD previo
- Cualquier pedido que no sea pure Q&A o one-liner fix

**Flujo obligatorio**:
1. Invocar `task { subagent_type: "prd-agent", prompt: "<user request>" }`
2. Esperar confirmacion explicita del usuario sobre el Intention Map
3. PRD escrito en `.opencode/prds/{name}.prd.md`
4. Reci despues: planning + implementacion

**Excepciones** (puede saltar prd-agent):
- Pure Q&A: "que hace X?" / "como funciona Y?"
- One-liner fix: "typo en README" / "agrega coma"
- Bug report con repro: "el login falla cuando..." (los criterios son obvios)
- Code review: "/code-review" sobre cambios existentes
- Usuario explicito: "skip PRD" / "implementa directo" / "ya te di el contexto"

**Anti-pattern explicit**: el agent NUNCA propone una solucion (con archivos, librerias, patrones) antes de pasar por prd-agent. Si el usuario pide feature X, la primera respuesta es invocar prd-agent, no "te recomiendo hacer Y con Z".

### 3. Session memory (auto-snapshot al cerrar)

**Regla**: cuando el usuario senala fin de sesion, el agent AUTO-escribe snapshot en `.agents/sessions/`. No espera a que corra `/session-end`.

**Triggers** (cualquiera activa auto-snapshot):
- "listo", "listo por hoy", "terminamos", "chau", "bye", "adios", "hasta maniana"
- "guarda donde quedamos" / "save state" / "snapshot"
- Inactividad > 30 min (si la sesion tuvo trabajo significativo)
- Despues de `/verify` exitoso en proyecto con cambios reales
- Antes de operacion destructiva (commit, push, etc) en sesion larga

**Comportamiento**:
1. Detectar trigger
2. Resumir sesion internamente (status, decisions, files, commits)
3. Preguntar UNA vez: "Snapshot de hoy como 'X' o queres otro titulo?"
4. Si confirma → escribir `.agents/sessions/{YYYY-MM-DD}-{slug}.md` + actualizar LATEST.md
5. Si dice "skip" → respetar, no insistir

**`/session-end` y `/session-start`** siguen disponibles para uso manual, pero ya no son necesarios. El auto-snapshot cubre el caso comun.

### 4. Acciones destructivas requieren consentimiento explicito

El agent NUNCA hace estas acciones sin que el usuario lo pida con verbo explicito:

- `git commit` / `git push` / `git push --force` / `git reset --hard`
- `rm -rf` / `DROP TABLE` / `DELETE` sin WHERE / `TRUNCATE`
- Escribir archivos fuera del scope pedido
- Modificar `package.json` / `pubspec.yaml` / `Cargo.toml` sin pedir
- Instalar/desinstalar dependencias
- Cambiar de branch / merge / rebase destructivo
- Forzar rebuilds, limpiar caches, tocar `.env` / secrets

**Cuando aplica**:
- Plan / implement / verify → se detienen en checkpoint, esperan instruccion
- "dale" / "ok" / "procede" solos NO son consentimiento para commit
- Si el usuario dice "commitea" / "haz commit" / `git commit` → OK
- Si el usuario dice "dale" despues de verify → agent espera, NO commitea

**Pattern de checkpoint**:
```
[verify: PASS-WITH-NITS]
checkpoint. espera instruccion.
- "commitea" / "push" / etc. → ejecuto
- "arregla nits" → fixes antes
- (nada) → sesion queda aca
```

Si duda entre accion reversible o no: para y pregunta. Es mejor pedir confirmacion que romper algo.

## Memoria de sesiones (4 capas)

El pack usa una arquitectura de 4 capas para minimizar tokens al retomar:

| Capa | Que vive | Cuando se carga | Tamanio |
|------|----------|-----------------|---------|
| 1 | AGENTS.md + INSTRUCTIONS.md + .agents/PROJECT.md | siempre | ~2K tokens |
| 2 | .agents/sessions/LATEST.md (ultimo snapshot) | al `/session-start` o auto al cerrar | ~1-3K tokens |
| 3 | Skills on-demand, files especificos, sub-agents | cuando se necesitan | variable |
| 4 | Full git history, todos los PRDs/plans, instincts | nunca al contexto | disco |

**Regla**: todo lo que pueda vivir en disco → disco. Solo lo "vivo" va a contexto.

## Reinicio

opencode lee la config al arrancar. Despues de cualquier cambio:

```
Ctrl+C          # salir del TUI
opencode .      # volver a entrar
```

## Verificacion post-cambio

```bash
opencode debug config   # muestra la config mergeada
opencode debug skill    # lista skills descubiertas
opencode debug agent <nombre>   # detalle de un agente
```

Si `debug skill` no lista algo, revisar: nombre del directorio, `SKILL.md` en mayusculas, frontmatter valido.
