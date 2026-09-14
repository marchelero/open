---
name: security-hardening
description: Use this skill when implementing security best practices. Covers OWASP Top 10, authentication, authorization, rate limiting, CORS, CSP headers, input validation, secrets management, and security headers.
triggers: [security, OWASP, authentication, authorization, rate limiting, CORS, CSP, security headers, input validation, secrets]
origin: starter-pack
---

# Security Hardening Patterns

Comprehensive security patterns for web applications and APIs.

## When to Activate

- Implementing authentication (JWT, OAuth, sessions)
- Setting up authorization (RBAC, ABAC)
- Configuring rate limiting
- Adding security headers
- Validating user input
- Managing secrets

## OWASP Top 10 Checklist

### A01: Broken Access Control

```typescript
// Authorization middleware
function authorize(...allowedRoles: string[]) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Usage
app.get('/admin', authorize('admin'), adminHandler);
app.put('/users/:id', authorize('admin', 'user'), updateUser);
```

### A02: Cryptographic Failures

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Password hashing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);  // Cost factor 12
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Random tokens
function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Encryption
function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secret, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
```

### A03: Injection

```typescript
// SQL injection prevention (parameterized queries)
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// XSS prevention
import DOMPurify from 'isomorphic-dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}

// Command injection prevention
import { execFile } from 'child_process';

function safeExec(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, { shell: false }, (error, stdout) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
}
```

### A04: Insecure Design

```typescript
// Input validation with Zod
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  age: z.number().int().min(13).max(120)
});

function validateInput(data: unknown) {
  return UserInputSchema.parse(data);
}
```

### A05: Security Misconfiguration

```typescript
// Helmet for Express
import helmet from 'helmet';

app.use(helmet());

// Custom CSP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"]
  }
}));
```

### A06: Vulnerable Components

```bash
# npm audit
npm audit
npm audit fix

# Snyk
npx snyk test
npx snyk monitor

# Dependabot alerts
gh api repos/{owner}/{repo}/vulnerability-alerts
```

### A07: Auth Failures

```typescript
import jwt from 'jsonwebtoken';

// JWT generation
function generateToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// JWT verification
function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Refresh token
function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}
```

### A08: Data Integrity

```typescript
import crypto from 'crypto';

// HMAC signature
function createSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = createSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### A09: Logging Failures

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});

// Security event logging
function logSecurityEvent(event: string, details: object) {
  logger.warn({ event, ...details, timestamp: new Date().toISOString() });
}

// Usage
logSecurityEvent('LOGIN_FAILED', { userId, ip, userAgent });
logSecurityEvent('UNAUTHORIZED_ACCESS', { path, method, userId });
```

### A10: SSRF

```typescript
import { URL } from 'url';

function isSafeUrl(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);

    // Block private IPs
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    // Check allowed hosts
    return allowedHosts.some(host => hostname.endsWith(host));
  } catch {
    return false;
  }
}
```

## Rate Limiting

### Express Rate Limit

```typescript
import rateLimit from 'express-rate-limit';

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 attempts per 15 minutes
  message: 'Too many login attempts'
});

app.post('/login', authLimiter, loginHandler);
```

### Redis Rate Limit

```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, now.toString());
  multi.zcard(key);
  multi.pexpire(key, windowMs);

  const results = await multi.exec();
  const count = results[2][1] as number;

  return count <= limit;
}
```

## Security Headers

### Express Headers

```typescript
// Security headers
app.use((req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Type Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Frame Options
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
});
```

### CORS Configuration

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400  // 24 hours
}));
```

## Secrets Management

### Environment Variables

```typescript
// Never commit .env files
// Use .env.example for documentation

// Validate required env vars
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### AWS Secrets Manager

```typescript
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();

async function getSecret(secretName: string): Promise<string> {
  const data = await secretsManager.getSecretValue({
    SecretId: secretName
  }).promise();

  return data.SecretString;
}
```

## Input Validation

### Express Validation

```typescript
import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Usage
app.post('/users',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().escape(),
  validate,
  createUser
);
```

## Anti-Patterns

1. **Storing secrets in code** → Use env vars or secrets manager
2. **Missing rate limiting** → DoS vulnerability
3. **No input validation** → Injection attacks
4. **Missing security headers** → XSS, clickjacking
5. **Weak password hashing** → Use bcrypt with high cost factor
6. **No HTTPS** → Data in transit exposed
7. **Missing CORS** → Cross-origin attacks

## Related Skills

- `observability` — for security logging
- `api-design` — for secure API design
- `database-migrations` — for secure schema changes

## Related Agents

- `security-reviewer` — for security review
- `code-reviewer` — for security code review
