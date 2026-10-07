---
name: docker-patterns
description: "Use when writing, reviewing, or optimizing Dockerfiles and docker-compose configurations."
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

### Compose Networking

Services on the same Compose network resolve each other by **service name** — that is the only address any container needs:

```
postgresql://postgres:secret@db:5432/mydb     # "db" is the service name
redis://redis:6379/0
```

`ports:` publishes to the **host**; it is not required for container-to-container traffic. Omit it in production for anything that is not meant to be reached from outside.

```yaml
services:
  frontend:
    networks: [frontend-net]

  api:
    networks: [frontend-net, backend-net]

  db:
    networks: [backend-net]      # reachable from api only, never from frontend
    ports:
      - "127.0.0.1:5432:5432"    # if the host must connect: bind to loopback
                                 # (omit ports entirely if only containers need it)

networks:
  frontend-net:
  backend-net:
```

Rules:
- Bind published ports to `127.0.0.1:` for databases and admin UIs. `5432:5432` publishes to every interface, including the public one.
- Separate frontend and backend planes; only services that must talk cross-plane join both networks.
- `depends_on` orders startup, it does not wait for *readiness* — use `condition: service_healthy` with a healthcheck.
- Docker's embedded DNS is the service discovery mechanism; hard-coded IPs break on every `up`.

### Volume Strategies

```yaml
volumes:
  postgres_data:        # named volume: persists across restarts, Docker-managed

services:
  app:
    volumes:
      - .:/app                        # bind mount: live reload in development
      - /app/node_modules             # anonymous volume: protect container deps from the host bind
      - /app/.next                    # protect the build cache from being overwritten
  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql   # read-only init
```

- Named volumes for anything durable; bind mounts for source during development only.
- Anonymous volume entries (`/app/node_modules`) are what keep a host bind mount from shadowing container-installed dependencies.
- Container filesystems are ephemeral: no volume = data gone on `docker compose down` or restart.
- Never bind-mount production data directories from the host — permissions and ownership drift.
- Mark config/secret mounts `:ro`.

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

## .dockerignore

Without it, `COPY . .` sends `node_modules`, `.git`, and every secret in the working directory to the daemon — bigger context, worse cache hits, and a real leak risk.

```
node_modules
.git
.env
.env.*
dist
coverage
*.log
.next
.cache
docker-compose*.yml
Dockerfile*
README.md
tests/
```

- Keep it next to the Dockerfile and review it whenever a new artifact directory appears.
- `.env*` is not optional — build context is the most common place secrets end up in an image.
- Exclude anything the build does not read; if it is not in a `COPY`, it does not belong in the context.

## Debugging

```bash
# Logs
docker compose logs -f app
docker compose logs --tail=50 db

# Inside a running container
docker compose exec app sh
docker compose exec db psql -U postgres

# State
docker compose ps                 # services and health
docker compose top                # processes per container
docker stats                      # live CPU/memory

# Rebuild
docker compose up --build
docker compose build --no-cache app     # ignore cached layers

# Cleanup (last one is destructive)
docker compose down
docker compose down -v            # also removes volumes — data loss
docker system prune
```

Network problems from inside a container:

```bash
docker compose exec app nslookup db                     # DNS resolves?
docker compose exec app wget -qO- http://api:3000/health  # connectivity?
docker network inspect <project>_default                # who is attached?
```

Typical order of diagnosis: `logs` → `ps` (is it healthy?) → DNS from inside the client container → port/`expose` mismatch → firewall. `localhost` inside a container is that container, not the host and not a sibling service — use the service name.

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
| Missing `.dockerignore` | Exclude `.env*`, `.git`, `node_modules`, tests |
| Public `ports:` on databases | Bind `127.0.0.1:` or omit entirely |
| Durable data in the container layer | Named volume for all persistent state |
| `localhost` used for a sibling service | Use the Compose service name |
| Production compose without an orchestrator | Kubernetes / ECS / Swarm for multi-host |

## References

- See `skill: environment-config` for env management
- See `agent: k8s-reviewer` for Kubernetes patterns
- See `skill: observability` for logging in containers
