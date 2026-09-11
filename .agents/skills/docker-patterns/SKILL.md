---
name: docker-patterns
description: Use when writing, reviewing, or optimizing Dockerfiles and docker-compose configurations. Covers multi-stage builds, security best practices, layer caching, image size optimization, health checks, secrets management, and docker-compose patterns for development and production.
---

# Docker Patterns Skill

Production-ready Dockerfiles and docker-compose configurations.

## Core Principles

1. **Multi-stage builds** — separate build and runtime stages
2. **Minimal images** — use Alpine or distroless
3. **Non-root user** — never run as root in production
4. **Layer caching** — order instructions from least to most frequently changing
5. **No secrets in image** — use build args or runtime secrets

## Multi-Stage Builds

### Node.js

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Python

```dockerfile
# Build stage
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage
FROM python:3.12-slim AS runtime
WORKDIR /app
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
COPY --from=builder /install /usr/local
COPY --chown=appuser:appgroup . .
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["python", "main.py"]
```

### Go

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# Runtime stage (distroless)
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/server /server
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/server"]
```

## Docker-Compose

### Development

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:secret@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Production

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    secrets:
      - db_password
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## Layer Caching Optimization

```dockerfile
# BAD: Reinstall all deps on any code change
COPY . .
RUN npm install

# GOOD: Install deps first (cached unless package.json changes)
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
```

## Security Best Practices

### Non-Root User

```dockerfile
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser
```

### Read-Only Filesystem

```dockerfile
FROM node:20-alpine
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
WORKDIR /app
COPY --chown=appuser:appgroup . .
USER appuser
# Docker run: --read-only --tmpfs /tmp
```

### Secrets Management

```dockerfile
# Build secrets (not in image layers)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci

# Runtime secrets
RUN --mount=type=secret,id=db_password cat /run/secrets/db_password
```

## Image Size Optimization

| Base Image | Size | Use Case |
|-----------|------|----------|
| `node:20-alpine` | ~180MB | Node.js apps |
| `python:3.12-slim` | ~150MB | Python apps |
| `golang:1.22-alpine` | ~300MB | Go builds |
| `gcr.io/distroless/static` | ~2MB | Go runtime |
| `nginx:alpine` | ~40MB | Static files |

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `FROM node:20` (full image) | `FROM node:20-alpine` |
| Running as root | Add non-root user |
| `COPY . .` before `npm install` | Copy package*.json first for caching |
| Secrets in Dockerfile | Use build secrets or runtime secrets |
| No health check | Add HEALTHCHECK instruction |
| Single-stage build | Use multi-stage builds |

## References

- See `skill: environment-config` for env management
- See `agent: k8s-reviewer` for Kubernetes patterns
- See `skill: observability` for logging in containers
