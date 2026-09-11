---
name: monorepo-patterns
description: Use when working with monorepos using Turborepo, Nx, pnpm workspaces, Lerna, or npm workspaces. Covers workspace structure, dependency management, task orchestration, caching, shared packages, and build optimization for multi-package repositories.
---

# Monorepo Patterns Skill

Workspace management for Turborepo, Nx, pnpm, Lerna, npm.

## Core Principles

1. **Shared code via packages** — not copy-paste between apps
2. **Explicit dependencies** — declare what you use, deduplicate at root
3. **Task orchestration** — build order based on dependency graph
4. **Caching** — cache builds, tests, lints to avoid redundant work
5. **Selective publishing** — only publish packages that changed

## Tool Selection

| Tool | Best For | Key Feature |
|------|----------|-------------|
| **Turborepo** | Any stack, simplicity | Caching, task orchestration |
| **Nx** | Large teams, Angular/React | Affected commands, generators |
| **pnpm workspaces** | Minimal setup, strict deps | Disk efficiency, strict mode |
| **npm workspaces** | Simple projects | Built-in with npm 7+ |
| **Lerna** | Publishing packages | Version management |

## Turborepo

### Structure

```
├── turbo.json
├── package.json
├── apps/
│   ├── web/          # Next.js app
│   └── api/          # Express app
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared ESLint/TS configs
│   └── utils/        # Shared utilities
```

### turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Commands

```bash
turbo run build                  # Build all packages
turbo run build --filter=web     # Build web + its dependencies
turbo run test --filter='./packages/*'  # Test all packages
turbo run build --dry            # Preview what would run
```

## Nx

### Structure

```
├── nx.json
├── workspace.json
├── apps/
│   └── web/
├── libs/
│   ├── shared/
│   │   └── ui/
│   └── feature/
```

### Commands

```bash
npx nx run web:build              # Build specific app
npx nx run-many --target=build --all   # Build everything
npx nx affected --target=build    # Build only affected by changes
npx nx graph                     # Visualize dependency graph
```

### generators.json

```json
{
  "generators": {
    "library": {
      "factory": "./libs/shared/ui/generators/library/schema.json",
      "description": "Create a shared library"
    }
  }
}
```

## pnpm Workspaces

### package.json (root)

```json
{
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Commands

```bash
pnpm -r run build                # Run build in all packages
pnpm --filter web build          # Build only web
pnpm --filter './packages/**' test  # Test all packages
pnpm list --depth 0              # List workspace dependencies
```

## npm Workspaces

### package.json (root)

```json
{
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "build:web": "npm run build -w apps/web"
  }
}
```

## Shared Package Patterns

### Shared Config Package

```
packages/
  config/
    package.json
    eslint.js          # Shared ESLint config
    tsconfig.base.json # Shared TypeScript config
```

### Shared UI Package

```
packages/
  ui/
    package.json
    src/
      Button.tsx
      Input.tsx
      index.ts
```

### Consuming Shared Packages

```json
{
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/config": "workspace:*"
  }
}
```

## Caching

### Turborepo Remote Cache

```bash
turbo login                       # Authenticate
turbo run build                   # Local + remote cache
```

### Nx Cloud

```bash
npx nx connect-to-nx-cloud        # Connect
npx nx run-many --target=build    # Cached builds
```

## Dependency Management

### Root-Level Dependencies

- Dev tools: eslint, prettier, typescript, jest
- Build tools: turbo, nx, lerna
- No runtime dependencies at root

### Package-Level Dependencies

- Runtime dependencies for that package only
- Shared deps via workspace protocol: `"dep": "workspace:*"`
- Peer deps for optional integrations

### Deduplication

```bash
pnpm dedupe                       # pnpm
npx npm-dedupe                    # npm
```

## Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Circular dependencies between packages | Extract shared code to a third package |
| Every app depends on every package | Only depend on what you use |
| Version pinning each package independently | Use workspace protocol |
| No task caching | Enable Turborepo/Nx caching |
| Publishing all packages on any change | Use affected/changed detection |

## References

- See `skill: coding-standards` for naming conventions
- See `skill: backend-patterns` for API patterns
- See `skill: frontend-patterns` for React patterns
