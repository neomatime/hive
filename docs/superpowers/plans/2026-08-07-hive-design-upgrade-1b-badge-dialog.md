# HIVE Visual Upgrade — Phase 1b (part i): Badge + Dialog primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize two currently-ad-hoc UI patterns — status/priority pills and modal dialogs — into shared `components/ui/badge.tsx` and `components/ui/dialog.tsx` primitives, and migrate every existing call site to them.

**Architecture:** `Badge` is a small presentational component with 5 variants (neutral + 4 semantic: danger/warning/success/info), styled with the `--danger-bg`/`--warning-bg`/`--success-bg`/`--info-bg` tokens already shipped in Phase 1a. `Dialog` extracts the overlay+panel shell duplicated across 4 existing modal implementations (`fixed inset-0` overlay, `role="dialog"` panel) into one component, preserving each call site's exact current behavior (width, overflow, click-outside-to-close) via props — this is a pure extraction, not a UX change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, vitest + Testing Library.

## Global Constraints

- No new dependencies.
- No behavior/UX changes anywhere — every migration must preserve the exact current appearance and interaction of the call site it touches. This is a refactor (de-duplication + design-token correctness), not a redesign.
- Every new component gets a test written and confirmed RED before implementation (TDD).
- Existing tests for migrated files must still pass unmodified (query by role/label/text, not implementation detail) — if one doesn't, that's a signal the migration changed real behavior, not a reason to edit the test.
- `prettier`, `eslint`, `vitest` (full suite), and `next build` must all pass clean before the final commit/PR.
- **Deviation from the spec, documented here rather than silently dropped:** the spec (`docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md` §8) also lists a `Tabs` component for this phase. No tab-like navigation exists anywhere in the current app (confirmed via full-codebase search) — Settings, the one place the spec speculated tabs might apply, is a card-grid landing page linking to sub-routes, not a tab bar. Building a shared component with zero real consumers is speculative infrastructure (YAGNI). This plan amends the spec (Task 11) to defer `Tabs` until a real tab-like UI need exists, rather than building it unused.

---

### Task 1: `Badge` component

**Files:**
- Create: `components/ui/badge.tsx`
- Test: `components/ui/badge.test.tsx`

**Interfaces:**
- Produces: `export type BadgeVariant = 'neutral' | 'danger' | 'warning' | 'success' | 'info'`; `Badge({ variant?: BadgeVariant, className?: string, children: React.ReactNode })` — a `<span>` styled as a small rounded pill.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/badge.test.tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Archived</Badge>)
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('defaults to the neutral variant styling', () => {
    render(<Badge>Archived</Badge>)
    expect(screen.getByText('Archived')).toHaveClass('bg-muted', 'text-muted-foreground')
  })

  it('applies semantic variant colors via CSS custom properties, not hardcoded hex', () => {
    render(<Badge variant="danger">Urgent</Badge>)
    const el = screen.getByText('Urgent')
    expect(el.style.color).toBe('var(--danger)')
    expect(el.style.background).toBe('var(--danger-bg)')
  })

  it('merges a caller-supplied className with its own', () => {
    render(<Badge className="shrink-0">Low</Badge>)
    expect(screen.getByText('Low')).toHaveClass('shrink-0', 'rounded-full')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/badge.test.tsx`
Expected: FAIL — `Cannot find module './badge'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/badge.tsx
import { cn } from '@/lib/utils'

export type BadgeVariant = 'neutral' | 'danger' | 'warning' | 'success' | 'info'

// Semantic variants use inline style (CSS custom properties), not Tailwind
// utility classes -- these colors aren't registered in the @theme block, and
// the *-bg tokens already carry the correct light/dark tint (see
// styles/theme.css's :root and .dark blocks, shipped in Phase 1a).
const variantStyle: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {},
  danger: { color: 'var(--danger)', background: 'var(--danger-bg)' },
  warning: { color: 'var(--warning)', background: 'var(--warning-bg)' },
  success: { color: 'var(--success)', background: 'var(--success-bg)' },
  info: { color: 'var(--info)', background: 'var(--info-bg)' },
}

export function Badge({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variant === 'neutral' && 'bg-muted text-muted-foreground',
        className
      )}
      style={variantStyle[variant]}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/badge.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Prettier + commit**

```bash
npx prettier --write components/ui/badge.tsx components/ui/badge.test.tsx
git add components/ui/badge.tsx components/ui/badge.test.tsx
git commit -m "Add Badge component"
```

---

### Task 2: `Dialog` component

**Files:**
- Create: `components/ui/dialog.tsx`
- Test: `components/ui/dialog.test.tsx`

**Interfaces:**
- Produces: `Dialog({ labelledBy: string, onClose: () => void, closeOnOverlayClick?: boolean (default true), className?: string, children: React.ReactNode })` — renders the `fixed inset-0` overlay + `role="dialog"` panel shell.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/dialog.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './dialog'

describe('Dialog', () => {
  it('renders its children inside a labelled dialog role', () => {
    render(
      <Dialog labelledBy="my-title" onClose={vi.fn()}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'my-title')
    expect(screen.getByText('My dialog')).toBeInTheDocument()
  })

  it('closes on overlay click by default', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    // The overlay is the dialog role's parent -- click it directly, not the panel.
    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on overlay click when closeOnOverlayClick is false', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose} closeOnOverlayClick={false}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    await userEvent.click(screen.getByRole('dialog').parentElement!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close when clicking inside the panel', async () => {
    const onClose = vi.fn()
    render(
      <Dialog labelledBy="my-title" onClose={onClose}>
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    await userEvent.click(screen.getByText('My dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies a caller-supplied className to the panel, replacing the default', () => {
    render(
      <Dialog labelledBy="my-title" onClose={vi.fn()} className="max-w-2xl">
        <h2 id="my-title">My dialog</h2>
      </Dialog>
    )
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/dialog.test.tsx`
Expected: FAIL — `Cannot find module './dialog'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/ui/dialog.tsx
'use client'

import { cn } from '@/lib/utils'

// Extracted from 4 call sites that each hand-rolled this same overlay+panel
// shell (task-detail-dialog, create-project-dialog, create-calendar-event,
// the team-member profile editor in settings-forms). closeOnOverlayClick and
// className default to what most of them already had; the two call sites
// that differ pass their own values explicitly (see the migration tasks).
export function Dialog({
  labelledBy,
  onClose,
  closeOnOverlayClick = true,
  className = 'w-full max-w-lg rounded-xl bg-background p-6 shadow-xl',
  children,
}: {
  labelledBy: string
  onClose: () => void
  closeOnOverlayClick?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={
        closeOnOverlayClick
          ? (event) => {
              if (event.target === event.currentTarget) onClose()
            }
          : undefined
      }
    >
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={cn(className)}>
        {children}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/dialog.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Prettier + commit**

```bash
npx prettier --write components/ui/dialog.tsx components/ui/dialog.test.tsx
git add components/ui/dialog.tsx components/ui/dialog.test.tsx
git commit -m "Add Dialog component"
```

---

### Task 3: Migrate task priority to `Badge` in `components/tasks/task-card.tsx`

**Files:**
- Modify: `components/tasks/task-card.tsx`

**Interfaces:**
- Consumes (from Task 1): `Badge`, `BadgeVariant` from `@/components/ui/badge`

No new test — existing `components/tasks/task-card.test.tsx` covers this component's structure/behavior and must still pass unmodified (text content and role are unchanged; only the wrapping element and its color styling change).

- [ ] **Step 1: Apply the change**

In `components/tasks/task-card.tsx`, add imports:

```tsx
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import type { TaskPriority } from '@/types/project'
```

Add this constant above the `TaskCard` function:

```tsx
const priorityVariant: Record<TaskPriority, BadgeVariant> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
}
```

Change:
```tsx
        <span className="eyebrow shrink-0">{task.priority}</span>
```
to:
```tsx
        <Badge variant={priorityVariant[task.priority]} className="shrink-0 uppercase">
          {task.priority}
        </Badge>
```

(`uppercase`, not `capitalize` — the removed `.eyebrow` class rendered priority in caps; matching that exactly keeps this a pure color/wrapper change with no visual regression.)

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/tasks/task-card.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/tasks/task-card.tsx
git add components/tasks/task-card.tsx
git commit -m "Migrate task priority indicator to Badge"
```

---

### Task 4: Migrate task status pill to `Badge` in `components/tasks/my-tasks-dashboard.tsx`

**Files:**
- Modify: `components/tasks/my-tasks-dashboard.tsx`

**Interfaces:**
- Consumes (from Task 1): `Badge` from `@/components/ui/badge`

No new test — existing `components/tasks/my-tasks-dashboard.test.tsx` must still pass unmodified.

- [ ] **Step 1: Apply the change**

In `components/tasks/my-tasks-dashboard.tsx`, add the import:

```tsx
import { Badge } from '@/components/ui/badge'
```

Change:
```tsx
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {task.statusName}
                  </span>
```
to:
```tsx
                  <Badge>{task.statusName}</Badge>
```

(Status names are workspace-defined free text, not a fixed semantic enum, so this intentionally stays the neutral variant — no color-by-status-name logic.)

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/tasks/my-tasks-dashboard.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/tasks/my-tasks-dashboard.tsx
git add components/tasks/my-tasks-dashboard.tsx
git commit -m "Migrate task status pill to Badge"
```

---

### Task 5: Migrate "Archived" pill to `Badge` in `components/settings/project-templates-manager.tsx`

**Files:**
- Modify: `components/settings/project-templates-manager.tsx`

**Interfaces:**
- Consumes (from Task 1): `Badge` from `@/components/ui/badge`

No new test — existing `components/settings/project-templates-manager.test.tsx` must still pass unmodified.

- [ ] **Step 1: Apply the change**

Add the import:

```tsx
import { Badge } from '@/components/ui/badge'
```

Change:
```tsx
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">Archived</span>
```
to:
```tsx
                    <Badge>Archived</Badge>
```

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/settings/project-templates-manager.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/settings/project-templates-manager.tsx
git add components/settings/project-templates-manager.tsx
git commit -m "Migrate Archived pill to Badge"
```

---

### Task 6: Migrate Connected/Not-connected pill to `Badge` in `components/settings/integrations-manager.tsx`

**Files:**
- Modify: `components/settings/integrations-manager.tsx`

**Interfaces:**
- Consumes (from Task 1): `Badge` from `@/components/ui/badge`

No existing test for this file, no new test added (pure presentational token swap, no new logic — consistent with this codebase's existing coverage boundaries). Verified via `npx eslint` + `npm run build` + manual read-through.

- [ ] **Step 1: Apply the change**

Add the import:

```tsx
import { Badge } from '@/components/ui/badge'
```

Change:
```tsx
              <span
                className={`rounded-full px-2 py-1 text-xs ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}
              >
                {enabled ? 'Connected' : 'Not connected'}
              </span>
```
to:
```tsx
              <Badge variant={enabled ? 'success' : 'neutral'}>
                {enabled ? 'Connected' : 'Not connected'}
              </Badge>
```

(This also fixes a real, separate defect found along the way: `bg-emerald-100`/`text-emerald-700` were raw Tailwind colors outside the HIMARK palette, which `design-system.md` §2.1 explicitly prohibits — "Random accent colours." The `success` variant's tokens are brand-derived.)

- [ ] **Step 2: Verify**

Run: `npx eslint components/settings/integrations-manager.tsx`
Expected: clean

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/settings/integrations-manager.tsx
git add components/settings/integrations-manager.tsx
git commit -m "Migrate integration status pill to Badge, fix off-palette color"
```

---

### Task 7: Migrate `components/tasks/task-detail-dialog.tsx` to `Dialog`

**Files:**
- Modify: `components/tasks/task-detail-dialog.tsx:288-295`

**Interfaces:**
- Consumes (from Task 2): `Dialog` from `@/components/ui/dialog`

No new test — existing `components/tasks/task-detail-dialog.test.tsx` must still pass unmodified (queries by role/label/text, not the wrapper markup).

- [ ] **Step 1: Apply the change**

Add the import:

```tsx
import { Dialog } from '@/components/ui/dialog'
```

Change:
```tsx
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
      >
        <div className="mb-5 flex justify-between">
```
to:
```tsx
  return (
    <Dialog
      labelledBy="task-title"
      onClose={onClose}
      closeOnOverlayClick={false}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
    >
        <div className="mb-5 flex justify-between">
```

Then find the matching closing tags near the end of the component's returned JSX:
```tsx
      </section>
    </div>
  )
}
```
Change to:
```tsx
    </Dialog>
  )
}
```

(`closeOnOverlayClick={false}` matches this file's current behavior exactly — it never had an `onMouseDown` overlay handler.)

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/tasks/task-detail-dialog.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/tasks/task-detail-dialog.tsx
git add components/tasks/task-detail-dialog.tsx
git commit -m "Migrate task detail dialog to shared Dialog component"
```

---

### Task 8: Migrate `components/projects/create-project-dialog.tsx` to `Dialog`

**Files:**
- Modify: `components/projects/create-project-dialog.tsx:58-71`

**Interfaces:**
- Consumes (from Task 2): `Dialog` from `@/components/ui/dialog`

No new test — existing `components/projects/create-project-dialog.test.tsx` must still pass unmodified.

- [ ] **Step 1: Apply the change**

Add the import:

```tsx
import { Dialog } from '@/components/ui/dialog'
```

Change:
```tsx
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="w-full max-w-lg space-y-5 rounded-xl bg-background p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
```
to:
```tsx
      {open && (
        <Dialog
          labelledBy="create-project-title"
          onClose={() => setOpen(false)}
          className="w-full max-w-lg space-y-5 rounded-xl bg-background p-6 shadow-xl"
        >
            <div className="flex items-center justify-between">
```

Then find the matching closing tags:
```tsx
          </section>
        </div>
      )}
```
Change to:
```tsx
        </Dialog>
      )}
```

(`closeOnOverlayClick` is left at its default `true`, matching this file's existing `onMouseDown` behavior.)

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/projects/create-project-dialog.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/projects/create-project-dialog.tsx
git add components/projects/create-project-dialog.tsx
git commit -m "Migrate create-project dialog to shared Dialog component"
```

---

### Task 9: Migrate `components/calendar/create-calendar-event.tsx` to `Dialog`

**Files:**
- Modify: `components/calendar/create-calendar-event.tsx:24-36`

**Interfaces:**
- Consumes (from Task 2): `Dialog` from `@/components/ui/dialog`

No existing test for this file. Verify via `npx eslint` + `npm run build` + the full suite (Task 12) not regressing anything that imports this component.

- [ ] **Step 1: Apply the change**

Add the import:

```tsx
import { Dialog } from '@/components/ui/dialog'
```

Change:
```tsx
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-event-title"
            className="w-full max-w-lg rounded-xl bg-background p-6 shadow-xl"
          >
            <div className="mb-5 flex justify-between">
```
to:
```tsx
      {open && (
        <Dialog labelledBy="new-event-title" onClose={() => setOpen(false)}>
            <div className="mb-5 flex justify-between">
```

(This file's original className exactly matches `Dialog`'s default, so no `className` prop is needed. `closeOnOverlayClick` defaults to `true`, matching its existing `onMouseDown` behavior.)

Then find the matching closing tags:
```tsx
          </section>
        </div>
      )}
```
Change to:
```tsx
        </Dialog>
      )}
```

- [ ] **Step 2: Verify**

Run: `npx eslint components/calendar/create-calendar-event.tsx`
Expected: clean

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/calendar/create-calendar-event.tsx
git add components/calendar/create-calendar-event.tsx
git commit -m "Migrate calendar event dialog to shared Dialog component"
```

---

### Task 10: Migrate the team-member profile editor to `Dialog` in `components/settings/settings-forms.tsx`

**Files:**
- Modify: `components/settings/settings-forms.tsx:338-344` (the `TeamMemberProfileDialog` function's returned JSX)

**Interfaces:**
- Consumes (from Task 2): `Dialog` from `@/components/ui/dialog`

No new test — existing `components/settings/settings-forms.test.tsx` (which exercises opening this exact dialog and saving) must still pass unmodified.

- [ ] **Step 1: Apply the change**

Add the import alongside this file's existing imports:

```tsx
import { Dialog } from '@/components/ui/dialog'
```

Change:
```tsx
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
      >
        <div className="mb-5 flex justify-between">
```
to:
```tsx
    <Dialog
      labelledBy="member-profile-title"
      onClose={onClose}
      closeOnOverlayClick={false}
      className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
    >
        <div className="mb-5 flex justify-between">
```

Then find the matching closing tags at the end of this function's returned JSX:
```tsx
      </section>
    </div>
  )
}
```
Change to:
```tsx
    </Dialog>
  )
}
```

(`closeOnOverlayClick={false}` matches this file's current behavior — it never had an overlay click handler, same as `task-detail-dialog.tsx`.)

- [ ] **Step 2: Run the existing test to confirm no regression**

Run: `npx vitest run components/settings/settings-forms.test.tsx`
Expected: PASS (unchanged test count)

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write components/settings/settings-forms.tsx
git add components/settings/settings-forms.tsx
git commit -m "Migrate team member profile dialog to shared Dialog component"
```

---

### Task 11: Amend the spec to defer `Tabs`

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md`

No test — documentation only.

- [ ] **Step 1: Update §8's Tabs bullet**

Change:
```
- **Tabs (new or formalized shared component):** hairline underline with a 2px ocean active indicator (not filled pills), wherever tab-like navigation currently exists (e.g., Settings sub-nav).
```
to:
```
- **Tabs — deferred.** No tab-like navigation exists anywhere in the current app (confirmed via full-codebase search during Phase 1b planning); Settings, this section's original guess, is a card-grid landing page linking to sub-routes, not a tab bar. Building a shared component with no real consumer would be speculative. Revisit if/when a page redesign actually introduces tabbed navigation.
```

- [ ] **Step 2: Update §12's testing list**

Change:
```
- TDD for new component logic: the theme-persistence hook, `Badge`, `Dialog`, `Tabs` components.
```
to:
```
- TDD for new component logic: the theme-persistence hook, `Badge`, `Dialog` components (`Tabs` deferred, see §8).
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md
git commit -m "Defer Tabs component -- no real consumer exists yet"
```

---

### Task 12: Full verification, live-browser check, and ship

**Files:** none (verification only)

- [ ] **Step 1: Full verification gate**

```bash
npx vitest run
npx eslint .
npm run build
```

Expected: full suite passes (existing count plus the 9 new Badge/Dialog tests), eslint clean, build clean.

- [ ] **Step 2: Live-browser verification**

Using the project's preview tooling (`hive-dev`), reach a page rendering at least one migrated `Badge` (e.g., a task with labels on the Board) and one migrated `Dialog` (e.g., "New project"). For each of the 4 semantic Badge variants used (danger/warning/success/info via task priority + integration status), use `getComputedStyle` to confirm the rendered `color`/`background` resolve to real, non-transparent values in both light and dark theme (toggle via the topbar control), not `var(--danger)` literally unresolved. Confirm a `Dialog` still closes via its Close button and (for the two that support it) via clicking the overlay.

- [ ] **Step 3: Push, open a PR, wait for the Vercel preview, then merge**

```bash
git push -u origin worktree-hive-projects
gh pr create --base master --head worktree-hive-projects --title "HIVE visual upgrade 1b (i): Badge + Dialog primitives" --body "$(cat <<'EOF'
## Summary
- New shared `Badge` component (5 variants: neutral + danger/warning/success/info, using Phase 1a's semantic color tokens) and `Dialog` component (extracted from 4 duplicated modal implementations).
- Migrated every existing ad-hoc badge (task priority, task status, template archived state, integration connection state) and every existing hand-rolled dialog (task detail, create project, create calendar event, team member profile editor) to the new primitives.
- Along the way, fixed a real off-palette color bug: the integrations page used raw `bg-emerald-100`/`text-emerald-700` instead of a HIMARK semantic token.
- Deferred `Tabs` (also planned for this phase) -- no tab-like UI exists anywhere in the app yet to migrate; spec amended to reflect this rather than building unused infrastructure.

See docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md §8 for the full primitives rationale.

## Test plan
- [x] New Badge + Dialog unit tests (9 total), full suite, eslint, build all clean
- [x] Every migrated file's existing test suite passes unmodified (no behavior change, pure extraction)
- [x] Live-browser verified: all 4 semantic Badge variants render real resolved colors in both themes; Dialog close behavior (button + overlay click where applicable) unchanged

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

The remaining two chunks of Phase 1b, per the spec's §10 Rollout: table/card density tightening, and loading-state skeletons — each gets its own plan once this ships.
