create table public.workspace_integrations(
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 provider varchar(50) not null check(provider in ('slack','microsoft_teams','google_calendar','dropbox')),
 is_connected boolean not null default true, connected_by uuid not null references public.users(id), connected_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(workspace_id,provider)
);
alter table public.workspace_integrations enable row level security;
grant select,insert,update,delete on public.workspace_integrations to authenticated;
create policy "Workspace members view integrations" on public.workspace_integrations for select to authenticated using(public.is_workspace_member(workspace_id,(select auth.uid())));
create policy "Workspace admins manage integrations" on public.workspace_integrations for all to authenticated using(public.is_workspace_admin(workspace_id,(select auth.uid()))) with check(public.is_workspace_admin(workspace_id,(select auth.uid())) and connected_by=(select id from public.users where auth_user_id=(select auth.uid())));
