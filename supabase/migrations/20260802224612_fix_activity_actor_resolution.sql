create or replace function private.record_project_activity()
returns trigger language plpgsql security definer set search_path = public, private as $$
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
  if tg_table_name = 'tasks' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.created_by);
    entity_kind := 'task'; entity_uuid := new.id;
    if tg_op = 'INSERT' then action_code := 'task_created';
    elsif old.column_id is distinct from new.column_id then action_code := 'task_moved';
    else return new;
    end if;
    details := jsonb_build_object('title', new.title, 'from_column_id', case when tg_op='UPDATE' then old.column_id else null end, 'to_column_id', new.column_id);
  elsif tg_table_name = 'task_comments' then
    select t.project_id into target_project_id from public.tasks t where t.id = new.task_id;
    target_user_id := coalesce(target_user_id, new.author_id);
    entity_kind := 'comment'; entity_uuid := new.id; action_code := 'comment_added';
    details := jsonb_build_object('task_id', new.task_id, 'content_preview', left(new.content, 120));
  elsif tg_table_name = 'files' then
    target_project_id := new.project_id;
    target_user_id := coalesce(target_user_id, new.uploaded_by);
    entity_kind := 'file'; entity_uuid := new.id; action_code := 'file_uploaded';
    details := jsonb_build_object('name', new.name, 'size_bytes', new.size_bytes, 'mime_type', new.mime_type);
  else
    return new;
  end if;
  select workspace_id into target_workspace_id from public.projects where id = target_project_id;
  insert into public.activity_logs(workspace_id, project_id, user_id, action, entity_type, entity_id, metadata)
  values(target_workspace_id, target_project_id, target_user_id, action_code, entity_kind, entity_uuid, details);
  return new;
end;
$$;

