---
name: edge-computing
description: Use this skill when building for edge runtimes. Covers Cloudflare Workers, Vercel Edge Functions, Deno Deploy, and edge middleware patterns for low-latency, globally distributed applications.
triggers: [edge computing, Cloudflare Workers, Vercel Edge, Deno Deploy, edge functions, edge middleware, serverless edge, global edge]
origin: starter-pack
---

# Edge Computing Patterns

Patterns for building applications that run on edge runtimes globally.

## When to Activate

- Building with Cloudflare Workers or Pages
- Implementing Vercel Edge Functions or Middleware
- Deploying to Deno Deploy
- Creating globally distributed APIs
- Implementing edge-side rendering
- Adding A/B testing at the edge

## Cloudflare Workers

### Basic Worker

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/hello') {
      return Response.json({ message: 'Hello from edge!' });
    }
    
    return fetch(request);
  }
};
```

### KV Storage

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cacheKey = `cache:${new URL(request.url).pathname}`;
    
    // Check cache
    const cached = await env.KV.get(cacheKey, 'json');
    if (cached) {
      return Response.json(cached);
    }
    
    // Fetch and cache
    const data = await fetchFromOrigin(request);
    await env.KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });
    
    return Response.json(data);
  }
};
```

### D1 Database

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { results } = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(1).all();
    
    return Response.json(results);
  }
};
```

### R2 Storage

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);
    
    const object = await env.R2.get(key);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    return new Response(object.body, { headers });
  }
};
```

## Vercel Edge Functions

### Edge API Route

```typescript
// app/api/chat/route.ts (Next.js 14+)
export const runtime = 'edge';

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### Edge Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US';
  
  // A/B testing
  const bucket = request.cookies.get('ab-test')?.value || 
    (Math.random() < 0.5 ? 'control' : 'variant');
  
  const response = NextResponse.next();
  response.cookies.set('ab-test', bucket, { path: '/' });
  
  // Geolocation-based routing
  if (country === 'BR') {
    return NextResponse.redirect(new URL('/pt', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
```

## Deno Deploy

### Basic Service

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req: Request) => {
  const url = new URL(req.url);
  
  if (url.pathname === "/api/time") {
    return Response.json({ 
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
  
  return new Response("Hello from Deno Deploy!");
});
```

### Oak Framework

```typescript
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const app = new Application();
const router = new Router();

router.get("/api/users", async (ctx) => {
  const users = await kv.getMany([
    ["users", "1"],
    ["users", "2"],
  ]);
  ctx.response.body = users;
});

app.use(router.routes());
await app.listen({ port: 8000 });
```

## Edge Patterns

### Edge-Side Rendering

```typescript
// Render HTML fragments at the edge
async function renderPage(request: Request): Promise<Response> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Edge Rendered</title></head>
      <body>
        <div id="app">
          ${await renderComponent('header')}
          ${await renderComponent('main')}
          ${await renderComponent('footer')}
        </div>
        <script src="/client.js"></script>
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
```

### Edge Authentication

```typescript
async function authenticate(request: Request, env: Env): Promise<User | null> {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  
  // Verify JWT at edge (no origin call needed)
  const payload = await verifyJWT(token, env.JWT_SECRET);
  return payload as User;
}
```

### Rate Limiting at Edge

```typescript
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

### Edge Config (Feature Flags)

```typescript
import { get } from '@vercel/edge-config';

async function isFeatureEnabled(feature: string): Promise<boolean> {
  return await get(feature) ?? false;
}

export default async function middleware(request: Request) {
  const darkMode = await isFeatureEnabled('darkMode');
  // Apply feature flag
}
```

## Anti-Patterns

1. **Node.js APIs** → Not available in edge runtimes
2. **Large dependencies** → Edge bundles are size-limited
3. **Synchronous I/O** → Edge is async-only
4. **Missing timeout handling** → Edge functions have time limits
5. **No caching strategy** → Edge should cache aggressively
6. **Ignoring cold starts** → Edge has minimal cold starts but still matter

## Related Skills

- `caching-patterns` — for edge caching strategies
- `security-hardening` — for edge security
- `api-design` — for API versioning and deployment

## Related Agents

- `performance-optimizer` — for edge performance
- `code-reviewer` — for edge code review
