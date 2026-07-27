# 01 — Node + TypeScript + Fastify API

Minimal REST API used to demo the opencode starter pack. Single endpoint (`/users/:id`) with in-memory storage. The point is **not** the app — it's the pack workflow around it.

## What this demos

| Pack feature | Try it |
|---|---|
| `tdd-guide` (ROJO→VERDE→REFACTOR) | Add a `POST /users` endpoint with TDD |
| `typescript-reviewer` | Run `/code-review` on a change |
| `code-quality-analyzer` (mode: `simplify`) | Run `/simplify` after the change |
| `/quick-prd` | `/quick-prd "add /users POST endpoint with email validation"` |
| `/verify` | After the change, run `/verify` |
| `/flow-bugfix` | Plant a bug, run `/flow-bugfix "users POST accepts invalid email"` |
| Security basics | All inputs validated, no secrets in code, env vars only |

## Stack

- **Node**: >= 20
- **Language**: TypeScript (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Framework**: Fastify 4
- **Test runner**: `node:test` (built-in, zero deps)
- **No database**: in-memory `Map` keeps the demo dependency-light

## Run it

```bash
# Install
npm install
# or: pnpm install / yarn / bun install

# Type check
npm run lint

# Run tests (4 tests, all green out of the box)
npm test

# Dev server
npm run dev
# → GET http://localhost:3000/
# → GET http://localhost:3000/users
# → GET http://localhost:3000/users/u_1
```

## Files

```
01-node-api/
├── README.md           # this file
├── package.json        # fastify + tsx + typescript only
├── tsconfig.json       # strict TS config
├── .env.example        # PORT, HOST, NODE_ENV
├── .gitignore
├── src/
│   ├── index.ts        # entry: build + listen
│   ├── app.ts          # Fastify app factory (testable)
│   └── users.ts        # in-memory store + routes
└── test/
    └── users.test.ts   # 4 integration tests via app.inject()
```

## Suggested exercises (5-15 min each)

1. **TDD add a feature**: `/quick-prd "add POST /users that creates a user with name and email"`. Implement with tdd-guide. Verify the new test goes red→green.
2. **Review the change**: `/code-review` on the diff. Should approve (no CRITICAL/HIGH).
3. **Add validation**: extend the POST to reject missing email or invalid format. Use Zod or a hand-rolled validator.
4. **Plant a bug**: in `users.ts`, change `users.get(request.params.id)` to always return `undefined`. Run `/flow-bugfix "GET /users/:id always returns 404"`. Watch the bug get reproduced, fixed, verified.
5. **Security audit**: write a `POST /users` that takes `name` and `email` from JSON body. Run `security-reviewer` on it. Should flag missing input validation, missing auth, and rate limiting (if you make the endpoint public).

## Pair with

- `examples/02-python-data` — same pack workflow, Python + FastAPI stack
- `examples/03-react-app` — same pack workflow, React + Vite stack

## Cleanup

After grokking the demo, delete the whole `01-node-api/` dir. The pack itself doesn't need it.
