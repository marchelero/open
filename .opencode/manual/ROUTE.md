# Ruteo de agentes

> 59 sub-agentes, agrupados por intención. Elige por lo que quieres hacer, no por el nombre del agente.
> Descripciones completas en `.opencode/agents/<nombre>.md`.

> **Nota (2026)**: el primary agent ahora auto-rutea via el skill `router` (Mandatory Routing Protocol, AGENTS.md comportamiento #8; merged `agent-router` + `skill-router` en pack 1.1). Este archivo es la versión "manual lookup" — útil para entender el catálogo, pero el primary ya no necesita que le digas qué agente invocar.

## "Quiero clarificar la intención antes de construir"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `prd-agent` | Protocolo de entendimiento → archivo PRD | **PRIMER PASO OBLIGATORIO** en cualquier tarea no trivial. Dispara con: "construir X", "crear Y", "agregar Z". |

## "Quiero planear / diseñar"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `planner` | Plan por fases con riesgos, dependencias y validación | Features complejos, refactors, cambios arquitectónicos |
| `code-architect` | Diseño de sistema, decisiones tecnológicas, escalabilidad, plano de archivos | Decisiones arquitectónicas, features en repos existentes |

## "Quiero revisar código"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `code-reviewer` | Calidad, seguridad, mantenibilidad | **OBLIGATORIO** en cada cambio de código |
| `security-reviewer` | OWASP Top 10, secretos, SSRF, inyección, criptografía insegura | Tras tocar auth, pagos, datos de usuario o secretos |
| `a11y-architect` | WCAG 2.2, diseño inclusivo | Componentes de UI, design systems |
| `code-quality-analyzer` (mode: comments) | Comentarios obsoletos, doc desactualizada | Codebases maduros, antes de un PR |
| `code-quality-analyzer` (mode: silent-failures) | Errores silenciados, fallbacks peligrosos | Tras fusionar un fix crítico, auditorías de robustez |
| `code-quality-analyzer` (mode: types) | Encapsulación, invariantes, uniones discriminadas | Refactors de modelo de dominio, diseño de APIs internas |
| `code-quality-analyzer` (mode: tests) | Calidad de cobertura de tests, cobertura conductual | Antes de aprobar un PR |
| `performance-optimizer` | Perfilado, fugas de memoria, rendimiento de render, bundle | Quejas de latencia, pre-release, frame drops |

### Revisores por stack (OBLIGATORIOS cuando el stack coincide)

| Stack | Agente | Se dispara con |
|-------|--------|----------------|
| TypeScript/JS | `typescript-reviewer` | cambios en `.ts`/`.tsx`/`.js` |
| React | `react-reviewer` | cambios en `.tsx`/`.jsx`, hooks, boundaries de Next.js |
| Vue | `vue-reviewer` | Vue 3 / Nuxt 3 (Composition API, SFC, reactivity) |
| Svelte | `svelte-reviewer` | Svelte 5 / SvelteKit (runes, `+page.server.ts`, form actions) |
| Python | `python-reviewer` | cambios en `.py` |
| Django | `django-reviewer` | apps Django (ORM, DRF, migraciones) |
| FastAPI | `fastapi-reviewer` | apps FastAPI (async, Pydantic, DI) |
| Go | `go-reviewer` | cambios en `.go` |
| Rust | `rust-reviewer` | cambios en `.rs`, borrow checker, `unsafe` |
| Java | `java-reviewer` | Java + Spring Boot o Quarkus |
| Kotlin | `kotlin-reviewer` | Kotlin / Android / Compose |
| Swift | `swift-reviewer` | Swift / iOS / SwiftUI |
| C# | `csharp-reviewer` | cambios en .NET |
| C++ | `cpp-reviewer` | cambios en C++, templates, RAII |
| PHP | `php-reviewer` | PHP, Laravel/Symfony |
| Flutter | `flutter-reviewer` | widgets Dart/Flutter, gestión de estado |
| Base de datos | `database-reviewer` | SQL, migraciones, diseño de schema |
| ML/MLOps | `mle-reviewer` | entrenamiento, inferencia, feature store |

## "Quiero arreglar un error de build / tipos"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `build-error-resolver` | Errores genéricos de TS/build, diff mínimo | `tsc` o `npm run build` falla |
| `cpp-build-resolver` | C++ / CMake / linker | build de C++ falla |
| `dart-build-resolver` | `dart analyze`, pub, build_runner | build de Flutter falla |
| `django-build-resolver` | pip, migraciones, `manage.py` | Django no arranca |
| `go-build-resolver` | `go build`, `go vet` | build de Go falla |
| `java-build-resolver` | Maven/Gradle, Spring/Quarkus | build de Java falla |
| `kotlin-build-resolver` | Kotlin/Gradle, KSP, KAPT | build de Kotlin falla |
| `pytorch-build-resolver` | Formas de tensor, device, grad, DataLoader | entrenamiento/inferencia de PyTorch crashea |
| `react-build-resolver` | Vite/webpack/Next.js/JSX/hidratación | build de React falla |
| `rust-build-resolver` | `cargo build`, borrow checker | build de Rust falla |
| `swift-build-resolver` | Xcode, SPM, code signing | build de Xcode falla |

## "Quiero testear"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `tdd-guide` | ROJO→VERDE→REFACTOR, cobertura 80%+ | **PROACTIVAMENTE** en features nuevas, fix de bugs o refactors |
| `e2e-runner` | Playwright/Vercel Agent Browser E2E | Flujos críticos de usuario, pre-release |

## "Quiero revisar infra (IaC / K8s)"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `iac-reviewer` | Terraform / OpenTofu / Pulumi / CloudFormation / CDK / Ansible. Caza 0.0.0.0/0 en sensitive ports, IAM wildcards, state en bucket público, secrets hardcoded, missing encryption, módulos sin version pin | Cambios en `.tf`/`.tfvars`/`.yaml`/`.yml`/Pulumi program/CDK app |
| `k8s-reviewer` | Kubernetes / Helm / Kustomize. Caza `privileged: true`, host namespaces, root sin justificación, capabilities.ALL, secrets en ConfigMap, image `:latest` + `Always`, sin `resources.requests/limits`, sin NetworkPolicy, automounted SA tokens | Cambios en manifests, charts, overlays, `kustomization.yaml` |

## "Quiero entender el codebase"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `code-explorer` | Traza paths de ejecución, mapea capas, documenta dependencias | Onboarding en un repo nuevo, antes de un cambio grande |
| `docs-lookup` | Recupera docs actualizadas de librerías vía Context7 | Cuando necesitas referencia actual de la API, no datos de entrenamiento |

## "Quiero mantener / limpiar"

| Agente | Qué hace | Cuándo usarlo |
|--------|----------|---------------|
| `code-quality-analyzer` | Código muerto, duplicados (knip/depcheck/ts-prune) | Mantenimiento periódico, pre-release |
| `doc-updater` | Codemaps, `/update-codemaps`, `/update-docs` | Tras cambios estructurales |
| `code-quality-analyzer` (mode: simplify) | Claridad, consistencia, sin cambio de comportamiento | Tras un PR pero antes del merge |
| `harness-optimizer` | Ajusta la configuración local del harness de agentes | Cuando el ruteo o los permisos se sienten mal |
| `loop-operator` | Monitorea bucles autónomos de agentes, abort seguro | Cuando corres agentes de noche |
