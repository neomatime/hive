-- SECURITY DEFINER functions receive EXECUTE for PUBLIC by default. Keep the
-- policy helpers internal, and expose only the two authenticated mutations.
revoke all on function can_create_project(uuid, uuid) from public, anon, authenticated;
revoke all on function is_project_member(uuid, uuid) from public, anon, authenticated;
revoke all on function is_project_manager(uuid, uuid) from public, anon, authenticated;
revoke all on function is_project_workspace_admin(uuid, uuid) from public, anon, authenticated;

revoke all on function create_project_with_owner(
  uuid,
  varchar,
  text,
  project_status,
  task_priority,
  uuid,
  date,
  date,
  uuid[]
) from public, anon;
grant execute on function create_project_with_owner(
  uuid,
  varchar,
  text,
  project_status,
  task_priority,
  uuid,
  date,
  date,
  uuid[]
) to authenticated;

revoke all on function reassign_project_owner(uuid, uuid) from public, anon;
grant execute on function reassign_project_owner(uuid, uuid) to authenticated;
