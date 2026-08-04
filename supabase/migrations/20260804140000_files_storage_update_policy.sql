-- Replacing a document re-uploads under the SAME storage_key (upsert), which
-- Supabase Storage treats as an update to the existing object, not an
-- insert. The insert-only policy from 20260802223037_files_storage.sql
-- covers new uploads but silently rejects upsert-replaces, so this adds the
-- matching update policy.
create policy project_files_storage_update on storage.objects for update to authenticated
using (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and private.can_edit_project_tasks(p.id, (select auth.uid()))
  )
)
with check (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and private.can_edit_project_tasks(p.id, (select auth.uid()))
  )
);
