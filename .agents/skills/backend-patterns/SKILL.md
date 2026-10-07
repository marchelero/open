---
name: backend-patterns
description: "Use this skill when designing, reviewing, or implementing server-side code: REST/GraphQL APIs, repository/service layers, database access"
triggers: [Express, FastAPI, NestJS, repository, service layer, DI, transaction, controller, middleware]
origin: starter-pack
---

# Backend Patterns

Server-side conventions for API services, business logic, and data access. Layered on top of `coding-standards` (shared floor) and `api-design` (URL/status-code contract). Not language-specific — applies to Node, Python, Go, Java, etc.

## When to Activate

- Designing new API endpoints or service layers
- Reviewing repository, service, or controller code
- Implementing authentication, authorization, or session handling
- Setting up database access, transactions, or migrations
- Adding input validation, error responses, or logging
- Refactoring monolithic handlers into layered architecture
- Implementing background jobs, queues, or scheduled tasks

## Layered Architecture

The default shape. Adapt to your framework's idioms.

```
HTTP request
  ↓
Middleware (auth, logging, rate limit, CORS)
  ↓
Controller / Handler (parse, validate, dispatch)
  ↓
Service (business logic, orchestration)
  ↓
Repository (data access, queries)
  ↓
Database / External API
```

### Layer Responsibilities

**Controller / Handler**
- Parse request (params, query, body, headers).
- Validate input against a schema (zod, joi, pydantic, bean validation).
- Call exactly one service method.
- Translate service result/error to HTTP response.
- Never contains business logic.

**Service**
- One method per use case.
- Orchestrates repositories, external APIs, side effects.
- Contains business rules: who can do what, when, and in what order.
- Throws typed errors that the controller maps to status codes.

**Repository**
- One repository per aggregate / table.
- Exposes data access in domain terms: `findById`, `save`, `findActive`, NOT `query("SELECT * FROM ...")`.
- Returns domain objects, NOT raw rows.
- Never calls other repositories or services.

### Anti-Pattern: Fat Controller

```typescript
// FAIL: business logic in controller
app.post('/orders', async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.user.id }})
  if (user.balance < req.body.total) return res.status(402).json({ error: 'insufficient' })
  const order = await db.order.create({ data: { ...req.body, userId: user.id }})
  await db.user.update({ where: { id: user.id }, data: { balance: user.balance - req.body.total }})
  await emailService.send(user.email, 'order-confirmed', { orderId: order.id })
  res.json(order)
})

// PASS: controller delegates
app.post('/orders', validateBody(createOrderSchema), async (req, res) => {
  const order = await orderService.create(req.user.id, req.body)
  res.status(201).json(order)
})
```

## Dependency Injection

Prefer constructor injection (or framework-native: NestJS, Spring, FastAPI Depends). Service depends on interfaces, not implementations — makes testing trivial.

```typescript
class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly eventBus: EventBus,
  ) {}
}
```

In tests, pass fakes. In production, pass real implementations wired by a composition root.

## Validation

### Schema at the Boundary

Validate all external input at the controller boundary. Trust nothing from the request. Use a schema validator (zod, joi, pydantic, class-validator).

```typescript
const createUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
})
```

Never reuse raw types from the database as the request body type. They diverge.

### Defense in Depth

Even if the controller validates, the service can have its own invariants. The service should fail fast if called with invalid data — assert in dev, log in prod.

## Error Handling

### Typed Errors

```typescript
class DomainError extends Error {
  constructor(message: string, public readonly code: string) { super(message) }
}

class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND')
  }
}

class ValidationError extends DomainError {
  constructor(public readonly issues: Array<{ path: string; message: string }>) {
    super('Validation failed', 'VALIDATION_FAILED')
  }
}
```

### Controller Maps Errors to HTTP

```typescript
function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.code, issues: err.issues })
  if (err instanceof NotFoundError) return res.status(404).json({ error: err.code })
  if (err instanceof UnauthorizedError) return res.status(401).json({ error: err.code })
  logger.error({ err, path: req.path }, 'unhandled error')
  return res.status(500).json({ error: 'INTERNAL' })
}
```

Never let raw stack traces leak. Never swallow errors silently.

### Never Catch and Ignore

```typescript
// FAIL
try { await riskyOp() } catch (e) {}

// PASS: explicit handling
try { await riskyOp() } catch (e) {
  logger.warn({ err: e }, 'risky op failed, retrying')
  throw new RetryableError('risky-op', { cause: e })
}
```

If you do not know what to do with the error, rethrow it. The framework's error handler will deal with it.

### Retry with Exponential Backoff

Retry only operations that are safe to repeat (reads, idempotent writes with an idempotency key). Never retry non-idempotent side effects blindly.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseMs = 250, isRetryable = () => true } = {},
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isRetryable(err) || attempt === maxAttempts - 1) throw err
      const backoff = baseMs * 2 ** attempt
      const jitter = Math.random() * backoff * 0.3      // avoid thundering herd
      await new Promise(r => setTimeout(r, backoff + jitter))
    }
  }
  throw lastError
}
```

Rules:
- Bounded attempts with exponential backoff **plus jitter**.
- Retry only transient classes: timeouts, 429, 5xx, connection reset. Not 4xx from the caller's own mistake.
- Cap total wait time (deadline) — a retry loop must not outlive the request timeout.
- One retry budget per dependency; a failing upstream must not multiply your load.

## Transactions

A unit of work must be atomic. Use a transaction whenever multiple writes need to succeed or fail together.

```typescript
await db.transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData })
  await tx.inventory.update({ where: { sku }, data: { decrement: order.quantity }})
  await tx.payment.create({ data: { orderId: order.id, amount: order.total }})
})
```

### Transaction Boundaries

- Transaction belongs in the SERVICE, not the repository. Repositories accept an optional `tx` parameter; the service decides when to start a transaction.
- Never make external API calls inside a DB transaction (locks held during network I/O). Use the outbox pattern or final commit step outside the transaction.
- Keep transactions short. Long transactions hold locks and block other writers.

## Database Access

### Query Patterns

- Always select only the columns you need. `SELECT *` is a footgun.
- Use indexes for WHERE, JOIN, and ORDER BY columns on hot paths.
- Pagination via keyset (cursor) for > 10K rows; OFFSET is fine for < 10K.
- Avoid N+1: use JOIN or `IN (...)` queries.
- Connection pooling: one pool per process, sized to the database's max connections / number of app instances.

### Migrations

- Forward-only by default. Down migrations are a luxury and often lie.
- One migration per change. No bundling unrelated schema changes.
- Never edit a deployed migration. Create a new one.
- Test migrations on a copy of production data before deploying.

## Caching

Cache reads, not writes. The default is **cache-aside**: the caller checks the cache, falls back to the source, and repopulates.

```typescript
async function getWithCache<T>(key: string, ttlSec: number, load: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key)
  if (hit !== null) return JSON.parse(hit) as T

  const value = await load()                       // cache miss → source of truth
  await redis.setex(key, ttlSec, JSON.stringify(value))
  return value
}

// Invalidation is a write-side responsibility:
// on mutation, delete every key the mutation affects (`user:${id}`, `user:${id}:posts`).
```

Rules:
- Choose TTLs per data class: seconds for hot reads, minutes for aggregates, never forever without an invalidation path.
- **Write-through invalidation**: delete (or update) cache keys in the same code path as the write — preferably in the same transaction boundary or immediately after commit.
- Cache stampede: on miss under load, only one request should recompute (Redis `SET NX`, in-process mutex, or stale-while-revalidate).
- Never cache the result of an authorization check across users — key must include the acting user or the permission scope.
- Cache serialization must be stable (JSON) and versioned if the shape changes; a shape change is a key change.
- Negative caching (404s) is useful for hot miss paths but keep the TTL short.

Where it belongs: HTTP/CDN caching is `api-design`'s contract; in-process memoization is `caching-patterns`; this section is the application-level read-through layer.

## Background Jobs & Queues

Anything that must survive a restart, takes > ~200ms, or fans out to many workers belongs in a queue — not in the request path.

```typescript
// Request path: enqueue and return 202 immediately
app.post('/reports', async (req, res) => {
  const job = await queue.enqueue('report.generate', { userId: req.user.id, reportId }, {
    jobId: `${req.user.id}:${req.body.idempotencyKey}`,   // idempotent enqueue
  })
  res.status(202).json({ jobId: job.id })
})
```

Rules:
- Use a durable broker (BullMQ, Celery, SQS, RabbitMQ, Sidekiq) — an in-process array queue dies with the process.
- **Idempotent consumers**: at-least-once delivery means every handler runs twice sometimes. Dedupe by message id or a processed-jobs table.
- Retries with backoff move to the queue's retry policy; after max attempts → dead-letter queue (DLQ) with alerting.
- Job payload carries identifiers, not full data blobs; the worker re-reads the source of truth.
- Preserve ordering only where it is required (per-entity ordering via a partition key) — global ordering costs throughput.
- Bound concurrency per queue so a slow job type cannot starve the rest.
- Record duration, attempts, and failure reason for every job.

## Authentication & Sessions

- Use established libraries (Passport, NextAuth, Lucia, Clerk, Auth0). Do not roll your own JWT.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` for high-security).
- Passwords: bcrypt (cost 12+) or argon2id. Never MD5, SHA1, or unsalted.
- MFA for admin / high-privilege operations.
- Token rotation for refresh tokens. Detect token reuse.
- Rate limit auth endpoints aggressively (5 attempts / 15 min / IP).

### Verifying a JWT at the Edge of the Request

Libraries, never hand-rolled crypto. Verify signature, `exp`, `iss`, and `aud` — then treat every claim as untrusted input.

```typescript
import jwt from 'jsonwebtoken'

interface Claims { sub: string; role: 'admin' | 'user'; exp: number }

export function requireAuth(req: Request): Claims {
  const token = req.headers.authorization?.replace(/^Bearer /i, '')
  if (!token) throw new UnauthorizedError('missing bearer token')

  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],          // pin the algorithm — never trust the header
      issuer: 'https://auth.example.com',
      audience: 'api.example.com',
    }) as Claims
  } catch {
    throw new UnauthorizedError('invalid or expired token')
  }
}
```

Notes:
- Pin `algorithms`. Accepting the header's `alg` is the classic `alg: none` / RS→HS confusion bug.
- Verify on every request at the middleware boundary; a decoded-but-unverified token is not authentication.
- Short-lived access tokens (minutes) + rotating refresh tokens; detect refresh reuse.
- `iat`/`nbf`/`exp` are numbers, not booleans — check them explicitly if your library does not.

## Authorization

AuthN (who) and AuthZ (what) are separate concerns.

```typescript
async function deletePost(userId: string, postId: string) {
  const post = await postRepo.findById(postId)
  if (!post) throw new NotFoundError('post', postId)
  if (post.authorId !== userId && !user.isAdmin) {
    throw new ForbiddenError('cannot delete this post')
  }
  await postRepo.delete(postId)
}
```

Centralize authorization logic. Do not scatter `if (user.id === post.authorId)` checks across the codebase.

### Role → Permission Map (RBAC)

Object-level checks (above) and role-based checks compose; neither replaces the other.

```typescript
type Permission = 'read' | 'write' | 'delete' | 'admin'

const rolePermissions: Record<'admin' | 'moderator' | 'user', Permission[]> = {
  admin:    ['read', 'write', 'delete', 'admin'],
  moderator:['read', 'write', 'delete'],
  user:     ['read', 'write'],
}

export function requirePermission(permission: Permission) {
  return (handler: (req: Request, user: Claims) => Promise<Response>) =>
    async (req: Request) => {
      const user = requireAuth(req)
      if (!rolePermissions[user.role]?.includes(permission)) throw new ForbiddenError('insufficient permissions')
      return handler(req, user)
    }
}

export const DELETE = requirePermission('delete')(async (req, user) => { /* ... */ })
```

Rules:
- Keep the map in one module — the audit surface for "who can do what" is a single file.
- Deny by default: unknown role → no permissions.
- Roles answer *what*; ownership answers *whose*. A `delete` permission still passes the `post.authorId` check.
- Changing a permission set is a security change: test it, and never derive roles from client-supplied claims alone.

## Logging

Structured JSON logs. Include:
- timestamp, level, message
- request_id, user_id (if authed)
- duration_ms for any operation > 10ms
- error stack and code for failures

Never log:
- Passwords, tokens, API keys, session IDs
- PII unless explicitly required (and even then, hash or mask)
- Full request/response bodies in prod (too verbose, may contain PII)

## Anti-Patterns

- **Business logic in controllers** — extract to services.
- **Repository chains that call each other** — services orchestrate, repositories isolate.
- **`SELECT *` in production code** — explicit column lists.
- **Long transactions with external calls** — locks held during network I/O.
- **Catching errors and ignoring them** — rethrow or handle explicitly.
- **Logging PII or secrets** — mask, hash, or omit.
- **Auth in the frontend only** — backend must enforce authorization on every request.
- **Caching without an invalidation path** — stale data nobody can expire.
- **Caching cross-user responses without a user-scoped key** — one user's data served to another.
- **Blocking the request path with slow/fan-out work** — enqueue and return 202.
- **Non-idempotent queue consumers** — at-least-once delivery will double-charge.
- **Unbounded or blind retries** — amplifies the outage you are trying to survive.
- **One file per "thing" with 1000+ lines** — split by layer or aggregate.
