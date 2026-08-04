-- 20260803100004's `revoke ... from public` only removed the PUBLIC
-- pseudo-role grant. These four functions also carry a separate, explicit
-- grant to `anon` (visible in proacl as `anon=X/postgres`, independent of
-- PUBLIC) that survives a PUBLIC-only revoke. Revoke it directly.
revoke execute on function public.is_workspace_member(uuid, uuid) from anon;
revoke execute on function public.is_workspace_admin(uuid, uuid) from anon;
revoke execute on function public.shares_workspace_with(uuid, uuid) from anon;
revoke execute on function public.handle_new_auth_user() from anon;

-- handle_new_auth_user is trigger-only (fires on auth.users insert); it has
-- no legitimate RPC caller. Also had a pre-existing, independent
-- `authenticated` grant that survives a PUBLIC-only revoke, for the same
-- reason the anon grants above did -- close it too.
revoke execute on function public.handle_new_auth_user() from authenticated;
