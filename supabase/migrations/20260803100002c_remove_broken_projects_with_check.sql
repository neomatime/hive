drop policy "projects_update_manager_or_workspace_admin" on public.projects;

create policy "projects_update_manager_or_workspace_admin"
  on public.projects for update
  using (private.is_project_manager(id, auth.uid()) or private.is_project_workspace_admin(id, auth.uid()));
