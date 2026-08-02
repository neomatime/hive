create table public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  browser_enabled boolean not null default false,
  assigned_task boolean not null default true,
  mention boolean not null default true,
  due_today boolean not null default true,
  overdue boolean not null default true,
  review_requested boolean not null default true,
  task_completed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
grant select, insert, update on table public.notification_preferences to authenticated;
create policy "Users can view their notification preferences" on public.notification_preferences for select to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Users can create their notification preferences" on public.notification_preferences for insert to authenticated with check (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Users can update their notification preferences" on public.notification_preferences for update to authenticated using (user_id = (select id from public.users where auth_user_id = (select auth.uid()))) with check (user_id = (select id from public.users where auth_user_id = (select auth.uid())));
