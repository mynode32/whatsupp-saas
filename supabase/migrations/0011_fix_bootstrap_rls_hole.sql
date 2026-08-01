-- CRITICAL FIX — found via live cross-tenant testing: any authenticated
-- user could make themselves 'owner' of ANY existing organization.
--
-- Root cause: organization_members_insert_bootstrap's "not exists"
-- check was a plain subquery over organization_members, which is
-- itself RLS-protected. Run as the calling (unprivileged) user, that
-- subquery could only see rows the caller already has access to —
-- i.e. none, for an org they're not in — so it always looked like
-- "this org has zero members" even when it didn't, letting anyone
-- bootstrap themselves in as owner of someone else's org.
--
-- Fix: do the "does this org already have a member" check inside a
-- SECURITY DEFINER function (bypasses RLS, sees the real state),
-- exactly like is_org_member/get_org_role already do correctly.

create or replace function org_has_no_members(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from organization_members where organization_id = target_org_id
  );
$$;

drop policy organization_members_insert_bootstrap on organization_members;

create policy organization_members_insert_bootstrap on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and org_has_no_members(organization_id)
  );
