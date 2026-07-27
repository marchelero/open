# 03 — React + Vite + TypeScript

Minimal React app used to demo the opencode starter pack. Loads a list of users, renders them, has 3 component tests. The point is **not** the app — it's the pack workflow around it.

## What this demos

| Pack feature | Try it |
|---|---|
| `tdd-guide` (ROJO→VERDE→REFACTOR) | Add a `<SearchBox />` filter with TDD |
| `react-reviewer` | Run `/code-review` on a change |
| `frontend-patterns` skill | Load when reviewing component composition, hooks, render perf |
| `code-quality-analyzer` (mode: `simplify`) | Run `/simplify` after the change |
| `a11y-architect` | Run on a new form or interactive component |
| `/quick-prd` | `/quick-prd "add a search input that filters users by name"` |
| `/verify` | After the change, run `/verify` |
| `/flow-bugfix` | Plant a bug, run `/flow-bugfix "search input crashes on empty string"` |

## Stack

- **Node**: >= 20
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Tests**: Vitest + Testing Library + jsdom
- **No backend**: mock data in `src/api.ts` keeps the demo dependency-light

## Run it

```bash
# Install
npm install
# or: pnpm install / yarn / bun install

# Type check
npm run lint

# Tests (3 component tests, all green out of the box)
npm test

# Dev server
npm run dev
# → http://localhost:5173/
```

## Files

```
03-react-app/
├── README.md             # this file
├── package.json          # react + vite + vitest + testing-library
├── tsconfig.json         # strict TS, react-jsx
├── tsconfig.node.json    # for vite.config.ts
├── vite.config.ts        # vite + vitest config
├── index.html
├── .env.example          # VITE_API_URL
├── .gitignore
└── src/
    ├── main.tsx          # entry: createRoot + StrictMode
    ├── App.tsx           # useEffect + fetchUsers + render
    ├── api.ts            # mock API client
    ├── test-setup.ts     # @testing-library/jest-dom setup
    └── components/
        ├── UserList.tsx
        └── UserList.test.tsx  # 3 tests
```

## Suggested exercises (5-15 min each)

1. **TDD add a feature**: `/quick-prd "add a search input that filters users by name"`. Implement with tdd-guide. The test should drive: state, input change handler, filter logic, render.
2. **Review the change**: `/code-review` on the diff. Should approve (or warn on minor items).
3. **A11y check**: add an `<input>` for the search. Run `a11y-architect` on the new component. Should flag missing `<label>`, missing `aria-*` attributes, focus management.
4. **Plant a bug**: in `App.tsx`, change the `useEffect` to not return the cleanup function. Run `/flow-bugfix "users list flickers on fast re-renders"`. Watch the bug get reproduced, fixed, verified.
5. **Render perf**: add a 10,000-item list. Run `performance-optimizer` on it. Should flag missing `React.memo`, missing list virtualization, expensive inline lambdas in render.
6. **Hook correctness**: write a custom hook `useDebouncedValue`. Run `react-reviewer`. Should check deps array, cleanup, stale closures.

## Pair with

- `examples/01-node-api` — same pack workflow, Node + TypeScript backend
- `examples/02-python-data` — same pack workflow, Python + FastAPI backend

## Cleanup

After grokking the demo, delete the whole `03-react-app/` dir. The pack itself doesn't need it.
