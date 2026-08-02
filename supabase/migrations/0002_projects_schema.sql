-- Project delivery enums
create type project_status as enum ('not_started', 'active', 'on_hold', 'completed', 'archived');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type project_member_role as enum ('project_owner', 'project_manager', 'contributor', 'viewer');

create sequence project_code_seq;

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  template_id uuid,
  name varchar(255) not null,
  project_code varchar(50) unique not null default ('PRJ-' || lpad(nextval('project_code_seq')::text, 4, '0')),
  description text,
  status project_status not null default 'not_started',
  priority task_priority not null default 'medium',
  owner_id uuid not null references users(id),
  start_date date,
  due_date date,
  completed_at timestamptz,
  progress_percentage numeric(5, 2) not null default 0,
  is_favourite boolean not null default false,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create index idx_projects_workspace on projects(workspace_id);
create index idx_projects_status on projects(status);
create index idx_projects_owner on projects(owner_id);
create index idx_projects_due_date on projects(due_date);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role project_member_role not null,
  added_by uuid not null references users(id),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create function can_create_project(target_workspace_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = target_workspace_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

create function is_project_member(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from project_members pm
    join users u on u.id = pm.user_id
    where pm.project_id = target_project_id
      and u.auth_user_id = target_auth_user_id
  );
$$;

create function is_project_manager(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from project_members pm
    join users u on u.id = pm.user_id
    where pm.project_id = target_project_id
      and u.auth_user_id = target_auth_user_id
      and pm.role in ('project_owner', 'project_manager')
  );
$$;

create function is_project_workspace_admin(target_project_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from projects p
    join workspace_members wm on wm.workspace_id = p.workspace_id
    join users u on u.id = wm.user_id
    where p.id = target_project_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
      and wm.role in ('owner', 'admin')
  );
$$;

alter table projects enable row level security;
alter table project_members enable row level security;

create policy "projects_select_member_or_workspace_admin"
  on projects for select
  using (is_project_member(id, auth.uid()) or is_project_workspace_admin(id, auth.uid()));

create policy "projects_insert_workspace_non_viewer"
  on projects for insert
  with check (can_create_project(workspace_id, auth.uid()));

create policy "projects_update_manager_or_workspace_admin"
  on projects for update
  using (is_project_manager(id, auth.uid()) or is_project_workspace_admin(id, auth.uid()));

create policy "project_members_select_member_or_workspace_admin"
  on project_members for select
  using (is_project_member(project_id, auth.uid()) or is_project_workspace_admin(project_id, auth.uid()));

create policy "project_members_write_manager_or_workspace_admin"
  on project_members for all
  using (is_project_manager(project_id, auth.uid()) or is_project_workspace_admin(project_id, auth.uid()))
  with check (is_project_manager(project_id, auth.uid()) or is_project_workspace_admin(project_id, auth.uid()));

create function create_project_with_owner(
  p_workspace_id uuid,
  p_name varchar,
  p_description text,
  p_status project_status,
  p_priority task_priority,
  p_owner_id uuid,
  p_start_date date,
  p_due_date date,
  p_member_ids uuid[]
)
returns projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator_id uuid;
  v_new_project projects;
  v_member_id uuid;
begin
  select id into v_creator_id from users where auth_user_id = auth.uid();
  if v_creator_id is null then
    raise exception 'Not authenticated';
  end if;

  if not can_create_project(p_workspace_id, auth.uid()) then
    raise exception 'You do not have permission to create a project in this workspace';
  end if;

  insert into projects (workspace_id, name, description, status, priority, owner_id, start_date, due_date, created_by)
  values (p_workspace_id, p_name, p_description, p_status, p_priority, p_owner_id, p_start_date, p_due_date, v_creator_id)
  returning * into v_new_project;

  insert into project_members (project_id, user_id, role, added_by)
  values (v_new_project.id, p_owner_id, 'project_owner', v_creator_id);

  if v_creator_id != p_owner_id then
    insert into project_members (project_id, user_id, role, added_by)
    values (v_new_project.id, v_creator_id, 'project_manager', v_creator_id);
  end if;

  if p_member_ids is not null then
    foreach v_member_id in array p_member_ids loop
      if v_member_id != p_owner_id and v_member_id != v_creator_id then
        insert into project_members (project_id, user_id, role, added_by)
        values (v_new_project.id, v_member_id, 'contributor', v_creator_id);
      end if;
    end loop;
  end if;

  return v_new_project;
end;
$$;

grant execute on function create_project_with_owner(uuid, varchar, text, project_status, task_priority, uuid, date, date, uuid[]) to authenticated;
