drop function if exists public.create_project_with_owner(uuid, varchar, text, project_status, task_priority, uuid, date, date, uuid[]);

create function public.create_project_with_owner(
  p_workspace_id uuid, p_name varchar, p_description text, p_status project_status,
  p_priority task_priority, p_owner_id uuid, p_start_date date, p_due_date date,
  p_member_ids uuid[], p_template_id uuid default null
)
returns projects language plpgsql security definer set search_path = public as $$
declare
  v_creator_id uuid; v_new_project projects; v_member_id uuid; v_template_description text;
begin
  select id into v_creator_id from users where auth_user_id = auth.uid();
  if v_creator_id is null or not private.can_create_project(p_workspace_id, auth.uid()) then raise exception 'You do not have permission to create a project in this workspace'; end if;
  if not exists (select 1 from workspace_members where workspace_id = p_workspace_id and user_id = p_owner_id and is_active) then raise exception 'The project owner must be an active workspace member'; end if;
  if p_template_id is not null then
    select description into v_template_description from project_templates where id = p_template_id and workspace_id = p_workspace_id and is_active;
    if not found then raise exception 'The selected template is unavailable'; end if;
  end if;
  insert into projects (workspace_id, name, description, status, priority, owner_id, start_date, due_date, created_by, template_id)
  values (p_workspace_id, p_name, coalesce(nullif(trim(p_description), ''), v_template_description), p_status, p_priority, p_owner_id, p_start_date, p_due_date, v_creator_id, p_template_id)
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
revoke all on function public.create_project_with_owner(uuid, varchar, text, project_status, task_priority, uuid, date, date, uuid[], uuid) from public, anon;
grant execute on function public.create_project_with_owner(uuid, varchar, text, project_status, task_priority, uuid, date, date, uuid[], uuid) to authenticated, service_role;
