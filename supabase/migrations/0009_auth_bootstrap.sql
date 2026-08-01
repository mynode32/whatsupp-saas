-- Auth bootstrapping: auto-create a profile on signup, and allow a
-- brand-new organization's very first member to insert themselves as
-- owner (the existing organization_members_insert policy requires the
-- caller to already be admin+ of the org, which is impossible for an
-- org that has zero members yet).

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create policy organization_members_insert_bootstrap on organization_members for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and not exists (
      select 1 from organization_members existing
      where existing.organization_id = organization_members.organization_id
    )
  );
