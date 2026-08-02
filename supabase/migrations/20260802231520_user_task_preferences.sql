create table public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  default_task_priority public.task_priority not null default 'medium',
  default_task_status public.task_status_type not null default 'todo',
  week_starts_on smallint not null default 1 check (week_starts_on in (0, 1)),
  working_hours_start time,
  working_hours_end time,
  show_completed_tasks boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (working_hours_start is null or working_hours_end is null or working_hours_start < working_hours_end)
);
alter table public.user_preferences enable row level security;
grant select, insert, update on table public.user_preferences to authenticated;
create policy "Users can view their task preferences" on public.user_preferences for select to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Users can create their task preferences" on public.user_preferences for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Users can update their task preferences" on public.user_preferences for update to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid()))) with check (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
