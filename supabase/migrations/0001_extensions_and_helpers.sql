-- Extensions & shared helpers used by every later migration.

create extension if not exists pgcrypto;

create type org_role as enum ('owner', 'admin', 'agent', 'viewer');

-- Shared updated_at trigger: every mutable table gets `before update`
-- wired to this so callers never have to set updated_at by hand.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
