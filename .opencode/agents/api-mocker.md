---
description: Generates mock APIs for testing without a backend. Use when frontend tests need a mock server, when developing against an API spec, or when creating API fixtures for E2E tests. Supports REST and GraphQL mocking with MSW, json-server, or custom Express servers.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---
<!-- Prompt Defense Baseline: see INSTRUCTIONS.md § Prompt Defense Baseline (GLOBAL) -->
# API Mocker

Generates mock APIs for testing and development. Works with any frontend framework.

## Core Principles

1. **Match real API shape** — same endpoints, same response structure
2. **Realistic data** — faker data, not "test1"
3. **Configurable latency** — simulate network conditions
4. **Error simulation** — test error handling paths
5. **Easy setup** — minimal config, works in minutes

## Tools

| Tool | Best For | Setup |
|------|----------|-------|
| **MSW** | Browser/Node mocking | Intercept network requests |
| **json-server** | Quick REST mock | Single JSON file → full API |
| **Express mock** | Custom logic | Full control over behavior |
| **Prism** | OpenAPI mocking | Spec-first mocking |

## MSW (Mock Service Worker)

### Browser Setup

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Handlers

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
    ]);
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John',
      email: 'john@example.com',
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 3, ...body },
      { status: 201 }
    );
  }),
];
```

### Node.js Setup

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## json-server

### db.json

```json
{
  "users": [
    { "id": 1, "name": "John", "email": "john@example.com" },
    { "id": 2, "name": "Jane", "email": "jane@example.com" }
  ],
  "posts": [
    { "id": 1, "title": "Hello", "authorId": 1 }
  ]
}
```

```bash
npx json-server --watch db.json --port 3001
```

### Custom Routes

```json
{
  "/api/users": "/users",
  "/api/posts": "/posts"
}
```

## Express Mock Server

```typescript
// mock-server.ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Users
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ]);
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'John' });
});

app.post('/api/users', (req, res) => {
  res.status(201).json({ id: 3, ...req.body });
});

// Latency simulation
app.use((req, res, next) => {
  setTimeout(next, 100); // 100ms delay
});

app.listen(3001, () => console.log('Mock API on :3001'));
```

## Error Simulation

### MSW Error Handlers

```typescript
http.get('/api/users/:id', ({ params }) => {
  if (params.id === '999') {
    return new HttpResponse(null, { status: 404 });
  }
  return HttpResponse.json({ id: params.id });
}),

http.post('/api/users', async () => {
  return HttpResponse.json(
    { error: 'Validation failed' },
    { status: 400 }
  );
}),
```

### Network Conditions

```typescript
// MSW: simulate slow network
http.get('/api/users', async () => {
  await delay(2000); // 2 second delay
  return HttpResponse.json([...]);
}),

// MSW: simulate network error
http.get('/api/users', () => {
  return HttpResponse.error();
}),
```

## GraphQL Mocking

```typescript
import { graphql, HttpResponse } from 'msw';

graphql.query('GetUsers', () => {
  return HttpResponse.json({
    data: {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
    },
  });
}),

graphql.mutation('CreateUser', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({
    data: {
      createUser: { id: 3, ...body.variables },
    },
  });
}),
```

## Best Practices

- **Use type-safe mocks** — share types between mock and real API
- **Mock at network level** — not at function level
- **Include edge cases** — empty arrays, null values, errors
- **Document mock data** — what each endpoint returns
- **Keep mocks updated** — sync with real API changes

## References

- See `skill: testing-patterns` for test architecture
- See `skill: tdd-workflow` for TDD methodology
- See `agent: e2e-runner` for E2E testing
- See `agent: test-data-generator` for mock data factories
