insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('workspace-branding','workspace-branding',true,2097152,array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Public workspace logos" on storage.objects for select using(bucket_id='workspace-branding');
create policy "Workspace admins upload logos" on storage.objects for insert to authenticated with check(bucket_id='workspace-branding' and public.is_workspace_admin(((storage.foldername(name))[1])::uuid,(select auth.uid())));
create policy "Workspace admins update logos" on storage.objects for update to authenticated using(bucket_id='workspace-branding' and public.is_workspace_admin(((storage.foldername(name))[1])::uuid,(select auth.uid()))) with check(bucket_id='workspace-branding' and public.is_workspace_admin(((storage.foldername(name))[1])::uuid,(select auth.uid())));
create policy "Workspace admins delete logos" on storage.objects for delete to authenticated using(bucket_id='workspace-branding' and public.is_workspace_admin(((storage.foldername(name))[1])::uuid,(select auth.uid())));
