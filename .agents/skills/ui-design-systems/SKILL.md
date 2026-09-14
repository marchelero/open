---
name: ui-design-systems
description: Use when building or reviewing UI that needs visual consistency — design tokens (color, space, type scale), spacing rhythm, typographic hierarchy, dark mode via semantic tokens, interactive states (hover/focus/active/disabled), component variants API, and layout-shift prevention. Covers the visual layer only; for component architecture and hooks correctness use frontend-patterns. Pairs with a11y-architect for contrast and focus requirements.
triggers: [design system, design tokens, spacing, typography, color palette, dark mode, theme, hover state, focus ring, visual consistency, brand, ui polish, css variables, tailwind tokens, contrast, type scale]
origin: starter-pack
---

# UI Design Systems

The difference between "AI-generated looking UI" and "designed UI" is almost never the components — it's the tokens. Same buttons; one product picked a type scale, an 8px rhythm, and a real dark mode, the other free-styled 47 different grays.

## When to Activate

- New UI surface (landing, dashboard, modal flow) with no existing token set
- Reviewing UI PRs where "something looks off" is the only complaint
- Adding dark mode / theming
- Component API design: how many variants does Button actually need?
- Auditing a product's visual drift (too many grays, too many font sizes, inconsistent gaps)
- Handing off between agents: frontend-patterns builds it, this skill makes it consistent

## Do Not Activate For

- Aesthetic direction / distinctive visual identity for a new surface → `frontend-design` (this skill builds the system it draws from)
- Component architecture, state, hooks, server/client boundaries → `frontend-patterns`
- Keyboard/screen-reader/contrast **compliance** → `a11y-architect` agent (this skill designs to its floor)
- Backend or CLI surfaces
- Pure copywriting → marketing-agent

## The Token Stack (build in this order)

1. **Primitives** — raw values, never used in components directly:
   `gray-50…gray-950`, `brand-500`, `space-0…space-16` (4px grid multiples).
2. **Semantic aliases** — the only layer components touch:
   `surface: {base, raised, overlay}`, `text: {primary, secondary, muted, onAccent}`, `border: {subtle, strong}`, `accent: {default, hover, active}`, `state: {danger, warn, success}`.
3. **Component tokens** (only when 3+ components need the same number): `button-radius`, `card-shadow`.

Dark mode is then a pure alias swap — one `[data-theme=dark] { --surface-base: …; }` block, zero `isDark` branches in components. If a component reaches for a primitive (`text-gray-400`), the audit fails.

## The Four Scales That Make UI Look Designed

| Scale | Values | Rule |
|---|---|---|
| Space | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 | gaps between related items < gaps between groups |
| Type | 12 / 14 / 16 / 20 / 24 / 30 / 36 / 48 | ratio ≈ 1.25 steps; **body stays 16px (14 on dense dashboards)** |
| Radius | 4 (inputs) / 8 (cards/buttons) / 16 (sheets/modals) / full (pills) | one system, pick and keep |
| Elevation | none / shadow-sm (cards) / shadow-lg (popovers/modals) | max 2 levels visible at once |

Proximity is the whole game: `margin-bottom` on a heading (8), `margin-top` on a paragraph (16) — related things hug, unrelated things breathe.

## Interactive States (every element gets all six)

```
default → hover → focus-visible → active → disabled → loading
```

- `:focus-visible` ring must be visible on the page's **background**, not assumed — 2px outline + 2px offset, accent color.
- Hover on touch devices is a lie: hover styles must be wrapped in `@media (hover: hover)` so they don't stick after taps.
- Disabled = reduced contrast (≥4.5:1 still for text) + `cursor-not-allowed` + no pointer events; never just `opacity-50` on clickable text.
- Loading state is a **skeleton of the same height**, not a spinner that grows the layout.

## Motion Defaults

- Durations: 120–200ms micro (hover/press), 240–320ms entrance, 400ms+ only for hero moments.
- Easing: `ease-out` for things entering, `ease-in` for exiting; custom cubic-bezier for anything springy.
- Animate only `transform`/`opacity` (compositor-only). `width/height/margin` animation = jank + layout shift.
- Respect `prefers-reduced-motion`: replace movement with opacity fades; keep opacity fades.

## Layout Shift (CLS)

- Every image/embed gets width+height (or `aspect-ratio`).
- Reserve space for async content with skeletons before it loads, not after.
- Sticky/fixed headers: don't inject banners above content — overlay them.

## Component Variant API (cva-style, framework-agnostic)

```ts
const button = cva('rounded-lg font-medium transition-colors focus-visible:outline-2', {
  variants: {
    intent: { primary: 'bg-accent text-onAccent hover:bg-accent-hover',
              secondary: 'bg-surface text-primary border hover:border-strong',
              ghost: 'text-primary hover:bg-surface-raised' },
    size: { sm: 'h-8 px-3 text-14', md: 'h-10 px-4 text-16', lg: 'h-12 px-6 text-18' },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
})
```

Rules: ≤3 intents, ≤3 sizes per component family. A 4th variant is a design smell — merge concepts.

## Audit Routine (existing UI)

1. `rg "gray-|slate-|zinc-" -c` across the app — 4+ shades of "gray" → collapse to semantic aliases.
2. Screenshot every surface, paste into one grid — the seams (gaps, font sizes, radii) are instantly visible.
3. Toggle dark mode mid-flow → anything unreadable is an alias bug, not a color bug.
4. Tab through once — every interactive element needs a visible `:focus-visible`.

## Rules

- Components consume semantic tokens only; primitives live in one theme file.
- One font, ≤6 sizes for 95% of the UI; weight (500/600) earns its place over size.
- Contrast floor: text ≥4.5:1, large text ≥3:1, UI borders/icons ≥3:1 (a11y-architect verifies).
- Touch targets ≥44×44px even when the visual box is smaller.
- Spacing decisions follow content, not the grid's ego: a label sits 6–8px above its input because they belong together.
- New colors go through the semantic layer; no one-off hex in a component, ever.

## Anti-Patterns

- `isDark` boolean threaded through props instead of CSS-variable theming.
- Three spacing systems in one file (margin + padding + gap + `mt-2` ad-hoc mix).
- Glassmorphism/gradient text as personality over clear hierarchy.
- Hover-only affordances (row actions that never appear for keyboard or touch users).
- Loading spinners that change layout height (CLS generator).
- "Just make it bigger" typography answers — usually a hierarchy/spacing problem, not a size problem.

## Integration

- Related skills: `frontend-design` (aesthetic direction on top of these tokens), `frontend-patterns` (structure — this skill skins it), `coding-standards` (naming), `file-search` (token audit searches).
- Related agents: `a11y-architect` (design the floor, it verifies), `react-reviewer`/`vue-reviewer` (they flag violations of both skills).
- Related commands: `/code-review` on UI PRs.

## Quick Example

Task: "the settings page looks cluttered."
Diagnosis via the four scales: section gaps (16px) ≤ label→input gaps (12px) — proximity inverted. Fix: sections `gap-24`, internal `gap-8`; card headers `text-20 semibold`, descriptions `text-14 muted`. Same components, zero color changes, 20 minutes.
