---
name: observability
description: Use this skill when adding logging, metrics, tracing, health checks, error tracking, or graceful shutdown to any service. Covers structured logging, OpenTelemetry, prom-client, Sentry SDK, liveness vs readiness probes, and SIGTERM handling across Node/TypeScript, Python, and Go.
triggers: [log, logger, pino, winston, structlog, logrus, zap, observability, tracing, OTel, OpenTelemetry, metrics, prometheus, prom-client, Sentry, health check, /health, /ready, liveness, readiness, graceful shutdown, SIGTERM, error tracking, monitoring, alerting]
origin: starter-pack
---

# Observability Patterns

Production-grade observability: structured logs, traces, metrics, and error tracking. Plus the operational endpoints (health checks) and lifecycle handling (graceful shutdown) that make a service deployable in Kubernetes, ECS, or any orchestrator.

This skill covers **patterns and recipes**. For security pitfalls around logging (PII leaks, secret redaction), see the `security-review` skill. For error-handling patterns (when to throw, retry strategies), see the `error-handling` skill.

## When to Activate

- Adding or modifying logging in any service
- Integrating OpenTelemetry / Datadog / Honeycomb / Jaeger
- Adding Prometheus metrics, custom counters, or histograms
- Wiring Sentry, Rollbar, Bugsnag, or another error tracker
- Adding health check endpoints (`/health`, `/ready`, `/livez`, `/readyz`)
- Implementing graceful shutdown on SIGTERM (Kubernetes rollouts, ECS deployments)
- Designing a service for horizontal scaling (need metrics, traces)
- Setting up alerting on error rate, latency, saturation
- Auditing an existing service for observability gaps

## Do Not Activate For

- Pure frontend client-side logging (use the framework's logger directly)
- One-off scripts that run and exit (no observability needed)
- Frontend analytics (Google Analytics, Mixpanel) — different concern
- Crash reporting on mobile (Sentry Mobile SDK has its own patterns)

## Core Principles

1. **Structured logs, not strings.** JSON or key-value. Never `console.log("user " + id + " did X")`. Always `logger.info({ userId: id, action: "X" })`.
2. **Logs are for humans, metrics are for machines, traces are for causality.** Use each for what it's good at. Don't try to make logs do metrics' job by counting in a log query.
3. **Sample aggressively, never completely.** 100% of errors, 1% of success, 10% of slow requests. Sample rates are configurable per environment.
4. **PII redaction at the source.** Never log emails, tokens, passwords, full credit cards, raw IP addresses. Redact at the log call, not in a downstream filter.
5. **Correlation ID everywhere.** Every request gets an ID, propagated through logs, traces, and outbound HTTP calls.
6. **Health checks have a purpose.** Liveness = "process alive, restart if not". Readiness = "ready to serve traffic, remove from LB if not". They are different.

## Structured Logging

### Node.js / TypeScript — Pino (recommended)

```typescript
import pino from "pino"

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "user-api", env: process.env.NODE_ENV },
  // Redact PII at the source
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token", "*.email"],
    censor: "[REDACTED]"
  },
  // ISO timestamps for log shippers
  timestamp: pino.stdTimeFunctions.isoTime
})

// Usage
logger.info({ userId, action: "login" }, "user logged in")
logger.warn({ err, requestId }, "request failed validation")
```

**Why Pino over Winston**: 5x faster, lower allocation, async by default, structured by default. Winston is fine if you need heavy transport customization.

### Python — structlog

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,  # request-scoped context
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

log = structlog.get_logger()

# Usage
log.info("user_login", user_id=user_id, ip=request.client.host)
log.warning("validation_failed", error=str(e), request_id=request_id)
```

### Go — slog (stdlib, Go 1.21+) or zap

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
slog.SetDefault(logger.With("service", "user-api", "env", env))

// Usage
slog.Info("user login", "user_id", id)
slog.Warn("validation failed", "error", err, "request_id", reqID)
```

For Go <1.21, use `zap` (Uber) — fast structured logger.

## Correlation ID

### Express middleware

```typescript
import { v4 as uuid } from "uuid"

app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] as string || uuid()
  res.setHeader("x-request-id", req.id)
  next()
})
```

### FastAPI middleware

```python
from fastapi import Request
import uuid

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    structlog.contextvars.bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response
```

### Outbound HTTP calls (propagate the ID)

```typescript
import { trace } from "@opentelemetry/api"

const span = trace.getActiveSpan()
const headers: Record<string, string> = { "x-request-id": req.id }
if (span) {
  headers["traceparent"] = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`
}
await fetch("https://other-service/...", { headers })
```

## OpenTelemetry Tracing

### Node.js setup

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces"
  }),
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start()
process.on("SIGTERM", () => sdk.shutdown().then(() => process.exit(0)))
```

### Python setup

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(
    endpoint=os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318/v1/traces")
))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
```

### Manual spans (use sparingly — auto-instrumentation covers 90%)

```typescript
import { trace, SpanStatusCode } from "@opentelemetry/api"

const tracer = trace.getTracer("user-api")

export async function processOrder(orderId: string) {
  return tracer.startActiveSpan("processOrder", async (span) => {
    span.setAttribute("order.id", orderId)
    try {
      const result = await doWork(orderId)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (err) {
      span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
      throw err
    } finally {
      span.end()
    }
  })
}
```

## Prometheus Metrics

### prom-client (Node.js)

```typescript
import promClient from "prom-client"

promClient.collectDefaultMetrics({ prefix: "user_api_" })

export const httpRequestDuration = new promClient.Histogram({
  name: "user_api_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
})

export const ordersProcessed = new promClient.Counter({
  name: "user_api_orders_processed_total",
  help: "Total orders processed",
  labelNames: ["status"]  // success | error
})

// Expose /metrics
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", promClient.register.contentType)
  res.send(await promClient.register.metrics())
})
```

### Histogram vs Counter vs Gauge

| Type | Use case | Example |
|------|----------|---------|
| Counter | Monotonic increment | requests total, errors total, bytes sent |
| Gauge | Value that goes up and down | active connections, queue depth, memory used |
| Histogram | Distribution of values | request duration, response size |
| Summary | Similar to histogram, but client-side quantiles | (prefer histogram in most cases) |

### RED method (per service)

- **R**ate — `requests_total` per second
- **E**rrors — `requests_total{status="5xx"}` per second
- **D**uration — `request_duration_seconds` histogram

These three are the minimum for any production service. Add USE metrics (Utilization, Saturation, Errors) for resources.

## Health Checks

### Kubernetes: liveness vs readiness

```typescript
import { Router } from "express"

const router = Router()

// Liveness: am I alive? If not, restart me.
router.get("/livez", (_req, res) => {
  res.status(200).send("ok")
})

// Readiness: am I ready to serve traffic? If not, remove me from the LB.
router.get("/readyz", async (_req, res) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkCache(),
    checkDownstream()
  ])
  const failed = checks.filter(c => c.status === "rejected")
  if (failed.length > 0) {
    res.status(503).json({ ready: false, failed: failed.map(f => String(f.reason)) })
  } else {
    res.status(200).json({ ready: true })
  }
})
```

### Don't check downstream in liveness

Liveness failures trigger a restart. If the database is down, restarting your app 50 times won't help — it'll just thrash. Liveness should be a static "process is up" check. Put DB checks in **readiness**.

### Common health check anti-patterns

- **Synchronous DB ping in the request path of `/readyz`** → use a cached status (refresh in background every 5s).
- **Returning 200 with a JSON body of `{ healthy: false, ... }`** → return non-2xx. The orchestrator doesn't read the body.
- **Health check itself takes >1s** → load balancers time out, the pod is marked unhealthy, traffic stops. Cache the result.

## Graceful Shutdown

### Node.js / Express

```typescript
const server = app.listen(PORT, () => logger.info({ port: PORT }, "started"))

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, "shutting down")
  
  // 1. Stop accepting new requests
  server.close(() => logger.info("http server closed"))
  
  // 2. Mark readiness false immediately (k8s removes from LB)
  readyToServe = false
  
  // 3. Wait for in-flight requests (bounded)
  const timeout = setTimeout(() => {
    logger.error("forced exit after 30s")
    process.exit(1)
  }, 30_000)
  
  // 4. Close DB / cache / queue connections
  await Promise.allSettled([
    db.end(),
    redis.quit(),
    queue.close()
  ])
  
  clearTimeout(timeout)
  process.exit(0)
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
```

### Python / FastAPI

```python
import signal
import asyncio

class GracefulShutdown:
    def __init__(self):
        self.shutting_down = False
    
    def __call__(self, signum, frame):
        self.shutting_down = True

shutdown_handler = GracefulShutdown()
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

@app.get("/readyz")
async def readyz():
    if shutdown_handler.shutting_down:
        raise HTTPException(503, "shutting down")
    return {"ready": True}
```

### Kubernetes terminationGracePeriodSeconds

Default is 30s. If your shutdown takes >30s, the pod is SIGKILLed and in-flight requests drop. Set `terminationGracePeriodSeconds: 60` (or longer) for slow-cleanup services.

```yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 5"]  # give LB time to remove from rotation
```

The `preStop sleep` is a Kubernetes quirk — without it, the LB may still route to the pod for a few seconds after SIGTERM fires.

## Error Tracking (Sentry SDK)

### Node.js

```typescript
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.GIT_SHA,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Strip PII before sending
    if (event.user) delete event.user.ip_address
    return event
  }
})

// Capture exceptions
try {
  await riskyOperation()
} catch (err) {
  Sentry.captureException(err, {
    tags: { feature: "checkout" },
    user: { id: userId },
    extra: { orderId }
  })
  throw err
}
```

### Python

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENV"),
    release=os.getenv("GIT_SHA"),
    traces_sample_rate=0.1,
    integrations=[FastApiIntegration()]
)
```

### What to capture vs not

| Capture | Don't capture |
|---------|---------------|
| Unhandled exceptions | Expected errors (4xx HTTP) |
| Caught exceptions in critical paths | Validation errors |
| Background job failures | Health check failures (too noisy) |
| Third-party API errors with context | User input errors |
| Anything the user reports | — |

## Sampling Strategies

```typescript
// Sample rate by route
const sampleRate = (req: Request) => {
  if (req.path === "/health" || req.path === "/metrics") return 0
  if (req.path.startsWith("/api/checkout")) return 1.0  // critical path, 100%
  if (req.path.startsWith("/api/internal")) return 0.01
  return 0.1  // 10% of normal traffic
}
```

Always sample **100% of errors** and **100% of slow requests** (>p99). Sample success proportionally to traffic.

## PII Redaction Checklist

Before shipping, audit your log calls:

- [ ] No raw emails (redact to `user@example.com` or `***@***`)
- [ ] No raw IPs (redact last octet: `192.168.1.xxx`)
- [ ] No passwords, tokens, API keys, session IDs
- [ ] No credit card numbers (PCI DSS violation)
- [ ] No full names combined with other PII (GDPR)
- [ ] No phone numbers, addresses, government IDs
- [ ] Authorization headers redacted
- [ ] Cookies redacted
- [ ] Request bodies redacted by default (log IDs, not payloads)

## Production Checklist

Before declaring a service "production-ready":

- [ ] Structured logger configured (pino / structlog / slog)
- [ ] PII redaction in logger config
- [ ] Request ID middleware
- [ ] Request ID propagated to outbound HTTP calls
- [ ] OpenTelemetry tracing instrumented (auto-instrumentations on)
- [ ] Sample rate configured per environment
- [ ] Prometheus metrics: RED (Rate, Errors, Duration)
- [ ] Metrics endpoint exposed at `/metrics` (not auth-protected on internal network)
- [ ] Liveness probe at `/livez` (static ok)
- [ ] Readiness probe at `/readyz` (checks DB, cache, downstream)
- [ ] Graceful shutdown: SIGTERM handler, in-flight drain, hard timeout
- [ ] Error tracking SDK initialized (Sentry / Rollbar / Bugsnag)
- [ ] Error tracking `beforeSend` strips PII
- [ ] Alerts: error rate spike, p99 latency, saturation
- [ ] Dashboard: RED per service
- [ ] Runbook: link from alerts to docs/runbooks/<service>.md
