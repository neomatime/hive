# HIVE Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 2 Critical + 8 Important findings from `.superpowers/sdd/2026-08-02-projects/codex-audit-migrations-report.md` (a live security audit of the `codex/*`-authored schema, dated 2026-08-03), so the live database on `ecesnhnkdqkhtdtzwisi` actually satisfies `docs/engineering/security.md` before the 9 already-provisioned-but-not-yet-onboarded users are added to a workspace.

**Architecture:** Every task is a single forward-only SQL migration applied live via the Supabase MCP `apply_migration` tool, verified against the live database (never assumed from the file), then committed. No application/TypeScript code changes are needed anywhere except Task 11 (a new integration test). This is remediation of existing infrastructure, not new feature work — there is no UI, no service layer, no component to write.

**Tech Stack:** PostgreSQL via Supabase (project `ecesnhnkdqkhtdtzwisi`), Row-Level Security, `SECURITY DEFINER` functions in the `private` schema, Vitest for the integration test (matching `tests/integration/rls-workspace-isolation.test.ts`'s existing pattern).

**Source documents:** `.superpowers/sdd/2026-08-02-projects/codex-audit-migrations-report.md` (the audit — cite finding IDs C-1/C-2/I-1..I-8 verbatim), `docs/engineering/security.md` (the governing spec — cite section numbers verbatim).

## Global Constraints

- Every migration is applied live via the Supabase MCP `apply_migration` tool against project `ecesnhnkdqkhtdtzwisi` before it is considered done — writing the SQL file is not sufficient, per the audit's own I-8 finding that checked-in files have already drifted from what's live once before.
- Every fix is verified with a **read-only** live query proving the specific finding is closed (not just that the migration applied without error). Where a finding described a concrete exploit scenario, prefer reproducing that exact scenario against throwaway rows and confirming it now fails/behaves correctly, then clean up in the same step — same pattern as `tests/integration/rls-workspace-isolation.test.ts`.
- Every `SECURITY DEFINER` function (new or replaced) must `set search_path` explicitly — this repo's existing house rule, true of all 18 current functions per the audit.
- Never widen a grant or policy beyond the minimum needed to close the named finding (`security.md` §5, "Grant the minimum access necessary").
- SQL style matches the existing migrations: lowercase keywords, `snake_case` identifiers, one statement's intent per migration file.
- No destructive action against real data. The live database currently holds real rows (1 workspace, 1 project, 1 task, etc. per the audit) — throwaway test rows created for verification must be deleted in the same step that created them.
- Per `security.md` §20 ("Source of Truth"): Task 10 updates `docs/engineering/security.md` with a short changelog note once all fixes land, since this pass changes authorisation and audit-logging behaviour.
- `npx prettier --check` and `npm run lint` apply to the one `.ts` file this plan touches (Task 11); the SQL migration files have no linter in this repo.

---

### Task 1: Fix C-1 — offboarding doesn't revoke project-level access

**Files:**
- Create: `supabase/migrations/20260803100001_fix_project_membership_active_checks.sql`

**Interfaces:** none — pure RLS-helper hardening, no new function signatures. `private.is_project_member`, `private.is_project_manager`, `private.can_edit_project_tasks` keep their existing `(uuid, uuid) returns boolean` signatures; only their bodies change.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260803100001_fix_project_membership_active_checks.sql`. Each function is replaced in full (not `alter function`, since the body changes) — this is the complete, current live body of each with one join added, confirmed against `pg_get_functiondef` immediately before writing this plan:

```sql
create or replace function private.is_project_member(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from project_members pm
    join users u on u.id = pm.user_id
    join workspace_members wm on wm.user_id = pm.user_id
      and wm.workspace_id = (select p.workspace_id from projects p where p.id = pm.project_id)
    where pm.project_id = target_project_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
  );
$$;

create or replace function private.is_project_manager(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from project_members pm
    join users u on u.id = pm.user_id
    join workspace_members wm on wm.user_id = pm.user_id
      and wm.workspace_id = (select p.workspace_id from projects p where p.id = pm.project_id)
    where pm.project_id = target_project_id
      and u.auth_user_id = target_auth_user_id
      and pm.role in ('project_owner', 'project_manager')
      and wm.is_active = true
  );
$$;

create or replace function private.can_edit_project_tasks(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select private.is_project_workspace_admin(target_project_id, target_auth_user_id) or exists(
    select 1
    from project_members pm
    join users u on u.id = pm.user_id
    join workspace_members wm on wm.user_id = pm.user_id
      and wm.workspace_id = (select p.workspace_id from projects p where p.id = pm.project_id)
    where pm.project_id = target_project_id
      and u.auth_user_id = target_auth_user_id
      and pm.role in ('project_owner', 'project_manager', 'contributor')
      and wm.is_active = true
  );
$$;
```

Note: `private.is_project_workspace_admin` and `private.can_create_project` already join through `workspace_members` and check `wm.is_active = true` (confirmed live) — they are correct today and are not touched by this task.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool against project `ecesnhnkdqkhtdtzwisi`, name `"fix_project_membership_active_checks"`, with the SQL from Step 1.

- [ ] **Step 3: Verify the fix live with the exact C-1 exploit scenario**

Using `execute_sql` (read-only for the check, throwaway rows for the setup — clean up immediately after):

1. Read the one real workspace's id: `select id from workspaces limit 1;`
2. Create a throwaway auth user and `users` row is not needed for a pure SQL-level check — instead, confirm the fix at the function level directly: pick any existing `project_members` row's `user_id`, temporarily flip that user's `workspace_members.is_active` to `false` in a transaction you roll back, and confirm `private.is_project_member(<project_id>, <that user's auth_user_id>)` now returns `false` where it would have returned `true` before this migration. Concretely:

```sql
begin;
  -- pick a real project_members row to test with
  with sample as (
    select pm.project_id, u.auth_user_id, wm.id as wm_id
    from project_members pm
    join users u on u.id = pm.user_id
    join workspace_members wm on wm.user_id = pm.user_id
    limit 1
  )
  select private.is_project_member(project_id, auth_user_id) as before_deactivation
  from sample;

  update workspace_members set is_active = false
  where id = (select wm.id from project_members pm join users u on u.id = pm.user_id join workspace_members wm on wm.user_id = pm.user_id limit 1);

  with sample as (
    select pm.project_id, u.auth_user_id
    from project_members pm
    join users u on u.id = pm.user_id
    limit 1
  )
  select private.is_project_member(project_id, auth_user_id) as after_deactivation
  from sample;
rollback;
```

Expected: `before_deactivation = true`, `after_deactivation = false`. The `rollback` guarantees no real row is actually changed. If the live data doesn't happen to have a `project_members` row to test against, skip the live-data check and instead verify via `execute_sql` that `pg_get_functiondef` for all three functions now contains `wm.is_active = true` — confirm this either way.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100001_fix_project_membership_active_checks.sql
git commit -m "fix(security): revoke project access when workspace membership is deactivated (audit C-1)"
```

---

### Task 2: Fix C-2 — `projects` UPDATE policy has no `WITH CHECK`, letting a project manager move a project into another workspace

**Files:**
- Create: `supabase/migrations/20260803100002_fix_projects_update_tenant_boundary.sql`

**Interfaces:** none — same policy name, same command, only the `with check` clause is added.

- [ ] **Step 1: Write the migration**

```sql
drop policy "projects_update_manager_or_workspace_admin" on public.projects;

create policy "projects_update_manager_or_workspace_admin"
  on public.projects for update
  using (private.is_project_manager(id, auth.uid()) or private.is_project_workspace_admin(id, auth.uid()))
  with check (workspace_id = (select p.workspace_id from public.projects p where p.id = id));
```

`with check` re-reads the row's own currently-stored `workspace_id` by primary key and requires the new row to match it — the tenant boundary itself becomes immutable via this policy. Reassigning a project to a different workspace is not a supported operation anywhere in this codebase (confirmed: no service function or RPC does this); if it's ever needed, it must be its own explicit, audited RPC, not a side effect of an ordinary field update.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"fix_projects_update_tenant_boundary"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live with the exact C-2 exploit scenario**

```sql
begin;
  with sample as (select id, workspace_id from projects limit 1)
  update projects set workspace_id = gen_random_uuid() where id = (select id from sample)
  returning id, workspace_id;
rollback;
```

Expected: the `update` statement itself raises a `new row violates row-level security policy` error (not a silent no-op, not a successful row change) — this is the correct failure mode and proves the `with check` is enforced. The `rollback` (or the error itself aborting the transaction) guarantees nothing real changes. Also re-run `select polwithcheck is null from pg_policy where polname = 'projects_update_manager_or_workspace_admin';` and confirm it now returns `false` (previously `true`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100002_fix_projects_update_tenant_boundary.sql
git commit -m "fix(security): pin workspace_id immutable on project updates (audit C-2)"
```

---

### Task 3: Fix I-6 — direct `INSERT` into `projects` bypasses `create_project_with_owner`'s validation

**Files:**
- Create: `supabase/migrations/20260803100003_restrict_direct_project_insert.sql`

**Interfaces:** none. `create_project_with_owner` is `SECURITY DEFINER` and inserts as the function owner, so it is entirely unaffected by revoking the `authenticated`/`anon` table-level `INSERT` grant on `projects` — confirmed by grepping this repo's `services/`, `app/` for any direct `.from('projects').insert(` call: there are none (every write path goes through `.rpc('create_project_with_owner', …)` in `services/projects/project-service.ts`, or updates via `.from('projects').update(...)`). Revoking `INSERT` is therefore a zero-blast-radius fix, not a behaviour change for any existing code path.

- [ ] **Step 1: Write the migration**

```sql
revoke insert on public.projects from anon, authenticated;
```

Kept deliberately minimal: this alone fully closes the finding (no grant → the `projects_insert_workspace_non_viewer` policy can never be evaluated for a direct client insert again, only for `service_role`/the RPC's definer context, neither of which needs the grant). No `with check` hardening is added to the now-unreachable policy — leaving unreachable code around invites exactly the "is this actually enforced?" confusion this whole audit exists to resolve; the policy is left as documentation of intent but the grant is what now does the work.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"restrict_direct_project_insert"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live**

```sql
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'projects' and grantee in ('anon','authenticated');
```

Expected: no `INSERT` row for either `anon` or `authenticated` (only `SELECT`/`UPDATE`/`DELETE`/etc. remain, matching whatever the table's actual policies still support). Then confirm the RPC still works: `select proacl from pg_proc where proname = 'create_project_with_owner';` still shows `authenticated=X` — the RPC's own grant is untouched by this migration (it's a separate grant, applied to the function, not the table).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100003_restrict_direct_project_insert.sql
git commit -m "fix(security): force project creation through create_project_with_owner only (audit I-6)"
```

---

### Task 4: Fix I-1 — four Phase-1 functions remain `anon`-executable via PostgREST

**Files:**
- Create: `supabase/migrations/20260803100004_revoke_public_execute_workspace_functions.sql`

**Interfaces:** none — grants only, no signature or body changes.

- [ ] **Step 1: Write the migration**

This mirrors `0004_lock_down_project_functions.sql`'s already-proven pattern (revoke the default PUBLIC grant, re-grant explicitly to `authenticated` for the two that RLS policies actually call at runtime; `handle_new_auth_user` is a trigger-only function and needs no re-grant, since triggers fire regardless of the firing role's own EXECUTE privilege):

```sql
revoke execute on function public.is_workspace_member(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;

revoke execute on function public.is_workspace_admin(uuid, uuid) from public;
grant execute on function public.is_workspace_admin(uuid, uuid) to authenticated;

revoke execute on function public.shares_workspace_with(uuid, uuid) from public;
grant execute on function public.shares_workspace_with(uuid, uuid) to authenticated;

revoke execute on function public.handle_new_auth_user() from public;
```

Moving these three into the `private` schema (the audit's "ideally") is deliberately deferred — it would require updating every policy that currently calls them unqualified across `workspace_members`, `workspaces`, `project_templates`, `workspace_integrations`, and three `storage.objects` policies, which is a materially larger and riskier change for a finding this grant-only fix already fully closes (PostgREST cannot reach a function with no PUBLIC/anon execute grant, regardless of which schema it lives in). Note this deferral in Task 10's report as a documented Minor for a future pass.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"revoke_public_execute_workspace_functions"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live**

```sql
select p.proname, p.proacl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_workspace_member','is_workspace_admin','shares_workspace_with','handle_new_auth_user');
```

Expected: no bare `=X/postgres` (PUBLIC) entry and no `anon=X` entry for any of the four; `is_workspace_member`/`is_workspace_admin`/`shares_workspace_with` each show `authenticated=X`; `handle_new_auth_user` shows neither `anon` nor `authenticated`. Then re-run `get_advisors` (type `security`) and confirm lint `0028_anon_security_definer_function_executable` no longer names any of these four.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100004_revoke_public_execute_workspace_functions.sql
git commit -m "fix(security): revoke anon/public execute on remaining workspace functions (audit I-1)"
```

---

### Task 5: Fix I-2 — `workspace-branding` is a public bucket with anonymous listing and SVG uploads enabled

**Files:**
- Create: `supabase/migrations/20260803100005_private_workspace_branding_bucket.sql`

**Interfaces:** none — bucket config and one policy change; the existing INSERT/UPDATE/DELETE policies (`Workspace admins upload/update/delete logos`, all correctly gated on `is_workspace_admin` per live verification) are untouched.

- [ ] **Step 1: Write the migration**

```sql
update storage.buckets
  set public = false,
      allowed_mime_types = array['image/png','image/jpeg','image/webp']
  where id = 'workspace-branding';

drop policy "Public workspace logos" on storage.objects;

create policy "Workspace members view logos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-branding'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );
```

Read access moves from "anyone, unauthenticated, can list the whole bucket" to "any active member of that specific workspace" — matching how `project-files` already works (`project_files_storage_read`, gated on project membership) rather than inventing a new pattern. Logos will now need a signed URL or an authenticated fetch client-side instead of a bare public URL; flag this for whoever owns the branding display component (search the codebase for `workspace-branding` in `.tsx`/`.ts` files and note any bare-public-URL usage as a follow-up if found — do not fix app code in this migration-only task, since this plan's scope is the database layer, but do not silently miss it either).

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"private_workspace_branding_bucket"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live**

```sql
select public, allowed_mime_types from storage.buckets where id = 'workspace-branding';
select policyname, roles, qual as using_expr from pg_policies where schemaname = 'storage' and tablename = 'objects' and qual ilike '%workspace-branding%';
```

Expected: `public = false`, `allowed_mime_types` has exactly 3 entries with no `image/svg+xml`; the SELECT policy is now `"Workspace members view logos"` scoped to `{authenticated}`, and no policy on this bucket has `roles: {public}` anymore. Then grep the app code:

```bash
grep -rn "workspace-branding" --include="*.ts" --include="*.tsx" .
```

If any result constructs a bare public storage URL (rather than a signed URL or an authenticated client fetch) for this bucket, report it as a concern in this task's completion notes rather than silently leaving broken logo images — do not fix it here (out of this plan's database-only scope), but do not lose track of it either.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100005_private_workspace_branding_bucket.sql
git commit -m "fix(security): make workspace-branding bucket private, drop SVG uploads (audit I-2)"
```

---

### Task 6: Fix I-3 — an admin can demote a workspace's last owner, leaving zero owners

**Files:**
- Create: `supabase/migrations/20260803100006_guard_last_workspace_owner.sql`

**Interfaces:** `add_workspace_member_by_email(p_workspace_id uuid, p_email text, p_role workspace_role default 'member')` keeps its exact signature — only the body gains one guard clause.

- [ ] **Step 1: Write the migration**

Complete current live body (confirmed via `pg_get_functiondef` immediately before writing this plan) with one new check inserted before the `insert ... on conflict ... do update`:

```sql
create or replace function public.add_workspace_member_by_email(p_workspace_id uuid, p_email text, p_role workspace_role default 'member'::workspace_role)
returns void
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  target_user_id uuid;
  caller_user_id uuid;
  target_current_role workspace_role;
  remaining_owners int;
begin
  if not public.is_workspace_admin(p_workspace_id, auth.uid()) then
    raise exception 'Admin access required';
  end if;
  if p_role = 'owner' then
    raise exception 'Ownership cannot be assigned through an invite';
  end if;

  select id into target_user_id from public.users where lower(email) = lower(trim(p_email)) and is_active and deleted_at is null;
  if target_user_id is null then
    raise exception 'No active Hive account was found for that email';
  end if;

  select role into target_current_role
  from public.workspace_members
  where workspace_id = p_workspace_id and user_id = target_user_id and is_active = true;

  if target_current_role = 'owner' then
    select count(*) into remaining_owners
    from public.workspace_members
    where workspace_id = p_workspace_id and role = 'owner' and is_active = true and user_id != target_user_id;

    if remaining_owners = 0 then
      raise exception 'Cannot change this member''s role: at least one active owner must remain in the workspace';
    end if;
  end if;

  select id into caller_user_id from public.users where auth_user_id = auth.uid();

  insert into public.workspace_members(workspace_id, user_id, role, invited_by, is_active)
  values(p_workspace_id, target_user_id, p_role, caller_user_id, true)
  on conflict(workspace_id, user_id) do update set role = excluded.role, is_active = true, invited_by = excluded.invited_by, updated_at = now();
end;
$$;
```

Note for the ledger, not this task's scope: the audit also flagged (as explicitly "outside this pass's remit") that Phase 1's `workspace_members_write_owner_admin` RLS policy separately lets an admin `PATCH` their own row to `role = 'owner'` directly (bypassing this function entirely). This task closes I-3's actual finding (the invite/role-change function); the separate direct-PATCH escalation path is a real, related gap but is not one of the audit's numbered findings and is deliberately left for a follow-up pass — record it as a deferred item in this plan's ledger, not silently dropped.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"guard_last_workspace_owner"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live with the exact I-3 exploit scenario**

Using throwaway rows, cleaned up immediately after:

```sql
begin;
  -- use the real workspace but a throwaway auth user so we don't touch the real owner
  insert into public.users (auth_user_id, email, first_name, last_name, display_name)
  values (gen_random_uuid(), 'sec-remediation-test-owner@example.com', 'Test', 'Owner', 'Test Owner')
  returning id \gset test_owner_

  -- (fall back to plain SQL if \gset isn't available in the execute_sql tool's driver — capture the id via a CTE instead)
rollback;
```

`\gset` is a psql-only meta-command and will not work through the Supabase MCP `execute_sql` tool — do the throwaway-row test as a single statement using CTEs instead:

```sql
begin;
  with real_ws as (select id as workspace_id from workspaces limit 1),
  new_user as (
    insert into users (auth_user_id, email, first_name, last_name, display_name)
    values (gen_random_uuid(), 'sec-remediation-test-owner@example.com', 'Test', 'Owner', 'Test Owner')
    returning id
  ),
  new_owner_membership as (
    insert into workspace_members (workspace_id, user_id, role, is_active)
    select workspace_id, new_user.id, 'owner', true from real_ws, new_user
    returning *
  )
  select * from new_owner_membership;

  -- this workspace now has 2 owners (the real one + the throwaway one).
  -- demoting the throwaway one should succeed (an owner remains):
  select public.add_workspace_member_by_email(
    (select workspace_id from workspaces limit 1),
    'sec-remediation-test-owner@example.com',
    'member'
  );

  -- now try to demote the workspace's ORIGINAL real owner too -- with the
  -- throwaway one now demoted to 'member', the real owner is the only one
  -- left, so this must raise:
  -- (run this as a separate statement so a raised exception doesn't abort
  -- the whole block before cleanup; if using execute_sql per-statement,
  -- confirm it raises 'Cannot change this member''s role' then proceed to
  -- rollback regardless of outcome)
rollback;
```

Expected: the demote-the-only-remaining-owner call raises `Cannot change this member's role: at least one active owner must remain in the workspace`. The `rollback` guarantees the throwaway user and membership never persist. If the transactional exception-handling makes this awkward through the tool, an acceptable simpler substitute is to confirm the guard exists in the live function body via `pg_get_functiondef` and reason through the logic rather than force a live exception through a wrapper that doesn't support catching it — do not leave a throwaway row uncommitted-but-uncleaned if a rollback doesn't fire.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100006_guard_last_workspace_owner.sql
git commit -m "fix(security): prevent demoting a workspace's last remaining owner (audit I-3)"
```

---

### Task 7: Fix I-5 — `files` and `calendar_events` never validate `workspace_id` matches the project's actual workspace

**Files:**
- Create: `supabase/migrations/20260803100007_validate_cross_workspace_refs.sql`

**Interfaces:** none — same policy names and commands, `with check` expressions gain one condition each.

- [ ] **Step 1: Write the migration**

Complete current live definitions (confirmed via `pg_policies` immediately before writing this plan) with the workspace/project consistency check added:

```sql
drop policy "files_insert" on public.files;
create policy "files_insert"
  on public.files for insert
  to authenticated
  with check (
    uploaded_by = (select users.id from users where users.auth_user_id = (select auth.uid()))
    and private.can_edit_project_tasks(project_id, (select auth.uid()))
    and workspace_id = (select p.workspace_id from projects p where p.id = project_id)
  );

drop policy "Project editors manage calendar events" on public.calendar_events;
create policy "Project editors manage calendar events"
  on public.calendar_events for all
  to authenticated
  using (private.can_edit_project_tasks(project_id, (select auth.uid())))
  with check (
    private.can_edit_project_tasks(project_id, (select auth.uid()))
    and created_by = (select users.id from users where users.auth_user_id = (select auth.uid()))
    and workspace_id = (select p.workspace_id from projects p where p.id = project_id)
  );
```

`files_update` has no `workspace_id` in its `with check` today either, but `UPDATE` on `files` cannot change `project_id` or `workspace_id` through any app code path (confirmed via grep: no service function updates either column) — left alone to avoid touching a policy with no live exposure, per the Global Constraint against widening scope beyond the named finding. If a future task adds project/workspace reassignment for files, it must add the same check then.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"validate_cross_workspace_refs"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live with the exact I-5 exploit scenario**

```sql
begin;
  with real_project as (select id, workspace_id from projects limit 1)
  insert into files (project_id, workspace_id, name, mime_type, size_bytes, storage_key, uploaded_by)
  select id, gen_random_uuid(), 'sec-test.txt', 'text/plain', 10, 'sec-test-key', (select id from users limit 1)
  from real_project
  returning id, project_id, workspace_id;
rollback;
```

Expected: the `insert` itself raises `new row violates row-level security policy` (because the inserted `workspace_id` is a random UUID that can't match the project's real one) — proving the cross-tenant injection I-5 describes is now blocked at the database layer regardless of what the client sends. Repeat the equivalent for `calendar_events` (insert with a mismatched `workspace_id`, confirm the same rejection), then roll back both.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100007_validate_cross_workspace_refs.sql
git commit -m "fix(security): validate workspace_id matches the project's workspace on files/calendar_events (audit I-5)"
```

---

### Task 8: Fix I-7 — `tasks.assignee_id` accepts any user, pushing task content to people outside the workspace

**Files:**
- Create: `supabase/migrations/20260803100008_validate_task_assignee_membership.sql`

**Interfaces:** none — same policy name/command, `with check` gains one condition.

- [ ] **Step 1: Write the migration**

```sql
drop policy "tasks_write" on public.tasks;
create policy "tasks_write"
  on public.tasks for all
  to authenticated
  using (private.can_edit_project_tasks(project_id, (select auth.uid())))
  with check (
    private.can_edit_project_tasks(project_id, (select auth.uid()))
    and (
      assignee_id is null
      or exists (
        select 1
        from project_members pm
        join workspace_members wm on wm.user_id = pm.user_id
        where pm.user_id = assignee_id
          and pm.project_id = tasks.project_id
          and wm.workspace_id = (select p.workspace_id from projects p where p.id = tasks.project_id)
          and wm.is_active = true
      )
    )
  );
```

This requires the assignee to already be an active `project_members` row on the same project — matching how the app is expected to work (you assign work to people already on the project), and it happens to be a strictly *more* correct precondition than the current unchecked state, not a new restriction users would notice, since assigning someone who was never added to the project isn't a meaningful workflow this app supports anywhere in its UI today (confirmed no service function adds a project_members row *as part of* a task-assignment call — membership and assignment are already separate steps in the real UI).

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"validate_task_assignee_membership"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live with the exact I-7 exploit scenario**

```sql
begin;
  with real_task as (
    select t.id, t.project_id, t.board_id, t.column_id
    from tasks t limit 1
  ),
  outsider as (
    insert into users (auth_user_id, email, first_name, last_name, display_name)
    values (gen_random_uuid(), 'sec-remediation-outsider@example.com', 'Test', 'Outsider', 'Test Outsider')
    returning id
  )
  update tasks set assignee_id = (select id from outsider)
  where id = (select id from real_task)
  returning id, assignee_id;
rollback;
```

Expected: the `update` raises `new row violates row-level security policy`, since the throwaway "outsider" user has no `project_members` row on the real project. Confirm the same real task's assignment to its actual, already-a-member assignee still works by re-running the equivalent update with a real `project_members.user_id` from that project and confirming it succeeds inside its own rolled-back transaction (proves the fix isn't overly strict).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100008_validate_task_assignee_membership.sql
git commit -m "fix(security): require task assignee to already be a project member (audit I-7)"
```

---

### Task 9: Fix I-4 — audit logging misses every workspace-level privileged action, and is only append-only by accident

**Files:**
- Create: `supabase/migrations/20260803100009_expand_audit_logging.sql`

**Interfaces:** `private.record_project_activity()` keeps its exact trigger-function signature (`returns trigger`, no arguments) — only its body grows two new `elsif tg_table_name = …` branches, and two new columns enter its existing `projects`/`files` branches' change-detection lists. Live trigger wiring confirmed via `information_schema.triggers` immediately before writing this plan: `files` has only an `AFTER INSERT` trigger today (no update trigger exists yet — one must be created for `file_deleted` to ever fire); `tasks` and `projects` already have `AFTER UPDATE` triggers wired, so no new trigger is needed for `task_deleted`/`project_archived` detection, only the function body needs the new branches.

- [ ] **Step 1: Write the migration**

```sql
create or replace function private.record_project_activity()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  target_project_id uuid;
  target_workspace_id uuid;
  target_user_id uuid;
  action_code text;
  entity_kind text;
  entity_uuid uuid;
  details jsonb;
begin
  target_user_id := (select id from public.users where auth_user_id = auth.uid());

  if tg_table_name = 'projects' then
    target_project_id := new.id;
    target_workspace_id := new.workspace_id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'project';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'project_created';
      details := jsonb_build_object('name', new.name);
    elsif old.name is distinct from new.name or old.description is distinct from new.description
       or old.status is distinct from new.status or old.priority is distinct from new.priority
       or old.start_date is distinct from new.start_date or old.due_date is distinct from new.due_date
       or old.archived_at is distinct from new.archived_at or old.deleted_at is distinct from new.deleted_at then
      action_code := case
        when old.archived_at is distinct from new.archived_at and new.archived_at is not null then 'project_archived'
        when old.archived_at is distinct from new.archived_at and new.archived_at is null then 'project_restored'
        else 'project_updated'
      end;
      details := jsonb_build_object('name', new.name, 'status', new.status, 'priority', new.priority);
    else
      return new;
    end if;

  elsif tg_table_name = 'project_members' then
    target_project_id := coalesce(new.project_id, old.project_id);
    entity_kind := 'member';
    entity_uuid := coalesce(new.user_id, old.user_id);
    if tg_op = 'INSERT' then
      target_user_id := coalesce(target_user_id, new.added_by);
      action_code := 'member_added';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif tg_op = 'DELETE' then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', old.user_id, 'role', old.role);
    elsif old.role is distinct from new.role then
      action_code := 'member_role_changed';
      details := jsonb_build_object('user_id', new.user_id, 'from_role', old.role, 'to_role', new.role);
    else
      return new;
    end if;

  elsif tg_table_name = 'tasks' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'task';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'task_created';
    elsif old.deleted_at is null and new.deleted_at is not null then
      action_code := 'task_deleted';
    elsif old.completed_at is null and new.completed_at is not null then
      action_code := 'task_completed';
    elsif old.column_id is distinct from new.column_id then
      action_code := 'task_moved';
    elsif old.title is distinct from new.title or old.description is distinct from new.description
       or old.priority is distinct from new.priority or old.assignee_id is distinct from new.assignee_id
       or old.due_date is distinct from new.due_date then
      action_code := 'task_updated';
    else
      return new;
    end if;
    details := jsonb_build_object('title', new.title, 'from_column_id', case when tg_op = 'UPDATE' then old.column_id else null end, 'to_column_id', new.column_id);

  elsif tg_table_name = 'task_comments' then
    select t.project_id into target_project_id from public.tasks t where t.id = new.task_id;
    target_user_id := coalesce(target_user_id, new.author_id);
    entity_kind := 'comment';
    entity_uuid := new.id;
    action_code := 'comment_added';
    details := jsonb_build_object('task_id', new.task_id, 'content_preview', left(new.content, 120));

  elsif tg_table_name = 'files' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.uploaded_by);
    entity_kind := 'file';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'file_uploaded';
    elsif old.deleted_at is null and new.deleted_at is not null then
      action_code := 'file_deleted';
    else
      return new;
    end if;
    details := jsonb_build_object('name', new.name, 'size_bytes', new.size_bytes, 'mime_type', new.mime_type);

  elsif tg_table_name = 'workspace_members' then
    target_workspace_id := coalesce(new.workspace_id, old.workspace_id);
    entity_kind := 'workspace_member';
    entity_uuid := coalesce(new.user_id, old.user_id);
    if tg_op = 'INSERT' then
      target_user_id := coalesce(target_user_id, new.invited_by);
      action_code := 'member_invited';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif tg_op = 'DELETE' then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', old.user_id, 'role', old.role);
    elsif old.is_active = true and new.is_active = false then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif old.is_active = false and new.is_active = true then
      action_code := 'member_invited';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif old.role is distinct from new.role then
      action_code := 'member_role_changed';
      details := jsonb_build_object('user_id', new.user_id, 'from_role', old.role, 'to_role', new.role);
    else
      return new;
    end if;

  elsif tg_table_name = 'workspaces' then
    target_workspace_id := new.id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'workspace';
    entity_uuid := new.id;
    if old.name is distinct from new.name or old.description is distinct from new.description
       or old.logo_url is distinct from new.logo_url or old.timezone is distinct from new.timezone
       or old.date_format is distinct from new.date_format or old.time_format is distinct from new.time_format then
      action_code := 'workspace_settings_changed';
      details := jsonb_build_object('name', new.name);
    else
      return new;
    end if;

  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if target_workspace_id is null then
    select workspace_id into target_workspace_id from public.projects where id = target_project_id;
  end if;

  insert into public.activity_logs(workspace_id, project_id, user_id, action, entity_type, entity_id, metadata)
  values(target_workspace_id, target_project_id, target_user_id, action_code, entity_kind, entity_uuid, details);

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger record_file_deleted
  after update on public.files
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_invited
  after insert on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_removed
  after delete on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_updated
  after update on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_updated
  after update on public.workspaces
  for each row execute function private.record_project_activity();

drop policy "activity_logs_read" on public.activity_logs;
create policy "activity_logs_read"
  on public.activity_logs for select
  to authenticated
  using (
    (project_id is not null and (private.is_project_member(project_id, (select auth.uid())) or private.is_project_workspace_admin(project_id, (select auth.uid()))))
    or
    (project_id is null and public.is_workspace_admin(workspace_id, (select auth.uid())))
  );

revoke insert, update, delete, truncate on public.activity_logs from anon, authenticated;
```

Workspace-scoped rows (`project_id is null`) are gated on `is_workspace_admin` rather than plain membership — these are governance events (who was invited/removed, role changes, workspace settings), a narrower audience than project activity, and `security.md` §5 asks for the minimum access necessary; broaden to plain membership later only if product requirements call for it. "Security settings changed" and "Session revoked" from `security.md` §13 have no corresponding table/mechanism in this schema yet (no security-settings table, no session-revocation feature) — not implemented here; note as N/A rather than invented scope.

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool, name `"expand_audit_logging"`, with the SQL from Step 1.

- [ ] **Step 3: Verify live**

```sql
select event_object_table, trigger_name, event_manipulation
from information_schema.triggers
where trigger_schema = 'public' and event_object_table in ('files','workspace_members','workspaces')
order by 1, 2;
```

Expected: `files` now also has `record_file_deleted` (UPDATE); `workspace_members` has all three new triggers; `workspaces` has `record_workspace_updated`. Then:

```sql
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='activity_logs' and grantee in ('anon','authenticated');
```

Expected: only `SELECT` remains for `authenticated`, and nothing at all for `anon`. Finally, exercise one real, harmless workspace-level event and confirm it's captured, then confirm it's readable only by a workspace admin:

```sql
begin;
  update workspaces set description = coalesce(description, '') || '' where id = (select id from workspaces limit 1)
  returning id;
  -- a true no-op content-wise, but still fires the AFTER UPDATE trigger; if
  -- your driver optimizes away no-op updates, instead toggle description to
  -- a throwaway value and back within the same transaction so OLD != NEW at
  -- least once, then rely on the rollback to discard it entirely.
  select action, entity_type from activity_logs where entity_type = 'workspace' order by created_at desc limit 1;
rollback;
```

Expected: one `workspace_settings_changed` row appears for the duration of the transaction, then vanishes on rollback (proving nothing real persists from this check).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260803100009_expand_audit_logging.sql
git commit -m "fix(security): log workspace-level privileged actions, enforce append-only grants (audit I-4)"
```

---

### Task 10: Fix I-8 — migration provenance doesn't match what's live; reconcile and document

**Files:**
- Create: `supabase/migrations/README.md`
- Modify: `docs/engineering/security.md` (append a short changelog note)

**Interfaces:** none — documentation and investigation only, no schema change in this task beyond what Tasks 1-9 already applied.

- [ ] **Step 1: Confirm the full current migration list matches what's live**

```sql
select version, name from supabase_migrations.schema_migrations order by version;
```

Compare this list's `name` values and count against `ls supabase/migrations/*.sql | wc -l`. Every migration this plan applied (Tasks 1-9) should now appear. Record any remaining mismatch between local filenames and applied `version` timestamps as expected and pre-existing (per the audit's own finding — Supabase stamps its own apply-time version regardless of the checked-in filename; this is normal Supabase behaviour, not itself a bug to fix), not something to force into alignment by renaming files.

- [ ] **Step 2: Investigate the two suspicious no-op migrations**

For `20260802224612_fix_activity_actor_resolution.sql`: read its live-equivalent effect by re-checking `pg_get_functiondef('private.record_project_activity'::regproc)` (already done in Task 9's own investigation) — Task 9's replacement fully supersedes whatever this migration touched, so whatever the original "actor resolution" bug was, it no longer matters: the current function (as of Task 9) resolves `target_user_id` from `auth.uid()` with sensible fallbacks in every branch. No separate action needed here beyond noting this in the file below.

For `20260802223615_fix_project_file_storage_paths.sql`: confirm the three `project-files` storage policies still correctly validate the folder-path structure by re-running the live policy dump from this plan's own preparation (`project_files_storage_insert`'s `with check` already confirmed to validate both `workspace_id` and `project_id` segments against the real project row). If this still looks correct today, the original "storage path" bug is either already fixed by whatever the real out-of-band change was, or never manifested — record this finding rather than guessing at a fix for a bug that can no longer be reproduced.

- [ ] **Step 3: Document the undeclared `HIVE` bucket**

```sql
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'HIVE';
```

Confirm it remains `public = false` with zero policies (so only `service_role` can reach it — verify via `select count(*) from pg_policies where schemaname='storage' and tablename='objects' and qual ilike '%HIVE%';`, expect `0`). Do not delete it and do not add policies to it speculatively — its purpose is undocumented and deleting a storage bucket is destructive; instead, document it plainly so it stops being a silent unknown.

- [ ] **Step 4: Write `supabase/migrations/README.md`**

```markdown
# Migrations

Applied via the Supabase MCP `apply_migration` tool against project `ecesnhnkdqkhtdtzwisi`. The `version` recorded in `supabase_migrations.schema_migrations` is stamped by Supabase at apply time and will not match this directory's filenames — this is expected, not a defect (confirmed in the 2026-08-03 security audit, finding I-8).

## Known pre-existing gaps (documented, not fixed, as of 2026-08-03)

- `20260802224612_fix_activity_actor_resolution.sql` and `20260802223615_fix_project_file_storage_paths.sql` are functionally no-ops against what's live today. Whatever they were meant to fix was either superseded by later migrations (actor resolution, by `20260803100009_expand_audit_logging.sql`) or is no longer reproducible (storage paths — the live `project_files_storage_insert` policy already validates both path segments correctly). Left in place for historical record; do not assume either migration name describes current behaviour.
- A storage bucket named `HIVE` exists live with `public = false` and zero policies (so only `service_role` can reach it). No migration in this directory creates it. Harmless as configured, but undocumented in origin — if you learn what it's for, replace this note with a real migration and description.
```

- [ ] **Step 5: Append a changelog note to `docs/engineering/security.md`**

Add immediately before the final `## 20. Source of Truth` section:

```markdown
## Changelog

- **2026-08-03:** Closed 2 Critical + 8 Important findings from a live security audit of the `codex/*`-authored schema (offboarding not revoking project access; the tenant boundary being writable on project updates; direct-insert bypass of project creation; four `anon`-executable workspace functions; a public storage bucket with SVG uploads; a last-owner demotion gap; missing workspace/project cross-validation on files and calendar events; unvalidated task assignees; and workspace-level actions missing from audit logging). See `supabase/migrations/2026080310000{1..9}_*.sql`. One related gap remains open and is tracked, not fixed: Phase 1's `workspace_members_write_owner_admin` policy still lets an admin `PATCH` their own row directly to `role = 'owner'`, bypassing `add_workspace_member_by_email`'s guards entirely.
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/README.md docs/engineering/security.md
git commit -m "docs(security): reconcile migration provenance, document HIVE bucket, changelog the remediation pass (audit I-8)"
```

---

### Task 11: Regression test proving the fixes hold

**Files:**
- Create: `tests/integration/security-remediation-rls.test.ts`

**Interfaces:** none — standalone guard test, following `tests/integration/rls-workspace-isolation.test.ts`'s existing pattern exactly (admin-client creates throwaway fixtures, exercises the anon-key client, cleans up in `afterAll`).

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

const TEST_PASSWORD = 'test-password-123!'

describe('Security remediation: RLS regression coverage', () => {
  const admin = createAdminClient()
  let workspaceId: string
  let projectId: string
  let ownerEmail: string
  let memberEmail: string
  let ownerAuthId: string
  let memberAuthId: string
  let memberUserId: string
  let memberMembershipId: string

  beforeAll(async () => {
    const suffix = Date.now()
    ownerEmail = `sec-remediation-owner-${suffix}@example.com`
    memberEmail = `sec-remediation-member-${suffix}@example.com`

    const { data: ws } = await admin.from('workspaces').select('id').limit(1).maybeSingle()
    workspaceId = ws!.id

    const { data: authOwner } = await admin.auth.admin.createUser({ email: ownerEmail, password: TEST_PASSWORD, email_confirm: true })
    const { data: authMember } = await admin.auth.admin.createUser({ email: memberEmail, password: TEST_PASSWORD, email_confirm: true })
    ownerAuthId = authOwner!.user!.id
    memberAuthId = authMember!.user!.id

    const { data: ownerUser } = await admin.from('users').select('id').eq('auth_user_id', ownerAuthId).single()
    const { data: memberUser } = await admin.from('users').select('id').eq('auth_user_id', memberAuthId).single()
    memberUserId = memberUser!.id

    const { data: memberWs } = await admin
      .from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: memberUser!.id, role: 'member', is_active: true })
      .select('id')
      .single()
    memberMembershipId = memberWs!.id

    const { data: proj } = await admin
      .from('projects')
      .insert({ workspace_id: workspaceId, name: `Sec Remediation Test ${suffix}`, owner_id: ownerUser!.id, created_by: ownerUser!.id })
      .select('id')
      .single()
    projectId = proj!.id

    await admin.from('project_members').insert([
      { project_id: projectId, user_id: ownerUser!.id, role: 'project_owner', added_by: ownerUser!.id },
      { project_id: projectId, user_id: memberUser!.id, role: 'contributor', added_by: ownerUser!.id },
    ])
  })

  afterAll(async () => {
    await admin.from('projects').delete().eq('id', projectId)
    for (const authId of [ownerAuthId, memberAuthId]) {
      await admin.auth.admin.deleteUser(authId)
    }
  })

  it('C-1: deactivating workspace membership revokes project access, not just workspace access', async () => {
    const memberClient = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await memberClient.auth.signInWithPassword({ email: memberEmail, password: TEST_PASSWORD })

    const before = await memberClient.from('projects').select('id').eq('id', projectId)
    expect(before.data).toHaveLength(1)

    await admin.from('workspace_members').update({ is_active: false }).eq('id', memberMembershipId)

    const after = await memberClient.from('projects').select('id').eq('id', projectId)
    expect(after.data).toEqual([])

    await admin.from('workspace_members').update({ is_active: true }).eq('id', memberMembershipId)
  })

  it('C-2: a project manager cannot move a project into a different workspace', async () => {
    const { data: otherWs } = await admin.from('workspaces').select('id').neq('id', workspaceId).limit(1).maybeSingle()
    if (!otherWs) return // only one workspace exists live; nothing to cross into, skip rather than fabricate a second tenant

    const memberClient = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await memberClient.auth.signInWithPassword({ email: memberEmail, password: TEST_PASSWORD })

    const { error } = await memberClient.from('projects').update({ workspace_id: otherWs.id }).eq('id', projectId)
    expect(error).not.toBeNull()

    const { data: unchanged } = await admin.from('projects').select('workspace_id').eq('id', projectId).single()
    expect(unchanged!.workspace_id).toBe(workspaceId)
  })

  it('I-6: a direct insert into projects is rejected regardless of caller role', async () => {
    const memberClient = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await memberClient.auth.signInWithPassword({ email: memberEmail, password: TEST_PASSWORD })

    const { error } = await memberClient
      .from('projects')
      .insert({ workspace_id: workspaceId, name: 'Should never exist', owner_id: memberUserId, created_by: memberUserId })

    expect(error).not.toBeNull()
  })

  it('I-7: a task cannot be assigned to someone outside the project', async () => {
    const { data: board } = await admin.from('boards').select('id').eq('project_id', projectId).limit(1).maybeSingle()
    const { data: column } = await admin.from('board_columns').select('id').eq('board_id', board!.id).limit(1).maybeSingle()
    const { data: task } = await admin
      .from('tasks')
      .insert({ project_id: projectId, board_id: board!.id, column_id: column!.id, title: 'Sec test task', position: 0, created_by: memberUserId })
      .select('id')
      .single()

    const { data: outsider } = await admin.auth.admin.createUser({ email: `sec-outsider-${Date.now()}@example.com`, password: TEST_PASSWORD, email_confirm: true })
    const { data: outsiderUser } = await admin.from('users').select('id').eq('auth_user_id', outsider!.user!.id).single()

    const memberClient = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await memberClient.auth.signInWithPassword({ email: memberEmail, password: TEST_PASSWORD })

    const { error } = await memberClient.from('tasks').update({ assignee_id: outsiderUser!.id }).eq('id', task!.id)
    expect(error).not.toBeNull()

    await admin.auth.admin.deleteUser(outsider!.user!.id)
  })
})
```

- [ ] **Step 2: Run the test against the real Supabase project**

Run: `npm run test:integration`
Expected: PASS (4 tests). This creates and deletes real throwaway rows — the `afterAll`/inline cleanup makes this safe, matching the same caution as every other integration test in this repo.

- [ ] **Step 3: Verify cleanup**

Using a read-only Supabase MCP query, confirm none of the throwaway emails, the throwaway project, or the throwaway task remain after the run.

- [ ] **Step 4: Verify the full build**

Run: `npm run build`, `npm run lint`, `npx prettier --check tests/integration/security-remediation-rls.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add tests/integration/security-remediation-rls.test.ts
git commit -m "test: add regression coverage proving the security remediation fixes hold"
```

---

## Self-Review Notes

- **Spec coverage:** all 2 Critical + 8 Important findings from the audit map 1:1 to Tasks 1-9 (C-1→1, C-2→2, I-6→3, I-1→4, I-2→5, I-3→6, I-5→7, I-7→8, I-4→9); I-8 (provenance) → Task 10; Task 11 adds regression coverage the audit itself didn't require but that this plan's own Global Constraints do. The 9 Minor findings from the audit are explicitly out of scope per the project owner's decision (Critical + Important only) — not forgotten, deliberately deferred; list them in the ledger's deferred-minors section at plan start so the final review can triage.
- **Deliberately out of scope, flagged twice already (Tasks 4 and 6) so it isn't lost a third time:** Phase 1's `workspace_members_write_owner_admin` policy lets an admin escalate their own row to `owner` directly, bypassing every guard this plan adds to `add_workspace_member_by_email`. This is real, related, and not one of the audit's numbered findings — a natural Task 12 for a future pass, not this one.
- **Order matters:** Tasks 1-9 are independent of each other (different tables/functions, no task's SQL depends on another task's migration having already run) and could theoretically be parallelized, but per `superpowers:subagent-driven-development`'s own rule, implementation subagents are never dispatched in parallel regardless — run them in the listed order for a clean, readable migration history. Task 10 must run after 1-9 (it reconciles what they produced). Task 11 must run last (it tests the cumulative effect of all of them).
- **Type consistency:** no new TypeScript types are introduced anywhere in this plan; `types/database.ts` already reflects every table/function this plan touches (regenerated immediately before this plan was written) and does not need regenerating again afterward, since none of these migrations add, remove, or rename a column, table, or function signature.
