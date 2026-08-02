# HIVE — Phase 2a: Projects

**Date:** 2026-08-02
**Status:** Approved by user, pending final written-spec review
**Scope:** First sub-slice of MVP.md "Phase 2 — Core Delivery," which bundles Projects, Board, and Tasks. This spec covers Projects only; Board and Tasks follow as separate specs.

---

## 1. Context

Phase 1 (Foundation — scaffold, auth, workspace) shipped, was merged to `master`, deployed to Vercel, and has a working first Owner login (see `docs/superpowers/specs/2026-08-01-foundation-auth-workspace-design.md` and its accompanying plan). The `workspace_role` enum (`owner`/`admin`/`member`/`viewer`) is live and enforced. The `project_member_role` enum (`project_owner`/`project_manager`/`contributor`/`viewer`) was defined in Phase 1's migration but has never been used — this is the first spec that actually needs it.

MVP.md's Phase 2 milestone is "Teams can manage project execution," but that bundles three subsystems — Projects, Board, Tasks — too much for one spec, the same issue Phase 1 had with the original "build HIVE" request. This spec is Projects only: the container Board and Tasks will both need. Board (with Tasks) is the next spec after this one.

## 2. Goals

- Full `projects` + `project_members` schema, matching `docs/architecture/database-schema.md` §4.4–4.5 exactly.
- Workspace members with role `owner`/`admin`/`member` can create a project; `viewer` cannot.
- Project-level RBAC via `project_member_role`, enforced by RLS.
- A project directory (cards view) with search, status/owner/favourite filters, and sort.
- Create, edit, archive, and restore projects; toggle favourite.
- A per-project detail shell with working Overview and Settings tabs; Board/Files/Calendar/Activity as "coming soon" placeholders.
- Test coverage matching Phase 1's bar: unit, component, RLS integration (against the live Supabase project), and one e2e journey.

## 3. Non-goals (deferred)

Board/Kanban and Tasks (the next spec), project templates (including the `template_id` field and `CreateProjectDialog`'s Template field — `template_id` stays NULL for every project created under this spec), Files/Calendar/Activity real content, a table view for the project directory, global cross-entity search (FR-090).

## 4. Resolved ambiguities

- **`is_favourite` is workspace-wide, not per-user.** `database-schema.md` defines it as a single boolean column directly on `projects`, not a per-user junction table. If anyone favourites a project, it's favourited for everyone. This looks like it could be an oversight, but it's exactly what the schema (the source of truth) specifies, and a per-user favourites table would be scope beyond it. Implemented as documented.
- **`project_code` is system-generated, not user-entered.** It's a required, unique column on `projects`, but absent from `CreateProjectDialog`'s field list in `components.md`. Generated via a Postgres sequence (`project_code_seq`), formatted as `'PRJ-' || lpad(nextval(...)::text, 4, '0')` — safe under concurrent creation, unlike a `count(*)+1` approach.
- **Membership on creation, when creator ≠ assigned owner.** `CreateProjectDialog` lets the creator assign anyone as the project's Owner. If only the assigned Owner were added to `project_members`, a creator who assigned someone else would immediately lose visibility into the project they just made (RLS requires project membership or workspace owner/admin). Resolution: the assigned Owner always gets `project_members.role = project_owner`; if the creator is a different person, the creator additionally gets `role = project_manager`. Anyone added via the dialog's Members field gets `role = contributor` by default, changeable later from the Settings tab.
- **Reassigning a project's Owner keeps `projects.owner_id` and `project_members` roles in sync.** `ProjectMemberList`'s Actions column (per `components.md` §11.4) implies role changes are possible after creation, including promoting someone to Project Owner — but `projects.owner_id` is a single FK, so there must only ever be one `project_owner` at a time. When a member's role is changed to `project_owner` via Settings, the service layer must, in the same operation: set `projects.owner_id` to that user and demote the previous owner's `project_members` row to `project_manager` (never leaving two people with `role = project_owner`, and never leaving `owner_id` pointing at someone whose `project_members` row says otherwise).
- **Existing `app/dashboard/projects/settings/*` routes** (8 pages, workspace-level settings, flagged as unreachable/out-of-plan in Phase 1's final review) sit at a URL path that overlaps conceptually with where project details now live (`/dashboard/projects/[projectId]/settings`). Next.js resolves the static `settings/` segment ahead of the dynamic `[projectId]/` one, so there's no routing conflict — but the information-architecture overlap is a pre-existing oddity this spec does not fix (that's Phase 4's Settings module).

---

## 5. Data Model & Authorization

### 5.1 Tables

**`projects`** — `id` (PK), `workspace_id` (FK), `template_id` (FK, nullable, always NULL for now), `name`, `project_code` (unique, system-generated), `description`, `status` (`project_status`: `not_started`/`active`/`on_hold`/`completed`/`archived`), `priority` (`task_priority`, default `medium`), `owner_id` (FK users), `start_date`, `due_date`, `completed_at`, `progress_percentage` (numeric, default 0 — stays 0 until Tasks exist to compute it from), `is_favourite` (boolean, default false), `created_by`, `created_at`, `updated_at`, `archived_at`, `deleted_at`.

**`project_members`** — `id` (PK), `project_id` (FK), `user_id` (FK), `role` (`project_member_role`), `added_by`, `joined_at`, `created_at`, `updated_at`. `UNIQUE(project_id, user_id)`.

### 5.2 Row-Level Security

New `SECURITY DEFINER` helper functions (same recursion-avoidance pattern as Phase 1):
- `can_create_project(workspace_id, auth_user_id)` — true if the user's active `workspace_members.role` is `owner`, `admin`, or `member` (excludes `viewer`).
- `is_project_member(project_id, auth_user_id)` — true if an active `project_members` row exists for this user on this project.
- `is_project_manager(project_id, auth_user_id)` — true if that row's role is `project_owner` or `project_manager`.

Policies:
- `projects` SELECT: project members, or the workspace's `owner`/`admin` (override, matching Phase 1's precedent that workspace owners/admins can manage all workspace records).
- `projects` INSERT: `can_create_project`.
- `projects` UPDATE (including archive/restore via `status`/`archived_at`): project owner/manager, or workspace owner/admin.
- `project_members` SELECT: same as `projects` SELECT.
- `project_members` INSERT/UPDATE/DELETE: project owner/manager, or workspace owner/admin.

### 5.3 Service layer

`services/projects/project-service.ts` — `createProject`, `listProjects` (filter/sort params), `getProject`, `updateProject`, `archiveProject`, `restoreProject`, `toggleFavourite`.
`services/projects/project-member-service.ts` — `listProjectMembers`, `addProjectMember`, `updateProjectMemberRole`, `removeProjectMember`. `updateProjectMemberRole` must handle the `project_owner` case specially per §4's ownership-reassignment rule: promoting a member to `project_owner` also updates `projects.owner_id` and demotes the previous owner to `project_manager`, in the same operation.

Both follow Phase 1's pattern exactly: plain functions taking a Supabase client as a parameter, unit-testable with a mock.

---

## 6. Architecture: Routes, Data Flow, Components

### 6.1 Routes

```
app/dashboard/projects/page.tsx                       — MODIFIED: real ProjectDirectory (cards)
app/dashboard/projects/[projectId]/layout.tsx         — NEW: project shell (tab nav)
app/dashboard/projects/[projectId]/page.tsx           — NEW: redirects to overview
app/dashboard/projects/[projectId]/overview/page.tsx  — NEW: real, minimal
app/dashboard/projects/[projectId]/{board,files,calendar,activity}/page.tsx — NEW: "coming soon"
app/dashboard/projects/[projectId]/settings/page.tsx  — NEW: real
```

### 6.2 Data flow

`ProjectDirectory` is a client component using TanStack Query (`useProjects(filters)`) — the first spec to actually exercise the TanStack Query pattern `Coding-Standards.md` calls for (Phase 1 wired the provider but never used it). Filter/search/sort changes refetch client-side without full navigation. `CreateProjectDialog` submits through a Server Action to `services/projects.createProject()`, then invalidates the projects query so the new card appears immediately.

The project detail shell (`[projectId]/layout.tsx`) mirrors `app/dashboard/layout.tsx`'s pattern: a Server Component fetches the project server-side (RLS-gated — a project that doesn't exist or that the user can't access looks identical from this query, and both render the same not-found/no-access state, never a raw error) and renders a client shell with tab navigation. Each tab page fetches whatever else it specifically needs — e.g., Settings also needs the member list — since Next.js layouts and pages don't share a render tree directly. Archive/restore/favourite are Server Actions paired with TanStack Query mutations for instant-feeling UI.

### 6.3 New components

`ProjectDirectory`, `ProjectCard` (states: default/hover/selected/archived/loading, per `components.md` §7.3), `CreateProjectDialog`, `ProjectShell` (tab nav), `ProjectOverviewPanel`, `ProjectSettingsPanel`, `ProjectMemberList`. Reused from Phase 1: `ComingSoon`, `NoAccess` (adapted for "project not found or no access"). New shadcn primitive needed: `AlertDialog` (archive confirmation).

---

## 7. Error Handling

- `CreateProjectDialog`: Zod validation (name required, owner required, due date ≥ start date, per `components.md` §11.2) client-side, re-validated server-side; generic error message on failure, never a raw Supabase error.
- A `projectId` that doesn't exist, or that the requester can't access, renders the same "not found or no access" state — never distinguishes the two (avoids leaking which project IDs are real to someone who shouldn't see them), never a raw RLS/Postgres error.
- Archiving requires confirmation (`AlertDialog`) since it changes the project's visibility in the default directory view, even though `restore` makes it reversible.

## 8. Testing Plan

- Unit tests for every function in `services/projects/project-service.ts` and `project-member-service.ts` (mocked Supabase client).
- RLS integration test (live Supabase, same rigor as Phase 1's workspace-isolation test): a member of Project A cannot read Project B; a workspace `viewer` cannot create a project; a project's own `contributor`/`viewer` cannot archive it or manage its members, even with a permissive workspace-level role.
- Component tests: `CreateProjectDialog` validation, `ProjectCard` across its five documented states, directory filtering/search behavior.
- One Playwright e2e journey against live infrastructure: create a project end-to-end (open dialog → fill form → submit → new card appears → open it → see the Overview tab).

---

## 9. Source documents referenced

`docs/product/FRS.md` (FR-020, FR-021, FR-022), `docs/product/MVP.md` (Phase 2), `docs/architecture/database-schema.md` (§4.4, §4.5), `docs/design/design-system.md` (§8.2), `docs/design/components.md` (§7.3, §7.4, §11.1–§11.5), `docs/engineering/Coding-Standards.md`, `docs/engineering/security.md`, `docs/superpowers/specs/2026-08-01-foundation-auth-workspace-design.md` (prior phase, establishes the RLS/service-layer/testing conventions this spec follows).
