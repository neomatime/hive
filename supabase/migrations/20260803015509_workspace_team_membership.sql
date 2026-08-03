create function public.add_workspace_member_by_email(p_workspace_id uuid, p_email text, p_role workspace_role default 'member')
returns void language plpgsql security definer set search_path = public, private as $$
declare target_user_id uuid; caller_user_id uuid;
begin
  if not public.is_workspace_admin(p_workspace_id, auth.uid()) then raise exception 'Admin access required'; end if;
  if p_role = 'owner' then raise exception 'Ownership cannot be assigned through an invite'; end if;
  select id into target_user_id from public.users where lower(email)=lower(trim(p_email)) and is_active and deleted_at is null;
  if target_user_id is null then raise exception 'No active Hive account was found for that email'; end if;
  select id into caller_user_id from public.users where auth_user_id=auth.uid();
  insert into public.workspace_members(workspace_id,user_id,role,invited_by,is_active)
  values(p_workspace_id,target_user_id,p_role,caller_user_id,true)
  on conflict(workspace_id,user_id) do update set role=excluded.role,is_active=true,invited_by=excluded.invited_by,updated_at=now();
end;
$$;
revoke all on function public.add_workspace_member_by_email(uuid,text,workspace_role) from public,anon;
grant execute on function public.add_workspace_member_by_email(uuid,text,workspace_role) to authenticated,service_role;
