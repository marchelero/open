---
name: frontend-patterns
description: "Use this skill when designing, reviewing, or implementing React, JSX, or TSX components and UI architecture."
triggers: [React, JSX, TSX, hooks, useState, useEffect, useMemo, form, component, render]
origin: starter-pack
---

# Frontend Patterns

React-specific conventions layered on top of `coding-standards`. This is the detailed playbook for components, hooks, and UI architecture. Not for Flutter/SwiftUI/native (use the relevant language-specific agent). For *deep* performance work (rerender prevention, bundle, hydration, server-component waterfalls) load `vercel-react-best-practices` too — this skill keeps the architectural floor, that one the perf rule set.

## When to Activate

- Designing new components or refactoring existing ones
- Reviewing React component code for hook correctness, render performance, or accessibility
- Building forms with validation and error handling
- Implementing state management (local, lifted, global store)
- Optimizing render performance (memo, callbacks, lazy loading)
- Establishing component composition patterns (compound, render props, slots)
- Setting up styling architecture (CSS modules, Tailwind, CSS-in-JS)

## Component Composition

### Composition Over Configuration

```tsx
// PASS: Composable, flexible
<Card>
  <Card.Header>
    <Card.Title>Orders</Card.Title>
  </Card.Header>
  <Card.Body>{children}</Card.Body>
  <Card.Footer>
    <Button onClick={onSave}>Save</Button>
  </Card.Footer>
</Card>

// FAIL: Prop explosion, rigid
<Card title="Orders" body={children} footerButton="Save" onFooterClick={onSave} />
```

Compound components via `React.Context` work well when 3+ sub-parts share state. For 1-2 sub-parts, just use children.

### Children as the API

```tsx
// PASS: Children describe what the parent renders
<DataTable rows={rows} columns={columns} getRowKey={r => r.id}>
  {(row) => <Row key={row.id} {...row} />}
</DataTable>

// FAIL: Parent decides the row shape
<DataTable rows={rows} columns={columns} renderRow={r => ({ id: r.id, name: r.name, ...r })} />
```

### Render Props and Slots

Use render props only when children cannot express the customization (rare). Prefer `children` and named props (`header`, `footer`, `empty`).

## Hooks

### Rules

- Call at the top level. Never inside conditions, loops, or callbacks.
- Custom hooks start with `use`. Lint rule: `react-hooks/rules-of-hooks`.
- Dependency arrays must be exhaustive. Lint rule: `react-hooks/exhaustive-deps`.

### Custom Hook Extraction

Extract a custom hook when:
- The same stateful logic appears in 2+ components.
- A component has 3+ `useState` / `useEffect` calls that are conceptually one thing.
- Side effects need to be testable in isolation.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
```

### useEffect Boundaries

`useEffect` is for synchronizing with an external system (network, DOM, subscription, timer). It is NOT for:
- Deriving values from props/state — compute during render.
- Responding to user events — use the event handler.
- Triggering data fetches on mount — use a data-fetching library or `useEffect` only when SSR-safe.

### Stable References

Pass stable references down to memoized children:

```tsx
// PASS: Stable callback
const handleClick = useCallback((id: string) => { ... }, [dependency])

// PASS: Stable object
const config = useMemo(() => ({ theme, locale }), [theme, locale])
```

Do not memoize everything. Memoize when the child is expensive AND the reference would otherwise change every render.

## State Management

### Local First

State should live at the lowest component that needs it. Lift only when:
- Two siblings need it.
- A deeply nested component needs it AND a parent does not.

### State Categories

| Type | Tool | When |
|------|------|------|
| Ephemeral UI | `useState` | Open/closed, focused, draft input |
| Form state | `react-hook-form` / `formik` | Multi-field, validation, dirty tracking |
| Server state | `tanstack-query` / `swr` | Fetched, cached, revalidated |
| Global client | `zustand` / `jotai` / context | Cross-tree, infrequent updates |
| URL state | `useSearchParams` | Filters, tabs, pagination, shareable links |

Never store server data in `useState` + `useEffect` — it duplicates what `tanstack-query` already handles (cache, dedup, refetch, retry, stale-while-revalidate).

### Reducers for Complex Local State

Use `useReducer` when state transitions have 3+ named actions, or when next state depends on previous.

## Forms

### Library or Hand-Rolled

For 1-2 fields with simple validation, native HTML + state is fine. For 3+ fields, conditional fields, async validation, multi-step, or file uploads, use `react-hook-form` + `zod`.

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.literal(true),
})

type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
})
```

### Validation Timing

- Schema validation on submit (always).
- Field-level validation on blur (UX).
- Inline format hints on focus (rare; sometimes annoying).

## Rendering Performance

### Memoization Decision Tree

1. Is the child expensive to render? (large list, deep tree, complex computation)
2. Do its props change every render? (new object/array/function)
3. If yes to both, memoize the child (`React.memo`) and stabilize props (`useCallback`, `useMemo`).

If no, do not memoize — `useMemo` itself has cost.

### Lists

- Always provide a stable `key` (id, not index).
- Virtualize lists > 100 items (`@tanstack/react-virtual`).
- Avoid inline arrow functions as list item handlers — extract to a stable callback.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,   // estimated row height
    overscan: 5,               // extra rows rendered outside the viewport
  })

  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(row => (
          <div
            key={row.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${row.size}px`,
              transform: `translateY(${row.start}px)`,
            }}
          >
            <Row item={items[row.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

The scroll container must have a bounded height — a virtualizer inside an auto-height parent renders nothing.

### Lazy Loading

```tsx
const HeavyChart = lazy(() => import('./HeavyChart'))

<Suspense fallback={<ChartSkeleton />}>
  {showChart && <HeavyChart data={data} />}
</Suspense>
```

### Bundle Size

- Route-level splitting is mandatory for non-trivial apps.
- Component-level splitting is for > 50KB components used conditionally.
- Check bundle with `rollup-plugin-visualizer` or `@next/bundle-analyzer`.

## Error Boundary

React does not catch render errors in production without a boundary — one bad component white-screens the page.

```tsx
interface BoundaryState { hasError: boolean; error: Error | null }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, info.componentStack)   // Sentry / logger
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Placement rules:
- One boundary per route/section, not one global — a localized fallback keeps the rest of the app usable.
- Wrap risky subtrees (rich editors, charts, third-party widgets), not every component.
- Boundaries catch render/lifecycle errors. They do **not** catch async handlers, event handlers, `setTimeout`, or SSR-side errors.
- Reset state on navigation so a failed section does not stay stuck behind "Try again".

## Accessibility (Quick Checklist)

- All interactive elements are `<button>`, `<a>`, or have `role` + `tabIndex`.
- All form inputs have `<label htmlFor>` or wrap with label.
- All images have `alt` (empty `alt=""` for decorative).
- Color is not the only signal (icons, text, or shape too).
- Keyboard navigation works (Tab, Enter, Escape, Arrow keys for menus/comboboxes).
- Focus is visible (`focus-visible:ring-2` or similar).
- Headings form a single h1 → h2 → h3 hierarchy.
- Live regions for async content (`aria-live="polite"` for status, `assertive` for errors).

### Focus Management

Focus is a real state — moving it is part of every overlay interaction.

```tsx
function Modal({ isOpen, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement
      dialogRef.current?.focus()
      return () => previousFocus.current?.focus()   // restore on close
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  )
}
```

Rules:
- Save `document.activeElement` before opening; restore it on close (the `cleanup` of the effect, not the `else` branch).
- Trap Tab inside the dialog; `Escape` closes; the dialog itself is `tabIndex={-1}` so it can receive initial focus.
- Non-modal overlays (menus, popovers) close on outside click and `Escape`, but do not trap focus.
- Never remove focus outlines — use `focus-visible` so pointer users do not see rings.

### Keyboard Navigation for Composite Widgets

```tsx
const onKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); setActive(i => Math.min(i + 1, options.length - 1)); break
    case 'ArrowUp':   e.preventDefault(); setActive(i => Math.max(i - 1, 0)); break
    case 'Home':      e.preventDefault(); setActive(0); break
    case 'End':       e.preventDefault(); setActive(options.length - 1); break
    case 'Enter':     e.preventDefault(); onSelect(options[active]); break
    case 'Escape':    onClose(); break
  }
}
```

Expose the state to AT: `role="combobox"`/`listbox` + `aria-expanded`, `aria-activedescendant` for the active option.

## Animation Patterns

Prefer CSS transitions for simple state changes; reach for `framer-motion` when you need exit animations, layout transitions, or gesture-driven motion.

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// List item enter/exit — AnimatePresence is required for exit to run
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      {item.body}
    </motion.div>
  ))}
</AnimatePresence>

// Overlay: animate the backdrop and the panel separately
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog" aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

Rules:
- Animate `opacity` and `transform` only — they are compositor-friendly; `width`/`top`/`margin` trigger layout on every frame.
- Wrap entrance/exit pairs in `AnimatePresence`; without it, `exit` never fires.
- Honor `@media (prefers-reduced-motion: reduce)` — disable travel distance and duration, keep opacity fades.
- Motion must not delay interaction: content is usable before the animation completes.
- Keep durations 100–300ms for UI feedback; longer only for narrative/hero moments.

## Styling Patterns

| Approach | When |
|----------|------|
| Tailwind | New project, small team, want fast iteration |
| CSS Modules | Existing CSS, want scoped styles without runtime cost |
| CSS-in-JS (vanilla-extract, styled-components) | Design system, dynamic styles, SSR |
| Inline styles | Dynamic computed values (rare) |

Avoid mixing 2+ approaches in the same codebase. Pick one as the default.

## Anti-Patterns

- **Prop drilling > 2 levels** — lift to context or a store.
- **useEffect for data fetching** — use `tanstack-query` / `swr` / framework loader.
- **Derived state in `useState`** — compute during render.
- **Massive `useEffect` with 10+ dependencies** — split into focused effects.
- **Direct DOM access for state** — use refs only for non-state (focus, scroll).
- **`index` as key** — breaks when list reorders, animates, or has stateful items.
- **Inline `style={{...}}` for theming** — use CSS variables or theme provider.
- **Ternary chains in JSX** — extract to named components or variables.
- **No error boundary around risky subtrees** — one render error white-screens the whole route.
- **Animating layout properties** — `width`/`height`/`top` cause reflow; transform and opacity only.
- **Focus lost after closing a modal** — the user's keyboard lands back at `<body>`.
