# HIVE Visual Upgrade — Phase 1b (part ii): Route-level loading states Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every high-traffic dashboard route an instant, content-shaped loading skeleton, so navigation stops feeling like the app froze.

**Architecture:** A small set of composable skeleton building blocks (`components/ui/skeletons.tsx`) built on the existing, currently-unused `Skeleton` primitive, then one Next.js `loading.tsx` per route composing the blocks into that route's real shape. `loading.tsx` is a framework file convention: App Router renders it instantly while the route's server component awaits its data, with no client-side state or wiring needed. This is purely additive — no existing component or page is modified except one literal "Loading…" string.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, vitest + Testing Library.

## Global Constraints

- No new dependencies.
- **Purely additive.** Every task except Task 6 creates new files only. No existing page, component, or style is modified — so there is no possible visual regression to any already-working screen.
- Every new component gets a test written and confirmed RED before implementation (TDD).
- Skeletons must be built from the existing `Skeleton` primitive (`components/ui/skeleton.tsx`), not hand-rolled `<div>`s with their own `animate-pulse`.
- **Reduced motion is already handled globally** — `styles/animations.css`'s `@media (prefers-reduced-motion: reduce)` block clamps *all* animations app-wide, including `Skeleton`'s `animate-pulse`. Do NOT add per-component reduced-motion handling; it would be redundant.
- Skeleton markup must not read as a wall of empty elements to a screen reader: the decorative placeholder bars are `aria-hidden`, with a single `role="status"` + visually-hidden text label announcing what is loading.
- `prettier`, `eslint`, `vitest` (full suite), and `next build` must all pass clean before the final commit/PR.

---

### Task 1: Skeleton building blocks

**Files:**
- Create: `components/ui/skeletons.tsx`
- Test: `components/ui/skeletons.test.tsx`

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/skeleton` (existing, unchanged — a `<div data-slot="skeleton" class="animate-pulse rounded-md bg-muted">`).
- Produces, all used by Tasks 2–5:
  - `LoadingRegion({ label: string, children: React.ReactNode })`
  - `PageHeaderSkeleton()`
  - `StatTilesSkeleton({ count?: number })` — default 3
  - `ListSkeleton({ rows?: number })` — default 5
  - `CardGridSkeleton({ cards?: number })` — default 6
  - `TableSkeleton({ rows?: number })` — default 6

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/skeletons.test.tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  CardGridSkeleton,
  ListSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatTilesSkeleton,
  TableSkeleton,
} from './skeletons'

function countPlaceholders(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="skeleton"]').length
}

describe('LoadingRegion', () => {
  it('announces what is loading through a status role', () => {
    render(
      <LoadingRegion label="Loading overview">
        <PageHeaderSkeleton />
      </LoadingRegion>
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading overview')).toBeInTheDocument()
  })

  it('hides the decorative placeholders from assistive tech', () => {
    const { container } = render(
      <LoadingRegion label="Loading overview">
        <PageHeaderSkeleton />
      </LoadingRegion>
    )
    const decorative = container.querySelector('[aria-hidden="true"]')
    expect(decorative).not.toBeNull()
    expect(countPlaceholders(decorative as HTMLElement)).toBeGreaterThan(0)
  })
})

describe('skeleton building blocks', () => {
  it('renders a title and subtitle bar for the page header', () => {
    const { container } = render(<PageHeaderSkeleton />)
    expect(countPlaceholders(container)).toBe(2)
  })

  it('renders three stat tiles by default, each with a label and value bar', () => {
    const { container } = render(<StatTilesSkeleton />)
    expect(countPlaceholders(container)).toBe(6)
  })

  it('honours an explicit stat tile count', () => {
    const { container } = render(<StatTilesSkeleton count={2} />)
    expect(countPlaceholders(container)).toBe(4)
  })

  it('renders five list rows by default, each with a label and trailing bar', () => {
    const { container } = render(<ListSkeleton />)
    expect(countPlaceholders(container)).toBe(10)
  })

  it('honours an explicit list row count', () => {
    const { container } = render(<ListSkeleton rows={3} />)
    expect(countPlaceholders(container)).toBe(6)
  })

  it('renders six cards by default', () => {
    const { container } = render(<CardGridSkeleton />)
    expect(countPlaceholders(container)).toBe(24)
  })

  it('honours an explicit card count', () => {
    const { container } = render(<CardGridSkeleton cards={2} />)
    expect(countPlaceholders(container)).toBe(8)
  })

  it('renders a header row plus six body rows by default', () => {
    const { container } = render(<TableSkeleton />)
    expect(countPlaceholders(container)).toBe(28)
  })

  it('honours an explicit table row count', () => {
    const { container } = render(<TableSkeleton rows={2} />)
    expect(countPlaceholders(container)).toBe(12)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/skeletons.test.tsx`
Expected: FAIL — `Cannot find module './skeletons'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/skeletons.tsx
import { Skeleton } from '@/components/ui/skeleton'

// Composable placeholders shaped like the app's real content, for use in
// route-level loading.tsx files. Reduced motion needs no handling here --
// styles/animations.css clamps every animation app-wide, including
// Skeleton's animate-pulse.

// A screen reader should hear "Loading projects" once, not a wall of empty
// boxes -- so the placeholders are hidden and a single status label speaks
// for them.
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-8">
        {children}
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  )
}

// Matches the Overview page's bordered, divided 3-across figure row.
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid divide-y rounded-md border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  )
}

// Matches the divide-y bordered lists used for deadlines, activity, tasks,
// and notifications.
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y rounded-md border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 p-3">
          <Skeleton className="h-4 w-full max-w-64" />
          <Skeleton className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// Matches ProjectDirectory / BoardPicker's card grid.
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Matches the Files table's four-column grid.
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[minmax(0,1fr)_150px_90px_170px] gap-3 bg-muted/50 px-4 py-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-14" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_150px_90px_170px] items-center gap-3 border-t px-4 py-3"
        >
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/skeletons.test.tsx`
Expected: PASS (11 tests)

- [ ] **Step 5: Prettier + commit**

```bash
npx prettier --write components/ui/skeletons.tsx components/ui/skeletons.test.tsx
git add components/ui/skeletons.tsx components/ui/skeletons.test.tsx
git commit -m "Add skeleton building blocks for route loading states"
```

---

### Task 2: Loading states for the list-shaped routes

**Files:**
- Create: `app/dashboard/my-tasks/loading.tsx`
- Create: `app/dashboard/inbox/loading.tsx`
- Create: `app/dashboard/search/loading.tsx`

**Interfaces:**
- Consumes (from Task 1): `LoadingRegion`, `PageHeaderSkeleton`, `ListSkeleton` from `@/components/ui/skeletons`

No test. These are declarative composition-only framework files with no logic or branching — this codebase has no precedent for unit-testing a `page.tsx`/`layout.tsx`-class file either. Verified by `next build` (Task 7) and the live-browser check.

- [ ] **Step 1: Create the My Tasks loading state**

```tsx
// app/dashboard/my-tasks/loading.tsx
import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading my tasks">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </LoadingRegion>
  )
}
```

- [ ] **Step 2: Create the Inbox loading state**

```tsx
// app/dashboard/inbox/loading.tsx
import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading inbox">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </LoadingRegion>
  )
}
```

- [ ] **Step 3: Create the Search loading state**

```tsx
// app/dashboard/search/loading.tsx
import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading search results">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </LoadingRegion>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npx eslint app/dashboard/my-tasks/loading.tsx app/dashboard/inbox/loading.tsx app/dashboard/search/loading.tsx`
Expected: clean

- [ ] **Step 5: Prettier + commit**

```bash
npx prettier --write app/dashboard/my-tasks/loading.tsx app/dashboard/inbox/loading.tsx app/dashboard/search/loading.tsx
git add app/dashboard/my-tasks/loading.tsx app/dashboard/inbox/loading.tsx app/dashboard/search/loading.tsx
git commit -m "Add loading states for list-shaped dashboard routes"
```

---

### Task 3: Loading state for Overview

**Files:**
- Create: `app/dashboard/overview/loading.tsx`

**Interfaces:**
- Consumes (from Task 1): `LoadingRegion`, `PageHeaderSkeleton`, `StatTilesSkeleton`, `ListSkeleton` from `@/components/ui/skeletons`

No test — same rationale as Task 2.

- [ ] **Step 1: Create the Overview loading state**

Mirrors the real page's structure (`app/dashboard/overview/page.tsx`): header, then a 3-across stat row, then a two-column pair of bordered lists (upcoming deadlines / recent activity).

```tsx
// app/dashboard/overview/loading.tsx
import {
  ListSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatTilesSkeleton,
} from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading overview">
      <PageHeaderSkeleton />
      <StatTilesSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <Skeleton className="h-5 w-44" />
          </div>
          <ListSkeleton rows={4} />
        </div>
        <div className="space-y-3">
          <div className="border-b pb-2">
            <Skeleton className="h-5 w-36" />
          </div>
          <ListSkeleton rows={4} />
        </div>
      </div>
    </LoadingRegion>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx eslint app/dashboard/overview/loading.tsx`
Expected: clean

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write app/dashboard/overview/loading.tsx
git add app/dashboard/overview/loading.tsx
git commit -m "Add Overview loading state"
```

---

### Task 4: Loading states for the card-grid, table, and calendar routes

**Files:**
- Create: `app/dashboard/projects/loading.tsx`
- Create: `app/dashboard/board/loading.tsx`
- Create: `app/dashboard/files/loading.tsx`
- Create: `app/dashboard/calendar/loading.tsx`

**Interfaces:**
- Consumes (from Task 1): `LoadingRegion`, `PageHeaderSkeleton`, `CardGridSkeleton`, `TableSkeleton` from `@/components/ui/skeletons`; `Skeleton` from `@/components/ui/skeleton`

No test — same rationale as Task 2.

- [ ] **Step 1: Create the Projects loading state**

```tsx
// app/dashboard/projects/loading.tsx
import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading projects">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </LoadingRegion>
  )
}
```

- [ ] **Step 2: Create the Board picker loading state**

```tsx
// app/dashboard/board/loading.tsx
import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading boards">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </LoadingRegion>
  )
}
```

- [ ] **Step 3: Create the Files loading state**

```tsx
// app/dashboard/files/loading.tsx
import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading files">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </LoadingRegion>
  )
}
```

- [ ] **Step 4: Create the Calendar loading state**

The calendar renders one large month grid rather than a list, so it gets a single block placeholder sized to roughly match.

```tsx
// app/dashboard/calendar/loading.tsx
import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading calendar">
      <PageHeaderSkeleton />
      <Skeleton className="h-[32rem] w-full rounded-xl" />
    </LoadingRegion>
  )
}
```

- [ ] **Step 5: Verify**

Run: `npx eslint app/dashboard/projects/loading.tsx app/dashboard/board/loading.tsx app/dashboard/files/loading.tsx app/dashboard/calendar/loading.tsx`
Expected: clean

- [ ] **Step 6: Prettier + commit**

```bash
npx prettier --write app/dashboard/projects/loading.tsx app/dashboard/board/loading.tsx app/dashboard/files/loading.tsx app/dashboard/calendar/loading.tsx
git add app/dashboard/projects/loading.tsx app/dashboard/board/loading.tsx app/dashboard/files/loading.tsx app/dashboard/calendar/loading.tsx
git commit -m "Add loading states for project, board, files, and calendar routes"
```

---

### Task 5: Loading state for the project detail shell

**Files:**
- Create: `app/dashboard/projects/[projectId]/loading.tsx`

**Interfaces:**
- Consumes (from Task 1): `LoadingRegion`, `ListSkeleton` from `@/components/ui/skeletons`; `Skeleton` from `@/components/ui/skeleton`

No test — same rationale as Task 2.

This route's real chrome (`components/projects/project-shell.tsx`) is a project code line, an `h1`, and a horizontal sub-navigation row above the tab content, so the placeholder mirrors that rather than the generic page header.

- [ ] **Step 1: Create the project detail loading state**

```tsx
// app/dashboard/projects/[projectId]/loading.tsx
import { ListSkeleton, LoadingRegion } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading project">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <div className="flex gap-5 border-b pb-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <ListSkeleton rows={5} />
    </LoadingRegion>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx eslint "app/dashboard/projects/[projectId]/loading.tsx"`
Expected: clean

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write "app/dashboard/projects/[projectId]/loading.tsx"
git add "app/dashboard/projects/[projectId]/loading.tsx"
git commit -m "Add project detail loading state"
```

---

### Task 6: Replace the app's one literal "Loading…" string with a skeleton

**Files:**
- Modify: `components/settings/settings-forms.tsx` (the `TeamMemberProfileDialog` function's loading branch)

**Interfaces:**
- Consumes: `Skeleton` from `@/components/ui/skeleton` only. None of Task 1's page-level blocks are used here — this placeholder mirrors a stack of form fields inside an already-open dialog, not a page shape.

This is the only place in the app that renders a literal loading string. It sits inside an already-open dialog while `getProfile` resolves, so it replaces text with form-field-shaped placeholders.

**Note:** `components/settings/settings-forms.test.tsx` currently opens this dialog and waits for the loaded state; it queries by label/role, not by the "Loading…" text, so it must still pass unmodified. If it does not, stop — that means this change altered real behavior, which it must not.

- [ ] **Step 1: Add the import**

In `components/settings/settings-forms.tsx`, add alongside the other `@/components/ui/*` imports:

```tsx
import { Skeleton } from '@/components/ui/skeleton'
```

- [ ] **Step 2: Replace the loading branch**

Change:
```tsx
      {profile === undefined && <p className="text-sm text-muted-foreground">Loading…</p>}
```
to:
```tsx
      {profile === undefined && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Loading profile</span>
          <div aria-hidden="true" className="max-w-2xl space-y-4 rounded-xl border bg-card p-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      )}
```

- [ ] **Step 3: Run the existing test to confirm no regression**

Run: `npx vitest run components/settings/settings-forms.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 4: Prettier + commit**

```bash
npx prettier --write components/settings/settings-forms.tsx
git add components/settings/settings-forms.tsx
git commit -m "Replace the literal Loading text with a form-shaped skeleton"
```

---

### Task 7: Full verification, live-browser check, and ship

**Files:** none (verification only)

- [ ] **Step 1: Full verification gate**

```bash
npx vitest run
npx eslint .
npm run build
```

Expected: full suite passes (existing count plus Task 1's 11 new tests), eslint clean, build clean. In the build's route table, the new `loading.tsx` files do not appear as their own routes — they are part of their route's output, so their absence from that list is expected and not a sign they were missed.

- [ ] **Step 2: Live-browser verification**

Using the project's preview tooling (`hive-dev`), and given no test credentials are available for the authenticated dashboard, verify what can be verified without logging in:

- Confirm the build output contains the skeleton markup for at least one route by checking the compiled `loading` chunk exists, or by temporarily throttling and navigating if a session is available.
- With a session available, navigate between Overview → Projects → My Tasks → Files and confirm each shows a shaped placeholder rather than a frozen previous page, in both light and dark theme (skeletons use `bg-muted`, which now has a correct dark-mode value — verify the placeholder bars are actually visible against the dark canvas and not near-invisible).
- Confirm `prefers-reduced-motion` clamps the pulse: with the OS/browser reduced-motion setting on, the placeholders should be static rather than pulsing.

If no session is available, record that clearly rather than claiming visual verification that did not happen, and rely on the unit tests plus build.

- [ ] **Step 3: Push, open a PR, wait for the Vercel preview, then merge**

```bash
git push -u origin worktree-hive-projects
gh pr create --base master --head worktree-hive-projects --title "HIVE visual upgrade 1b (ii): route-level loading states" --body "$(cat <<'EOF'
## Summary
- Every high-traffic dashboard route now has a `loading.tsx` showing a content-shaped skeleton while its server component fetches. Previously there were **zero** `loading.tsx` files across 32 dashboard routes, so every navigation left the old page frozen on screen with no feedback until the new data arrived.
- Added composable skeleton building blocks (`components/ui/skeletons.tsx`) shaped like the app's real content -- page header, stat tiles, list rows, card grid, table -- built on the existing `Skeleton` primitive, which until now had no consumers anywhere.
- Replaced the app's single literal "Loading…" string (the team-member profile dialog) with a form-shaped skeleton.
- Accessibility: placeholders are `aria-hidden` behind one `role="status"` region with a visually-hidden label, so a screen reader hears "Loading projects" once instead of a wall of empty boxes. Reduced motion needs no new handling -- `styles/animations.css` already clamps every animation app-wide.

Purely additive apart from the one string replacement: no existing page or component was restyled, so there is no regression surface on already-working screens.

## Test plan
- [x] 11 new unit tests for the skeleton blocks (structure + count props + the a11y contract), TDD RED→GREEN
- [x] Full suite, eslint, and `next build` all clean
- [x] The one modified file's existing test suite passes unmodified

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Wait for the `Vercel` check to report `SUCCESS` (poll `gh pr checks <number>`), then:

```bash
gh pr merge <number> --merge --delete-branch=false
```

---

## What's next

Remaining Phase 1b scope, each getting its own plan:

- **Empty-states audit** (spec §9). Deliberately excluded here: this plan is about *loading*, and auditing existing empty states across Board/Files/Search/Inbox for consistency is a separate, modification-heavy pass with a real regression surface — the opposite of this plan's purely-additive shape. Worth doing, worth doing separately.
- **Density tightening** (spec §6): table row, nav item, and card padding.
- **`--motion-fast` on hover/press/focus micro-interactions** (spec §6).
- **Button/Input dark-mode variant audit** (spec §8) — partly discharged already: a prior whole-branch review traced each existing `dark:` variant against the real palette and found they resolve to faint-but-harmless alpha tints, so this is now a low-priority confirmation pass rather than a suspected-bug hunt.
