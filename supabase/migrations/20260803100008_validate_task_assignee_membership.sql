drop policy "tasks_write" on public.tasks;
create policy "tasks_write"
  on public.tasks for all
  to authenticated
  using (private.can_edit_project_tasks(project_id, (select auth.uid())))
  with check (
    private.can_edit_project_tasks(project_id, (select auth.uid()))
    and (
      assignee_id is null
      or exists (
        select 1
        from project_members pm
        join workspace_members wm on wm.user_id = pm.user_id
        where pm.user_id = assignee_id
          and pm.project_id = tasks.project_id
          and wm.workspace_id = (select p.workspace_id from projects p where p.id = tasks.project_id)
          and wm.is_active = true
      )
    )
  );
