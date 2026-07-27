---
name: refactoring-patterns
description: Use this skill when restructuring existing code without changing its behavior. Covers the Fowler catalog of refactorings (Extract Function, Inline Variable, Replace Conditional with Polymorphism, Introduce Parameter Object, Replace Magic Literal with Constant), code smells (long method, primitive obsession, data clumps, speculative generality, dead code), the red-green-refactor discipline, and tooling (jscodeshift, codemod, IDE shortcuts). Pair with tdd-workflow and testing-patterns.
triggers: [refactor, refactoring, extract method, extract function, inline, rename, move, decompose, restructure, code smell, long method, large class, primitive obsession, data clumps, shotgun surgery, speculative generality, dead code, duplication, jscodeshift, codemod, refactoring catalog, Fowler, red-green-refactor, baby steps, preserve behavior]
origin: starter-pack
---

# Refactoring Patterns

The discipline of changing code structure without changing behavior. The key invariant: **tests stay green throughout**. Every refactor here assumes you have a test suite that catches regressions — if you don't, write the tests first (see `tdd-workflow`).

This skill is the **catalog and process**. For the *what* (which refactor for which smell), see the Code Smells section. For the *when* (when to refactor vs. ship), see "When to Refactor".

## When to Activate

- Reviewing code that is hard to read or change
- Cleaning up a function that has grown too long
- Removing duplication across similar code blocks
- Renaming a poorly-named function, variable, or class
- Restructuring before adding new functionality (the "prepare to add" refactor)
- Removing dead code (unused exports, unreachable branches)
- Consolidating parallel hierarchies (parallel inheritance, shotgun surgery)
- Converting a switch statement to polymorphism
- After a feature lands, to pay down the implementation debt

## Do Not Activate For

- Behavior changes (refactor preserves behavior — if behavior changes, that's a feature)
- Performance optimization (different goal, different techniques — use `performance-optimizer`)
- Greenfield code (refactor existing code; for new code, design it well the first time)
- Without test coverage (you cannot safely refactor code with no tests — write them first)

## Core Principles

1. **Refactor preserves observable behavior.** No new features, no bug fixes, no "while I'm here" changes. One concern per commit.
2. **Tests are the safety net.** They must exist, must be fast, must pass before AND after. If they don't exist: stop, write them, then refactor.
3. **Small steps, frequent commits.** One rename, one extract, one move. Commit per refactor. If a refactor takes more than 15 minutes, break it down.
4. **Two hats**: at any moment you are either adding function (red-green) or refactoring (no test changes). Never both. Toggle.
5. **The rule of three**: duplicate once is fine, duplicate twice is suspect, duplicate three times is a refactor. Don't preemptively abstract.
6. **Names are the primary tool.** If a function is hard to read, rename its parts. If a class is hard to understand, rename its methods. Most "complex code" is just badly-named code.
7. **Refactor when you need to change, not as a separate "cleanup sprint".** Inline refactoring as part of feature work. Boy Scout Rule applies per-touch, not per-quarter.

## The Refactoring Catalog (Fowler)

Each entry: name, when to use, mechanical steps, before/after sketch. The full catalog is in Martin Fowler's "Refactoring" book; this is the high-frequency subset.

### Extract Function (a.k.a. Extract Method)

**When**: a code fragment inside a function can be grouped together and named. Comments that explain "what this block does" are the smell.

**Before**:
```typescript
function printInvoice(invoice: Invoice) {
  console.log("=== INVOICE ===")
  console.log(`Customer: ${invoice.customer.name}`)
  console.log(`Address: ${invoice.customer.address}`)
  let outstanding = 0
  for (const o of invoice.orders) {
    outstanding += o.amount
  }
  console.log(`Total: $${outstanding}`)
  // record due date
  const today = new Date()
  const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
  console.log(`Due: ${due.toLocaleDateString()}`)
}
```

**After**:
```typescript
function printInvoice(invoice: Invoice) {
  printHeader(invoice)
  printOutstanding(invoice)
  recordDueDate()
}

function printHeader(invoice: Invoice) { /* ... */ }
function printOutstanding(invoice: Invoice) { /* ... */ }
function recordDueDate() { /* ... */ }
```

**Steps**:
1. Create a new function with a name that describes the fragment.
2. Copy the fragment into the new function.
3. Add parameters for any local variables it reads.
4. Pass any needed return value back to the caller.
5. Replace the fragment with a call.
6. Run tests.

### Inline Function (a.k.a. Inline Method)

**When**: the body of a function is as clear as its name. The indirection adds noise.

**Before**:
```typescript
function getRating(driver: Driver): number {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1
}
function moreThanFiveLateDeliveries(driver: Driver): boolean {
  return driver.lateDeliveries > 5
}
```

**After**:
```typescript
function getRating(driver: Driver): number {
  return driver.lateDeliveries > 5 ? 2 : 1
}
```

**Steps**:
1. Verify all callers behave the same (no side effects in the inlined function).
2. Replace each call with the function body.
3. Delete the function.
4. Run tests.

### Rename Variable / Function / Class

**When**: the name no longer describes what the thing does. Often the highest-leverage refactor.

**Steps**:
1. Use IDE rename (F2 in most editors) — it catches all references, including imports, test files, comments.
2. If no IDE: `grep -r` for the name, change each, run tests.
3. **Never** half-rename ("rename `data` to `userData` in 4 files, leave 2 files using `data`"). All or nothing in one commit.

### Replace Magic Literal with Constant

**When**: a literal value (number, string) appears in code without explanation.

**Before**:
```typescript
if (potentialEnergy > 0.81) return "high"
```

**After**:
```typescript
const POTENTIAL_THRESHOLD = 0.81
if (energy > POTENTIAL_THRESHOLD) return "high"
```

### Replace Conditional with Polymorphism

**When**: a switch or if/else chain dispatches by type. Adding a new type means changing every chain.

**Before**:
```typescript
function plumage(bird: Bird): string {
  switch (bird.type) {
    case "EuropeanSwallow": return "average"
    case "AfricanSwallow": return bird.numberOfCoconuts > 2 ? "tired" : "average"
    case "NorwegianBlueParrot": return bird.voltage > 100 ? "scorched" : "beautiful"
  }
}
function airSpeedVelocity(bird: Bird): number {
  switch (bird.type) { /* ... */ }
}
```

**After**:
```typescript
abstract class Bird {
  abstract plumage(): string
  abstract airSpeedVelocity(): number
}
class EuropeanSwallow extends Bird {
  plumage() { return "average" }
  airSpeedVelocity() { return 35 }
}
// ... etc
```

**Note**: in TypeScript with discriminated unions, this is often a `switch` over the discriminant that the type system already protects. Polymorphism is for when the dispatch is dynamic (plugin systems, strategy).

### Introduce Parameter Object

**When**: a group of parameters always travel together. The signature is hard to read and the call sites are repetitive.

**Before**:
```typescript
function amountInvoiced(start: Date, end: Date, customer: Customer, product: Product) { /* ... */ }
amountInvoiced(new Date("2026-01-01"), new Date("2026-01-31"), customer, product)
amountInvoiced(new Date("2026-02-01"), new Date("2026-02-28"), customer, product)
```

**After**:
```typescript
type InvoicePeriod = { start: Date; end: Date }
function amountInvoiced(period: InvoicePeriod, customer: Customer, product: Product) { /* ... */ }
amountInvoiced({ start: ..., end: ... }, customer, product)
```

### Replace Nested Conditional with Guard Clauses

**When**: deep `if` nesting obscures the happy path.

**Before**:
```typescript
function getPayAmount(employee: Employee): number {
  let result: number
  if (employee.isSeparated) {
    result = 0
  } else {
    if (employee.isRetired) {
      result = 0
    } else {
      if (employee.isDead) {
        result = 0
      } else {
        result = employee.baseSalary * 0.9
      }
    }
  }
  return result
}
```

**After**:
```typescript
function getPayAmount(employee: Employee): number {
  if (employee.isSeparated || employee.isRetired || employee.isDead) return 0
  return employee.baseSalary * 0.9
}
```

### Decompose Conditional

**When**: a complex `if (date.before(SUMMER_START) || date.after(SUMMER_END))` hides the meaning.

**Before**:
```typescript
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
  charge = quantity * winterRate + winterServiceCharge
} else {
  charge = quantity * summerRate
}
```

**After**:
```typescript
if (isWinter(date)) {
  charge = winterCharge(quantity)
} else {
  charge = summerCharge(quantity)
}
```

### Introduce Special Case (a.k.a. Null Object)

**When**: the same null check is repeated everywhere ("if customer exists, use X, else use Y").

**Before**:
```typescript
if (customer === null) {
  return "occupant"
} else {
  return customer.name
}
```

**After**:
```typescript
// Special-case object that responds like a real customer
class UnknownCustomer {
  get name() { return "occupant" }
  get billingPlan() { return BillingPlan.basic }
  set billingPlan(_) { /* no-op */ }
}
```

### Replace Loop with Pipeline

**When**: a loop with accumulation can be expressed as a sequence of operations.

**Before**:
```typescript
const names = []
for (const i of people) {
  if (i.age > 18) names.push(i.name.toUpperCase())
}
```

**After**:
```typescript
const names = people
  .filter(p => p.age > 18)
  .map(p => p.name.toUpperCase())
```

### Split Loop

**When**: one loop does multiple unrelated things (calculates two sums, fills two collections).

**Before**:
```typescript
let youngest = Infinity
let totalSalary = 0
for (const p of people) {
  if (p.age < youngest) youngest = p.age
  totalSalary += p.salary
}
```

**After**:
```typescript
const youngest = Math.min(...people.map(p => p.age))
const totalSalary = people.reduce((sum, p) => sum + p.salary, 0)
```

## Code Smells — Quick Reference

Each smell points to one or more refactorings in the catalog.

| Smell | Symptom | Refactor |
|-------|---------|----------|
| **Long Method** | > 20 lines, multiple sections separated by comments | Extract Function |
| **Large Class** | Class with many fields and many methods | Extract Class |
| **Primitive Obsession** | Strings/numbers used everywhere (phone numbers, emails) | Replace Primitive with Object, Introduce Parameter Object |
| **Long Parameter List** | > 3 params, especially same type next to each other | Introduce Parameter Object, Preserve Whole Object |
| **Data Clumps** | Same group of fields appears together in multiple places | Extract Class, Introduce Parameter Object |
| **Switch Statements** | Type-based switch (especially by subtype) | Replace Conditional with Polymorphism |
| **Parallel Inheritance** | Adding a subclass to one hierarchy requires adding to another | Move Method, Move Field |
| **Speculative Generality** | "We might need this later" hooks, abstract base classes with one impl | Collapse Hierarchy, Inline Class, Remove Parameter |
| **Dead Code** | Unused exports, commented-out code, unreachable branches | Remove Dead Code |
| **Duplicated Code** | Same logic in two places | Extract Function (or shared utility) |
| **Comments** | Comments explaining what code does (not why) | Extract Function + good name |
| **Feature Envy** | Method uses more features of another class than its own | Move Method |
| **Inappropriate Intimacy** | Classes know too much about each other's internals | Move Method, Change Bidirectional to Unidirectional, Extract Class |
| **Refused Bequest** | Subclass doesn't use inherited methods | Push Down Method, Push Down Field |

## The Refactoring Process (Red-Green-Refactor)

The canonical TDD loop. Refactor is the third hat.

```
1. RED    — write a failing test for the next behavior
2. GREEN  — write the minimum code to pass (might be ugly, that's fine)
3. REFACTOR — clean up the GREEN code without changing behavior
   ↓ tests still pass
4. repeat
```

**When you discover a refactor mid-feature** (e.g., "I need to add a third type to this switch — let me convert it to polymorphism first"):
1. Commit current state (tests green).
2. Refactor (tests still green).
3. Commit refactor.
4. Now add the feature (red-green).
5. Commit feature.

Two commits, clean history, each commit leaves the codebase working.

## Tools

### IDE shortcuts (most leverage, least effort)

| Editor | Rename | Extract Function | Inline | Move |
|--------|--------|------------------|--------|------|
| VS Code | F2 | Ctrl+. (Quick Fix) | Ctrl+. | Alt+↑/↓ |
| JetBrains | Shift+F6 | Ctrl+Alt+M | Ctrl+Alt+N | F6 |
| Vim + LSP | `<leader>rn` | `<leader>ext` | `<leader>inl` | manual |

Use them. Manual find-replace for renames is a bug factory.

### Codemods (large-scale refactors)

When the refactor touches hundreds of files and IDE shortcuts fall short:

- **jscodeshift** (JS/TS): write a transform, run on codebase
- **comby** (any language): structural search and replace
- **Codemod.com** (Python, Java, Go): hosted platform with templates
- **OpenRewrite** (Java): automated framework migrations (Spring Boot 2→3, JUnit 4→5)
- **ts-morph** (TypeScript): AST manipulation in Node

Example: rename `getUserById` to `findUserById` across 200 files with confidence.

```bash
# jscodeshift example
jscodeshift -t transforms/rename-getUserById.js src/
```

## Pair With

- `tdd-workflow` — red-green-refactor discipline; tests are the safety net
- `testing-patterns` — what good tests look like (you need them before refactoring)
- `coding-standards` — naming, immutability, KISS/DRY principles that guide refactor decisions
- `code-reviewer` — review a refactor PR for completeness (any behavior change hidden?)
- `code-quality-analyzer` (mode: simplify) — can invoke this skill to apply the catalog mechanically
- `code-quality-analyzer` (mode: silent-failures) — after refactor, hunt for swallowed errors introduced by accident
