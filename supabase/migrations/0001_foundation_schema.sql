-- Enums
create type workspace_role as enum ('owner', 'admin', 'member', 'viewer');

-- Tables
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  first_name varchar(100) not null default '',
  last_name varchar(100) not null default '',
  display_name varchar(200) not null,
  email varchar(255) unique not null,
  phone_number varchar(30),
  job_title varchar(150),
  department varchar(150),
  avatar_url text,
  timezone varchar(100) not null default 'UTC',
  locale varchar(20) not null default 'en',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_users_email on users(email);
create index idx_users_active on users(is_active);

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  slug varchar(100) unique not null,
  description text,
  logo_url text,
  timezone varchar(100) not null default 'UTC',
  date_format varchar(30) not null default 'DD/MM/YYYY',
  time_format varchar(20) not null default '24h',
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role workspace_role not null,
  joined_at timestamptz not null default now(),
  invited_by uuid references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Auto-create a public.users row whenever a Supabase Auth user is created
create function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_user_id, email, first_name, last_name, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- RLS helper functions (SECURITY DEFINER to avoid recursive policy evaluation —
-- see spec section 6.3)
create function is_workspace_member(target_workspace_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = target_workspace_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
  );
$$;

create function is_workspace_admin(target_workspace_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members wm
    join users u on u.id = wm.user_id
    where wm.workspace_id = target_workspace_id
      and u.auth_user_id = target_auth_user_id
      and wm.is_active = true
      and wm.role in ('owner', 'admin')
  );
$$;

create function shares_workspace_with(target_user_row_id uuid, target_auth_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from workspace_members target_wm
    join workspace_members my_wm on my_wm.workspace_id = target_wm.workspace_id
    join users me on me.id = my_wm.user_id
    where target_wm.user_id = target_user_row_id
      and me.auth_user_id = target_auth_user_id
      and target_wm.is_active = true
      and my_wm.is_active = true
  );
$$;

-- RLS
alter table users enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

create policy "users_select_own_or_workspace_peers"
  on users for select
  using (auth_user_id = auth.uid() or shares_workspace_with(id, auth.uid()));

create policy "users_update_own"
  on users for update
  using (auth_user_id = auth.uid());

create policy "workspaces_select_active_member"
  on workspaces for select
  using (is_workspace_member(id, auth.uid()));

create policy "workspaces_update_owner_admin"
  on workspaces for update
  using (is_workspace_admin(id, auth.uid()));

create policy "workspace_members_select_same_workspace"
  on workspace_members for select
  using (is_workspace_member(workspace_id, auth.uid()));

create policy "workspace_members_write_owner_admin"
  on workspace_members for all
  using (is_workspace_admin(workspace_id, auth.uid()))
  with check (is_workspace_admin(workspace_id, auth.uid()));
