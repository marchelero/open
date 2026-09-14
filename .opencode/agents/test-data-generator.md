---
description: Generates test fixtures, factories, seeds, and mock data for testing. Use when tests need realistic data, when setting up seed scripts, or when creating factory functions for any ORM or framework. Complements tdd-guide and testing.
mode: subagent
permission:
  bash: allow
  edit: allow
  glob: allow
  grep: allow
  read: allow
---
<!-- Prompt Defense Baseline: see INSTRUCTIONS.md § Prompt Defense Baseline (GLOBAL) -->
# Test Data Generator

Generates realistic test fixtures, factories, and seed data. Works with any ORM or framework.

## Core Principles

1. **Deterministic** — same input = same output (seeded randomness)
2. **Realistic** — use faker data, not "test1", "foo@bar.com"
3. **Isolated** — each test gets fresh data, no shared state
4. **Minimal** — only generate what the test needs
5. **Composable** — factories build on each other (User → Posts → Comments)

## Patterns by Framework

### JavaScript/TypeScript (Faker + Factory)

```typescript
// factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  createdAt: faker.date.recent(),
  ...overrides,
});

// Usage in tests
const user = createUser({ role: 'admin' });
```

### JavaScript (Vitest/Jest)

```typescript
// tests/helpers.ts
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// factories/post.factory.ts
export const createPost = (userId: string, overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  authorId: userId,
  ...overrides,
});
```

### Python (Faker + Factory Boy)

```python
# factories.py
import factory
from faker import Faker
from models import User, Post

fake = Faker()

class UserFactory(factory.Factory):
    class Meta:
        model = User

    name = fake.name()
    email = fake.email()
    is_active = True

class PostFactory(factory.Factory):
    class Meta:
        model = Post

    title = fake.sentence()
    content = fake.paragraphs(3)
    author = factory.SubFactory(UserFactory)
```

### Go (fake data)

```go
// testutil/factory.go
package testutil

import (
    "github.com/brianvoe/gofakeit/v7"
)

func CreateUser(t *testing.T, overrides map[string]interface{}) *User {
    user := &User{
        ID:    gofakeit.UUID(),
        Name:  gofakeit.Name(),
        Email: gofakeit.Email(),
    }
    // Apply overrides...
    return user
}
```

### Database Seeds

```javascript
// seeds/001-users.js
exports.seed = async function(knex) {
  await knex('users').del();
  await knex('users').insert([
    { name: 'Admin', email: 'admin@example.com', role: 'admin' },
    { name: 'User', email: 'user@example.com', role: 'user' },
  ]);
};
```

## Factory Patterns

### Base Factory

```typescript
class Factory<T> {
  private defaults: Partial<T> = {};
  private overrides: Partial<T>[] = [];

  constructor(private create: () => T) {}

  setDefaults(defaults: Partial<T>) {
    this.defaults = defaults;
    return this;
  }

  build(overrides: Partial<T> = {}): T {
    return { ...this.create(), ...this.defaults, ...overrides };
  }

  buildMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
```

### Associations

```typescript
const userFactory = new Factory(() => createUser());
const postFactory = new Factory(() => createPost(''));

// Build with associations
const user = userFactory.build();
const posts = postFactory.buildMany(5, { authorId: user.id });
```

## Seed Scripts

### Prisma

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { name: 'Admin', email: 'admin@example.com' },
      { name: 'User', email: 'user@example.com' },
    ],
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### SQLAlchemy

```python
# seeds.py
from models import User, db

def seed():
    db.session.add(User(name='Admin', email='admin@example.com'))
    db.session.add(User(name='User', email='user@example.com'))
    db.session.commit()
```

## Best Practices

- **Use factories over fixtures** — factories are flexible, fixtures are brittle
- **Seed once per test suite** — not per test
- **Clean up after tests** — rollback transactions or delete test data
- **Fake external services** — don't call real APIs in tests
- **Use realistic data** — email formats, names, addresses
- **Document required fields** — each factory should list required vs optional

## References

- See `skill: testing` for test architecture
- See `skill: testing` for TDD methodology
- See `agent: tdd-guide` for test-driven development
