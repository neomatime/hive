create table public.calendar_events(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 project_id uuid not null references public.projects(id) on delete cascade, type varchar(30) not null check(type in ('meeting','milestone')),
 title varchar(255) not null check(length(trim(title))>0), description text, starts_at timestamptz not null, ends_at timestamptz,
 created_by uuid not null references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at is null or ends_at >= starts_at)
);
create index idx_calendar_events_workspace_start on public.calendar_events(workspace_id,starts_at);
create index idx_calendar_events_project_start on public.calendar_events(project_id,starts_at);
alter table public.calendar_events enable row level security;
grant select,insert,update,delete on public.calendar_events to authenticated;
create policy "Project members view calendar events" on public.calendar_events for select to authenticated using(private.is_project_member(project_id,(select auth.uid())) or private.is_project_workspace_admin(project_id,(select auth.uid())));
create policy "Project editors manage calendar events" on public.calendar_events for all to authenticated using(private.can_edit_project_tasks(project_id,(select auth.uid()))) with check(private.can_edit_project_tasks(project_id,(select auth.uid())) and created_by=(select id from public.users where auth_user_id=(select auth.uid())));
