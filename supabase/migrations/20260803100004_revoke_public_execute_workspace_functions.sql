revoke execute on function public.is_workspace_member(uuid, uuid) from public;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;

revoke execute on function public.is_workspace_admin(uuid, uuid) from public;
grant execute on function public.is_workspace_admin(uuid, uuid) to authenticated;

revoke execute on function public.shares_workspace_with(uuid, uuid) from public;
grant execute on function public.shares_workspace_with(uuid, uuid) to authenticated;

revoke execute on function public.handle_new_auth_user() from public;
