-- Bug found via live testing: organizations_select required
-- is_org_member(id), but a brand-new org has zero members at the
-- moment of creation — so INSERT ... RETURNING (which Postgres
-- evaluates against the SELECT policy) failed for the very user
-- creating the org, before they can bootstrap their own membership
-- row. Fix: track who created the org and let them always see it.

alter table organizations add column created_by uuid references profiles (id);

drop policy organizations_select on organizations;
create policy organizations_select on organizations for select
  using (is_org_member(id) or created_by = auth.uid());
