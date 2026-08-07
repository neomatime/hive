# HIVE Visual Upgrade — Phase 1a: Tokens + Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a real light/dark theme and the new permanent-dark "Ink Panel" sidebar — the first, most visible milestone of the HIVE visual upgrade.

**Architecture:** A small client-side theme store (`lib/theme/theme-store.ts`) mirrors the existing `useSyncExternalStore` + localStorage pattern already used for sidebar-collapse state in `dashboard-shell.tsx`. A blocking inline `<script>` in the root layout applies the persisted (or system-preferred) theme class to `<html>` before hydration, avoiding a flash of the wrong theme. All color values live as CSS custom properties in `styles/theme.css`, with a new `.dark` block there — `styles/global.css`'s shadcn-convention aliasing layer needs no changes, since it already references `theme.css` tokens via `var()` and will pick up dark values automatically once the `.dark` class is present.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, vitest + Testing Library.

## Global Constraints

- No new dependencies.
- No behavior/feature changes — visual only.
- Every new component gets a test written and confirmed RED before implementation (TDD).
- `prettier`, `eslint`, `vitest` (full suite), and `next build` must all pass clean before the final commit/PR.
- Sidebar stays visually dark in **both** canvas themes — only its exact shade swaps (Ink Deep on light canvas, Midnight on dark canvas) — per `docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md` §5.1.
- Theme preference is a device-level (localStorage) setting, not synced to the `user_preferences` table — see spec §7.
- `.auth-dark` (the login screen) is explicitly out of scope — do not touch `app/(auth)/layout.tsx` or `.auth-dark` in this plan.

---

### Task 1: Theme persistence store

**Files:**
- Create: `lib/theme/theme-store.ts`
- Test: `lib/theme/theme-store.test.ts`

**Interfaces:**
- Produces: `type Theme = 'light' | 'dark'`; `THEME_STORAGE_KEY: string`; `subscribeTheme(listener: () => void): () => void`; `getThemeSnapshot(): Theme`; `getThemeServerSnapshot(): Theme`; `setTheme(theme: Theme): void`; `toggleTheme(): void`

- [ ] **Step 1: Write the failing test**

```ts
// lib/theme/theme-store.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
  toggleTheme,
} from './theme-store'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  window.localStorage.clear()
})

describe('getThemeSnapshot', () => {
  it('returns light when the dark class is absent', () => {
    expect(getThemeSnapshot()).toBe('light')
  })
  it('returns dark when the dark class is present', () => {
    document.documentElement.classList.add('dark')
    expect(getThemeSnapshot()).toBe('dark')
  })
})

describe('getThemeServerSnapshot', () => {
  it('always returns light, matching the server-rendered HTML', () => {
    expect(getThemeServerSnapshot()).toBe('light')
  })
})

describe('setTheme', () => {
  it('adds the dark class and persists the choice when set to dark', () => {
    setTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
  it('removes the dark class and persists the choice when set to light', () => {
    document.documentElement.classList.add('dark')
    setTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })
  it('notifies subscribers', () => {
    const listener = vi.fn()
    subscribeTheme(listener)
    setTheme('dark')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('toggleTheme', () => {
  it('flips from light to dark', () => {
    toggleTheme()
    expect(getThemeSnapshot()).toBe('dark')
  })
  it('flips from dark to light', () => {
    setTheme('dark')
    toggleTheme()
    expect(getThemeSnapshot()).toBe('light')
  })
})

describe('subscribeTheme', () => {
  it('returns an unsubscribe function that stops further notifications', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeTheme(listener)
    unsubscribe()
    setTheme('dark')
    expect(listener).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/theme/theme-store.test.ts`
Expected: FAIL — `Cannot find module './theme-store'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/theme/theme-store.ts
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'hive-theme'

const listeners = new Set<() => void>()

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Matches the server-rendered HTML (always light) -- the blocking script in
// app/layout.tsx applies the real theme before hydration, same no-flash
// pattern as the sidebar-collapse state in dashboard-shell.tsx.
export function getThemeServerSnapshot(): Theme {
  return 'light'
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  listeners.forEach((listener) => listener())
}

export function toggleTheme() {
  setTheme(getThemeSnapshot() === 'dark' ? 'light' : 'dark')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/theme/theme-store.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Prettier + commit**

```bash
npx prettier --write lib/theme/theme-store.ts lib/theme/theme-store.test.ts
git add lib/theme/theme-store.ts lib/theme/theme-store.test.ts
git commit -m "Add theme persistence store"
```

---

### Task 2: ThemeToggle component + Topbar wiring

**Files:**
- Create: `components/layout/theme-toggle.tsx`
- Test: `components/layout/theme-toggle.test.tsx`
- Modify: `components/layout/topbar.tsx`

**Interfaces:**
- Consumes (from Task 1): `getThemeServerSnapshot`, `getThemeSnapshot`, `subscribeTheme`, `toggleTheme` from `@/lib/theme/theme-store`
- Produces: `ThemeToggle()` — a button component with no props, rendered inside `Topbar`

- [ ] **Step 1: Write the failing test**

```tsx
// components/layout/theme-toggle.test.tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './theme-toggle'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  window.localStorage.clear()
})

describe('ThemeToggle', () => {
  it('offers to switch to dark theme when currently light', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
  it('switches to dark theme on click and updates its own label', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })
  it('switches back to light theme on a second click', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/layout/theme-toggle.test.tsx`
Expected: FAIL — `Cannot find module './theme-toggle'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/layout/theme-toggle.tsx
'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  subscribeTheme,
  toggleTheme,
} from '@/lib/theme/theme-store'

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot)
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      style={{ color: 'var(--text-secondary)' }}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/layout/theme-toggle.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Wire it into the Topbar**

Modify `components/layout/topbar.tsx` — add the import and render `<ThemeToggle />` next to notifications:

```tsx
import { ThemeToggle } from './theme-toggle'
```

Change:
```tsx
      <div className="flex items-center gap-3">
        <NotificationCenter />
        <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
      </div>
```
to:
```tsx
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationCenter />
        <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
      </div>
```

- [ ] **Step 6: Run the full a11y/dashboard-shell test to confirm no regression**

Run: `npx vitest run tests/a11y/dashboard-shell.a11y.test.tsx`
Expected: PASS (still 1 test — Task 7 adds the dark-mode one)

- [ ] **Step 7: Prettier + commit**

```bash
npx prettier --write components/layout/theme-toggle.tsx components/layout/theme-toggle.test.tsx components/layout/topbar.tsx
git add components/layout/theme-toggle.tsx components/layout/theme-toggle.test.tsx components/layout/topbar.tsx
git commit -m "Add ThemeToggle to the topbar"
```

---

### Task 3: No-flash theme script in the root layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes (from Task 1): `THEME_STORAGE_KEY` from `@/lib/theme/theme-store`

No new automated test — `app/layout.tsx` has no existing test file in this codebase (it renders `next/font/google` calls, which the project's established convention avoids unit-testing directly). Verified via `next build` succeeding and a live-browser check in Task 7.

- [ ] **Step 1: Add the import**

In `app/layout.tsx`, add alongside the existing imports:

```tsx
import { THEME_STORAGE_KEY } from '@/lib/theme/theme-store'
```

- [ ] **Step 2: Add the blocking script as the first child of `<html>`**

Change:
```tsx
    <html
      lang="en"
      className={cn('font-sans', geist.variable, geistMono.variable, newsreader.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
```
to:
```tsx
    <html
      lang="en"
      className={cn('font-sans', geist.variable, geistMono.variable, newsreader.variable)}
    >
      {/* Runs before hydration so the correct theme applies on first paint --
          without this, the page would flash light before React mounts and
          the ThemeToggle's useSyncExternalStore picks up the real value. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
        }}
      />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
```

- [ ] **Step 3: Verify the build compiles**

Run: `npm run build`
Expected: succeeds, no TypeScript/ESLint errors

- [ ] **Step 4: Prettier + commit**

```bash
npx prettier --write app/layout.tsx
git add app/layout.tsx
git commit -m "Apply persisted/system theme before hydration"
```

---

### Task 4: Dark theme tokens in theme.css; remove the dead .dark block from global.css

**Files:**
- Modify: `styles/theme.css`
- Modify: `styles/global.css`

**Interfaces:**
- Produces (new CSS custom properties consumed by Task 5): `--sidebar-nav-text`, `--sidebar-nav-text-active`, `--sidebar-nav-active-bg`
- Produces (new CSS custom properties, no consumer in this plan — used by Phase 1b's Badge component): `--danger-bg`, `--warning-bg`, `--success-bg`, `--info-bg`

No automated unit test — pure CSS custom property values aren't meaningfully testable in jsdom (this codebase has no precedent of unit-testing raw token values; verification is via live-browser computed-style checks, same technique used for the login-page contrast fix earlier in this project). Verified in Task 7.

- [ ] **Step 1: Change the sidebar background token and add the new invariant sidebar/badge tokens**

In `styles/theme.css`, inside the existing `:root { ... }` block:

Change:
```css
  --background-sidebar: var(--color-ocean-light);
```
to:
```css
  /* Sidebar is now a permanent dark panel in both canvas themes -- this is
     the LIGHT-canvas value (Ink Deep); .dark below overrides it to Midnight,
     one step lighter than the dark canvas, for quiet depth with no border
     or shadow. See docs/superpowers/specs/2026-08-06-hive-design-upgrade-
     foundation-design.md §5.1. */
  --background-sidebar: var(--color-ink-deep);
```

Add after the `--focus-ring` line (still inside `:root`):
```css

  /* Sidebar nav item colors -- theme-invariant (the sidebar is always dark,
     see --background-sidebar above), unlike the rest of the canvas tokens. */
  --sidebar-nav-text: #8aa0ac;
  --sidebar-nav-text-active: #ffffff;
  --sidebar-nav-active-bg: rgba(95, 129, 144, 0.22);

  /* Badge background tints (light theme). Paired with the existing flat
     --danger/--warning/--success/--info tokens, which stay as the text
     color. Both get dark-mode overrides below. */
  --danger-bg: rgba(154, 78, 78, 0.1);
  --warning-bg: rgba(154, 116, 54, 0.1);
  --success-bg: rgba(63, 107, 90, 0.1);
  --info-bg: rgba(95, 129, 144, 0.12);
```

- [ ] **Step 2: Add the `.dark` block**

Add after the closing `}` of `:root` in `styles/theme.css`:

```css

/* Real app-wide dark theme -- built entirely from existing brand colors
   (Ink Deep, Midnight, Ocean), no new hues. See the spec referenced above,
   §5.3-5.4, for the full rationale and the mockups it was approved from. */
.dark {
  --background-app: var(--color-ink-deep);
  --background-surface: var(--color-midnight);
  --background-sidebar: var(--color-midnight);
  --background-hover: rgba(255, 255, 255, 0.06);
  --background-selected: rgba(138, 173, 184, 0.14);

  --text-primary: var(--color-white);
  --text-secondary: #b7c3ca;
  --text-muted: #8aa0ac;
  --text-disabled: rgba(255, 255, 255, 0.35);

  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-default: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.2);

  --success: #9fcdb8;
  --warning: #e0c090;
  --danger: #e2a3a3;
  --info: #b9d3da;

  --success-bg: rgba(140, 200, 170, 0.16);
  --warning-bg: rgba(220, 180, 120, 0.16);
  --danger-bg: rgba(220, 140, 140, 0.16);
  --info-bg: rgba(138, 173, 184, 0.18);
}
```

- [ ] **Step 3: Delete the dead `.dark` block from global.css**

In `styles/global.css`, replace the entire existing `.dark { ... }` block (the generic shadcn near-black oklch values, currently unused anywhere) with a short explanatory comment:

Change:
```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```
to:
```css
/* Dark theme values live in styles/theme.css's own .dark block (the brand/
   token layer) -- the :root block above already aliases every one of these
   shadcn-convention variables to a theme.css token via var(), so it picks
   up the dark value automatically once that class is present. A second
   .dark block here would just be a second, driftable source of truth. */
```

- [ ] **Step 4: Prettier + commit**

```bash
npx prettier --write styles/theme.css styles/global.css
git add styles/theme.css styles/global.css
git commit -m "Add real dark theme tokens; remove dead shadcn dark block"
```

---

### Task 5: Ink Panel sidebar

**Files:**
- Modify: `components/navigation/sidebar.tsx`
- Modify: `components/navigation/sidebar-nav-item.tsx`

**Interfaces:**
- Consumes (from Task 4): `--background-sidebar`, `--sidebar-nav-text`, `--sidebar-nav-text-active`, `--sidebar-nav-active-bg` CSS custom properties
- No prop/signature changes to `Sidebar` or `SidebarNavItem` — existing `components/navigation/sidebar.test.tsx` covers structure/behavior and needs no edits, only a re-run to confirm no regression.

- [ ] **Step 1: Rewrite the active/inactive nav item styling**

Replace the full contents of `components/navigation/sidebar-nav-item.tsx`:

```tsx
import Link from 'next/link'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/constants/routes'

// Active state reads as a soft tinted pill against the permanently-dark
// sidebar (see docs/superpowers/specs/2026-08-06-hive-design-upgrade-
// foundation-design.md §7) -- supersedes the old left-border-plus-lightened-
// background treatment from design-system.md §21, which was tuned for the
// old medium-teal Ocean Light sidebar background.
export function SidebarNavItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-standard',
        collapsed && 'justify-center px-0',
        active ? 'font-semibold' : 'hover:bg-white/5'
      )}
      style={{
        background: active ? 'var(--sidebar-nav-active-bg)' : 'transparent',
        color: active ? 'var(--sidebar-nav-text-active)' : 'var(--sidebar-nav-text)',
      }}
    >
      <Icon size={18} />
      <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
    </Link>
  )
}
```

- [ ] **Step 2: Fix the sidebar footer (logo/divider/avatar/name/role) for the always-dark background**

In `components/navigation/sidebar.tsx`, the footer block currently assumes a medium-teal background — its divider, avatar, and text colors need to work against near-black instead.

Change:
```tsx
      <div
        className="text-sm"
        style={{
          color: 'var(--text-primary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.4)',
          paddingTop: 'var(--space-4)',
        }}
      >
        {collapsed ? (
          <div
            aria-label={userDisplayName}
            title={userDisplayName}
            className="mx-auto flex size-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: 'rgba(255, 255, 255, 0.4)', color: 'var(--color-midnight)' }}
          >
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 600 }}>{userDisplayName}</div>
            <div className="eyebrow" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
              {ROLE_LABELS[userRole]}
            </div>
          </>
        )}
      </div>
```
to:
```tsx
      <div
        className="text-sm"
        style={{
          color: 'var(--sidebar-nav-text-active)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          paddingTop: 'var(--space-4)',
        }}
      >
        {collapsed ? (
          <div
            aria-label={userDisplayName}
            title={userDisplayName}
            className="mx-auto flex size-8 items-center justify-center rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-ocean-light)', color: 'var(--color-ink-deep)' }}
          >
            {userDisplayName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 600 }}>{userDisplayName}</div>
            <div className="eyebrow" style={{ color: 'var(--sidebar-nav-text)', marginTop: 2 }}>
              {ROLE_LABELS[userRole]}
            </div>
          </>
        )}
      </div>
```

- [ ] **Step 3: Run the existing sidebar test suite to confirm no regression**

Run: `npx vitest run components/navigation/sidebar.test.tsx`
Expected: PASS (all 6 existing tests, unchanged)

- [ ] **Step 4: Prettier + commit**

```bash
npx prettier --write components/navigation/sidebar.tsx components/navigation/sidebar-nav-item.tsx
git add components/navigation/sidebar.tsx components/navigation/sidebar-nav-item.tsx
git commit -m "Rework sidebar for the permanent dark Ink Panel treatment"
```

---

### Task 6: Update design-system.md and color-palette.md

**Files:**
- Modify: `docs/design/design-system.md`
- Modify: `docs/design/color-palette.md`

No automated test — documentation only.

- [ ] **Step 1: Update design-system.md §2.1's density line**

Change:
```
Avoid:

- Unnecessary charts
- Decorative gradients
- Excessive shadows
- Random accent colours
- Dense dashboards
- Overloaded navigation
```
to:
```
Avoid:

- Unnecessary charts
- Decorative gradients
- Excessive shadows
- Random accent colours
- Cluttered, unstructured layouts
- Overloaded navigation

HIVE stays calm and uncluttered, but its spacing is deliberate rather than
loose -- see the 2026-08-06 design upgrade spec for the tightened rhythm
applied across tables, nav items, and cards.
```

- [ ] **Step 2: Update design-system.md §3.2's Ocean Light row**

Change:
```
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Sidebar, subtle highlights, selected areas |
```
to:
```
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Subtle highlights, selected areas, collapsed-sidebar avatar accent |
```

- [ ] **Step 3: Update design-system.md §3.5's distribution list**

Change:
```
Off White / White surfaces: 75–85%
Midnight / Ink Deep: 8–12%
Ocean Light sidebar: 8–12%
Ocean / Ocean Dark accents: 3–6%
Semantic colours: under 2%
```
to:
```
Off White / White surfaces: 70–80%
Ink Deep / Midnight (sidebar + dark-theme surfaces): 10–15%
Ocean / Ocean Dark / Ocean Light accents: 3–6%
Semantic colours: under 2%
```

- [ ] **Step 4: Rewrite design-system.md §6.2 (Sidebar)**

Change:
```
## 6.2 Sidebar

The sidebar must use **Ocean Light**:

```css
background: #8aadb8;
```

Navigation:

```text
Overview
Projects
Board
My Tasks
Calendar
Files
Settings
```

Rules:

- Selected item: Midnight background with white text
- Hover item: semi-transparent white background
- Default item: Ink Deep text
- Selected icon: white
- User profile appears at the bottom
```
to:
```
## 6.2 Sidebar

The sidebar is a **permanent dark panel**, regardless of the active canvas
theme (see §7 "Theming"). Its own shade adapts to stay visually separated
from its neighboring canvas:

```css
/* Light canvas */
background: #0e1822; /* Ink Deep */
/* Dark canvas */
background: #1c2b3a; /* Midnight */
```

Navigation:

```text
Overview
Projects
Board
My Tasks
Inbox
Calendar
Files
Settings
```

Rules:

- Selected item: soft tinted pill (`rgba(95, 129, 144, 0.22)`) with white text, not a full-bleed fill
- Hover item (unselected): `rgba(255, 255, 255, 0.05)` background
- Default item text: `#8aa0ac`
- Selected item text/icon: white
- User profile appears at the bottom; the collapsed-state avatar uses Ocean Light background with Ink Deep text as its one deliberate accent use
```

- [ ] **Step 5: Update color-palette.md §1's Ocean Light row**

Change:
```
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Sidebar background |
```
to:
```
| `--color-ocean-light` | Ocean Light | `#8AADB8` | Subtle highlights, selected-area accents |
```

- [ ] **Step 6: Update color-palette.md §4's distribution list**

Change:
```
- Off White / White: **75–85%**
- Midnight / Ink Deep: **8–12%**
- Ocean Light (sidebar): **8–12%**
- Ocean / Ocean Dark accents: **3–6%**
- Semantic colours: **<2%**
```
to:
```
- Off White / White: **70–80%**
- Ink Deep / Midnight (sidebar + dark-theme surfaces): **10–15%**
- Ocean / Ocean Dark / Ocean Light accents: **3–6%**
- Semantic colours: **<2%**
```

- [ ] **Step 7: Update color-palette.md §5's UI Mapping Sidebar row**

Change:
```
| Sidebar | Ocean Light |
```
to:
```
| Sidebar | Ink Deep (light canvas) / Midnight (dark canvas) |
```

- [ ] **Step 8: Commit**

```bash
git add docs/design/design-system.md docs/design/color-palette.md
git commit -m "Update design docs for the permanent dark sidebar"
```

---

### Task 7: Dark-mode accessibility coverage, full verification, and ship

**Files:**
- Modify: `tests/a11y/dashboard-shell.a11y.test.tsx`

- [ ] **Step 1: Write the failing test — dark mode has no axe violations either**

Add to `tests/a11y/dashboard-shell.a11y.test.tsx`, inside the existing `describe('DashboardShell accessibility', ...)` block, a second test:

```tsx
  it('has no axe violations in dark mode', async () => {
    document.documentElement.classList.add('dark')
    const { container } = render(
      <DashboardShell
        user={{
          id: '1',
          authUserId: 'a1',
          displayName: 'Jane Doe',
          email: 'jane@himark.com',
          avatarUrl: null,
          workspace: { id: 'w1', name: 'HIMARK' },
          role: 'admin',
        }}
      >
        <p>Page content</p>
      </DashboardShell>
    )
    expect(await axe(container)).toHaveNoViolations()
    document.documentElement.classList.remove('dark')
  })
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tests/a11y/dashboard-shell.a11y.test.tsx`
Expected: PASS (2 tests) — if it fails, the failure will name the specific contrast/ARIA violation; fix the offending token in `styles/theme.css`'s `.dark` block (Task 4) and re-run, don't weaken the test.

- [ ] **Step 3: Prettier + commit**

```bash
npx prettier --write tests/a11y/dashboard-shell.a11y.test.tsx
git add tests/a11y/dashboard-shell.a11y.test.tsx
git commit -m "Add dark-mode a11y coverage for the dashboard shell"
```

- [ ] **Step 4: Full verification gate**

Run each of these and confirm clean output before proceeding:

```bash
npx vitest run
npx eslint .
npm run build
```

- [ ] **Step 5: Live-browser verification (both themes)**

Using the project's preview tooling (start the `hive-dev` server, navigate to `/dashboard/overview`):
- Toggle the new theme button; confirm the sidebar stays dark in both states and the canvas actually swaps.
- Use `getComputedStyle` on the sidebar background, nav item text, topbar, and canvas background/text in both themes; compute WCAG contrast ratios for each text/background pair against the values from spec §5 and confirm they meet at least 4.5:1 for body text (same technique used for the login-page fix earlier in this project).
- Confirm the collapsed-sidebar avatar circle (Ocean Light bg / Ink Deep text) is legible.
- Reload the page after toggling to dark to confirm no flash of light theme before paint.

- [ ] **Step 6: Push, open a PR, wait for the Vercel preview, then merge**

```bash
git push -u origin worktree-hive-projects
gh pr create --base master --head worktree-hive-projects --title "HIVE visual upgrade 1a: real dark theme + Ink Panel sidebar" --body "$(cat <<'EOF'
## Summary
- Real light/dark theme, toggleable from the topbar, persisted client-side, defaulting to system preference.
- Sidebar becomes a permanent dark "Ink Panel" (Ink Deep on light canvas, Midnight on dark canvas) instead of the old theme-static Ocean Light -- matches Linear/Vercel/Height's convention, reuses only existing brand colors.
- design-system.md and color-palette.md updated to match (§2.1, §3.2, §3.5, §6.2 / §1, §4, §5).

See docs/superpowers/specs/2026-08-06-hive-design-upgrade-foundation-design.md for the full design rationale and the approved mockups it came from.

## Test plan
- [x] New theme-store + ThemeToggle unit tests, full suite, eslint, build all clean
- [x] Dark-mode a11y coverage added to dashboard-shell.a11y.test.tsx
- [x] Live-browser contrast verification in both themes

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

Phase 1b (primitives + states — Badge, Dialog, Tabs components, Button/Input dark-mode audit, table/card tightening, skeleton loading states) gets its own plan once this ships, per the spec's rollout section.
