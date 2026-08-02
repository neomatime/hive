create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function can_create_project(uuid, uuid) set schema private;
alter function is_project_member(uuid, uuid) set schema private;
alter function is_project_manager(uuid, uuid) set schema private;
alter function is_project_workspace_admin(uuid, uuid) set schema private;

grant execute on function private.can_create_project(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_project_member(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_project_manager(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_project_workspace_admin(uuid, uuid) to authenticated, service_role;

create or replace function create_project_with_owner(
  p_workspace_id uuid,
  p_name varchar,
  p_description text,
  p_status project_status,
  p_priority task_priority,
  p_owner_id uuid,
  p_start_date date,
  p_due_date date,
  p_member_ids uuid[]
)
returns projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_new_project projects;
  v_member_id uuid;
begin
  select id into v_creator_id from users where auth_user_id = auth.uid();
  if v_creator_id is null or not private.can_create_project(p_workspace_id, auth.uid()) then
    raise exception 'You do not have permission to create a project in this workspace';
  end if;

  if not exists (select 1 from workspace_members where workspace_id = p_workspace_id and user_id = p_owner_id and is_active) then
    raise exception 'The project owner must be an active workspace member';
  end if;

  insert into projects (workspace_id, name, description, status, priority, owner_id, start_date, due_date, created_by)
  values (p_workspace_id, p_name, p_description, p_status, p_priority, p_owner_id, p_start_date, p_due_date, v_creator_id)
  returning * into v_new_project;

  insert into project_members (project_id, user_id, role, added_by) values (v_new_project.id, p_owner_id, 'project_owner', v_creator_id);
  if v_creator_id != p_owner_id then insert into project_members (project_id, user_id, role, added_by) values (v_new_project.id, v_creator_id, 'project_manager', v_creator_id); end if;
  if p_member_ids is not null then
    foreach v_member_id in array p_member_ids loop
      if v_member_id != p_owner_id and v_member_id != v_creator_id and exists (select 1 from workspace_members where workspace_id = p_workspace_id and user_id = v_member_id and is_active) then
        insert into project_members (project_id, user_id, role, added_by) values (v_new_project.id, v_member_id, 'contributor', v_creator_id) on conflict do nothing;
      end if;
    end loop;
  end if;
  return v_new_project;
end;
$$;

create or replace function reassign_project_owner(p_project_id uuid, p_new_owner_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (private.is_project_manager(p_project_id, auth.uid()) or private.is_project_workspace_admin(p_project_id, auth.uid())) then raise exception 'You do not have permission to reassign this project''s owner'; end if;
  if not exists (select 1 from project_members where project_id = p_project_id and user_id = p_new_owner_user_id) then raise exception 'The new owner must already be a project member'; end if;
  update projects set owner_id = p_new_owner_user_id, updated_at = now() where id = p_project_id;
  update project_members set role = 'project_manager', updated_at = now() where project_id = p_project_id and role = 'project_owner' and user_id != p_new_owner_user_id;
  update project_members set role = 'project_owner', updated_at = now() where project_id = p_project_id and user_id = p_new_owner_user_id;
end;
$$;
