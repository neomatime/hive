drop policy "files_insert" on public.files;
create policy "files_insert"
  on public.files for insert
  to authenticated
  with check (
    uploaded_by = (select users.id from users where users.auth_user_id = (select auth.uid()))
    and private.can_edit_project_tasks(project_id, (select auth.uid()))
    and workspace_id = (select p.workspace_id from projects p where p.id = project_id)
  );

drop policy "Project editors manage calendar events" on public.calendar_events;
create policy "Project editors manage calendar events"
  on public.calendar_events for all
  to authenticated
  using (private.can_edit_project_tasks(project_id, (select auth.uid())))
  with check (
    private.can_edit_project_tasks(project_id, (select auth.uid()))
    and created_by = (select users.id from users where users.auth_user_id = (select auth.uid()))
    and workspace_id = (select p.workspace_id from projects p where p.id = project_id)
  );
