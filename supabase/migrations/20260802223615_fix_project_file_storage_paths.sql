drop policy if exists project_files_storage_read on storage.objects;
drop policy if exists project_files_storage_insert on storage.objects;
drop policy if exists project_files_storage_delete on storage.objects;

create policy project_files_storage_read on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and (private.is_project_member(p.id, (select auth.uid())) or private.is_project_workspace_admin(p.id, (select auth.uid())))
  )
);
create policy project_files_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.workspace_id::text = (storage.foldername(storage.objects.name))[1]
      and p.id::text = (storage.foldername(storage.objects.name))[2]
      and private.can_edit_project_tasks(p.id, (select auth.uid()))
  )
);
create policy project_files_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and private.can_edit_project_tasks(p.id, (select auth.uid()))
  )
);
