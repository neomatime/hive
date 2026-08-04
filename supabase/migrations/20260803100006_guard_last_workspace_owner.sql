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
