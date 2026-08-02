create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type varchar(50) not null check (type in ('assigned_task', 'task_completed')),
  title varchar(255) not null, message text not null, entity_type varchar(50), entity_id uuid,
  is_read boolean not null default false, read_at timestamptz, created_at timestamptz not null default now()
);
create index idx_notifications_user_read on public.notifications(user_id, is_read, created_at desc);
alter table public.notifications enable row level security;
grant select, update on table public.notifications to authenticated;
create policy "Users can view their notifications" on public.notifications for select to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Users can update their notifications" on public.notifications for update to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid()))) with check (user_id = (select id from public.users where auth_user_id = (select auth.uid())));

create function private.notify_task_change() returns trigger language plpgsql security definer set search_path = public, private as $$
declare target_workspace_id uuid; event_type text; event_title text; event_message text; enabled boolean;
begin
  if new.assignee_id is not null and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id) then
    event_type := 'assigned_task'; event_title := 'Task assigned'; event_message := new.title;
  elsif tg_op = 'UPDATE' and old.completed_at is null and new.completed_at is not null and new.assignee_id is not null then
    event_type := 'task_completed'; event_title := 'Task completed'; event_message := new.title;
  else return new;
  end if;
  select workspace_id into target_workspace_id from public.projects where id = new.project_id;
  select coalesce(np.in_app_enabled, true) and case when event_type = 'assigned_task' then coalesce(np.assigned_task, true) else coalesce(np.task_completed, true) end into enabled from (select 1) seed left join public.notification_preferences np on np.user_id = new.assignee_id;
  if coalesce(enabled, true) then insert into public.notifications(user_id, workspace_id, type, title, message, entity_type, entity_id) values(new.assignee_id, target_workspace_id, event_type, event_title, event_message, 'task', new.id); end if;
  return new;
end; $$;
revoke all on function private.notify_task_change() from public, anon, authenticated;
create trigger notify_task_assigned after insert or update of assignee_id on public.tasks for each row execute function private.notify_task_change();
create trigger notify_task_completed after update of completed_at on public.tasks for each row execute function private.notify_task_change();
