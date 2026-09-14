---
name: testing
description: Use this skill when writing new features, fixing bugs, refactoring code, writing or reviewing tests, designing test architecture, or improving test coverage. Covers TDD methodology (red-green-refactor), test pyramid, AAA pattern, mocking strategies per language (jest/vitest, pytest, Go testing, JUnit, Swift Testing), test doubles (dummy/stub/spy/mock/fake), integration tests with databases (testcontainers, transactional), E2E with Playwright, parameterized tests, and coverage anti-patterns.
triggers: [test, TDD, RED, GREEN, REFACTOR, coverage, jest, pytest, vitest, mock, testing, unit test, integration test, e2e, stub, spy, fake, fixture, factory, builder, testcontainers, playwright, junit, go test, RSpec, parameterized, AAA, arrange act assert, FIRST, test pyramid, mutation testing, flaky test, snapshot test, test double, harness]
origin: starter-pack
---

# Testing

TDD methodology + concrete testing patterns in one skill. Methodology (when/how) + patterns (what/how-per-language).

## When to Activate

- Writing new features or functionality (TDD workflow)
- Fixing bugs or issues (write reproducer first)
- Refactoring existing code (tests as safety net)
- Writing or reviewing tests
- Designing a test harness (fixtures, helpers, builders)
- Reducing test flakiness or test runtime
- Adding integration tests against a real database, queue, or HTTP service
- Setting up E2E tests for a critical user flow
- Choosing between unit, integration, and E2E for a given case

## Do Not Activate For

- Choosing what to test (acceptance criteria, edge cases) — use `intent-driven-development`
- Performance testing (load, stress, soak) — see load-testing references in your stack
- Pure code review on non-test code — use `code-reviewer`
- One-off scripts that will run once and be deleted

---

# Part 1: TDD Methodology

## Core Principles

### 1. Tests BEFORE Code
ALWAYS write tests first, then implement code to make tests pass.

### 2. Coverage Requirements
- Minimum 80% coverage (unit + integration + E2E)
- 100% on critical paths (auth, payments, data integrity)
- All edge cases covered, error scenarios tested

### 3. Test Types

| Type | What | Speed |数量 |
|------|------|-------|------|
| **Unit** | Individual functions, pure logic | <50ms | Many |
| **Integration** | API endpoints, DB, services | <1s | Fewer |
| **E2E** | Critical user flows, browser | >1s | Very few |

## TDD Workflow Steps

### Step 1: Write User Journeys
```
As a [role], I want to [action], so that [benefit]
```

### Step 2: Generate Test Cases
```typescript
describe('Feature', () => {
  it('returns expected result for valid input', async () => { /* ... */ })
  it('handles empty input gracefully', async () => { /* ... */ })
  it('falls back when dependency unavailable', async () => { /* ... */ })
})
```

### Step 3: Run Tests — RED Gate
```bash
npm test
# Tests should fail — haven't implemented yet
```

**RED validation requires:**
- Runtime RED: test compiles, executes, and fails for the intended reason
- Compile-time RED: new test references buggy code, compile failure is the signal
- Failure is NOT from syntax errors, broken setup, or missing dependencies

Do not edit production code until RED is confirmed. Create a checkpoint commit.

### Step 4: Implement Code
Write minimal code to make tests pass. Stage the fix but defer commit.

### Step 5: Run Tests — GREEN Gate
```bash
npm test
# Tests should now pass
```

Create a checkpoint commit after GREEN is validated.

### Step 6: Refactor
Improve code quality while keeping tests green. Create checkpoint commit.

### Step 7: Verify Coverage
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## Git Checkpoints

- One commit for failing test added (RED)
- One commit for minimal fix applied (GREEN)
- One optional commit for refactor complete
- Each checkpoint on current active branch, belongs to current task

---

# Part 2: Testing Patterns

## AAA: Arrange, Act, Assert

Three distinct sections. Blank line between. Don't sneak asserts into setup.

```typescript
it('calculates total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }]

  // Act
  const total = calculateTotal(items)

  // Assert
  expect(total).toBe(30)
})
```

## FIRST Principles

- **F**ast — under 100ms per unit test
- **I**solated — no shared state, no order dependence
- **R**epeatable — same result every run
- **S**elf-validating — binary pass/fail
- **T**imely — written with the code, not after

## Test Doubles — The Five Kinds

| Kind | Purpose | Verifies | When to use |
|------|---------|----------|-------------|
| **Dummy** | Fill parameter list, never used | nothing | Required params with no meaningful interaction |
| **Stub** | Return canned answers | state | Need preset data to exercise a code path |
| **Spy** | Stub + record how it was called | indirect state | Verify side effects (logging, notifications) |
| **Mock** | Pre-programmed expectations | behavior | Verify "this was called with these args" |
| **Fake** | Working implementation, unsuitable for prod | state | In-memory DB, fake SMTP — preferred over mocks |

**Rule of thumb: fakes and stubs over mocks.** Mocks couple tests to implementation. Fakes test behavior without coupling.

## Mocking Per Language

### JavaScript / TypeScript — Jest / Vitest

```typescript
// Stub a module
vi.mock("./db", () => ({
  save: vi.fn().mockResolvedValue({ id: 1 }),
}))

// Spy without changing behavior
const log = vi.spyOn(logger, "info")

// Fake an implementation (preferred over mocks)
class FakeUserRepo implements UserRepo {
  users = new Map<string, User>()
  async save(u: User) { this.users.set(u.id, u); return u }
  async findById(id: string) { return this.users.get(id) ?? null }
}

// Inject fake via DI
const service = new UserService(new FakeUserRepo())

// Time mocking
vi.useFakeTimers()
vi.setSystemTime(new Date("2026-01-01"))
```

### Python — pytest

```python
# Monkeypatch (built-in)
def test_log_calls(monkeypatch):
    calls = []
    monkeypatch.setattr("app.logger.info", lambda *a: calls.append(a))
    do_thing()
    assert any("started" in str(c) for c in calls)

# unittest.mock (stdlib)
from unittest.mock import Mock, AsyncMock
repo = Mock(spec=UserRepo)
repo.find_by_id = AsyncMock(return_value=User(id="1"))

# Fake (better than Mock for behavior)
class FakeUserRepo:
    def __init__(self): self.users = {}
    async def save(self, u): self.users[u.id] = u; return u
    async def find_by_id(self, id): return self.users.get(id)

# Freezegun for time
@freeze_time("2026-01-01")
def test_anniversary_email():
    send_anniversary_emails()
    assert mail.outbox[0].subject == "Happy 1 year!"
```

### Go

```go
// Table-driven tests (idiomatic)
func TestAdd(t *testing.T) {
    tests := []struct{
        name string
        a, b, want int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -1, -2},
        {"zero", 0, 0, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.want {
                t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)
            }
        })
    }
}

// Fake interface implementation
type fakeUserRepo struct{ users map[string]User }
func (f *fakeUserRepo) Save(u User) error { f.users[u.ID] = u; return nil }
func (f *fakeUserRepo) FindByID(id string) (User, error) {
    return f.users[id], nil
}
```

### Java — JUnit 5 + Mockito

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock UserRepo repo;
    @InjectMocks UserService service;

    @Test
    void createsUser() {
        when(repo.save(any())).thenReturn(new User("1", "Ada"));
        var result = service.create(new CreateUser("Ada"));
        assertThat(result.id()).isEqualTo("1");
        verify(repo).save(argThat(u -> u.name().equals("Ada")));
    }
}
```

### Swift — Swift Testing

```swift
@Test("UserService creates user with generated ID")
func createsUser() async throws {
    let repo = FakeUserRepo()
    let service = UserService(repo: repo)
    let user = try await service.create(name: "Ada")
    #expect(user.id == "1")
    #expect(user.name == "Ada")
}
```

## Builders and Object Mothers

Construction noise drowns tests. Extract builders.

```typescript
class UserBuilder {
  private user: Partial<User> = {
    id: "1", name: "Ada", email: "ada@example.com",
    createdAt: new Date("2026-01-01"), roles: ["user"],
  }
  withId(id: string) { this.user.id = id; return this }
  withName(name: string) { this.user.name = name; return this }
  withRoles(roles: string[]) { this.user.roles = roles; return this }
  build(): User { return this.user as User }
}

const admin = new UserBuilder().withRoles(["admin"]).build()
```

Keep builders in `test/builders/`. Plain factory functions for simple objects.

## Integration Tests With Databases

### 1. Transactional rollback (fast, no cleanup)
```python
@pytest.mark.django_db(transaction=True)
def test_user_creation():
    user = User.objects.create(name="Ada")
    assert User.objects.count() == 1
    # transaction rolls back
```
Pros: fast, isolated. Cons: doesn't catch constraint/migration issues.

### 2. Testcontainers (real DB, isolated)
```typescript
import { PostgreSqlContainer } from "@testcontainers/postgresql"
let container: StartedPostgreSqlContainer
beforeAll(async () => {
  container = await new PostgreSqlContainer().start()
  await runMigrations(container.getConnectionUri())
}, 60_000)
```
Pros: catches real DB behavior. Cons: slower, Docker dependency.

### 3. Dedicated test DB with truncation
```python
@pytest.fixture(autouse=True)
def clear_db(db):
    yield
    User.objects.all().delete()
```
Pros: real DB, fast cleanup. Cons: needs discipline.

## E2E Tests With Playwright

```typescript
test("user can sign up and see dashboard", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Email").fill("ada@example.com")
  await page.getByRole("button", { name: "Sign up" }).click()
  await expect(page).toHaveURL("/dashboard")
})
```

Patterns:
- **Critical journeys only**: signup, login, checkout. Not every page.
- **Data attributes for selectors**: `data-testid`, not CSS classes.
- **Auth state reuse**: `storageState` to skip login per suite.
- **Flaky quarantine**: mark `@flaky`, skip from CI, fix within sprint.

## Parameterized Tests

Same code, multiple inputs. Eliminates copy-paste.

```typescript
// Vitest / Jest
test.each([
  ["USD", 100, "$1.00"],
  ["EUR", 100, "€1.00"],
  ["JPY", 100, "¥100"],
])("formats %s correctly", (currency, cents, expected) => {
  expect(formatMoney(cents, currency)).toBe(expected)
})
```

```python
@pytest.mark.parametrize("currency,cents,expected", [
    ("USD", 100, "$1.00"),
    ("EUR", 100, "€1.00"),
])
def test_format_money(currency, cents, expected):
    assert format_money(cents, currency) == expected
```

## Coverage Strategy

**Coverage is a floor, not a goal.** 100% line coverage with no behavior tests = false safety.

| Metric | What it tells you | What it misses |
|--------|-------------------|----------------|
| Line coverage | Which lines executed | Which branches/inputs/error paths |
| Branch coverage | Which if/else arms ran | Which combinations |
| Mutation score | Whether tests detect injected bugs | Real bugs |

**Targets:**
- 80% line coverage minimum
- 100% on critical paths (auth, payments, data integrity)
- Mutation score >= 70% on critical code (Stryker, PIT, mutmut)

**What NOT to do:**
- Test private methods to bump numbers
- Mock everything to make coverage lines "covered"
- Write tests that only assert `expect(x).toBe(x)`

## Common Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|--------------|--------------|-----|
| Test calls private method via reflection | Couples to implementation | Test the public method |
| One mega-test for "the whole flow" | Can't identify which step fails | Split into focused tests |
| `sleep(1000)` in tests | Slow, flaky | Use polling, fake timers |
| Shared mutable state between tests | Order-dependent | Reset in `beforeEach` |
| Mocking the system under test | Test passes, code is broken | Mock dependencies only |
| Snapshot tests for everything | Snapshots rot | Snapshot only stable output |

## Quick-Reference Checklist

When writing or reviewing a test:

- [ ] Test name describes behavior (`"rejects expired token"`, not `"test validate"`)
- [ ] AAA structure visible
- [ ] One behavior concept per test
- [ ] No `sleep`/`setTimeout` for async waiting
- [ ] No shared mutable state between tests
- [ ] Mocks/fakes verify behavior, not implementation
- [ ] Edge cases: empty input, null, max boundary, error path
- [ ] Test fails when behavior is broken (delete code, run test)
- [ ] Test passes consistently across 10 runs
- [ ] Test runs in under 100ms (unit) or 1s (integration)

## Test File Organization

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx          # Unit tests
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration tests
├── test/
│   └── builders/                     # Test data builders
└── e2e/
    ├── markets.spec.ts               # E2E tests
    └── auth.spec.ts
```

## Continuous Testing

```bash
npm test -- --watch              # Watch mode during dev
npm test && npm run lint         # Pre-commit hook
npm test -- --coverage           # CI with coverage upload
```

## Success Metrics

- 80%+ code coverage achieved
- All tests passing (green)
- No skipped or disabled tests
- Fast test execution (< 30s for unit tests)
- E2E tests cover critical user flows only
- Tests catch bugs before production
