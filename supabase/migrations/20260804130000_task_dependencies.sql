-- Backlog: task dependencies ("blocked by"). A task can be blocked by
-- one or more other tasks; the block is considered cleared once the
-- blocking task's completed_at is set (the same signal moveTask()
-- already uses to mark a task done).
create table task_dependencies (
  id uuid primary key default gen_random_uuid(),
  blocking_task_id uuid not null references tasks(id) on delete cascade,
  blocked_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint task_dependencies_not_self check (blocking_task_id <> blocked_task_id),
  unique (blocking_task_id, blocked_task_id)
);

create index idx_task_dependencies_blocked on task_dependencies(blocked_task_id);
create index idx_task_dependencies_blocking on task_dependencies(blocking_task_id);

alter table task_dependencies enable row level security;

-- blocked_task_id has no same-named column on the `tasks` table it's
-- compared against here (tasks' own PK is `id`), so this subquery
-- correlates outward to the outer task_dependencies row correctly.
create policy "task_dependencies_select"
  on task_dependencies for select
  to authenticated
  using (
    private.is_project_member((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
    or private.is_project_workspace_admin((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
  );

create policy "task_dependencies_insert"
  on task_dependencies for insert
  to authenticated
  with check (
    private.is_project_member((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
    or private.is_project_workspace_admin((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
  );

create policy "task_dependencies_delete"
  on task_dependencies for delete
  to authenticated
  using (
    private.is_project_member((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
    or private.is_project_workspace_admin((select t.project_id from tasks t where t.id = blocked_task_id), (select auth.uid()))
  );

grant select, insert, delete on task_dependencies to authenticated;
