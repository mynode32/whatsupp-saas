-- The last-owner-protection trigger correctly blocks demoting/removing
-- an org's only owner while the org still exists, but it also blocked
-- deleting the organization itself (which cascades into deleting its
-- organization_members rows) — that would have broken the future
-- "close organization" feature (Faz 11) entirely. Only block when the
-- organization is still around; allow it as part of a full org delete.

create or replace function prevent_last_owner_change()
returns trigger
language plpgsql
as $$
declare
  remaining_owners int;
  org_still_exists boolean;
begin
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then

    select exists(select 1 from organizations where id = old.organization_id) into org_still_exists;

    if org_still_exists then
      select count(*) into remaining_owners
      from organization_members
      where organization_id = old.organization_id and role = 'owner' and id <> old.id;

      if remaining_owners = 0 then
        raise exception 'Cannot remove or demote the last owner of an organization';
      end if;
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
