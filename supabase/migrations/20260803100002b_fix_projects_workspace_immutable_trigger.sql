create or replace function private.prevent_project_workspace_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'Cannot change a project''s workspace_id';
  end if;
  return new;
end;
$$;

create trigger prevent_project_workspace_reassignment
  before update on public.projects
  for each row execute function private.prevent_project_workspace_change();
