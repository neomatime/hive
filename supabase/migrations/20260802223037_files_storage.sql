create type public.file_type as enum ('folder','document','image','spreadsheet','presentation','pdf','archive','other');

create table public.files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  uploaded_by uuid not null references public.users(id),
  name varchar(255) not null check(length(trim(name)) > 0),
  storage_key text unique not null,
  mime_type varchar(150) not null,
  file_type public.file_type not null default 'other',
  size_bytes bigint not null check(size_bytes >= 0 and size_bytes <= 52428800),
  version_number integer not null default 1 check(version_number > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_files_workspace on public.files(workspace_id);
create index idx_files_project on public.files(project_id);
create index idx_files_task on public.files(task_id);

alter table public.files enable row level security;
grant select, insert, update, delete on public.files to authenticated;

create policy files_read on public.files for select to authenticated
using (
  private.is_project_member(project_id, (select auth.uid()))
  or private.is_project_workspace_admin(project_id, (select auth.uid()))
);
create policy files_insert on public.files for insert to authenticated
with check (
  uploaded_by = (select id from public.users where auth_user_id = (select auth.uid()))
  and private.can_edit_project_tasks(project_id, (select auth.uid()))
);
create policy files_update on public.files for update to authenticated
using (private.can_edit_project_tasks(project_id, (select auth.uid())))
with check (private.can_edit_project_tasks(project_id, (select auth.uid())));
create policy files_delete on public.files for delete to authenticated
using (private.can_edit_project_tasks(project_id, (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-files',
  'project-files',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'application/zip'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy project_files_storage_read on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and exists (
    select 1 from public.projects p
    where p.id::text = (storage.foldername(storage.objects.name))[2]
      and (
        private.is_project_member(p.id, (select auth.uid()))
        or private.is_project_workspace_admin(p.id, (select auth.uid()))
      )
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


