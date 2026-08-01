# HIVE Foundation (Scaffold + Auth + Workspace) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `hive/` from a documented-but-empty scaffold into a running Next.js app where a HIMARK team member can be invited, log in, reset their password, and land on a real authenticated shell — matching MVP.md's "Phase 1 — Foundation" milestone: *"Team can securely access HIVE."*

**Architecture:** Next.js 15 App Router + TypeScript strict, Supabase (Postgres + Auth) with three tables (`users`, `workspaces`, `workspace_members`) protected by RLS, a thin service layer between UI and Supabase, and a server-only bootstrap script for invite-only provisioning (no public signup). Design tokens come from `docs/design/design-system.md` / `color-palette.md` verbatim.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), react-hook-form + Zod, TanStack Query, Vitest + React Testing Library, Playwright, axe.

**Source spec:** `docs/superpowers/specs/2026-08-01-foundation-auth-workspace-design.md` — read it for full rationale; this plan implements it task-by-task.

## Global Constraints

- TypeScript `strict` mode; zero ESLint/Prettier warnings before merge (`Coding-Standards.md`).
- Naming: components PascalCase, files kebab-case, functions/variables camelCase, constants UPPER_SNAKE_CASE (`Coding-Standards.md`).
- Tailwind CSS only, using the design tokens defined in Task 2 — no inline colors, no arbitrary one-off hex values (`Coding-Standards.md`).
- Database access only through the service layer (`services/`); never call the Supabase client directly from a component or page; never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser (`Coding-Standards.md`, `security.md` §12).
- No public signup route. The only way into HIVE is the bootstrap script (Task 4) creating an `auth.users` record via the admin API.
- `workspace_role` enum is exactly `owner` | `admin` | `member` | `viewer` — this is the resolution of the FRS-vs-security.md contradiction documented in the spec §4. Do not introduce `project_manager`/`contributor` at the workspace level.
- Sidebar background is always Ocean Light `#8AADB8` — never change it (`color-palette.md` §10).
- Error messages shown to users are always generic ("Invalid email or password", "Something went wrong") — never expose which field failed, SQL errors, stack traces, or policy names (`security.md` §15).
- Dark mode is explicitly not required for MVP (`design-system.md` §14) — don't build it.
- No CI/GitHub Actions in this phase — `hive` has no git remote yet; tests run locally.

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc.json`, `next-env.d.ts` (auto-generated)
- Create: `app/globals.css` is NOT created here — the existing `styles/*.css` files are used instead (Task 2)

**Interfaces:**
- Produces: a working `npm run dev` / `npm run build` / `npm run lint` / `npm test` / `npm run test:e2e` command set that every later task relies on.

This task has no application logic to unit-test — verification is the build/lint/test commands actually working.

- [ ] **Step 1: Initialize package.json**

```bash
npm init -y
```

Then edit `package.json`'s generated content to:

```json
{
  "name": "hive",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "bootstrap": "tsx scripts/bootstrap-owner.ts"
  }
}
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install next@latest react@latest react-dom@latest @supabase/ssr@latest @supabase/supabase-js@latest @tanstack/react-query@latest react-hook-form@latest @hookform/resolvers@latest zod@latest clsx@latest tailwind-merge@latest class-variance-authority@latest lucide-react@latest sonner@latest
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss postcss eslint eslint-config-next prettier vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test axe-core tsx supabase
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Write `next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

- [ ] **Step 6: Write `postcss.config.mjs`**

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

- [ ] **Step 7: Write `eslint.config.mjs`**

```javascript
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]
```

Run `npm install -D @eslint/eslintrc` if the `eslint.config.mjs` import fails.

- [ ] **Step 8: Write `.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

- [ ] **Step 9: Verify the app boots**

Run: `npm run build`
Expected: build succeeds (it will render the existing empty `app/page.tsx`/`app/layout.tsx` — an empty file is valid but will produce an empty page; that's fine, later tasks fill it in). If `app/layout.tsx` being 0 bytes fails the build because Next.js requires at least an exported default component, write the minimal valid placeholder:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

into `app/layout.tsx`, and:

```tsx
export default function Home() {
  return null
}
```

into `app/page.tsx`. Re-run `npm run build` and confirm it exits 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs .prettierrc.json app/layout.tsx app/page.tsx
git commit -m "chore: scaffold Next.js 15 project (TypeScript, Tailwind v4, ESLint, Vitest, Playwright)"
```

---

### Task 2: Wire the design tokens into styles/

**Files:**
- Modify: `styles/theme.css`
- Modify: `styles/typography.css`
- Modify: `styles/global.css`
- Modify: `styles/animations.css`
- Modify: `app/layout.tsx:1-9` (import the stylesheets)

**Interfaces:**
- Produces: CSS custom properties (`--color-midnight`, `--space-4`, `--radius-md`, etc.) available globally via `var(--token-name)`, and Tailwind utility classes wired to them.

- [ ] **Step 1: Write `styles/theme.css`** (colors, spacing, radius, shadows, motion — exact values from `docs/design/color-palette.md` §8 and `docs/design/design-system.md` §4)

```css
:root {
  /* Brand */
  --color-midnight: #1C2B3A;
  --color-ink-deep: #0E1822;
  --color-ocean: #5F8190;
  --color-ocean-light: #8AADB8;
  --color-ocean-dark: #2E4A5A;
  --color-off-white: #F7F7F5;
  --color-white: #FFFFFF;

  /* Neutrals */
  --neutral-950: #111820;
  --neutral-800: #27323C;
  --neutral-700: #3F4B55;
  --neutral-600: #5C6872;
  --neutral-500: #77838C;
  --neutral-400: #A4ADB4;
  --neutral-300: #C8CFD4;
  --neutral-200: #DCE1E4;
  --neutral-100: #EDF0F2;
  --neutral-50: #F8F9F9;

  /* Semantic */
  --success: #3F6B5A;
  --warning: #9A7436;
  --danger: #9A4E4E;
  --info: #5F8190;

  /* Applied roles */
  --background-app: var(--color-off-white);
  --background-surface: var(--color-white);
  --background-sidebar: var(--color-ocean-light);
  --background-hover: var(--neutral-50);
  --background-selected: rgba(28, 43, 58, 0.09);

  --text-primary: var(--color-ink-deep);
  --text-secondary: var(--neutral-700);
  --text-muted: var(--neutral-600);
  --text-disabled: var(--neutral-400);
  --text-on-dark: var(--color-white);

  --border-subtle: var(--neutral-100);
  --border-default: var(--neutral-200);
  --border-strong: var(--neutral-300);

  --focus-ring: rgba(95, 129, 144, 0.35);

  /* Spacing (8pt system) */
  --space-0: 0px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(14, 24, 34, 0.04);
  --shadow-sm: 0 2px 8px rgba(14, 24, 34, 0.06);
  --shadow-md: 0 8px 24px rgba(14, 24, 34, 0.08);
  --shadow-lg: 0 16px 48px rgba(14, 24, 34, 0.12);

  /* Motion */
  --motion-fast: 120ms;
  --motion-standard: 180ms;
  --motion-slow: 240ms;
  --motion-easing: cubic-bezier(0.2, 0, 0, 1);
}
```

- [ ] **Step 2: Write `styles/typography.css`** (exact type scale from `design-system.md` §5)

```css
:root {
  --font-family-base: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --text-display-size: 36px; --text-display-line: 44px; --text-display-weight: 600;
  --text-h1-size: 30px; --text-h1-line: 38px; --text-h1-weight: 600;
  --text-h2-size: 24px; --text-h2-line: 32px; --text-h2-weight: 600;
  --text-h3-size: 20px; --text-h3-line: 28px; --text-h3-weight: 600;
  --text-h4-size: 16px; --text-h4-line: 24px; --text-h4-weight: 600;
  --text-body-lg-size: 16px; --text-body-lg-line: 26px; --text-body-lg-weight: 400;
  --text-body-size: 14px; --text-body-line: 22px; --text-body-weight: 400;
  --text-body-sm-size: 13px; --text-body-sm-line: 20px; --text-body-sm-weight: 400;
  --text-label-size: 12px; --text-label-line: 16px; --text-label-weight: 600;
  --text-caption-size: 11px; --text-caption-line: 16px; --text-caption-weight: 500;
}

body {
  font-family: var(--font-family-base);
  font-size: var(--text-body-size);
  line-height: var(--text-body-line);
  color: var(--text-primary);
}

h1 { font-size: var(--text-h1-size); line-height: var(--text-h1-line); font-weight: var(--text-h1-weight); }
h2 { font-size: var(--text-h2-size); line-height: var(--text-h2-line); font-weight: var(--text-h2-weight); }
h3 { font-size: var(--text-h3-size); line-height: var(--text-h3-line); font-weight: var(--text-h3-weight); }
h4 { font-size: var(--text-h4-size); line-height: var(--text-h4-line); font-weight: var(--text-h4-weight); }
```

- [ ] **Step 3: Write `styles/global.css`** (imports Tailwind + the other token files, base resets)

```css
@import "tailwindcss";
@import "./theme.css";
@import "./typography.css";
@import "./animations.css";

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  padding: 0;
  margin: 0;
  background: var(--background-app);
}

:focus-visible {
  outline: 2px solid var(--color-ocean);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Write `styles/animations.css`** (motion tokens applied as reusable transition classes)

```css
.transition-fast {
  transition-duration: var(--motion-fast);
  transition-timing-function: var(--motion-easing);
}

.transition-standard {
  transition-duration: var(--motion-standard);
  transition-timing-function: var(--motion-easing);
}

.transition-slow {
  transition-duration: var(--motion-slow);
  transition-timing-function: var(--motion-easing);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: Import the stylesheet from the root layout**

Edit `app/layout.tsx`, add the import as the first line:

```tsx
import '@/styles/global.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Verify**

Run: `npm run build`
Expected: exits 0, no CSS errors.

- [ ] **Step 7: Commit**

```bash
git add styles/ app/layout.tsx
git commit -m "feat: wire HIVE design tokens (color, spacing, typography, motion) into global styles"
```

---

### Task 3: Supabase project, schema migration, and generated types

**Files:**
- Create: `supabase/migrations/<timestamp>_foundation_schema.sql`
- Create: `types/database.ts` (generated)
- Create: `types/user.ts`
- Create: `types/workspace.ts`
- Modify: `.env.local` (real credentials — not committed)

**Interfaces:**
- Produces: `Database` type (from `types/database.ts`), `User` interface and `Workspace`/`WorkspaceRole`/`WorkspaceMembership` interfaces (`types/user.ts`, `types/workspace.ts`) that every later task's TypeScript code imports.

```typescript
// types/workspace.ts (produced this task)
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Workspace {
  id: string
  name: string
  slug: string
  timezone: string
}

export interface WorkspaceMembership {
  workspace: Workspace
  role: WorkspaceRole
}
```

```typescript
// types/user.ts (produced this task)
export interface User {
  id: string
  authUserId: string
  firstName: string
  lastName: string
  displayName: string
  email: string
  avatarUrl: string | null
}
```

This task is infrastructure — there's no unit to TDD in the traditional sense. Verification is applying the migration to a real (new) Supabase project and confirming the tables/policies exist.

- [ ] **Step 1: Create the Supabase project**

The user already approved creating a new, dedicated Supabase project for HIVE during brainstorming. Use the Supabase MCP tool to create it (organization: the same one used by `ops-booking`/`lgndry-co-ops`; name: `hive`; choose a region close to the team, e.g. the same `eu-west-1` used by the other two projects; use the free/appropriate plan).

Record the returned `project_id` — it's needed for every subsequent Supabase MCP call in this plan.

- [ ] **Step 2: Write the migration SQL**

Create `supabase/migrations/` directory and write `supabase/migrations/0001_foundation_schema.sql`:

```sql
-- Enums
create type workspace_role as enum ('owner', 'admin', 'member', 'viewer');

-- Tables
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  first_name varchar(100) not null default '',
  last_name varchar(100) not null default '',
  display_name varchar(200) not null,
  email varchar(255) unique not null,
  phone_number varchar(30),
  job_title varchar(150),
  department varchar(150),
  avatar_url text,
  timezone varchar(100) not null default 'UTC',
  locale varchar(20) not null default 'en',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_users_email on users(email);
create index idx_users_active on users(is_active);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  slug varchar(100) unique not null,
  description text,
  logo_url text,
  timezone varchar(100) not null default 'UTC',
  date_format varchar(30) not null default 'DD/MM/YYYY',
  time_format varchar(20) not null default '24h',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role workspace_role not null,
  joined_at timestamptz not null default now(),
  invited_by uuid references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Auto-create a public.users row whenever a Supabase Auth user is created
create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- RLS helper functions (SECURITY DEFINER to avoid recursive policy evaluation —
-- see spec section 6.3)
create function is_workspace_member(target_workspace_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = target_workspace_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
  );
$$;

create function is_workspace_admin(target_workspace_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = target_workspace_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
      and wm.role in ('owner', 'admin')
  );
$$;

create function shares_workspace_with(target_user_row_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members target_wm
    join workspace_members my_wm on my_wm.workspace_id = target_wm.workspace_id
    join users me on me.id = my_wm.user_id
    where target_wm.user_id = target_user_row_id
      and me.auth_user_id = target_auth_user_id
      and target_wm.is_active = true
      and my_wm.is_active = true
  );
$$;

-- RLS
alter table users enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

create policy "users_select_own_or_workspace_peers"
  on users for select
  using (auth_user_id = auth.uid() or shares_workspace_with(id, auth.uid()));

create policy "users_update_own"
  on users for update
  using (auth_user_id = auth.uid());

create policy "workspaces_select_active_member"
  on workspaces for select
  using (is_workspace_member(id, auth.uid()));

create policy "workspaces_update_owner_admin"
  on workspaces for update
  using (is_workspace_admin(id, auth.uid()));

create policy "workspace_members_select_same_workspace"
  on workspace_members for select
  using (is_workspace_member(workspace_id, auth.uid()));

create policy "workspace_members_write_owner_admin"
  on workspace_members for all
  using (is_workspace_admin(workspace_id, auth.uid()))
  with check (is_workspace_admin(workspace_id, auth.uid()));
```

- [ ] **Step 3: Apply the migration**

Use the Supabase MCP `apply_migration` tool with `project_id` from Step 1, `name: "foundation_schema"`, and the SQL from Step 2.

- [ ] **Step 4: Verify the schema**

Use the Supabase MCP `list_tables` tool (verbose: true) against the project. Expected: `users`, `workspaces`, `workspace_members` present with the columns defined above, and `list_tables` (or a follow-up `execute_sql` calling `select * from pg_policies where schemaname = 'public'`) shows the 6 policies created.

- [ ] **Step 5: Fill in real Supabase credentials**

Use the Supabase MCP `get_project_url` tool and the project's API settings to get the anon key and service role key (via the dashboard/MCP as available), then update `.env.local` (already gitignored — do not commit it):

```text
NEXT_PUBLIC_SUPABASE_URL=<real project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<real anon key>
SUPABASE_SERVICE_ROLE_KEY=<real service role key>
SUPABASE_JWT_SECRET=<real JWT secret>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STORAGE_BUCKET=hive-files
```

- [ ] **Step 6: Generate TypeScript types**

Use the Supabase MCP `generate_typescript_types` tool with the project ID, and write the output to `types/database.ts`.

- [ ] **Step 7: Write the hand-written domain types**

Write `types/workspace.ts` and `types/user.ts` with the exact content shown in the Interfaces section above.

- [ ] **Step 8: Verify**

Run: `npm run build`
Expected: exits 0 (confirms `types/database.ts` is valid TypeScript).

- [ ] **Step 9: Commit**

```bash
git add supabase/ types/database.ts types/user.ts types/workspace.ts
git commit -m "feat: add Supabase schema migration (users, workspaces, workspace_members) with RLS"
```

Do not `git add .env.local` — it's gitignored.

---

### Task 4: Admin client and bootstrap script

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `scripts/bootstrap-owner-logic.ts`
- Create: `scripts/bootstrap-owner-logic.test.ts`
- Create: `scripts/bootstrap-owner.ts`

**Interfaces:**
- Consumes: `types/database.ts` (`Database`), `types/workspace.ts` (`WorkspaceRole`)
- Produces: `createAdminClient(): SupabaseClient<Database>` (`lib/supabase/admin.ts`); `parseBootstrapArgs(argv: string[]): { email: string; role: WorkspaceRole }` and `ensureWorkspace(admin: SupabaseClient<Database>): Promise<{ id: string }>` (`scripts/bootstrap-owner-logic.ts`) — later phases do not depend on these, this is a leaf script.

- [ ] **Step 1: Write `lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

This must only ever be imported from server-only code (scripts, Server Actions never call it directly — only the bootstrap script uses it in this phase).

- [ ] **Step 2: Write the failing test for argument parsing**

Create `scripts/bootstrap-owner-logic.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseBootstrapArgs } from './bootstrap-owner-logic'

describe('parseBootstrapArgs', () => {
  it('parses email and role flags', () => {
    const result = parseBootstrapArgs(['--email=owner@himark.com', '--role=owner'])
    expect(result).toEqual({ email: 'owner@himark.com', role: 'owner' })
  })

  it('defaults role to member when not provided', () => {
    const result = parseBootstrapArgs(['--email=person@himark.com'])
    expect(result).toEqual({ email: 'person@himark.com', role: 'member' })
  })

  it('throws when email is missing', () => {
    expect(() => parseBootstrapArgs([])).toThrow('--email is required')
  })

  it('throws when role is not a valid workspace_role', () => {
    expect(() => parseBootstrapArgs(['--email=x@himark.com', '--role=superadmin'])).toThrow(
      'invalid role'
    )
  })
})
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `npx vitest run scripts/bootstrap-owner-logic.test.ts`
Expected: FAIL — `bootstrap-owner-logic.ts` does not exist yet.

- [ ] **Step 4: Implement `scripts/bootstrap-owner-logic.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WorkspaceRole } from '@/types/workspace'

const VALID_ROLES: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer']

export function parseBootstrapArgs(argv: string[]): { email: string; role: WorkspaceRole } {
  const emailArg = argv.find((a) => a.startsWith('--email='))
  const roleArg = argv.find((a) => a.startsWith('--role='))

  if (!emailArg) {
    throw new Error('--email is required, e.g. --email=owner@himark.com')
  }

  const email = emailArg.split('=')[1]
  const role = (roleArg ? roleArg.split('=')[1] : 'member') as WorkspaceRole

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`invalid role "${role}" — must be one of ${VALID_ROLES.join(', ')}`)
  }

  return { email, role }
}

export async function ensureWorkspace(
  admin: SupabaseClient<Database>
): Promise<{ id: string }> {
  const { data: existing } = await admin.from('workspaces').select('id').limit(1).maybeSingle()
  if (existing) return { id: existing.id }

  const { data: created, error } = await admin
    .from('workspaces')
    .insert({ name: 'HIMARK', slug: 'himark', timezone: 'UTC', date_format: 'DD/MM/YYYY', time_format: '24h' })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(`Failed to create workspace: ${error?.message}`)
  }

  return { id: created.id }
}
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npx vitest run scripts/bootstrap-owner-logic.test.ts`
Expected: PASS (4 tests). The `ensureWorkspace` function isn't covered by this unit test (it needs a real/mocked Supabase client) — it's exercised for real in Step 7's manual run.

- [ ] **Step 6: Write the CLI entrypoint**

Create `scripts/bootstrap-owner.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBootstrapArgs, ensureWorkspace } from './bootstrap-owner-logic'

async function main() {
  const { email, role } = parseBootstrapArgs(process.argv.slice(2))
  const admin = createAdminClient()

  const workspace = await ensureWorkspace(admin)

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email)
  if (inviteError || !invited.user) {
    throw new Error(`Failed to invite ${email}: ${inviteError?.message}`)
  }

  // The DB trigger (Task 3) has created the public.users row by now.
  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id')
    .eq('auth_user_id', invited.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Could not find users row for invited auth user: ${profileError?.message}`)
  }

  const { error: memberError } = await admin.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: profile.id,
    role,
  })

  if (memberError) {
    throw new Error(`Failed to add workspace membership: ${memberError.message}`)
  }

  console.log(`Invited ${email} as ${role}. They'll receive an email to set their password.`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
```

- [ ] **Step 7: Manual step — DO NOT run this autonomously**

This step creates a real Supabase Auth user and sends a real email. An agent executing this plan must stop here and ask the user for the real email address to invite as the first Owner, rather than guessing or using a placeholder address. Once the user provides it:

```bash
npm run bootstrap -- --email=<the email the user provided> --role=owner
```

Expected output: `Invited <email> as owner. They'll receive an email to set their password.` Confirm in the Supabase dashboard (Authentication → Users) that the user now exists, and that `workspace_members` has one row with `role = 'owner'`.

- [ ] **Step 8: Commit**

```bash
git add lib/supabase/admin.ts scripts/
git commit -m "feat: add admin client and invite-only bootstrap script for first workspace owner"
```

---

### Task 5: Auth service layer

**Files:**
- Create: `services/auth/auth-service.ts`
- Create: `services/auth/auth-service.test.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js` `SupabaseClient<Database>` (any Supabase client — server or browser — passed in by the caller)
- Produces:
  ```typescript
  signIn(supabase: SupabaseClient<Database>, email: string, password: string): Promise<{ error: string | null }>
  signOut(supabase: SupabaseClient<Database>): Promise<void>
  requestPasswordReset(supabase: SupabaseClient<Database>, email: string, redirectTo: string): Promise<void>
  updatePassword(supabase: SupabaseClient<Database>, newPassword: string): Promise<{ error: string | null }>
  ```
  Tasks 8, 9, 10 (Server Actions) call these directly.

- [ ] **Step 1: Write the failing tests**

Create `services/auth/auth-service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { signIn, signOut, requestPasswordReset, updatePassword } from './auth-service'

function mockSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  } as never
}

describe('signIn', () => {
  it('returns no error on success', async () => {
    const supabase = mockSupabase()
    const result = await signIn(supabase, 'a@himark.com', 'password123')
    expect(result.error).toBeNull()
  })

  it('returns a generic error message on failure, not the raw Supabase error', async () => {
    const supabase = mockSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'Invalid login credentials' } }),
    })
    const result = await signIn(supabase, 'a@himark.com', 'wrong')
    expect(result.error).toBe('Invalid email or password.')
  })
})

describe('signOut', () => {
  it('calls supabase.auth.signOut', async () => {
    const supabase = mockSupabase()
    await signOut(supabase)
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('requestPasswordReset', () => {
  it('resolves without throwing even if the underlying call errors (never reveal whether the email exists)', async () => {
    const supabase = mockSupabase({
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: { message: 'User not found' } }),
    })
    await expect(requestPasswordReset(supabase, 'nobody@himark.com', 'http://x/reset')).resolves.toBeUndefined()
  })
})

describe('updatePassword', () => {
  it('returns a generic error message on failure', async () => {
    const supabase = mockSupabase({
      updateUser: vi.fn().mockResolvedValue({ error: { message: 'Token expired' } }),
    })
    const result = await updatePassword(supabase, 'newpassword123')
    expect(result.error).toBe('Could not update password. Please try requesting a new reset link.')
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `npx vitest run services/auth/auth-service.test.ts`
Expected: FAIL — `auth-service.ts` does not exist.

- [ ] **Step 3: Implement `services/auth/auth-service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function signIn(
  supabase: SupabaseClient<Database>,
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Invalid email or password.' }
  return { error: null }
}

export async function signOut(supabase: SupabaseClient<Database>): Promise<void> {
  await supabase.auth.signOut()
}

export async function requestPasswordReset(
  supabase: SupabaseClient<Database>,
  email: string,
  redirectTo: string
): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(
  supabase: SupabaseClient<Database>,
  newPassword: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    return { error: 'Could not update password. Please try requesting a new reset link.' }
  }
  return { error: null }
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run: `npx vitest run services/auth/auth-service.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add services/auth/
git commit -m "feat: add auth service layer (signIn, signOut, password reset/update)"
```

---

### Task 6: Workspace service layer

**Files:**
- Create: `services/workspace/workspace-service.ts`
- Create: `services/workspace/workspace-service.test.ts`

**Interfaces:**
- Consumes: `types/user.ts` (`User`), `types/workspace.ts` (`WorkspaceRole`)
- Produces:
  ```typescript
  interface CurrentUserWithMembership {
    id: string
    authUserId: string
    displayName: string
    email: string
    avatarUrl: string | null
    workspace: { id: string; name: string }
    role: WorkspaceRole
  }
  type CurrentUserResult =
    | { status: 'unauthenticated' }
    | { status: 'no-active-membership' }
    | { status: 'ok'; user: CurrentUserWithMembership }
  getCurrentUserWithMembership(supabase: SupabaseClient<Database>): Promise<CurrentUserResult>
  ```
  Three distinct states, not a nullable — this is what lets Task 13's layout show the spec's required "You don't have access" state (§8) separately from "not logged in." Task 13 (`hooks/use-current-user.ts`, dashboard layout) and Task 14 (Overview page) call this directly.

- [ ] **Step 1: Write the failing test**

Create `services/workspace/workspace-service.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getCurrentUserWithMembership } from './workspace-service'

describe('getCurrentUserWithMembership', () => {
  it('returns unauthenticated when there is no auth session', async () => {
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({ status: 'unauthenticated' })
  })

  it('returns no-active-membership when the user has no workspace_members row', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        auth_user_id: 'auth-1',
        display_name: 'Jane Doe',
        email: 'jane@himark.com',
        avatar_url: null,
        workspace_members: [],
      },
      error: null,
    })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      }),
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({ status: 'no-active-membership' })
  })

  it('returns ok with the user, workspace, and role when authenticated with active membership', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        auth_user_id: 'auth-1',
        display_name: 'Jane Doe',
        email: 'jane@himark.com',
        avatar_url: null,
        workspace_members: [
          { role: 'admin', workspace: { id: 'ws-1', name: 'HIMARK' } },
        ],
      },
      error: null,
    })

    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single }),
        }),
      }),
    } as never

    const result = await getCurrentUserWithMembership(supabase)
    expect(result).toEqual({
      status: 'ok',
      user: {
        id: 'user-1',
        authUserId: 'auth-1',
        displayName: 'Jane Doe',
        email: 'jane@himark.com',
        avatarUrl: null,
        workspace: { id: 'ws-1', name: 'HIMARK' },
        role: 'admin',
      },
    })
  })
})
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npx vitest run services/workspace/workspace-service.test.ts`
Expected: FAIL — `workspace-service.ts` does not exist.

- [ ] **Step 3: Implement `services/workspace/workspace-service.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WorkspaceRole } from '@/types/workspace'

export interface CurrentUserWithMembership {
  id: string
  authUserId: string
  displayName: string
  email: string
  avatarUrl: string | null
  workspace: { id: string; name: string }
  role: WorkspaceRole
}

export type CurrentUserResult =
  | { status: 'unauthenticated' }
  | { status: 'no-active-membership' }
  | { status: 'ok'; user: CurrentUserWithMembership }

export async function getCurrentUserWithMembership(
  supabase: SupabaseClient<Database>
): Promise<CurrentUserResult> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return { status: 'unauthenticated' }

  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      auth_user_id,
      display_name,
      email,
      avatar_url,
      workspace_members ( role, workspace:workspaces ( id, name ) )
    `
    )
    .eq('auth_user_id', authUser.id)
    .single()

  if (error || !data) return { status: 'unauthenticated' }

  const membership = data.workspace_members[0]
  if (!membership) return { status: 'no-active-membership' }

  return {
    status: 'ok',
    user: {
      id: data.id,
      authUserId: data.auth_user_id,
      displayName: data.display_name,
      email: data.email,
      avatarUrl: data.avatar_url,
      workspace: membership.workspace,
      role: membership.role,
    },
  }
}
```

- [ ] **Step 4: Run test and verify it passes**

Run: `npx vitest run services/workspace/workspace-service.test.ts`
Expected: PASS (3 tests). Note: the exact shape of the mocked query chain in the test must match how the real Supabase query builder is called (`.from().select().eq().single()`) — if the implementation chains methods differently, update the test's mock to match before considering this done.

- [ ] **Step 5: Commit**

```bash
git add services/workspace/
git commit -m "feat: add workspace service layer (getCurrentUserWithMembership)"
```

---

### Task 7: shadcn/ui primitives and class name utility

**Files:**
- Create: `utils/cn.ts`
- Create: `components.json` (shadcn config)
- Create: `components/ui/button.tsx`, `input.tsx`, `label.tsx`, `form.tsx`, `card.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `separator.tsx`, `skeleton.tsx`, `sonner.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` (`utils/cn.ts`) and the standard shadcn component exports (`Button`, `Input`, `Label`, `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`, `Card`/`CardHeader`/`CardContent`, `Avatar`/`AvatarImage`/`AvatarFallback`, `DropdownMenu` family, `Separator`, `Skeleton`, `Toaster`/`toast`) — Tasks 8–14 consume these.

- [ ] **Step 1: Write `utils/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

When prompted (or via `-d` defaults), confirm: base color neutral, CSS variables yes, `styles/global.css` as the global CSS file, `@/components` alias, `@/lib/utils` alias — if the CLI insists on `lib/utils.ts` instead of `utils/cn.ts`, let it create `lib/utils.ts` and then re-export from `utils/cn.ts`:

```typescript
// utils/cn.ts
export { cn } from '@/lib/utils'
```

- [ ] **Step 3: Add the primitives**

```bash
npx shadcn@latest add button input label form card avatar dropdown-menu separator skeleton sonner -y
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add utils/cn.ts components.json components/ui/ lib/utils.ts
git commit -m "feat: install shadcn/ui primitives and class name utility"
```

---

### Task 8: Login page

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/actions.ts`
- Create: `components/forms/login-form.tsx`
- Create: `components/forms/login-form.test.tsx`

**Interfaces:**
- Consumes: `services/auth.signIn`, `lib/supabase/server.createClient`, shadcn `Button`/`Input`/`Label`/`Form*`
- Produces: `loginAction(input: { email: string; password: string }): Promise<{ error: string | null }>` (`app/(auth)/login/actions.ts`) and the `LoginForm` component — nothing later depends on these directly (leaf page), but Task 16's e2e test drives this page.

- [ ] **Step 1: Write the failing component test**

Create `components/forms/login-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'

vi.mock('@/app/(auth)/login/actions', () => ({
  loginAction: vi.fn(),
}))

import { loginAction } from '@/app/(auth)/login/actions'

describe('LoginForm', () => {
  it('shows validation errors when submitted empty', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('calls loginAction with the entered credentials on valid submit', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: null })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'correct-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(loginAction).toHaveBeenCalledWith({ email: 'jane@himark.com', password: 'correct-password' })
  })

  it('shows the server error message when loginAction returns one', async () => {
    vi.mocked(loginAction).mockResolvedValue({ error: 'Invalid email or password.' })
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@himark.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run components/forms/login-form.test.tsx`
Expected: FAIL — `login-form.tsx` and `actions.ts` don't exist yet.

- [ ] **Step 3: Write the Server Action**

Create `app/(auth)/login/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signIn } from '@/services/auth/auth-service'

export async function loginAction(input: {
  email: string
  password: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const result = await signIn(supabase, input.email, input.password)
  if (result.error) return result

  redirect('/dashboard/overview')
}
```

- [ ] **Step 4: Write the LoginForm component**

Create `components/forms/login-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { loginAction } from '@/app/(auth)/login/actions'

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginInput = z.infer<typeof loginSchema>

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const result = await loginAction(data)
    if (result.error) setServerError(result.error)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
          <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
            {serverError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <a href="/forgot-password" className="text-sm block text-center" style={{ color: 'var(--color-ocean)' }}>
          Forgot your password?
        </a>
      </form>
    </Form>
  )
}
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npx vitest run components/forms/login-form.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Write the auth layout and login page**

Create `app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background-app)' }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-lg"
        style={{ background: 'var(--background-surface)', boxShadow: 'var(--shadow-md)' }}
      >
        {children}
      </div>
    </div>
  )
}
```

Create `app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/forms/login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1>Sign in to HIVE</h1>
      <LoginForm />
    </div>
  )
}
```

- [ ] **Step 7: Verify the full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add "app/(auth)" components/forms/login-form.tsx components/forms/login-form.test.tsx
git commit -m "feat: add login page (form, server action, auth layout)"
```

---

### Task 9: Forgot password page

**Files:**
- Create: `app/(auth)/forgot-password/page.tsx`
- Create: `app/(auth)/forgot-password/actions.ts`
- Create: `components/forms/forgot-password-form.tsx`
- Create: `components/forms/forgot-password-form.test.tsx`
- Modify: `middleware.ts:36-44`

**Interfaces:**
- Consumes: `services/auth.requestPasswordReset`, `lib/supabase/server.createClient`
- Produces: `requestPasswordResetAction(input: { email: string }): Promise<{ submitted: true }>` — always succeeds from the caller's perspective, by design (never reveals whether the email exists).

- [ ] **Step 1: Fix the middleware redirect-loop bug**

`middleware.ts` currently only excludes `/login` and `/auth` from the auth redirect, which means a logged-out user visiting `/forgot-password` gets bounced straight back to `/login` — exactly the page they can't use. Edit `middleware.ts:36-44`:

```typescript
  const publicPaths = ['/login', '/forgot-password', '/reset-password', '/auth']

  if (!user && !publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
```

- [ ] **Step 2: Write the failing component test**

Create `components/forms/forgot-password-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPasswordForm } from './forgot-password-form'

vi.mock('@/app/(auth)/forgot-password/actions', () => ({
  requestPasswordResetAction: vi.fn(),
}))

import { requestPasswordResetAction } from '@/app/(auth)/forgot-password/actions'

describe('ForgotPasswordForm', () => {
  it('shows a validation error for an invalid email', async () => {
    render(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
  })

  it('shows the same confirmation message regardless of whether the email exists', async () => {
    vi.mocked(requestPasswordResetAction).mockResolvedValue({ submitted: true })
    render(<ForgotPasswordForm />)
    await userEvent.type(screen.getByLabelText(/email/i), 'anyone@himark.com')
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(
      await screen.findByText(/if that email exists, we've sent a link/i)
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `npx vitest run components/forms/forgot-password-form.test.tsx`
Expected: FAIL — files don't exist yet.

- [ ] **Step 4: Write the Server Action**

Create `app/(auth)/forgot-password/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { requestPasswordReset } from '@/services/auth/auth-service'

export async function requestPasswordResetAction(input: {
  email: string
}): Promise<{ submitted: true }> {
  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
  await requestPasswordReset(supabase, input.email, redirectTo)
  return { submitted: true }
}
```

- [ ] **Step 5: Write the ForgotPasswordForm component**

Create `components/forms/forgot-password-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { requestPasswordResetAction } from '@/app/(auth)/forgot-password/actions'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type Input = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  async function onSubmit(data: Input) {
    await requestPasswordResetAction(data)
    setSubmitted(true)
  }

  if (submitted) {
    return <p>If that email exists, we've sent a link to reset your password.</p>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npx vitest run components/forms/forgot-password-form.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Write the page**

Create `app/(auth)/forgot-password/page.tsx`:

```tsx
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <h1>Reset your password</h1>
      <ForgotPasswordForm />
    </div>
  )
}
```

- [ ] **Step 8: Verify the full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add middleware.ts "app/(auth)/forgot-password" components/forms/forgot-password-form.tsx components/forms/forgot-password-form.test.tsx
git commit -m "feat: add forgot-password page and fix middleware redirect loop for public auth routes"
```

---

### Task 10: Reset password page

**Files:**
- Create: `app/(auth)/reset-password/page.tsx`
- Create: `app/(auth)/reset-password/actions.ts`
- Create: `components/forms/reset-password-form.tsx`
- Create: `components/forms/reset-password-form.test.tsx`

**Interfaces:**
- Consumes: `services/auth.updatePassword`, `lib/supabase/server.createClient`
- Produces: `updatePasswordAction(input: { password: string }): Promise<{ error: string | null }>`. This page is also where a newly-bootstrapped teammate lands after clicking their invite email (Supabase routes both invite and recovery links through the same flow).

- [ ] **Step 1: Write the failing component test**

Create `components/forms/reset-password-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResetPasswordForm } from './reset-password-form'

vi.mock('@/app/(auth)/reset-password/actions', () => ({
  updatePasswordAction: vi.fn(),
}))

import { updatePasswordAction } from '@/app/(auth)/reset-password/actions'

describe('ResetPasswordForm', () => {
  it('requires a minimum password length', async () => {
    render(<ResetPasswordForm />)
    await userEvent.type(screen.getByLabelText(/new password/i), 'short')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('shows the server error when updatePasswordAction fails', async () => {
    vi.mocked(updatePasswordAction).mockResolvedValue({
      error: 'Could not update password. Please try requesting a new reset link.',
    })
    render(<ResetPasswordForm />)
    await userEvent.type(screen.getByLabelText(/new password/i), 'longenoughpassword')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(
      await screen.findByText('Could not update password. Please try requesting a new reset link.')
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run components/forms/reset-password-form.test.tsx`
Expected: FAIL — files don't exist yet.

- [ ] **Step 3: Write the Server Action**

Create `app/(auth)/reset-password/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/services/auth/auth-service'

export async function updatePasswordAction(input: {
  password: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()
  return updatePassword(supabase, input.password)
}
```

- [ ] **Step 4: Write the ResetPasswordForm component**

Create `components/forms/reset-password-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { updatePasswordAction } from '@/app/(auth)/reset-password/actions'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type Input = z.infer<typeof schema>

export function ResetPasswordForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { password: '' } })

  async function onSubmit(data: Input) {
    setServerError(null)
    const result = await updatePasswordAction(data)
    if (result.error) {
      setServerError(result.error)
      return
    }
    router.push('/login')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {serverError && (
          <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
            {serverError}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Form>
  )
}
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npx vitest run components/forms/reset-password-form.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Write the page**

Create `app/(auth)/reset-password/page.tsx`:

```tsx
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <h1>Set a new password</h1>
      <ResetPasswordForm />
    </div>
  )
}
```

- [ ] **Step 7: Verify the full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add "app/(auth)/reset-password" components/forms/reset-password-form.tsx components/forms/reset-password-form.test.tsx
git commit -m "feat: add reset-password page"
```

---

### Task 11: Navigation constants and sidebar

**Files:**
- Create: `constants/routes.ts`
- Create: `constants/roles.ts`
- Create: `components/navigation/sidebar-nav-item.tsx`
- Create: `components/navigation/sidebar.tsx`
- Create: `components/navigation/sidebar.test.tsx`

**Interfaces:**
- Produces: `NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[]` (`constants/routes.ts`), `ROLE_LABELS: Record<WorkspaceRole, string>` (`constants/roles.ts`), `Sidebar` component (props: `{ activePath: string; userDisplayName: string; userRole: WorkspaceRole }`) — consumed by Task 13's `DashboardShell`.

- [ ] **Step 1: Write `constants/routes.ts`**

```typescript
import {
  LayoutDashboard,
  FolderKanban,
  Trello,
  ListTodo,
  Calendar,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'Board', href: '/dashboard/board', icon: Trello },
  { label: 'My Tasks', href: '/dashboard/my-tasks', icon: ListTodo },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Files', href: '/dashboard/files', icon: FileText },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]
```

- [ ] **Step 2: Write `constants/roles.ts`**

```typescript
import type { WorkspaceRole } from '@/types/workspace'

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}
```

- [ ] **Step 3: Write the failing sidebar test**

Create `components/navigation/sidebar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from './sidebar'

describe('Sidebar', () => {
  it('renders all seven nav items', () => {
    render(<Sidebar activePath="/dashboard/overview" userDisplayName="Jane Doe" userRole="admin" />)
    for (const label of ['Overview', 'Projects', 'Board', 'My Tasks', 'Calendar', 'Files', 'Settings']) {
      expect(screen.getByRole('link', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
  })

  it('marks the active route with aria-current', () => {
    render(<Sidebar activePath="/dashboard/board" userDisplayName="Jane Doe" userRole="admin" />)
    expect(screen.getByRole('link', { name: /board/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /overview/i })).not.toHaveAttribute('aria-current')
  })

  it("shows the user's name and role at the bottom", () => {
    render(<Sidebar activePath="/dashboard/overview" userDisplayName="Jane Doe" userRole="admin" />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the test and verify it fails**

Run: `npx vitest run components/navigation/sidebar.test.tsx`
Expected: FAIL — `sidebar.tsx` doesn't exist.

- [ ] **Step 5: Write `components/navigation/sidebar-nav-item.tsx`**

```tsx
import Link from 'next/link'
import { cn } from '@/utils/cn'
import type { NavItem } from '@/constants/routes'

export function SidebarNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-standard',
        active ? 'font-semibold' : 'hover:bg-white/20'
      )}
      style={{
        background: active ? 'var(--color-midnight)' : 'transparent',
        color: active ? 'var(--text-on-dark)' : 'var(--text-primary)',
      }}
    >
      <Icon size={18} color={active ? 'var(--color-white)' : undefined} />
      {item.label}
    </Link>
  )
}
```

- [ ] **Step 6: Write `components/navigation/sidebar.tsx`**

```tsx
import { NAV_ITEMS } from '@/constants/routes'
import { ROLE_LABELS } from '@/constants/roles'
import { SidebarNavItem } from './sidebar-nav-item'
import type { WorkspaceRole } from '@/types/workspace'

export function Sidebar({
  activePath,
  userDisplayName,
  userRole,
}: {
  activePath: string
  userDisplayName: string
  userRole: WorkspaceRole
}) {
  return (
    <aside
      className="flex flex-col justify-between"
      style={{ width: 240, background: 'var(--background-sidebar)', padding: 'var(--space-4)' }}
    >
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.href} item={item} active={activePath.startsWith(item.href)} />
        ))}
      </nav>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
        <div style={{ fontWeight: 600 }}>{userDisplayName}</div>
        <div style={{ color: 'var(--text-secondary)' }}>{ROLE_LABELS[userRole]}</div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 7: Run the test and verify it passes**

Run: `npx vitest run components/navigation/sidebar.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add constants/ components/navigation/
git commit -m "feat: add sidebar navigation with nav items and active-route highlighting"
```

---

### Task 12: Top bar, user menu, and sign-out

**Files:**
- Create: `app/dashboard/actions.ts`
- Create: `components/layout/topbar.tsx`
- Create: `components/layout/user-menu.tsx`
- Create: `components/layout/user-menu.test.tsx`

**Interfaces:**
- Consumes: `services/auth.signOut`, `lib/supabase/server.createClient`, shadcn `DropdownMenu`/`Avatar`
- Produces: `signOutAction(): Promise<void>` (`app/dashboard/actions.ts`); `UserMenu` (props: `{ displayName: string; email: string; avatarUrl: string | null }`), `Topbar` (props: `{ title: string; userDisplayName: string; userEmail: string; userAvatarUrl: string | null }`) — consumed by Task 13's `DashboardShell`.

- [ ] **Step 1: Write the sign-out Server Action**

Create `app/dashboard/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/services/auth/auth-service'

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await signOut(supabase)
  redirect('/login')
}
```

- [ ] **Step 2: Write the failing UserMenu test**

Create `components/layout/user-menu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './user-menu'

vi.mock('@/app/dashboard/actions', () => ({
  signOutAction: vi.fn(),
}))

import { signOutAction } from '@/app/dashboard/actions'

describe('UserMenu', () => {
  it('opens to reveal a sign out option', async () => {
    render(<UserMenu displayName="Jane Doe" email="jane@himark.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /jane doe/i }))
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls signOutAction when "Sign out" is clicked', async () => {
    render(<UserMenu displayName="Jane Doe" email="jane@himark.com" avatarUrl={null} />)
    await userEvent.click(screen.getByRole('button', { name: /jane doe/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }))
    expect(signOutAction).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `npx vitest run components/layout/user-menu.test.tsx`
Expected: FAIL — `user-menu.tsx` doesn't exist.

- [ ] **Step 4: Write `components/layout/user-menu.tsx`**

```tsx
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOutAction } from '@/app/dashboard/actions'

export function UserMenu({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string
  email: string
  avatarUrl: string | null
}) {
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2" aria-label={displayName}>
          <Avatar>
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {email}
        </div>
        <DropdownMenuItem onSelect={() => signOutAction()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npx vitest run components/layout/user-menu.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Write `components/layout/topbar.tsx`** (no global search / notifications — out of scope this phase, per spec §7.4)

```tsx
import { UserMenu } from './user-menu'

export function Topbar({
  title,
  userDisplayName,
  userEmail,
  userAvatarUrl,
}: {
  title: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
}) {
  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: 72,
        padding: '0 var(--space-8)',
        background: 'var(--background-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      <UserMenu displayName={userDisplayName} email={userEmail} avatarUrl={userAvatarUrl} />
    </header>
  )
}
```

- [ ] **Step 7: Verify the full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/actions.ts components/layout/topbar.tsx components/layout/user-menu.tsx components/layout/user-menu.test.tsx
git commit -m "feat: add top bar, user menu, and sign-out action"
```

---

### Task 13: Dashboard shell and layout

**Files:**
- Create: `hooks/use-current-user.ts`
- Create: `components/layout/dashboard-shell.tsx`
- Create: `components/empty-states/no-access.tsx`
- Create: `app/dashboard/layout.tsx`
- Create: `app/providers.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `services/workspace.getCurrentUserWithMembership`, `components/navigation/sidebar.Sidebar`, `components/layout/topbar.Topbar`
- Produces: `DashboardShell` (props: `{ activePath: string; user: CurrentUserWithMembership; children: React.ReactNode }`) — used only by `app/dashboard/layout.tsx`, nothing later depends on it directly.

- [ ] **Step 1: Add the TanStack Query provider**

Create `app/providers.tsx`:

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

Edit `app/layout.tsx` to wrap children:

```tsx
import '@/styles/global.css'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Write `hooks/use-current-user.ts`**

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => getCurrentUserWithMembership(createClient()),
  })
}
```

This hook exists for any future client-side components that need the current user reactively (e.g. optimistic UI in later phases); the dashboard layout itself fetches server-side in Step 4 rather than using this hook, to avoid a loading flash on first paint.

- [ ] **Step 3: Write `components/layout/dashboard-shell.tsx`**

```tsx
import { Sidebar } from '@/components/navigation/sidebar'
import { Topbar } from '@/components/layout/topbar'
import type { CurrentUserWithMembership } from '@/services/workspace/workspace-service'

export function DashboardShell({
  activePath,
  user,
  pageTitle,
  children,
}: {
  activePath: string
  user: CurrentUserWithMembership
  pageTitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background-app)' }}>
      <Sidebar activePath={activePath} userDisplayName={user.displayName} userRole={user.role} />
      <div className="flex flex-1 flex-col">
        <Topbar
          title={pageTitle}
          userDisplayName={user.displayName}
          userEmail={user.email}
          userAvatarUrl={user.avatarUrl}
        />
        <main style={{ padding: 'var(--space-8)', maxWidth: 1600 }}>{children}</main>
      </div>
    </div>
  )
}
```

`pageTitle` is a plain prop (not derived from the route) because Next.js layouts don't receive the child page's metadata directly; each `page.tsx` under `app/dashboard/*` will need to either pass its own title up via a shared client-side title store or the layout can derive it from `usePathname()` mapped through `NAV_ITEMS`. To keep this task's scope minimal, derive it in `app/dashboard/layout.tsx` (Step 4) from the pathname instead of threading it through props.

- [ ] **Step 4: Write the "no access" state component**

Create `components/empty-states/no-access.tsx` — this is the spec §8-required distinct state for an authenticated user whose workspace membership is missing/deactivated (as opposed to not being logged in at all, which still redirects to `/login`):

```tsx
export function NoAccess() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center"
      style={{ background: 'var(--background-app)', padding: 'var(--space-8)' }}
    >
      <h1>You don&apos;t have access</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Your account isn&apos;t an active member of the HIMARK workspace. Contact your workspace
        owner or admin.
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Write `app/dashboard/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { NoAccess } from '@/components/empty-states/no-access'
import { NAV_ITEMS } from '@/constants/routes'
import { headers } from 'next/headers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const result = await getCurrentUserWithMembership(supabase)

  if (result.status === 'unauthenticated') {
    redirect('/login')
  }

  if (result.status === 'no-active-membership') {
    return <NoAccess />
  }

  const pathname = (await headers()).get('x-invoke-path') ?? '/dashboard/overview'
  const activeItem = NAV_ITEMS.find((item) => pathname.startsWith(item.href))

  return (
    <DashboardShell activePath={pathname} user={result.user} pageTitle={activeItem?.label ?? 'HIVE'}>
      {children}
    </DashboardShell>
  )
}
```

Note: reading the current pathname from a Server Component layout isn't directly supported by a stable Next.js API as of this writing (`headers()` does not reliably expose the invoked path in all deployment targets). If `x-invoke-path` is unavailable in local testing, fall back to computing `pageTitle` inside each `page.tsx` and rendering it as a heading in the page body instead of the top bar, OR convert `Topbar`'s title to be set via a small client-side `usePathname()` read inside `DashboardShell` itself (making `DashboardShell` a client component for just the title line, while the rest of the layout stays server-rendered). Prefer the second fix if the header approach doesn't work: move the `NAV_ITEMS.find(...)` lookup into `Topbar`, convert `Topbar` to `'use client'`, and call `usePathname()` there directly instead of accepting a `title` prop.

- [ ] **Step 6: Verify the full build**

Run: `npm run build`
Expected: exits 0. If Step 5's pathname approach fails at runtime, apply the fallback described in Step 5 and re-verify.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, sign in with the bootstrapped Owner account from Task 4, and confirm in the browser: the sidebar shows all 7 nav items with Overview highlighted, the top bar shows the correct name/email, and the page renders using the Ocean Light sidebar / Off White background / Midnight active-item tokens (not default black-on-white).

- [ ] **Step 8: Commit**

```bash
git add hooks/use-current-user.ts components/layout/dashboard-shell.tsx components/empty-states/no-access.tsx app/dashboard/layout.tsx app/providers.tsx app/layout.tsx
git commit -m "feat: add authenticated dashboard shell (sidebar + top bar + auth guard + no-access state)"
```

---

### Task 14: Overview page, placeholder pages, and error boundary

**Files:**
- Create: `components/empty-states/coming-soon.tsx`
- Modify: `app/dashboard/overview/page.tsx`
- Modify: `app/dashboard/board/page.tsx`, `calendar/page.tsx`, `files/page.tsx`, `my-tasks/page.tsx`, `projects/page.tsx`, `settings/page.tsx`
- Create: `app/dashboard/error.tsx`

**Interfaces:**
- Produces: `ComingSoon` component (props: `{ module: string }`) — used by the 6 stub pages.

- [ ] **Step 1: Write `components/empty-states/coming-soon.tsx`**

```tsx
export function ComingSoon({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: 'var(--space-16) 0' }}>
      <h3>{module} is coming soon</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        This part of HIVE hasn&apos;t been built yet — it&apos;s planned for a later phase.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Wire the 6 stub pages**

Each of `app/dashboard/board/page.tsx`, `app/dashboard/calendar/page.tsx`, `app/dashboard/files/page.tsx`, `app/dashboard/my-tasks/page.tsx`, `app/dashboard/projects/page.tsx`, `app/dashboard/settings/page.tsx` gets the same pattern (module name changes per file):

```tsx
import { ComingSoon } from '@/components/empty-states/coming-soon'

export default function BoardPage() {
  return <ComingSoon module="Board" />
}
```

(Use `CalendarPage`/`"Calendar"`, `FilesPage`/`"Files"`, `MyTasksPage`/`"My Tasks"`, `ProjectsPage`/`"Projects"`, `SettingsPage`/`"Settings"` respectively — component function names must be unique per file and match the page's purpose.)

- [ ] **Step 3: Write the real Overview page**

Edit `app/dashboard/overview/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { ROLE_LABELS } from '@/constants/roles'

export default async function OverviewPage() {
  const supabase = await createClient()
  const result = await getCurrentUserWithMembership(supabase)

  // Unreachable in the 'unauthenticated'/'no-active-membership' cases —
  // app/dashboard/layout.tsx (Task 13) already handles both before this page renders.
  if (result.status !== 'ok') return null

  const { user } = result

  return (
    <div className="space-y-2">
      <h1>Welcome, {user.displayName.split(' ')[0]}</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        You&apos;re signed in to the {user.workspace.name} workspace as {ROLE_LABELS[user.role]}.
      </p>
      <p style={{ color: 'var(--text-muted)' }}>
        Projects, tasks, and deadlines will show up here once they&apos;re built.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Write the dashboard error boundary**

Create `app/dashboard/error.tsx`:

```tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: 'var(--space-16) 0' }}>
      <h3>Something went wrong</h3>
      <p style={{ color: 'var(--text-muted)' }}>
        Please try again. If the problem continues, contact whoever manages HIVE.
      </p>
      <button onClick={reset} className="underline text-sm" style={{ marginTop: 'var(--space-4)' }}>
        Try again
      </button>
    </div>
  )
}
```

`error` is intentionally unused in the rendered output — its message must never be shown directly to the user (`security.md` §15); it's available here only for the (optional, out of scope this phase) future step of forwarding it to server-side logging.

- [ ] **Step 5: Verify the full build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, sign in, click through all 7 sidebar nav items. Expected: Overview shows the real welcome message with correct name/workspace/role; the other 6 show the "coming soon" placeholder, never a blank page.

- [ ] **Step 7: Commit**

```bash
git add components/empty-states/ app/dashboard/overview/page.tsx app/dashboard/board/page.tsx app/dashboard/calendar/page.tsx app/dashboard/files/page.tsx app/dashboard/my-tasks/page.tsx app/dashboard/projects/page.tsx app/dashboard/settings/page.tsx app/dashboard/error.tsx
git commit -m "feat: add real Overview content, coming-soon placeholders, and dashboard error boundary"
```

---

### Task 15: RLS workspace-isolation integration test

**Files:**
- Create: `tests/integration/rls-workspace-isolation.test.ts`
- Modify: `package.json` (add `test:integration` script)

**Interfaces:**
- Consumes: `lib/supabase/admin.createAdminClient`, real Supabase project from Task 3
- Produces: nothing consumed by later tasks — this is a standalone guard test.

- [ ] **Step 1: Add the integration test script**

Edit `package.json`'s `scripts` block, add:

```json
"test:integration": "vitest run tests/integration"
```

- [ ] **Step 2: Write the test**

Create `tests/integration/rls-workspace-isolation.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const TEST_PASSWORD = 'test-password-123!'

describe('RLS: workspace isolation', () => {
  const admin = createAdminClient()
  let workspaceAId: string
  let workspaceBId: string
  let userAEmail: string
  let userBEmail: string

  beforeAll(async () => {
    const suffix = Date.now()
    userAEmail = `rls-test-a-${suffix}@example.com`
    userBEmail = `rls-test-b-${suffix}@example.com`

    const { data: wsA } = await admin
      .from('workspaces')
      .insert({ name: `Test WS A ${suffix}`, slug: `test-ws-a-${suffix}`, timezone: 'UTC', date_format: 'DD/MM/YYYY', time_format: '24h' })
      .select('id')
      .single()
    const { data: wsB } = await admin
      .from('workspaces')
      .insert({ name: `Test WS B ${suffix}`, slug: `test-ws-b-${suffix}`, timezone: 'UTC', date_format: 'DD/MM/YYYY', time_format: '24h' })
      .select('id')
      .single()
    workspaceAId = wsA!.id
    workspaceBId = wsB!.id

    const { data: authA } = await admin.auth.admin.createUser({
      email: userAEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    const { data: authB } = await admin.auth.admin.createUser({
      email: userBEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    const { data: userA } = await admin.from('users').select('id').eq('auth_user_id', authA!.user!.id).single()
    const { data: userB } = await admin.from('users').select('id').eq('auth_user_id', authB!.user!.id).single()

    await admin.from('workspace_members').insert({ workspace_id: workspaceAId, user_id: userA!.id, role: 'member' })
    await admin.from('workspace_members').insert({ workspace_id: workspaceBId, user_id: userB!.id, role: 'member' })
  })

  afterAll(async () => {
    await admin.from('workspaces').delete().in('id', [workspaceAId, workspaceBId])
    const { data } = await admin.auth.admin.listUsers()
    const testUsers = data.users.filter((u) => u.email === userAEmail || u.email === userBEmail)
    for (const u of testUsers) {
      await admin.auth.admin.deleteUser(u.id)
    }
  })

  it("user A cannot read user B's workspace", async () => {
    const clientA = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await clientA.auth.signInWithPassword({ email: userAEmail, password: TEST_PASSWORD })

    const { data, error } = await clientA.from('workspaces').select('id').eq('id', workspaceBId)

    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it("user A cannot read user B's workspace_members row", async () => {
    const clientA = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await clientA.auth.signInWithPassword({ email: userAEmail, password: TEST_PASSWORD })

    const { data } = await clientA.from('workspace_members').select('id').eq('workspace_id', workspaceBId)

    expect(data).toEqual([])
  })
})
```

- [ ] **Step 3: Run the test against the real Supabase project**

Run: `npm run test:integration`
Expected: PASS (2 tests). This test creates and deletes real (throwaway, timestamp-suffixed) rows in the Supabase project from Task 3 — safe because it cleans up in `afterAll`, but do not point `NEXT_PUBLIC_SUPABASE_URL` at a production project when running it.

- [ ] **Step 4: Commit**

```bash
git add tests/integration/ package.json
git commit -m "test: add RLS integration test proving cross-workspace data isolation"
```

---

### Task 16: Playwright login journey

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/login.spec.ts`

**Interfaces:** none — leaf e2e test.

- [ ] **Step 1: Write `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 2: Write the test**

This test needs a real, known set of credentials. Create `tests/e2e/login.spec.ts` using the same throwaway-user pattern as Task 15's integration test (create via admin API in a setup step, sign in through the real UI, clean up after) rather than depending on the bootstrapped Owner account from Task 4 (whose email is unknown to the test suite):

```typescript
import { test, expect } from '@playwright/test'
import { createAdminClient } from '../../lib/supabase/admin'

const TEST_PASSWORD = 'e2e-test-password-123!'
let testEmail: string
let testUserId: string

test.beforeAll(async () => {
  const admin = createAdminClient()
  testEmail = `e2e-login-${Date.now()}@example.com`

  const { data: created } = await admin.auth.admin.createUser({
    email: testEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  testUserId = created!.user!.id

  const { data: userRow } = await admin.from('users').select('id').eq('auth_user_id', testUserId).single()
  const { data: workspace } = await admin.from('workspaces').select('id').limit(1).maybeSingle()
  const workspaceId =
    workspace?.id ??
    (
      await admin
        .from('workspaces')
        .insert({ name: 'E2E Test WS', slug: `e2e-test-ws-${Date.now()}`, timezone: 'UTC', date_format: 'DD/MM/YYYY', time_format: '24h' })
        .select('id')
        .single()
    ).data!.id

  await admin.from('workspace_members').insert({ workspace_id: workspaceId, user_id: userRow!.id, role: 'member' })
})

test.afterAll(async () => {
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(testUserId)
})

test('login, protected-route redirect, and logout', async ({ page }) => {
  // Protected route redirect: visiting /dashboard/overview while logged out sends to /login
  await page.goto('/dashboard/overview')
  await expect(page).toHaveURL(/\/login/)

  // Login
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard\/overview/)
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

  // Logout
  await page.getByRole('button', { name: new RegExp(testEmail.split('@')[0], 'i') }).click()
  await page.getByRole('menuitem', { name: /sign out/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('shows an error for wrong credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(testEmail)
  await page.getByLabel(/password/i).fill('wrong-password')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
})
```

Note: the logout step's button name assumes `UserMenu`'s `aria-label` is the display name, but this test user has no `display_name` set beyond what the DB trigger derives from their email (Task 3's trigger falls back to `new.email` when no metadata is provided) — so the visible name will be the email address, not `testEmail.split('@')[0]`. Adjust the selector to `page.getByRole('button', { name: testEmail })` if the trigger's fallback produces the full email rather than a shortened form; verify against actual rendered output when running this test the first time and correct the selector to match.

- [ ] **Step 3: Run the test**

Run: `npm run test:e2e`
Expected: PASS (2 tests). If a selector mismatch appears (per the note above), fix the selector and re-run.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: add Playwright e2e coverage for login, protected-route redirect, and logout"
```

---

### Task 17: Accessibility pass on auth forms and dashboard shell

**Files:**
- Create: `tests/a11y/auth-forms.a11y.test.tsx`
- Create: `tests/a11y/dashboard-shell.a11y.test.tsx`
- Create: `vitest.setup.ts`
- Modify: `vitest.config.ts` (create if not already present)

**Interfaces:** none — leaf tests.

- [ ] **Step 1: Ensure Vitest config wires up jsdom and the setup file**

Create (or verify, if Task 1 hasn't already produced it) `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', 'tests/e2e/**', 'tests/integration/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 2: Write the failing a11y test for auth forms**

Create `tests/a11y/auth-forms.a11y.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { LoginForm } from '@/components/forms/login-form'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

describe('Auth forms accessibility', () => {
  it('LoginForm has no axe violations', async () => {
    const { container } = render(<LoginForm />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ForgotPasswordForm has no axe violations', async () => {
    const { container } = render(<ForgotPasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ResetPasswordForm has no axe violations', async () => {
    const { container } = render(<ResetPasswordForm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 3: Run and verify it fails (or passes trivially — install gap)**

Run: `npx vitest run tests/a11y/auth-forms.a11y.test.tsx`
Expected: FAIL if `vitest-axe` isn't installed yet — run `npm install -D vitest-axe` and add `import 'vitest-axe/extend-expect'` to `vitest.setup.ts`, then re-run.

- [ ] **Step 4: Fix any real violations, then verify it passes**

Run: `npx vitest run tests/a11y/auth-forms.a11y.test.tsx`
Expected: PASS (3 tests). If a violation is reported (e.g. a missing accessible name), fix the specific component from Tasks 8–10 and re-run — do not weaken the test.

- [ ] **Step 5: Write the dashboard shell a11y test**

Create `tests/a11y/dashboard-shell.a11y.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { DashboardShell } from '@/components/layout/dashboard-shell'

describe('DashboardShell accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <DashboardShell
        activePath="/dashboard/overview"
        pageTitle="Overview"
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
  })
})
```

- [ ] **Step 6: Run and verify it passes**

Run: `npx vitest run tests/a11y/dashboard-shell.a11y.test.tsx`
Expected: PASS. Fix any real violation in `Sidebar`/`Topbar`/`UserMenu` rather than suppressing the check.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: every test across all previous tasks still passes together (not just individually).

- [ ] **Step 8: Commit**

```bash
git add tests/a11y/ vitest.config.ts vitest.setup.ts package.json
git commit -m "test: add axe accessibility coverage for auth forms and dashboard shell"
```

---

## Self-Review Notes

- **Spec coverage:** every numbered section of the design spec (§5 Foundation Setup → Task 1–2; §6 Data Model & Authorization → Task 3–4; §7 Architecture → Task 5–14; §8 Error Handling → Tasks 8–10's generic error messages + Task 14's `error.tsx`; §9 Testing Plan → Tasks 5, 6, 8–14's unit/component tests, Task 15's RLS test, Task 16's Playwright test, Task 17's axe tests) has a corresponding task.
- **Fixed during self-review:** the first draft of Task 6 had `getCurrentUserWithMembership` return `CurrentUserWithMembership | null`, collapsing "not logged in" and "logged in but no active workspace membership" into the same `null`/redirect-to-login behavior — silently dropping the spec §8 requirement for a distinct "You don't have access" state. Changed the return type to a `CurrentUserResult` discriminated union (`unauthenticated` / `no-active-membership` / `ok`) and updated Task 13 (dashboard layout, now renders the new `NoAccess` component for the second case) and Task 14 (Overview page) to match.
- **Type consistency:** `CurrentUserWithMembership` and `CurrentUserResult` are defined once in Task 6 and imported (never redefined) by Tasks 12, 13, 14, 17 — Task 17's a11y test constructs a raw `CurrentUserWithMembership` object directly since `DashboardShell` takes the already-unwrapped user, not the union type. `WorkspaceRole` is defined once in Task 3 and imported everywhere else. `NavItem` is defined once in Task 11.
- **Known follow-up risk flagged in-line:** Task 13 Step 5 flags that reading the current pathname from a Server Component layout may not work as written and gives a concrete fallback — this is a real open technical risk in the Next.js APIs available, not a placeholder; whoever executes this task must resolve it one way or the other before moving on, and the step says how.

---

## What's next after this plan

Once this ships, the next spec/plan (not part of this document) is MVP.md "Phase 2 — Core Delivery": Projects, Board, Tasks — following the same brainstorming → spec → plan cycle.
