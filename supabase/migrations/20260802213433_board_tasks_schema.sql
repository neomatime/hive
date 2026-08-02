create type task_status_type as enum ('backlog', 'todo', 'in_progress', 'review', 'done');

create table boards (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade,
  name varchar(150) not null default 'Project board', description text, is_default boolean not null default true,
  created_by uuid not null references users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index boards_one_default_per_project on boards(project_id) where is_default;

create table board_columns (
  id uuid primary key default gen_random_uuid(), board_id uuid not null references boards(id) on delete cascade,
  name varchar(100) not null, status_type task_status_type not null, position integer not null,
  wip_limit integer check(wip_limit is null or wip_limit > 0), is_terminal boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(board_id, position), unique(board_id, status_type)
);

create table tasks (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references projects(id) on delete cascade,
  board_id uuid not null references boards(id) on delete cascade, column_id uuid not null references board_columns(id),
  parent_task_id uuid references tasks(id), title varchar(300) not null check(length(trim(title)) > 0), description text,
  priority task_priority not null default 'medium', assignee_id uuid references users(id), created_by uuid not null references users(id),
  start_date date, due_date date, completed_at timestamptz, position numeric(20,10) not null,
  estimated_minutes integer check(estimated_minutes is null or estimated_minutes >= 0),
  progress_percentage numeric(5,2) not null default 0 check(progress_percentage between 0 and 100),
  is_blocked boolean not null default false, blocked_reason text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), deleted_at timestamptz,
  check(due_date is null or start_date is null or due_date >= start_date), check(not is_blocked or blocked_reason is not null)
);
create index idx_tasks_project on tasks(project_id); create index idx_tasks_column on tasks(column_id);
create index idx_tasks_assignee on tasks(assignee_id); create index idx_tasks_due_date on tasks(due_date);
create index idx_tasks_parent on tasks(parent_task_id); create index idx_tasks_project_column_position on tasks(project_id,column_id,position);

create table labels (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references workspaces(id) on delete cascade,
  name varchar(100) not null, color_token varchar(50) not null, created_by uuid not null references users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id,name)
);
create table task_labels (task_id uuid not null references tasks(id) on delete cascade, label_id uuid not null references labels(id) on delete cascade, created_at timestamptz not null default now(), primary key(task_id,label_id));
create table task_comments (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references tasks(id) on delete cascade,
  author_id uuid not null references users(id), parent_comment_id uuid references task_comments(id),
  content text not null check(length(trim(content)) > 0), is_edited boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create function private.can_edit_project_tasks(target_project_id uuid, target_auth_user_id uuid)
returns boolean language sql security definer set search_path=public stable as $$
  select private.is_project_workspace_admin(target_project_id,target_auth_user_id) or exists(
    select 1 from project_members pm join users u on u.id=pm.user_id where pm.project_id=target_project_id
      and u.auth_user_id=target_auth_user_id and pm.role in ('project_owner','project_manager','contributor'));
$$;
grant execute on function private.can_edit_project_tasks(uuid,uuid) to authenticated,service_role;

create function create_default_project_board() returns trigger language plpgsql security definer set search_path=public as $$
declare board_uuid uuid; begin
  insert into boards(project_id,created_by) values(new.id,new.created_by) returning id into board_uuid;
  insert into board_columns(board_id,name,status_type,position,is_terminal) values
    (board_uuid,'Backlog','backlog',0,false),(board_uuid,'To Do','todo',1,false),(board_uuid,'In Progress','in_progress',2,false),(board_uuid,'Review','review',3,false),(board_uuid,'Done','done',4,true);
  return new; end;
$$;
revoke all on function create_default_project_board() from public,anon,authenticated;
create trigger projects_create_default_board after insert on projects for each row execute function create_default_project_board();

insert into boards(project_id,created_by) select id,created_by from projects p where not exists(select 1 from boards b where b.project_id=p.id);
insert into board_columns(board_id,name,status_type,position,is_terminal)
select b.id,v.name,v.status::task_status_type,v.position,v.terminal from boards b cross join
(values('Backlog','backlog',0,false),('To Do','todo',1,false),('In Progress','in_progress',2,false),('Review','review',3,false),('Done','done',4,true)) v(name,status,position,terminal);

alter table boards enable row level security; alter table board_columns enable row level security; alter table tasks enable row level security;
alter table labels enable row level security; alter table task_labels enable row level security; alter table task_comments enable row level security;
create policy boards_read on boards for select to authenticated using(private.is_project_member(project_id,(select auth.uid())) or private.is_project_workspace_admin(project_id,(select auth.uid())));
create policy columns_read on board_columns for select to authenticated using(exists(select 1 from boards b where b.id=board_id and (private.is_project_member(b.project_id,(select auth.uid())) or private.is_project_workspace_admin(b.project_id,(select auth.uid())))));
create policy tasks_read on tasks for select to authenticated using(private.is_project_member(project_id,(select auth.uid())) or private.is_project_workspace_admin(project_id,(select auth.uid())));
create policy tasks_write on tasks for all to authenticated using(private.can_edit_project_tasks(project_id,(select auth.uid()))) with check(private.can_edit_project_tasks(project_id,(select auth.uid())));
create policy labels_read on labels for select to authenticated using(is_workspace_member(workspace_id,(select auth.uid())));
create policy labels_write on labels for all to authenticated using(is_workspace_admin(workspace_id,(select auth.uid()))) with check(is_workspace_admin(workspace_id,(select auth.uid())));
create policy task_labels_access on task_labels for all to authenticated using(exists(select 1 from tasks t where t.id=task_id and private.can_edit_project_tasks(t.project_id,(select auth.uid())))) with check(exists(select 1 from tasks t where t.id=task_id and private.can_edit_project_tasks(t.project_id,(select auth.uid()))));
create policy comments_read on task_comments for select to authenticated using(exists(select 1 from tasks t where t.id=task_id and (private.is_project_member(t.project_id,(select auth.uid())) or private.is_project_workspace_admin(t.project_id,(select auth.uid())))));
create policy comments_insert on task_comments for insert to authenticated with check(author_id=(select id from users where auth_user_id=(select auth.uid())) and exists(select 1 from tasks t where t.id=task_id and private.can_edit_project_tasks(t.project_id,(select auth.uid()))));
create policy comments_update on task_comments for update to authenticated using(author_id=(select id from users where auth_user_id=(select auth.uid()))) with check(author_id=(select id from users where auth_user_id=(select auth.uid())));
