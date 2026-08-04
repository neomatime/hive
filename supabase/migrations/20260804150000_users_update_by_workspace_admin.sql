-- Lets an owner/admin edit a teammate's profile fields (job title,
-- department, display name, phone, timezone) from the Team page.
-- users_update_own (0001_foundation_schema.sql) only allows self-edits, so
-- without this an admin's update silently no-ops (RLS blocks the row,
-- PostgREST returns 0 rows affected, not an error).
create function is_admin_of_user(target_user_id uuid, caller_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members target_wm
    join workspace_members caller_wm on caller_wm.workspace_id = target_wm.workspace_id
    join users caller on caller.id = caller_wm.user_id
    where target_wm.user_id = target_user_id
      and target_wm.is_active
      and caller.auth_user_id = caller_auth_user_id
      and caller_wm.is_active
      and caller_wm.role in ('owner', 'admin')
  );
$$;

create policy "users_update_by_workspace_admin"
  on users for update
  using (is_admin_of_user(id, auth.uid()))
  with check (is_admin_of_user(id, auth.uid()));
