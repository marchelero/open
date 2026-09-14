---
name: api-versioning
description: Use this skill when implementing API versioning strategies. Covers REST versioning, backward compatibility, deprecation policies, version negotiation, and migration strategies.
triggers: [API versioning, REST versioning, backward compatibility, deprecation, API migration, version negotiation]
origin: starter-pack
---

# API Versioning Patterns

Patterns for REST API versioning, backward compatibility, and deprecation.

## When to Activate

- Adding versioning to existing API
- Deprecating old API versions
- Migrating clients between versions
- Implementing version negotiation
- Managing backward compatibility

## Versioning Strategies

### URL Path Versioning

```typescript
// /api/v1/users
// /api/v2/users

app.get('/api/v1/users', getUsersV1);
app.get('/api/v2/users', getUsersV2);
```

### Header Versioning

```typescript
// Accept: application/vnd.myapp.v1+json
// Accept: application/vnd.myapp.v2+json

app.get('/api/users', (req, res) => {
  const version = req.headers['accept']?.match(/v(\d+)/)?.[1] || '1';

  switch (version) {
    case '1':
      return getUsersV1(req, res);
    case '2':
      return getUsersV2(req, res);
    default:
      return res.status(400).json({ error: 'Unsupported version' });
  }
});
```

### Query Parameter Versioning

```typescript
// /api/users?version=1
// /api/users?version=2

app.get('/api/users', (req, res) => {
  const version = parseInt(req.query.version as string) || 1;

  switch (version) {
    case 1:
      return getUsersV1(req, res);
    case 2:
      return getUsersV2(req, res);
  }
});
```

## Express Versioning

### Router-Based

```typescript
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// V1 routes
v1Router.get('/users', getUsersV1);
v1Router.get('/users/:id', getUserV1);

// V2 routes
v2Router.get('/users', getUsersV2);
v2Router.get('/users/:id', getUserV2);

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

### Middleware-Based

```typescript
function versionMiddleware(version: string) {
  return (req, res, next) => {
    req.apiVersion = version;
    next();
  };
}

app.use('/api/v1', versionMiddleware('v1'), v1Routes);
app.use('/api/v2', versionMiddleware('v2'), v2Routes);
```

## NestJS Versioning

```typescript
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';

const app = await NestFactory.create(AppModule);

// URI versioning (default)
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'api/v'
});

// Header versioning
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version'
});

// Media type versioning
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v='
});

// Controller
@Controller('users')
export class UsersController {
  @Version('1')
  @Get()
  findAllV1() {
    return 'This is version 1';
  }

  @Version('2')
  @Get()
  findAllV2() {
    return 'This is version 2';
  }
}
```

## Backward Compatibility

### Additive Changes (Safe)

```typescript
// Adding new field
interface UserV1 {
  id: string;
  name: string;
  email: string;
}

interface UserV2 extends UserV1 {
  createdAt: Date;  // New field, backward compatible
}
```

### Breaking Changes (Require New Version)

```typescript
// Changing field type
interface UserV1 {
  id: number;  // Was number
}

interface UserV2 {
  id: string;  // Now string - BREAKING
}

// Removing field
interface UserV1 {
  name: string;
  email: string;
}

interface UserV2 {
  name: string;
  // email removed - BREAKING
}
```

### Response Transformation

```typescript
function transformUserV1(user: UserV2) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
    // Don't include new fields
  };
}

function transformUserV2(user: UserV1) {
  return {
    ...user,
    createdAt: user.createdAt || new Date()
  };
}
```

## Deprecation Strategies

### Deprecation Header

```typescript
app.use('/api/v1', (req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', '2025-01-01');
  res.setHeader('Link', '</api/v2>; rel="successor-version"');
  next();
});
```

### Deprecation Warning

```typescript
function deprecated(version: string, sunset: string) {
  return (req, res, next) => {
    console.warn(`[DEPRECATED] ${req.method} ${req.path} - ${version} deprecated, use v2`);
    res.setHeader('X-Deprecated', version);
    res.setHeader('X-Sunset', sunset);
    next();
  };
}

// Usage
app.get('/api/v1/users', deprecated('v1', '2025-01-01'), getUsersV1);
```

### Gradual Migration

```typescript
// Phase 1: Add warning headers
app.use('/api/v1', deprecationMiddleware);

// Phase 2: Log usage
app.use('/api/v1', (req, res, next) => {
  metrics.increment('api.v1.requests');
  next();
});

// Phase 3: Reduce functionality
app.use('/api/v1', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(410).json({
      error: 'This method is no longer supported',
      upgradeTo: '/api/v2'
    });
  }
  next();
});

// Phase 4: Remove entirely
// Delete v1 routes
```

## Version Negotiation

### Content Negotiation

```typescript
app.get('/api/users', (req, res) => {
  const accept = req.headers.accept;

  if (accept?.includes('application/vnd.myapp.v2+json')) {
    return res.json(getUsersV2());
  }

  // Default to latest version
  return res.json(getUsersV2());
});
```

### Client Configuration

```typescript
// Client-side
const apiClient = new ApiClient({
  baseURL: 'https://api.example.com',
  version: 'v2',
  headers: {
    'Accept': 'application/vnd.myapp.v2+json'
  }
});
```

## Migration Strategies

### Parallel Running

```typescript
// Run both versions simultaneously
app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);

// Monitor traffic
setInterval(() => {
  const v1Traffic = metrics.get('api.v1.requests');
  const v2Traffic = metrics.get('api.v2.requests');

  if (v1Traffic === 0) {
    // Safe to remove v1
    console.log('v1 has no traffic, safe to deprecate');
  }
}, 60000);
```

### Canary Deployment

```typescript
// Deploy v2 to small percentage
if (Math.random() < 0.1) {  // 10% traffic
  return res.json(getUsersV2());
} else {
  return res.json(getUsersV1());
}
```

## Anti-Patterns

1. **Breaking changes in same version** → Clients break unexpectedly
2. **No deprecation timeline** → Clients can't plan migration
3. **Missing version headers** → Clients can't identify version
4. **Too many versions** → Maintenance burden
5. **No documentation** → Clients don't know how to migrate

## Related Skills

- `api-design` — for API design patterns
- `coding-standards` — for consistent naming
- `observability` — for version metrics

## Related Agents

- `code-reviewer` — for API review
- `typescript-reviewer` — for TypeScript API patterns
