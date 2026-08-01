-- RLS helper functions.
--
-- These are SECURITY DEFINER because organization_members itself has
-- RLS enabled (0008) — without bypassing it here, checking "am I a
-- member of org X" would recurse into the same policy it's used by.

create or replace function is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organization_members
    where organization_id = target_org_id and user_id = auth.uid()
  );
$$;

create or replace function get_org_role(target_org_id uuid)
returns org_role
language sql
security definer
set search_path = public
stable
as $$
  select role from organization_members
  where organization_id = target_org_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function org_role_rank(r org_role)
returns int
language sql
immutable
as $$
  select case r
    when 'owner' then 4
    when 'admin' then 3
    when 'agent' then 2
    when 'viewer' then 1
  end;
$$;

-- True if the caller's role in target_org_id is at least as privileged as min_role.
create or replace function has_org_role_at_least(target_org_id uuid, min_role org_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(org_role_rank(get_org_role(target_org_id)) >= org_role_rank(min_role), false);
$$;

-- Defense in depth for "owner can't accidentally remove the last owner"
-- (Faz 2.3): enforced here even though the app layer also checks it.
create or replace function prevent_last_owner_change()
returns trigger
language plpgsql
as $$
declare
  remaining_owners int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into remaining_owners
    from organization_members
    where organization_id = old.organization_id and role = 'owner' and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'Cannot remove or demote the last owner of an organization';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_prevent_last_owner
  before update or delete on organization_members
  for each row execute function prevent_last_owner_change();
