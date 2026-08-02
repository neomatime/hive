create function reassign_project_owner(p_project_id uuid, p_new_owner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_project_manager(p_project_id, auth.uid()) or is_project_workspace_admin(p_project_id, auth.uid())) then
    raise exception 'You do not have permission to reassign this project''s owner';
  end if;

  if not exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = p_new_owner_user_id
  ) then
    raise exception 'The new owner must already be a project member';
  end if;

  update projects set owner_id = p_new_owner_user_id, updated_at = now() where id = p_project_id;
  update project_members set role = 'project_manager', updated_at = now()
    where project_id = p_project_id and role = 'project_owner' and user_id != p_new_owner_user_id;
  update project_members set role = 'project_owner', updated_at = now()
    where project_id = p_project_id and user_id = p_new_owner_user_id;
end;
$$;

grant execute on function reassign_project_owner(uuid, uuid) to authenticated;
