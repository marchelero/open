# open

Starter pack portable de opencode: 64 agentes, 11 skills, 47 slash commands.

Docs: [STARTER.md](./STARTER.md)

## Quick start

```bash
# copiar a tu proyecto
cp opencode.json instructions/ AGENTS.md .opencode/ /path/a/tu/proyecto/

# o usar el installer
./setup.sh /path/a/tu/proyecto        # bash
pwsh ./setup.ps1 /path/a/tu/proyecto  # powershell

# abrir
cd /path/a/tu/proyecto && opencode .
```

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

---

Patron de invocacion: `vos → agente primary (build/plan/general) → task tool { subagent_type: "<nombre>" }`. La mayoria corre en paralelo para no contaminar el contexto del primary.
