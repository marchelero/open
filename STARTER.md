# open

Kit portable de opencode: agentes, skills, comandos e instrucciones. Copialo a cualquier proyecto y anda.

## Que tiene

```
open/
├── opencode.json              Config principal (mcp, plugin, instructions)
├── instructions/
│   └── INSTRUCTIONS.md        Reglas globales que se cargan en cada sesion
├── AGENTS.md                  Reglas para agentes (caveman mode, etc)
├── STARTER.md                 Este archivo (rename: cada proyecto tiene su README)
├── README.md                  GitHub landing (este repo)
├── .agents/                   Contexto persistente (4 capas)
│   ├── PROJECT.md             (capa 1) stack, conventions, no negociables
│   ├── sessions/              (capa 2) snapshots por sesion
│   │   ├── README.md
│   │   ├── LATEST.md          (auto: copia del ultimo snapshot)
│   │   └── YYYY-MM-DD-{slug}.md
│   └── skills/                Skills user-installed (ej: caveman)
└── .opencode/
    ├── agents/                65 subagentes (.md, mode: all)
    ├── skills/                11 skills portables (SKILL.md)
    ├── commands/              49 slash commands (.md, frontmatter)
    ├── bin/                   CLI nativo (instinct.js, sin deps)
    ├── instincts/             Instincts project-scope (json)
    └── prds/                  PRD artifacts (prd-agent)
```

Mas:
- **MCP servers (2)**: `context7` (docs search), `playwright` (browser automation)
- **Plugins (4)**: dynamic-context-pruning, skillful, vibeguard, pty
- **Permission global**: `skill: allow` (todos los agentes pueden cargar skills)
- **Caveman mode**: default ON en AGENTS.md (respuestas tersas, ~75% menos tokens)
- **Instincts CLI**: `.opencode/bin/instinct.js` — gestion nativa (reemplaza ECC continuous-learning-v2)
- **Session memory**: `/session-start` + `/session-end` (capa 1+2 always loaded, capa 3+ on-demand)

Sin dependencias npm en el root. Plugins usan Bun internamente (instala solo si esta).

## Comportamientos automaticos (no opt-in)

El agent SIEMPRE hace esto. No hay que activarlo, no hay que recordarlo:

| # | Comportamiento | Que pasa |
|---|----------------|----------|
| 1 | **Caveman mode** | Todas las respuestas en estilo terso (~75% menos tokens). Salir solo para security warnings, acciones irreversibles, multi-paso, o cuando vos pidas "habla normal". |
| 2 | **PRD-first** | Cualquier pedido "build X" / "create Y" / "agregar Z" invoca `@prd-agent` o `/prd` PRIMERO. No propone solucion sin antes clarificar intent + escribir PRD. Skip solo para Q&A, one-liner, bug repro, o "skip PRD" explicito. |
| 3 | **Session memory** | Cuando decis "listo" / "bye" / "chau" / "hasta maniana", el agent auto-escribe snapshot en `.agents/sessions/`. No tenes que correr `/session-end`. |
| 4 | **No destructive without consent** | `git commit` / `push` / `rm -rf` / `DROP TABLE` / etc requieren verbo explicito. "dale" / "ok" solos NO son consentimiento. |
| 5 | **No git push/commit without explicit per-turn consent** | El agent NUNCA commitea ni pushea sin que vos digas "commitea" / "push" en ESE turno. Permiso previo NO se aplica al turno actual. |

**Trigger del smoke test** (post-install, anytime):

```bash
node .opencode/bin/smoke-test.js
# PASSED: 23, WARNINGS: 0, FAILED: 0
```

Reglas completas en `AGENTS.md`.

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

### `.opencode/instructions/INSTRUCTIONS.md`

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

## Agentes (64)

Cada agente es un sub-proceso con su propio system prompt y permisos. Se invocan con `@nombre` desde la TUI o via `task { subagent_type: "..." }`. Aca va que hace cada uno y cuando conviene dispararlo.

### Orquestacion y planificacion

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `prd-agent` | Product Requirements specialist. Lee/crea `.agents/PROJECT.md`, corre Understanding Protocol (active listening, intention map, resolucion de ambiguedad) y produce `.opencode/prds/{name}.prd.md`. | Activar PRIMERO en cualquier tarea no-trivial. Dispara con "build X", "create Y", "add feature Z". Antes de planear, queres entender la intencion. |
| `planner` | Planning specialist para features complejos y refactors. Descompone en fases, identifica dependencias y riesgos, devuelve plan con tareas concretas. | Cuando el usuario pide feature implementation, cambios arquitectonicos o refactors grandes. Auto-activado en tasks de planning. |
| `architect` | Software architecture specialist. Toma decisiones de diseno, escalabilidad y tech choices. | En `/plan` o cuando se debate entre alternativas (DB, queue, state mgmt, monorepo vs polyrepo). No escribe codigo: solo blueprints. |
| `code-architect` | Disena features analizando patrones del codebase existente. Devuelve blueprint con archivos, interfaces, data flow y orden de construccion. | Antes de implementar una feature mediana/grande. A diferencia de `architect`, este mira tu repo y propone la estructura concreta. |
| `gan-planner` | GAN Harness — Planner. Expande un one-line prompt en spec completa: features, sprints, criterios de evaluacion, direccion de diseno. | Solo en flujo GAN (plan→generate→evaluate). Punto de entrada para builds generativos iterativos. |

### Code review y calidad (cross-stack)

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `code-reviewer` | Review experto de calidad, seguridad, mantenibilidad. Aplica checklists genéricos. | Inmediatamente despues de escribir o modificar codigo. MUST BE USED para todo cambio. Corre como sub-agente read-only. |
| `code-simplifier` | Simplifica y refina codigo para claridad y consistencia sin cambiar comportamiento. Foco en archivos modificados recientemente. | Cuando el codigo funciona pero esta verboso o tiene capas redundantes. Despues de un PR, antes de merge. |
| `comment-analyzer` | Analiza comentarios por exactitud, completitud, mantenibilidad y "comment rot" risk. | Pre-commit o pre-PR en codebases maduros donde los comments pueden haber quedado stale. |
| `silent-failure-hunter` | Busca errores silenciados, swallowed exceptions, fallbacks peligrosos, falta de propagacion de errores. | Code review enfocado en robustez. Despues de mergear fix critico, para auditar si se introdujo ocultamiento de errores. |
| `type-design-analyzer` | Analiza diseno de tipos: encapsulacion, expresion de invariantes, enforcement. | Refactor de modelos de dominio, diseno de APIs internas, evaluacion de sealed classes / discriminated unions. |
| `pr-test-analyzer` | Revisa cobertura de tests en un PR con foco en behavioral coverage y prevencion de bugs reales. | Antes de aprobar un PR. Detecta tests triviales (mockeados para pasar) o gaps criticos. |
| `performance-optimizer` | Performance specialist. Perfila, busca memory leaks, optimiza render y algoritmos, reduce bundle size. | Cuando hay queja de latencia, frame drops, alto CPU/mem, o antes de release. Devuelve cambios concretos con medicion. |
| `security-reviewer` | OWASP Top 10, SSRF, injection, unsafe crypto, secretos. Dispara PROACTIVAMENTE. | Despues de escribir codigo con user input, auth, API endpoints, o datos sensibles. MUST en `/verify`. |
| `a11y-architect` | WCAG 2.2 compliance para Web y Native. Diseno de design systems inclusivos. | Disenando componentes UI, estableciendo design system, o auditando para usuarios con discapacidad. |
| `refactor-cleaner` | Dead code cleanup. Corre knip/depcheck/ts-prune, identifica codigo muerto y duplicados, remueve seguro. | Mantenimiento periodico, pre-release, o cuando el codebase tiene anos de crecimiento organico. |
| `doc-updater` | Especialista en codemaps y documentacion. Corre `/update-codemaps` y `/update-docs`, genera `docs/CODEMAPS/*`, actualiza READMEs. | Despues de cambios estructurales: nuevos modulos, refactors, deprecaciones. Mantiene docs sincronizados con codigo. |
| `docs-lookup` | Wrapper sobre Context7 MCP. Resuelve library ID y fetcha docs actualizadas. | Cuando el usuario pregunta por setup de una libreria, API reference, o necesita ejemplos up-to-date. Reemplaza adivinar desde training data. |
| `seo-specialist` | Technical SEO audit, on-page optimization, structured data, Core Web Vitals, sitemap/robots. | Auditando un sitio web, agregando schema markup, debuggeando indexacion, o plan de remediacion SEO. |

### Build resolvers (cross-stack)

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `build-error-resolver` | Resuelve errores de build y TypeScript con diffs minimos, sin cambios arquitectonicos. | Cuando `npm run build` o `tsc` falla. Foco en volver a verde rapido. NO refactorea, solo fix. |

### Reviewers por stack

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `typescript-reviewer` | TS/JS expert. Type safety, async correctness, Node/web security, idiomatic patterns. | MUST BE USED en proyectos TS/JS. Despues de cada cambio en `.ts`/`.tsx`/`.js`. |
| `python-reviewer` | PEP 8, Pythonic idioms, type hints, security, performance. | MUST BE USED en proyectos Python. Cualquier cambio a `.py`. |
| `go-reviewer` | Idiomatic Go, concurrency patterns, error handling, performance. | MUST BE USED en proyectos Go. Enfocado en goroutine leaks, channel misuse, error wrapping. |
| `rust-reviewer` | Ownership, lifetimes, error handling, unsafe usage, idiomatic patterns. | MUST BE USED en proyectos Rust. Borrow checker complaints, `unsafe`, traits mal definidos. |
| `java-reviewer` | Spring Boot o Quarkus (auto-detecta). Layered architecture, JPA/Panache, MongoDB, security, concurrency. | MUST BE USED en proyectos Java. Despues de cada cambio a controllers, services, repos. |
| `kotlin-reviewer` | Idiomatic Kotlin, coroutine safety, Compose best practices, Android pitfalls, clean architecture. | MUST BE USED en proyectos Kotlin o Android/KMP. En Compose: side effects, recomposicion. |
| `csharp-reviewer` | .NET conventions, async patterns, security, nullable reference types, performance. | MUST BE USED en proyectos C#. Despues de cambios a controllers, services, EF queries. |
| `cpp-reviewer` | Memory safety, modern C++ idioms, concurrency, performance. | MUST BE USED en proyectos C++. Templates, RAII, smart pointers, move semantics. |
| `fsharp-reviewer` | Functional idioms, type safety, pattern matching, computation expressions. | MUST BE USED en proyectos F#. Discriminated unions, railway-oriented programming. |
| `swift-reviewer` | Protocol-oriented design, value semantics, ARC, Swift Concurrency, idiomatic patterns. | MUST BE USED en proyectos Swift. `@MainActor`, Sendable, retain cycles. |
| `php-reviewer` | PSR-12, PHP type system, Eloquent ORM, security, performance. | MUST BE USED en proyectos PHP. Laravel/Symfony. |
| `react-reviewer` | Hook correctness, render performance, server/client component boundaries, a11y, React security. | MUST BE USED en React. Cambios a `.tsx`/`.jsx`. En Next.js: hydration mismatches, `'use client'`. |
| `flutter-reviewer` | Widget best practices, state management, Dart idioms, perf, a11y, clean architecture. Library-agnostic. | MUST BE USED en Flutter/Dart. Riverpod/Bloc/Provider. Widget tests, const constructors. |
| `django-reviewer` | ORM correctness, DRF patterns, migration safety, security misconfigs, production practices. | MUST BE USED en Django. N+1 queries, middleware, migrations riesgosas. |
| `fastapi-reviewer` | Async correctness, dependency injection, Pydantic schemas, security, OpenAPI quality. | Proyectos FastAPI. Background tasks, lifespan events, response models. |
| `database-reviewer` | PostgreSQL specialist. Query optimization, schema design, security, perf. Supabase best practices. | Escribiendo SQL, creando migrations, diseno de schema, troubleshooting query lenta. PROACTIVELY. |
| `healthcare-reviewer` | Clinical safety, CDSS accuracy, PHI compliance (HIPAA), medical data integrity. | Apps medicas/EMR/EHR/clinical decision support. Validacion contra HIPAA y data integrity. |
| `mle-reviewer` | ML/MLOps production-grade. Data contracts, feature pipelines, training reproducibility, eval offline/online, serving, monitoring, rollback. | Cambios en training, inference, feature store, evaluation code. Antes de deploy de modelo. |

### Build resolvers por stack

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `cpp-build-resolver` | CMake, linker, template errors. Fixes minimos. | Builds de C++ fallando. No arquitectural, solo surgical fixes. |
| `dart-build-resolver` | `dart analyze`, Flutter compile failures, pub dependency conflicts, `build_runner` issues. | Builds de Flutter/Dart fallando. Incluye `pub get` issues. |
| `django-build-resolver` | pip/Poetry, migration conflicts, import errors, `collectstatic` failures. | Django no arranca o `manage.py` falla. No modela la app, solo la hace correr. |
| `go-build-resolver` | `go build`, `go vet`, linter warnings. | Builds de Go fallando. Fixes compatibles con `go vet`. |
| `java-build-resolver` | Maven/Gradle, Spring Boot o Quarkus. Compiler errors, dep issues. | Builds Java fallando. Detecta framework auto. |
| `kotlin-build-resolver` | Kotlin/Gradle compiler, dependency issues. | Builds Kotlin fallando. En Android: Gradle, KSP, KAPT. |
| `pytorch-build-resolver` | Tensor shape mismatches, device errors, gradient issues, DataLoader, mixed precision. | PyTorch training/inference crashea. No reescribe modelo, solo fix. |
| `react-build-resolver` | Vite, webpack, Next.js, CRA, Parcel, esbuild, Bun. JSX/TSX compile, hydration, server/client boundaries. | MUST BE USED cuando build de React falla. Bundler-specific surgical fixes. |
| `rust-build-resolver` | `cargo build`, borrow checker, `Cargo.toml`. | Builds de Rust fallando. Borrow checker es el 90% de los casos. |
| `swift-build-resolver` | `swift build`, Xcode, SPM, code signing. | Builds Swift/Xcode fallando. Provisioning profiles, signing. |

### Dominio y especialidad

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `network-architect` | Disena arquitectura enterprise o multi-site. Usa skills de routing, validacion, automation, troubleshooting. | Proyectos de red. Planear topology, segmentacion, alta disponibilidad. |
| `network-config-reviewer` | Revisa configs de router/switch: security, correctness, stale references, risky change-window commands. | Antes de aplicar cambios a prod network. Audit de configs existentes. |
| `network-troubleshooter` | Diagnostica connectivity, routing, DNS, interface, policy. Workflow read-only OSI-layer con evidencia. | Cuando algo no responde. Read-only: no cambia configs, solo diagnostica. |
| `homelab-architect` | Disena planes de red para home/small-lab desde hardware inventory, goals y nivel del operador. Safe staged changes con rollback. | Setup de home lab, homelab upgrades, segmentation domestica. |
| `harmonyos-app-resolver` | ArkTS/ArkUI, V2 state management, Navigation routing, API usage, perf. | Proyectos HarmonyOS/OpenHarmony. |
| `marketing-agent` | Strategist + copywriter. Campaign planning, audience research, positioning, copy, content review. Landing pages, email, social, ads, video scripts, calendars. | Planificar o ejecutar un launch, escribir copy, content calendar, o auditar messaging. |
| `chief-of-staff` | Triage multi-canal (email, Slack, LINE, Messenger). Clasifica en 4 tiers (skip/info_only/meeting_info/action_required), genera draft replies. | Gestion de bandeja unificada, priorizacion de mensajes, follow-up post-send via hooks. |
| `e2e-runner` | E2E testing con Vercel Agent Browser (preferred) o Playwright fallback. Genera, mantiene y corre tests. Maneja test journeys, quarantine flaky, sube artifacts. | PROACTIVELY para validar flujos criticos. Despues de features que tocan UI, pre-release. |
| `tdd-guide` | TDD specialist. Enforces write-tests-first. Garantiza 80%+ coverage. RED→GREEN→REFACTOR. | PROACTIVELY al escribir features, fix bugs, o refactor. MUST en proyectos con coverage target. |
| `harness-optimizer` | Analiza y mejora la config local de agent harness: reliability, cost, throughput. | Tunear el setup de opencode: cuales agentes se llaman mas, donde falla el routing, optimizacion de permissions. |
| `loop-operator` | Opera loops autonomos de agentes. Monitorea progreso e interviene seguro cuando se estancan. | Cuando corres un agente en loop (ej. overnight build) y queres supervision con abort conditions. |
| `code-explorer` | Analisis profundo del codebase. Traza execution paths, mapea architecture layers, documenta dependencies. | Antes de un cambio grande, onboarding a un repo nuevo, o planear refactor. Devuelve mapa mental. |
| `conversation-analyzer` | Analiza transcripts de conversacion para encontrar behaviors que valga la pena prevenir con hooks. | Disparado por `/hookify` sin argumentos. Mining de patrones problematicos. |

### Pipeline opensource

3 etapas para liberar un proyecto interno. Se corren en orden.

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `opensource-forker` | Copia archivos, strip secrets/credenciales (20+ patterns), reemplaza internal references con placeholders, genera `.env.example`, limpia git history. | Etapa 1: cuando decis "este repo va a ser open source". Punto de entrada. |
| `opensource-sanitizer` | Verifica que el fork esta fully sanitized. Scans de leaked secrets, PII, internal references, dangerous files. Genera PASS/FAIL/PASS-WITH-WARNINGS. | Etapa 2: PROACTIVELY antes de cualquier public release. Audit final. |
| `opensource-packager` | Genera packaging completo: `CLAUDE.md`, `setup.sh`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, GitHub issue templates. | Etapa 3: post-sanitization, para hacer el repo inmediatamente usable. |

### GAN Harness (3 agentes en loop)

Patron generative adversarial: planner escribe spec, generator implementa, evaluator testea. Itera hasta threshold.

| Agente | Que hace | Cuando usarlo |
| --- | --- | --- |
| `gan-planner` | Expande one-line prompt en spec con features, sprints, criterios de evaluacion y diseno. | Punto de entrada GAN. Define el "que". |
| `gan-generator` | Implementa features segun la spec, lee feedback del evaluator, itera hasta quality threshold. | En el loop, despues de plan. Produce codigo. |
| `gan-evaluator` | Testea la app corriendo via Playwright, scorea contra rubric, devuelve feedback actionable. | En el loop, contra generator. Cierra el ciclo. |

Patron de invocacion: `vos → agente primary (build/plan/general) → task tool { subagent_type: "<nombre>" }`. La mayoria corre en paralelo para no contaminar el contexto del primary.

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

### Paso 9: checkpoint — vos decidis que sigue

despues de /verify, build (primary) **se detiene**. no commitea solo.

```
[verify result: PASS-WITH-NITS, 3 auto-fixes aplicados]

checkpoint. espera instruccion.
- "commitea"          → git commit con conventional
- "mostrame diff"     → sin cambios, solo review
- "arregla nits primero" → fixes antes de commit
- (callate)           → sesion queda aca, sin commit
```

**Regla**: el agent NUNCA hace commit, push, force-push, rm -rf, DROP TABLE, etc. sin que vos lo pidas explicito. "dale" sin verbo destructivo = no destructivo.

vos: "commitea, sin push"

build usa skill `git-workflow` (auto por contexto commit):
- git add lib/ test/ pubspec.yaml
- commit: `feat(quiz): implement flutter quiz app with riverpod + go_router`
- NO push (vos no lo pediste)

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

**Cambiar las instrucciones**: edita `.opencode/instructions/INSTRUCTIONS.md` o modifica el array `instructions` del config.

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
