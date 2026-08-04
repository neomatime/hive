-- Backlog: task watchers. Subscribe/unsubscribe + list only in this pass --
-- fanning watcher notifications out from notify_task_change() is a natural
-- next step, not built here (see docs/product/Backlog.md follow-up note).
create table task_watchers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create index idx_task_watchers_task on task_watchers(task_id);

alter table task_watchers enable row level security;

-- task_id has no same-named column on the `tasks` table it's compared
-- against here (tasks' own PK is `id`), so this subquery correlates
-- outward to the outer task_watchers row correctly -- not the same shape
-- as the 20260803100002 self-reference bug, which compared `id` to `id`
-- on the very same table.
create policy "task_watchers_select"
  on task_watchers for select
  to authenticated
  using (
    private.is_project_member((select t.project_id from tasks t where t.id = task_id), (select auth.uid()))
    or private.is_project_workspace_admin((select t.project_id from tasks t where t.id = task_id), (select auth.uid()))
  );

create policy "task_watchers_insert_own"
  on task_watchers for insert
  to authenticated
  with check (
    user_id = (select id from users where auth_user_id = (select auth.uid()))
    and (
      private.is_project_member((select t.project_id from tasks t where t.id = task_id), (select auth.uid()))
      or private.is_project_workspace_admin((select t.project_id from tasks t where t.id = task_id), (select auth.uid()))
    )
  );

create policy "task_watchers_delete_own"
  on task_watchers for delete
  to authenticated
  using (user_id = (select id from users where auth_user_id = (select auth.uid())));

grant select, insert, delete on task_watchers to authenticated;
