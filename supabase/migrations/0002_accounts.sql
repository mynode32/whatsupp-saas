-- Accounts: organizations, profiles, membership, invitations, audit log.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  default_lang text not null default 'tr',
  timezone text not null default 'Europe/Istanbul',
  support_email text,
  brand_voice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();

-- Mirrors auth.users 1:1. Row is created by a trigger added in Faz 2
-- (handle_new_user) once real signup exists.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role org_role not null default 'agent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create trigger organization_members_set_updated_at before update on organization_members
  for each row execute function set_updated_at();
create index organization_members_user_id_idx on organization_members (user_id);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role org_role not null default 'agent',
  invited_by uuid not null references profiles (id),
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, email, status)
);
create trigger invitations_set_updated_at before update on invitations
  for each row execute function set_updated_at();

-- Append-only: no updated_at, no update trigger. Immutability is
-- enforced by RLS in 0003 (insert-only for normal roles).
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  actor_id uuid references profiles (id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_created_idx on audit_logs (organization_id, created_at desc);
