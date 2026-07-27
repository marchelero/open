---
name: testing-patterns
description: Use this skill when writing or reviewing tests, designing test architecture, or improving test coverage. Covers test pyramid, AAA pattern, mocking strategies per language (jest/vitest, pytest, Go testing, JUnit, Swift Testing), test doubles (dummy/stub/spy/mock/fake), integration tests with databases (testcontainers, transactional), E2E with Playwright, parameterized tests, and coverage anti-patterns. Pair with tdd-workflow for the methodology.
triggers: [test, testing, unit test, integration test, e2e, mock, stub, spy, fake, fixture, factory, builder, testcontainers, playwright, jest, vitest, pytest, junit, go test, RSpec, parameterized, AAA, arrange act assert, FIRST, test pyramid, coverage, mutation testing, flaky test, snapshot test, test double, harness]
origin: starter-pack
---

# Testing Patterns

Concrete patterns for writing fast, reliable, maintainable tests. This is the **how** of testing. For **when** and **methodology** (red-green-refactor, coverage targets), see `tdd-workflow`.

This skill covers patterns across languages. Stack-specific quirks (React Testing Library, Django TestCase, Go table-driven tests) get the deep treatment here; the rest stays portable.

## When to Activate

- Writing tests for new code or fixing untested code
- Designing a test harness (fixtures, helpers, builders)
- Reducing test flakiness or test runtime
- Adding integration tests against a real database, queue, or HTTP service
- Reviewing a PR for test quality (behavioral coverage, not line coverage)
- Setting up E2E tests for a critical user flow
- Diagnosing why coverage metrics mislead (covered lines, uncovered behavior)
- Choosing between unit, integration, and E2E for a given case

## Do Not Activate For

- TDD methodology (write-test-first red-green-refactor) — use `tdd-workflow`
- Choosing what to test (acceptance criteria, edge cases) — use `intent-driven-development`
- Performance testing (load, stress, soak) — see load-testing references in your stack
- Pure code review on non-test code — use `code-reviewer` or stack-specific reviewer
- One-off scripts that will run once and be deleted

## Core Principles

1. **Test behavior, not implementation.** A test should break when the user-visible behavior breaks, not when you rename a private function. Assert on outputs, public APIs, and observable side effects — not internal state.
2. **One assertion concept per test.** Multiple `expect()` calls are fine if they verify the same concept (e.g., the response status, body, and headers of an HTTP call). Multiple concepts (login flow + payment flow) belong in separate tests.
3. **AAA: Arrange, Act, Assert.** Three distinct sections. Blank line between. Don't sneak asserts into setup. Don't do assertions in the "Arrange" half.
4. **FIRST**: Fast (under 100ms per unit test), Isolated (no shared state, no order dependence), Repeatable (same result every run), Self-validating (binary pass/fail, no manual inspection), Timely (written with the code, not after).
5. **Test pyramid**: many unit tests (fast, narrow), fewer integration tests (slower, broader), very few E2E tests (slowest, most realistic). Anti-pattern: the ice-cream cone (lots of E2E, few units) — slow, flaky, expensive.
6. **Trivial code does not need tests.** Getters, simple constructors, framework glue. Test the behavior they participate in, not the code itself. Coverage targets apply to meaningful lines, not `return x.field`.
7. **Tests are code.** Same standards: small functions, no duplication, no magic. Refactor helpers, extract builders, kill duplication. A 5000-line test file is a code smell, not a safety net.

## Test Doubles — The Five Kinds

Gerard Meszarfs taxonomy. Using the wrong kind is the most common testing mistake.

| Kind | Purpose | Verifies | Example |
|------|---------|----------|---------|
| **Dummy** | Fill parameter list, never used | nothing | `new EmailService(null)` |
| **Stub** | Return canned answers | state | `repo.findById returns User(id=1)` |
| **Spy** | Stub + record how it was called | indirect state | spy on logger to assert error was logged |
| **Mock** | Pre-programmed expectations, fails on miss | behavior | `expect(mock).toHaveBeenCalledWith(x, y)` |
| **Fake** | Working implementation, unsuitable for prod | state | in-memory DB, fake SMTP server |

Rule of thumb: **fakes and stubs over mocks**. Mocks couple tests to implementation. Fakes test behavior without coupling. Use mocks only when verifying "this was called with these args" is the actual contract.

## Mocking Per Language

### JavaScript / TypeScript — Jest / Vitest

```typescript
// Stub a module
vi.mock("./db", () => ({
  save: vi.fn().mockResolvedValue({ id: 1 }),
}))

// Spy without changing behavior
const log = vi.spyOn(logger, "info")

// Fake an implementation
class FakeUserRepo implements UserRepo {
  users = new Map<string, User>()
  async save(u: User) { this.users.set(u.id, u); return u }
  async findById(id: string) { return this.users.get(id) ?? null }
}

// Inject fake via DI (preferred)
const service = new UserService(new FakeUserRepo())
const result = await service.create({ name: "Ada" })
expect(result.id).toBe("1")
expect((await service.findById("1"))?.name).toBe("Ada")

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

func TestUserService(t *testing.T) {
    repo := &fakeUserRepo{users: map[string]User{}}
    svc := NewUserService(repo)
    // ...
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

### Swift — Swift Testing (new) or XCTest

```swift
@Test("UserService creates user with generated ID")
func createsUser() async throws {
    let repo = FakeUserRepo()
    let service = UserService(repo: repo)

    let user = try await service.create(name: "Ada")

    #expect(user.id == "1")
    #expect(user.name == "Ada")
    #expect(await repo.findByID("1")?.name == "Ada")
}
```

## Builders and Object Mothers

Construction noise (`new User({ id: "1", name: "Ada", email: "...", createdAt: new Date(), roles: [...] })`) drowns tests. Extract builders.

```typescript
// Builder pattern for tests
class UserBuilder {
  private user: Partial<User> = {
    id: "1",
    name: "Ada",
    email: "ada@example.com",
    createdAt: new Date("2026-01-01"),
    roles: ["user"],
  }
  withId(id: string) { this.user.id = id; return this }
  withName(name: string) { this.user.name = name; return this }
  withRoles(roles: string[]) { this.user.roles = roles; return this }
  build(): User { return this.user as User }
}

// Usage
const admin = new UserBuilder().withRoles(["admin"]).build()
const noEmail = new UserBuilder().withEmail("").build()
```

Keep builders in `test/builders/` (or equivalent), one per domain object. Do not over-engineer with fluent interfaces for objects that have one or two fields — plain factory functions are fine.

## Integration Tests With Databases

Three approaches, in order of preference:

### 1. Transactional rollback (fast, no cleanup)

```python
# pytest-django
@pytest.mark.django_db(transaction=True)
def test_user_creation():
    user = User.objects.create(name="Ada")
    assert User.objects.count() == 1
    # transaction rolls back, DB clean for next test
```

```typescript
// Prisma + vitest
afterEach(async () => {
  await prisma.$transaction([prisma.user.deleteMany()])
})
```

Pros: fast, isolated, no schema knowledge needed.
Cons: doesn't catch constraint bugs, missing indexes, or migration issues.

### 2. Testcontainers (real DB, isolated per test class)

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"

let container: StartedPostgreSqlContainer

beforeAll(async () => {
  container = await new PostgreSqlContainer().start()
  await runMigrations(container.getConnectionUri())
}, 60_000)

afterAll(async () => {
  await container.stop()
})
```

Pros: catches real DB behavior (transactions, isolation levels, indexes).
Cons: slower (~5-10s per container start), Docker dependency.

### 3. Dedicated test DB with truncation (compromise)

```python
# Django default
@pytest.fixture(autouse=True)
def clear_db(db):
    yield
    User.objects.all().delete()
    # truncate other tables
```

Pros: real DB, fast cleanup.
Cons: needs discipline to truncate all tables; foreign keys complicate.

## E2E Tests With Playwright

```typescript
import { test, expect } from "@playwright/test"

test("user can sign up and see dashboard", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Email").fill("ada@example.com")
  await page.getByLabel("Password").fill("correct-horse-battery-staple")
  await page.getByRole("button", { name: "Sign up" }).click()

  await expect(page).toHaveURL("/dashboard")
  await expect(page.getByRole("heading", { name: /welcome, ada/i })).toBeVisible()
})
```

Patterns:
- **Critical journeys only**: signup, login, checkout, core action. Not every page.
- **Data attributes for selectors**: `data-testid="checkout-button"`, not CSS classes.
- **Auth state reuse**: `storageState` to skip login on every test in a suite.
- **Flaky quarantine**: if a test is flaky, mark `@flaky` and skip from CI; fix the root cause within a sprint, don't ignore.
- **No assertions on third-party UI**: don't assert Google reCAPTCHA rendered. Assert your app handled the callback.

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

```go
// Go table-driven (see Mocking section above)
```

```python
# pytest
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
| Line coverage | Which lines were executed | Which branches, which inputs, which error paths |
| Branch coverage | Which `if/else` arms ran | Which combinations of branches |
| Path coverage | Which control-flow paths ran | Which inputs trigger them |
| Mutation score | Whether tests detect injected bugs | Real bugs that don't match mutation patterns |

**Targets** (per `tdd-workflow`):
- 80% line coverage minimum
- 100% coverage on critical paths (auth, payments, data integrity)
- Mutation score ≥ 70% on critical code (use Stryker, PIT, mutmut)

**What NOT to do for coverage**:
- Test private methods to bump numbers
- Add `if (false) { coverage.branch = true }` no-op branches
- Mock everything to make coverage lines "covered"
- Write a test that only calls `expect(x).toBe(x)` on the value under test

## Common Anti-Patterns

| Anti-pattern | Why it's bad | Fix |
|--------------|--------------|-----|
| Test calls private method via reflection | Couples to implementation; refactor breaks tests | Test the public method that uses the private one |
| One mega-test for "the whole flow" | When it fails, you don't know which step | Split into 5-10 focused tests |
| `sleep(1000)` in tests | Slow, flaky | Use polling, fake timers, or wait-for-condition |
| Shared mutable state between tests | Order-dependent, flake on reordering | Reset in `beforeEach`, or use isolated fixtures |
| Mocking the system under test | Test passes, code is broken | Mock dependencies, not the thing you're testing |
| Asserting on log output | Brittle, not behavior | Use a fake logger and assert on its recorded calls only if logging is the contract |
| Snapshot tests for everything | Snapshots rot; you stop reading diffs | Snapshot only stable, intentional output (UI baselines, serializations) |
| `expect(result).toEqual(mock)` | Tests that mock does what mock does | Assert on derived observable, not the mock return |

## Quick-Reference Checklist

When writing or reviewing a test:

- [ ] Test name describes behavior, not method (`"rejects expired token"`, not `"test validate"`)
- [ ] AAA structure visible (blank lines, or comments)
- [ ] One behavior concept per test
- [ ] No `sleep`/`setTimeout` for waiting on async (use polling or fake timers)
- [ ] No shared mutable state between tests
- [ ] Mocks/fakes verify behavior, not implementation
- [ ] Edge cases covered: empty input, null, max boundary, error path
- [ ] Test fails when the behavior is broken (delete the code, run the test, it fails)
- [ ] Test passes consistently across 10 runs
- [ ] Test runs in under 100ms (unit) or 1s (integration)
- [ ] Coverage is reported (vitest --coverage, pytest --cov, go test -cover)

## Pair With

- `tdd-workflow` — the methodology (red-green-refactor)
- `intent-driven-development` — define what to test (acceptance criteria)
- `error-handling` — error paths in tests
- `frontend-patterns` — React Testing Library, component tests
- `backend-patterns` — service-layer test architecture
- `verification-loop` — full verification including tests in CI
