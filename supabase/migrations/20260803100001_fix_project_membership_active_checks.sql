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
