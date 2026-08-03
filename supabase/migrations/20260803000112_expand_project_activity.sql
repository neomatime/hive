create or replace function private.record_project_activity()
returns trigger language plpgsql security definer set search_path = public, private as $$
declare
  target_project_id uuid; target_workspace_id uuid; target_user_id uuid;
  action_code text; entity_kind text; entity_uuid uuid; details jsonb;
begin
  target_user_id := (select id from public.users where auth_user_id = auth.uid());
  if tg_table_name = 'projects' then
    target_project_id := new.id; target_workspace_id := new.workspace_id;
    target_user_id := coalesce(target_user_id, new.created_by); entity_kind := 'project'; entity_uuid := new.id;
    if tg_op = 'INSERT' then
      action_code := 'project_created'; details := jsonb_build_object('name', new.name);
    elsif old.name is distinct from new.name or old.description is distinct from new.description or old.status is distinct from new.status or old.priority is distinct from new.priority or old.start_date is distinct from new.start_date or old.due_date is distinct from new.due_date then
      action_code := 'project_updated'; details := jsonb_build_object('name', new.name, 'status', new.status, 'priority', new.priority);
    else return new; end if;
  elsif tg_table_name = 'project_members' then
    target_project_id := coalesce(new.project_id, old.project_id); entity_kind := 'member'; entity_uuid := coalesce(new.user_id, old.user_id);
    if tg_op = 'INSERT' then target_user_id := coalesce(target_user_id, new.added_by); action_code := 'member_added'; details := jsonb_build_object('user_id', new.user_id, 'role', new.role);
    elsif tg_op = 'DELETE' then action_code := 'member_removed'; details := jsonb_build_object('user_id', old.user_id, 'role', old.role);
    elsif old.role is distinct from new.role then action_code := 'member_role_changed'; details := jsonb_build_object('user_id', new.user_id, 'from_role', old.role, 'to_role', new.role);
    else return new; end if;
  elsif tg_table_name = 'tasks' then
    target_project_id := new.project_id; target_user_id := coalesce(target_user_id, new.created_by); entity_kind := 'task'; entity_uuid := new.id;
    if tg_op = 'INSERT' then action_code := 'task_created';
    elsif old.completed_at is null and new.completed_at is not null then action_code := 'task_completed';
    elsif old.column_id is distinct from new.column_id then action_code := 'task_moved';
    elsif old.title is distinct from new.title or old.description is distinct from new.description or old.priority is distinct from new.priority or old.assignee_id is distinct from new.assignee_id or old.due_date is distinct from new.due_date then action_code := 'task_updated';
    else return new; end if;
    details := jsonb_build_object('title', new.title, 'from_column_id', case when tg_op='UPDATE' then old.column_id else null end, 'to_column_id', new.column_id);
  elsif tg_table_name = 'task_comments' then
    select t.project_id into target_project_id from public.tasks t where t.id = new.task_id;
    target_user_id := coalesce(target_user_id, new.author_id); entity_kind := 'comment'; entity_uuid := new.id; action_code := 'comment_added';
    details := jsonb_build_object('task_id', new.task_id, 'content_preview', left(new.content, 120));
  elsif tg_table_name = 'files' then
    target_project_id := new.project_id; target_user_id := coalesce(target_user_id, new.uploaded_by); entity_kind := 'file'; entity_uuid := new.id; action_code := 'file_uploaded';
    details := jsonb_build_object('name', new.name, 'size_bytes', new.size_bytes, 'mime_type', new.mime_type);
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if target_workspace_id is null then select workspace_id into target_workspace_id from public.projects where id = target_project_id; end if;
  insert into public.activity_logs(workspace_id, project_id, user_id, action, entity_type, entity_id, metadata)
  values(target_workspace_id, target_project_id, target_user_id, action_code, entity_kind, entity_uuid, details);
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.record_project_activity() from public, anon, authenticated;

drop trigger if exists record_task_moved on public.tasks;
create trigger record_task_updated after update on public.tasks for each row execute function private.record_project_activity();
create trigger record_project_created after insert on public.projects for each row execute function private.record_project_activity();
create trigger record_project_updated after update on public.projects for each row execute function private.record_project_activity();
create trigger record_project_member_added after insert on public.project_members for each row execute function private.record_project_activity();
create trigger record_project_member_updated after update on public.project_members for each row execute function private.record_project_activity();
create trigger record_project_member_removed after delete on public.project_members for each row execute function private.record_project_activity();

