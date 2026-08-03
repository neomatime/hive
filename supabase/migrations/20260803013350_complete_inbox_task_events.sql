alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in ('assigned_task', 'task_completed', 'due_today', 'overdue', 'review_requested', 'mention'));
create unique index if not exists idx_notifications_task_event_once on public.notifications(user_id, type, entity_id) where entity_type = 'task' and type in ('due_today', 'overdue', 'review_requested');

create function public.refresh_my_task_notifications()
returns void language plpgsql security definer set search_path = public, private as $$
declare current_user_id uuid;
begin
  select id into current_user_id from public.users where auth_user_id = auth.uid();
  if current_user_id is null then raise exception 'Authentication required'; end if;
  insert into public.notifications(user_id, workspace_id, type, title, message, entity_type, entity_id)
  select current_user_id, p.workspace_id,
    case when t.due_date < current_date then 'overdue' else 'due_today' end,
    case when t.due_date < current_date then 'Task overdue' else 'Task due today' end,
    t.title, 'task', t.id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  left join public.notification_preferences np on np.user_id = current_user_id
  where t.assignee_id = current_user_id and t.deleted_at is null and t.completed_at is null
    and t.due_date <= current_date
    and coalesce(np.in_app_enabled, true)
    and ((t.due_date < current_date and coalesce(np.overdue, true)) or (t.due_date = current_date and coalesce(np.due_today, true)))
  on conflict (user_id, type, entity_id) where entity_type = 'task' and type in ('due_today', 'overdue', 'review_requested') do nothing;
end;
$$;
revoke all on function public.refresh_my_task_notifications() from public, anon;
grant execute on function public.refresh_my_task_notifications() to authenticated, service_role;

create function private.notify_task_review() returns trigger language plpgsql security definer set search_path = public, private as $$
declare target_workspace_id uuid; enabled boolean;
begin
  if new.assignee_id is null or old.column_id is not distinct from new.column_id or not exists(select 1 from public.board_columns where id = new.column_id and status_type = 'review') then return new; end if;
  select workspace_id into target_workspace_id from public.projects where id = new.project_id;
  select coalesce(np.in_app_enabled, true) and coalesce(np.review_requested, true) into enabled from (select 1) seed left join public.notification_preferences np on np.user_id = new.assignee_id;
  if coalesce(enabled, true) then
    insert into public.notifications(user_id, workspace_id, type, title, message, entity_type, entity_id)
    values(new.assignee_id, target_workspace_id, 'review_requested', 'Task ready for review', new.title, 'task', new.id)
    on conflict (user_id, type, entity_id) where entity_type = 'task' and type in ('due_today', 'overdue', 'review_requested') do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_task_review() from public, anon, authenticated;
create trigger notify_task_review after update of column_id on public.tasks for each row execute function private.notify_task_review();

create function private.notify_comment_mentions() returns trigger language plpgsql security definer set search_path = public, private as $$
declare target_workspace_id uuid; mentioned_user record; enabled boolean; task_title text;
begin
  select p.workspace_id, t.title into target_workspace_id, task_title from public.tasks t join public.projects p on p.id=t.project_id where t.id=new.task_id;
  for mentioned_user in
    select u.id from public.users u join public.workspace_members wm on wm.user_id=u.id and wm.workspace_id=target_workspace_id and wm.is_active
    where u.id <> new.author_id and position('@' || lower(u.email) in lower(new.content)) > 0
  loop
    select coalesce(np.in_app_enabled, true) and coalesce(np.mention, true) into enabled from (select 1) seed left join public.notification_preferences np on np.user_id=mentioned_user.id;
    if coalesce(enabled, true) then
      insert into public.notifications(user_id, workspace_id, type, title, message, entity_type, entity_id)
      values(mentioned_user.id, target_workspace_id, 'mention', 'You were mentioned', task_title, 'task', new.task_id);
    end if;
  end loop;
  return new;
end;
$$;
revoke all on function private.notify_comment_mentions() from public, anon, authenticated;
create trigger notify_comment_mentions after insert on public.task_comments for each row execute function private.notify_comment_mentions();
