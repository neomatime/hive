create table public.project_templates (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name varchar(255) not null check (length(trim(name)) between 1 and 255), description text, category varchar(100),
  created_by uuid not null references public.users(id), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create index idx_project_templates_workspace_active on public.project_templates(workspace_id, is_active, created_at desc);
alter table public.project_templates enable row level security;
grant select, insert, update on table public.project_templates to authenticated;
create policy "Workspace members can view project templates" on public.project_templates for select to authenticated using (public.is_workspace_member(workspace_id, (select auth.uid())));
create policy "Workspace admins can create project templates" on public.project_templates for insert to authenticated with check (public.is_workspace_admin(workspace_id, (select auth.uid())) and created_by = (select id from public.users where auth_user_id = (select auth.uid())));
create policy "Workspace admins can update project templates" on public.project_templates for update to authenticated using (public.is_workspace_admin(workspace_id, (select auth.uid()))) with check (public.is_workspace_admin(workspace_id, (select auth.uid())));
