# HIVE — Foundation: Scaffold + Auth + Workspace

**Date:** 2026-08-01
**Status:** Approved by user, pending final written-spec review
**Scope:** First implementation slice of HIVE. Covers the project scaffolding the existing docs assume already exists, plus MVP.md's "Phase 1 — Foundation."

---

## 1. Context

HIVE is HIMARK's internal project management platform (see `docs/product/PRD.md`). As of this spec, `hive/` contains a thorough `docs/` tree (PRD, FRS, architecture, design system, engineering standards, wireframes) but almost no code:

- No git repo, no `package.json`/build tooling, no lockfile, no `node_modules`.
- Every route file under `app/**/page.tsx` is 0 bytes — route names only.
- `components/`, `features/`, `services/`, `hooks/`, `store/`, `types/`, `utils/`, `constants/`, `tests/` are empty folders.
- `styles/*.css` are 0 bytes — none of the design tokens are wired up yet.
- The only working code is `middleware.ts` and `lib/supabase/{client,server}.ts` — a correct Supabase SSR auth setup, but it redirects unauthenticated requests to `/login`, which doesn't exist yet.

This spec defines the first buildable slice: get the project running, apply the real design tokens, and deliver MVP.md's Phase 1 milestone — **"Team can securely access HIVE."**

This is the first of several specs. Later specs (not covered here) will cover MVP.md Phase 2 (Projects/Board/Tasks), Phase 3 (My Tasks/Calendar/Files), and Phase 4 (Settings/Activity), in that order.

---

## 2. Goals

- A running Next.js app with the real HIVE design tokens applied.
- A new, dedicated Supabase project for HIVE with a migration covering exactly the tables this phase needs.
- Working Login, Logout, Forgot Password, and Reset Password, backed by Supabase Auth, matching FRS FR-001/FR-002.
- Role-based workspace membership (`owner`/`admin`/`member`/`viewer`), enforced via RLS and the service layer.
- A minimal authenticated app shell (sidebar, top bar) so login has somewhere real to land.
- A repeatable way to provision the first Owner and additional early teammates without a public signup page.
- Unit, component, and e2e test coverage for everything above, per `testing-strategy.md`.

## 3. Non-goals (deferred to later specs)

Projects, Board, Tasks, Calendar, Files, the full Settings module (My Profile/Account/Team/Notifications/Task Preferences/Project Templates/Integrations pages), Activity feed, two-factor auth/session list/connected devices, a real in-app Team-invite UI, notifications, global search, Vercel deployment, CI/GitHub Actions (no git remote exists yet).

## 4. Known documentation contradiction, and how this spec resolves it

`FRS.md` §2 lists one flat role list: Owner / Admin / Project Manager / Contributor / Viewer. `security.md` §4 and `database-schema.md` instead define **two** separate enums: `workspace_role` (`owner`/`admin`/`member`/`viewer`) and `project_member_role` (`project_owner`/`project_manager`/`contributor`/`viewer`). The database schema is treated as the source of truth. This spec implements `workspace_role` only — `project_member_role` is out of scope until Phase 2 introduces `projects`/`project_members`. FRS's "Project Manager" and "Contributor" are project-level concerns, not workspace-level ones.

---

## 5. Foundation Setup

- `git init` (done), npm as package manager.
- Next.js 15 (App Router), React 19, TypeScript in `strict` mode, Tailwind CSS v4, shadcn/ui, ESLint + Prettier — matching `Coding-Standards.md`.
- Wire the real design tokens into the currently-empty `styles/*.css` files: colors, neutrals, semantic colors, spacing (8pt scale), border radius, shadows, motion, and typography (`Inter`, the full type scale) from `design-system.md` §4–5 and `color-palette.md`.
- New, dedicated Supabase project for HIVE (separate from the `ops-booking` and `lgndry-co-ops` projects already in the account) — real credentials replace the placeholder values currently in `.env.local`.

## 6. Data Model & Authorization

### 6.1 Tables

This spec creates exactly three tables, with their **full** column sets as defined in `database-schema.md` §4.1–4.3 (each table is fully owned by this spec even though some columns won't have editing UI until a later phase):

**`users`** — `id` (PK), `auth_user_id` (unique, FK-equivalent to `auth.users.id`), `first_name`, `last_name`, `display_name`, `email` (unique), `phone_number`, `job_title`, `department`, `avatar_url`, `timezone`, `locale`, `is_active` (default `true`), `last_seen_at`, `created_at`, `updated_at`, `deleted_at`.

**`workspaces`** — `id` (PK), `name`, `slug` (unique), `description`, `logo_url`, `timezone`, `date_format`, `time_format`, `created_by`, `created_at`, `updated_at`, `deleted_at`. Exactly one row will ever exist for HIMARK.

**`workspace_members`** — `id` (PK), `workspace_id` (FK), `user_id` (FK), `role` (`workspace_role` enum), `joined_at`, `invited_by` (FK, nullable), `is_active` (default `true`), `created_at`, `updated_at`. `UNIQUE(workspace_id, user_id)`.

**`workspace_role` enum:** `owner`, `admin`, `member`, `viewer`.

### 6.2 Sync from Supabase Auth

A Postgres trigger on `auth.users` insert auto-creates the matching `public.users` row, populating `auth_user_id`, `email`, and best-effort `first_name`/`last_name`/`display_name` from signup metadata. This makes "an auth user always has a profile row" a DB-enforced invariant, so Phase 4's real invite flow doesn't have to re-implement it.

### 6.3 Row-Level Security

RLS enabled on all three tables (`security.md` §6):

- `users`: `SELECT` own row, or any row belonging to a user who shares a workspace with the requester. `UPDATE` own row only.
- `workspaces`: `SELECT` if an active member. `UPDATE` restricted to `owner`/`admin`.
- `workspace_members`: `SELECT` rows within the requester's own workspace. `INSERT`/`UPDATE`/`DELETE` restricted to `owner`/`admin`. The bootstrap script (below) uses the service-role key, which bypasses RLS by design — acceptable because it's a trusted, server-only script never shipped to the client.

Implementation note: the `users` policy reads `workspace_members` and the `workspace_members` policy reads `users`/membership state — implemented naively this recurses. Use `SECURITY DEFINER` helper functions (e.g. `is_workspace_member(workspace_id, user_id)`) for the cross-table checks, per standard Supabase RLS practice, rather than inlining the subqueries directly in each policy.

### 6.4 Service layer

`services/auth/` wraps Supabase Auth calls (sign in, sign out, request password reset, update password). `services/workspace/` wraps workspace/membership reads and role checks. Server Components and Server Actions call these services — never the Supabase client directly — per `Coding-Standards.md`'s "access only through service layer." This is also where raw Postgres/Supabase errors get mapped to the sanitized messages `security.md` §15 requires.

### 6.5 Bootstrap script

`npm run bootstrap -- --email=<addr> --role=<owner|admin|member|viewer>`, server-side only, uses `SUPABASE_SERVICE_ROLE_KEY`:

1. Calls Supabase's `auth.admin.inviteUserByEmail()` — creates the `auth.users` row **and** emails the person a link to set their own password. This gives "invite-only" provisioning for free, reusing the same set/reset-password UI built for FR-001, instead of assigning temporary passwords.
2. On first run only, creates the single `workspaces` row.
3. Inserts a `workspace_members` row linking the new user to the workspace with the given role.

This is how the first Owner is created, and how every teammate is added until Phase 4 ships a real in-app invite UI. There is no public signup page.

---

## 7. Architecture: Routes, Data Flow, App Shell

### 7.1 Routes

```
app/(auth)/layout.tsx                — centered card layout, no sidebar
app/(auth)/login/page.tsx
app/(auth)/forgot-password/page.tsx
app/(auth)/reset-password/page.tsx   — also the landing page for bootstrap-script invite links
app/dashboard/layout.tsx             — NEW: sidebar + top bar shell
app/dashboard/overview/page.tsx      — real minimal content
app/dashboard/{board,calendar,files,my-tasks,projects,settings}/page.tsx  — shared "coming soon" placeholder
```

Route groups (parenthesized segments) don't affect the URL, so `/login` still matches what `middleware.ts` already redirects unauthenticated requests to.

### 7.2 Request/data flow for any `/dashboard/*` page

1. `middleware.ts` (already correct, reused as-is) checks the Supabase session cookie server-side.
2. No session → redirect to `/login?redirect=<original-path>` (preserves intended destination).
3. Valid session → the Server Component calls `services/workspace.getCurrentUserWithMembership()`, using the cookie-scoped server client (`lib/supabase/server.ts`); RLS ensures the user only ever sees their own row and workspace.
4. Result renders into the shell — sidebar shows the user's name/avatar/role at the bottom (`design-system.md` §6.2).
5. Sign out: a Server Action in the user menu calls `services/auth.signOut()`, clears the session, redirects to `/login`.

### 7.3 Auth flows

- **Login:** `LoginForm` (react-hook-form + Zod, validated client-side and re-validated server-side) → Server Action → `services/auth.signIn()`. On failure: one generic "Invalid email or password" message — never reveals which field was wrong (`security.md` §15).
- **Forgot password:** requesting a reset always shows the same "if that email exists, we've sent a link" message, regardless of whether the account exists, to avoid leaking which emails are registered.
- **Reset password:** doubles as the landing page for a newly-invited teammate's first password-set.

### 7.4 App shell

Per `design-system.md` §6: sidebar 240px wide (72px collapsed), Ocean Light background, selected nav item Midnight background with white text; top bar 72px tall. The top bar's global-search and notifications slots are **left out entirely** rather than built as inert UI — those features don't exist until later phases (FR-090, FR-100), and non-functional controls would be half-finished work. This spec's top bar holds only breadcrumb/page title and the user menu (avatar, name, sign out).

Sidebar nav items: Overview, Projects, Board, My Tasks, Calendar, Files, Settings (per `design-system.md` §6.2, matching the app's existing `app/dashboard/*` folder names). All are linked and navigable; only Overview has real content this phase, the rest show the shared "coming soon" placeholder rather than a blank page.

### 7.5 New components

- `components/ui/*` — shadcn primitives: button, input, label, form, card, avatar, dropdown-menu, separator, skeleton, sonner.
- `components/forms/login-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`.
- `components/navigation/sidebar.tsx`, `sidebar-nav-item.tsx`.
- `components/layout/dashboard-shell.tsx`, `topbar.tsx`, `user-menu.tsx`.
- `components/empty-states/coming-soon.tsx` — shared placeholder for the six not-yet-built dashboard pages.

### 7.6 Supporting code

`services/auth/`, `services/workspace/` (service layer); `hooks/use-current-user.ts` (TanStack Query); `types/database.ts` (generated via Supabase CLI `gen types typescript`) plus hand-written `types/user.ts`/`workspace.ts`; `constants/routes.ts` (nav item definitions), `constants/roles.ts` (role labels); `utils/cn.ts` (shadcn classname helper). `store/` (Zustand) stays empty this phase — nothing needs shared client state yet; that starts with Board's drag state in Phase 2.

---

## 8. Error Handling

- Failed login → one generic "Invalid email or password."
- Expired/invalid reset-password link → clear message plus a link back to request a new one.
- Deactivated/missing workspace membership (edge case) → explicit "You don't have access" state, never a raw Postgres/RLS error surfaced to the browser.
- Unexpected exceptions → a Next.js `error.tsx` boundary at the dashboard layout level, so a crash never shows a blank white screen.
- All service-layer errors are mapped to sanitized messages before reaching the client; full detail logged server-side only; tokens never logged (`security.md` §3, §15).

## 9. Testing Plan

- Vitest unit tests for `services/auth` and `services/workspace` (Supabase client mocked), targeting the 80% services/utilities coverage guidance in `testing-strategy.md` §19.
- React Testing Library component tests for the three auth forms: validation errors, loading/disabled-while-submitting, error display.
- One Playwright spec (`tests/e2e/login.spec.ts`) covering `testing-strategy.md` §8's Authentication journey exactly: Login, Logout, Password reset, Protected-route redirect.
- An RLS test proving a user can't read another workspace's data — trivial with a single workspace today, but locks in the invariant before Phase 2 makes it exploitable.
- Axe accessibility check on the auth forms and dashboard shell (keyboard navigation, focus visibility, form labels), targeting WCAG 2.1 AA.
- Tests run locally (`npm test`, `npm run test:e2e`) for now; CI/GitHub Actions wiring is deferred until there's a git remote to run it against.

---

## 10. Source documents referenced

`docs/product/PRD.md`, `docs/product/FRS.md`, `docs/product/MVP.md`, `docs/architecture/database-schema.md`, `docs/architecture/system-architecture.md`, `docs/design/design-system.md`, `docs/design/color-palette.md`, `docs/engineering/Coding-Standards.md`, `docs/engineering/security.md`, `docs/engineering/testing-strategy.md`, `docs/engineering/Definition-of-Done.md`, `docs/engineering/Git-Workflow.md`.
