-- Backlog: saved board filter presets. Users save their own named
-- filter combinations (search/priority/assignee) per board and
-- reapply them later. No sharing across users in this pass.
create table board_filter_presets (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (board_id, user_id, name)
);

create index idx_board_filter_presets_board_user on board_filter_presets(board_id, user_id);

alter table board_filter_presets enable row level security;

-- board_id has no same-named column on the `boards` table it's
-- compared against here (boards' own PK is `id`), so this subquery
-- correlates outward to the outer board_filter_presets row correctly.
create policy "board_filter_presets_select_own"
  on board_filter_presets for select
  to authenticated
  using (user_id = (select id from users where auth_user_id = (select auth.uid())));

create policy "board_filter_presets_insert_own"
  on board_filter_presets for insert
  to authenticated
  with check (
    user_id = (select id from users where auth_user_id = (select auth.uid()))
    and private.is_project_member(
      (select b.project_id from boards b where b.id = board_id),
      (select auth.uid())
    )
  );

create policy "board_filter_presets_delete_own"
  on board_filter_presets for delete
  to authenticated
  using (user_id = (select id from users where auth_user_id = (select auth.uid())));

grant select, insert, delete on board_filter_presets to authenticated;
