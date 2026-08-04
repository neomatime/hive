create or replace function private.record_project_activity()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private'
as $$
declare
  target_project_id uuid;
  target_workspace_id uuid;
  target_user_id uuid;
  action_code text;
  entity_kind text;
  entity_uuid uuid;
  details jsonb;
begin
  target_user_id := (select id from public.users where auth_user_id = auth.uid());

  if tg_table_name = 'projects' then
    target_project_id := new.id;
    target_workspace_id := new.workspace_id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'project';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'project_created';
      details := jsonb_build_object('name', new.name);
    elsif old.name is distinct from new.name or old.description is distinct from new.description
       or old.status is distinct from new.status or old.priority is distinct from new.priority
       or old.start_date is distinct from new.start_date or old.due_date is distinct from new.due_date
       or old.archived_at is distinct from new.archived_at or old.deleted_at is distinct from new.deleted_at then
      action_code := case
        when old.archived_at is distinct from new.archived_at and new.archived_at is not null then 'project_archived'
        when old.archived_at is distinct from new.archived_at and new.archived_at is null then 'project_restored'
        else 'project_updated'
      end;
      details := jsonb_build_object('name', new.name, 'status', new.status, 'priority', new.priority);
    else
      return new;
    end if;

  elsif tg_table_name = 'project_members' then
    target_project_id := coalesce(new.project_id, old.project_id);
    entity_kind := 'member';
    entity_uuid := coalesce(new.user_id, old.user_id);
    if tg_op = 'INSERT' then
      target_user_id := coalesce(target_user_id, new.added_by);
      action_code := 'member_added';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif tg_op = 'DELETE' then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', old.user_id, 'role', old.role);
    elsif old.role is distinct from new.role then
      action_code := 'member_role_changed';
      details := jsonb_build_object('user_id', new.user_id, 'from_role', old.role, 'to_role', new.role);
    else
      return new;
    end if;

  elsif tg_table_name = 'tasks' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'task';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'task_created';
    elsif old.deleted_at is null and new.deleted_at is not null then
      action_code := 'task_deleted';
    elsif old.completed_at is null and new.completed_at is not null then
      action_code := 'task_completed';
    elsif old.column_id is distinct from new.column_id then
      action_code := 'task_moved';
    elsif old.title is distinct from new.title or old.description is distinct from new.description
       or old.priority is distinct from new.priority or old.assignee_id is distinct from new.assignee_id
       or old.due_date is distinct from new.due_date then
      action_code := 'task_updated';
    else
      return new;
    end if;
    details := jsonb_build_object('title', new.title, 'from_column_id', case when tg_op = 'UPDATE' then old.column_id else null end, 'to_column_id', new.column_id);

  elsif tg_table_name = 'task_comments' then
    select t.project_id into target_project_id from public.tasks t where t.id = new.task_id;
    target_user_id := coalesce(target_user_id, new.author_id);
    entity_kind := 'comment';
    entity_uuid := new.id;
    action_code := 'comment_added';
    details := jsonb_build_object('task_id', new.task_id, 'content_preview', left(new.content, 120));

  elsif tg_table_name = 'files' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.uploaded_by);
    entity_kind := 'file';
    entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'file_uploaded';
    elsif old.deleted_at is null and new.deleted_at is not null then
      action_code := 'file_deleted';
    else
      return new;
    end if;
    details := jsonb_build_object('name', new.name, 'size_bytes', new.size_bytes, 'mime_type', new.mime_type);

  elsif tg_table_name = 'workspace_members' then
    target_workspace_id := coalesce(new.workspace_id, old.workspace_id);
    entity_kind := 'workspace_member';
    entity_uuid := coalesce(new.user_id, old.user_id);
    if tg_op = 'INSERT' then
      target_user_id := coalesce(target_user_id, new.invited_by);
      action_code := 'member_invited';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif tg_op = 'DELETE' then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', old.user_id, 'role', old.role);
    elsif old.is_active = true and new.is_active = false then
      action_code := 'member_removed';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif old.is_active = false and new.is_active = true then
      action_code := 'member_invited';
      details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif old.role is distinct from new.role then
      action_code := 'member_role_changed';
      details := jsonb_build_object('user_id', new.user_id, 'from_role', old.role, 'to_role', new.role);
    else
      return new;
    end if;

  elsif tg_table_name = 'workspaces' then
    target_workspace_id := new.id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'workspace';
    entity_uuid := new.id;
    if old.name is distinct from new.name or old.description is distinct from new.description
       or old.logo_url is distinct from new.logo_url or old.timezone is distinct from new.timezone
       or old.date_format is distinct from new.date_format or old.time_format is distinct from new.time_format then
      action_code := 'workspace_settings_changed';
      details := jsonb_build_object('name', new.name);
    else
      return new;
    end if;

  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if target_workspace_id is null then
    select workspace_id into target_workspace_id from public.projects where id = target_project_id;
  end if;

  insert into public.activity_logs(workspace_id, project_id, user_id, action, entity_type, entity_id, metadata)
  values(target_workspace_id, target_project_id, target_user_id, action_code, entity_kind, entity_uuid, details);

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger record_file_deleted
  after update on public.files
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_invited
  after insert on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_removed
  after delete on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_member_updated
  after update on public.workspace_members
  for each row execute function private.record_project_activity();

create trigger record_workspace_updated
  after update on public.workspaces
  for each row execute function private.record_project_activity();

drop policy "activity_logs_read" on public.activity_logs;
create policy "activity_logs_read"
  on public.activity_logs for select
  to authenticated
  using (
    (project_id is not null and (private.is_project_member(project_id, (select auth.uid())) or private.is_project_workspace_admin(project_id, (select auth.uid()))))
    or
    (project_id is null and public.is_workspace_admin(workspace_id, (select auth.uid())))
  );

revoke insert, update, delete, truncate on public.activity_logs from anon, authenticated;
