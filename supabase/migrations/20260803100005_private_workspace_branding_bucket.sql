update storage.buckets
  set public = false,
      allowed_mime_types = array['image/png','image/jpeg','image/webp']
  where id = 'workspace-branding';

drop policy "Public workspace logos" on storage.objects;

create policy "Workspace members view logos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'workspace-branding'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );
