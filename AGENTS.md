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

## Modo Caveman (default: ON)

Todas las respuestas en este proyecto van en **caveman mode** por default para reducir ~75% el consumo de tokens. Reglas:

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

Despues de la parte riesgosa, resume caveman.

**Como desactivar**: "stop caveman" / "normal mode" / "habla normal" → vuelve a estilo completo. Reactivar: "caveman mode" o `/caveman`.

Referencia completa: `.agents/skills/caveman/SKILL.md`.

## Acciones destructivas requieren consentimiento explicito

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
| 2 | .agents/sessions/LATEST.md (ultimo snapshot) | al `/session-start` | ~1-3K tokens |
| 3 | Skills on-demand, files especificos, sub-agents | cuando se necesitan | variable |
| 4 | Full git history, todos los PRDs/plans, instincts | nunca al contexto | disco |

**Comandos**:
- `/session-start` — lee Capa 1+2, resume en 1-2 lineas
- `/session-end` — escribe snapshot nuevo, actualiza LATEST.md

**Regla**: todo lo que pueda vivir en disco → disco. Solo lo "vivo" va a contexto.

**Cuando usarlos**:
- Al retomar proyecto: `/session-start`
- Al cerrar sesion larga: `/session-end`
- Despues de checkpoint destructivo: `/session-end` para preservar estado

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
