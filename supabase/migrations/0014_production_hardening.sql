-- Production hardening: close member-role escalation, make knowledge
-- publishing able to maintain its search chunks, and associate raw provider
-- events with the contact they belong to for erasure.

create or replace function prevent_membership_identity_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id <> old.organization_id or new.user_id <> old.user_id then
    raise exception 'Membership organization and user cannot be changed';
  end if;
  return new;
end;
$$;

create trigger organization_members_identity_immutable
  before update on organization_members
  for each row execute function prevent_membership_identity_change();

drop policy organization_members_update on organization_members;
drop policy organization_members_delete on organization_members;

create policy organization_members_update on organization_members for update
  using (
    has_org_role_at_least(organization_id, 'owner')
    or (has_org_role_at_least(organization_id, 'admin') and role <> 'owner')
  )
  with check (
    has_org_role_at_least(organization_id, 'owner')
    or (has_org_role_at_least(organization_id, 'admin') and role <> 'owner')
  );

create policy organization_members_delete on organization_members for delete
  using (
    has_org_role_at_least(organization_id, 'owner')
    or (has_org_role_at_least(organization_id, 'admin') and role <> 'owner')
  );

create policy knowledge_chunks_insert on knowledge_chunks for insert
  with check (
    has_org_role_at_least(organization_id, 'agent')
    and exists (
      select 1 from knowledge_documents d
      where d.id = knowledge_chunks.document_id
        and d.organization_id = knowledge_chunks.organization_id
    )
  );

create policy knowledge_chunks_delete on knowledge_chunks for delete
  using (
    has_org_role_at_least(organization_id, 'agent')
    and exists (
      select 1 from knowledge_documents d
      where d.id = knowledge_chunks.document_id
        and d.organization_id = knowledge_chunks.organization_id
    )
  );

alter table webhook_events
  add column contact_id uuid references contacts (id) on delete cascade;
create index webhook_events_contact_idx on webhook_events (contact_id);

update webhook_events e
set contact_id = ci.contact_id
from contact_identities ci
where e.provider = 'twilio'
  and ci.organization_id = e.organization_id
  and ci.channel = 'whatsapp'
  and ci.external_id = e.payload ->> 'From'
  and e.contact_id is null;

-- Shared rate-limit buckets for serverless/multi-instance deployments.
create table rate_limit_buckets (
  bucket_key text primary key,
  request_count int not null,
  reset_at timestamptz not null
);
create index rate_limit_buckets_reset_idx on rate_limit_buckets (reset_at);
alter table rate_limit_buckets enable row level security;

create or replace function consume_rate_limit(
  input_key text,
  max_requests int,
  window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  current_reset timestamptz;
begin
  if random() < 0.01 then
    delete from rate_limit_buckets where reset_at < now() - interval '1 day';
  end if;

  insert into rate_limit_buckets (bucket_key, request_count, reset_at)
  values (input_key, 1, now() + make_interval(secs => window_seconds))
  on conflict (bucket_key) do update set
    request_count = case
      when rate_limit_buckets.reset_at <= now() then 1
      else rate_limit_buckets.request_count + 1
    end,
    reset_at = case
      when rate_limit_buckets.reset_at <= now() then now() + make_interval(secs => window_seconds)
      else rate_limit_buckets.reset_at
    end
  returning request_count, reset_at into current_count, current_reset;

  return current_count > max_requests;
end;
$$;

revoke all on function consume_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function consume_rate_limit(text, int, int) to service_role;

create or replace function record_inbound_activity(target_conversation_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update conversations
  set unread_count = unread_count + 1, last_message_at = now()
  where id = target_conversation_id;
$$;

revoke all on function record_inbound_activity(uuid) from public, anon, authenticated;
grant execute on function record_inbound_activity(uuid) to service_role;

-- A provider account/number may route inbound events to only one tenant.
-- Disconnect older duplicate sandbox connections before enforcing it.
with ranked as (
  select id,
    row_number() over (
      partition by channel_type, provider, external_id
      order by updated_at desc, id
    ) as position
  from channel_connections
  where status = 'connected' and external_id is not null
)
update channel_connections c
set status = 'disconnected',
    last_error = 'Disconnected during security hardening: provider identity was connected to another organization.'
from ranked r
where c.id = r.id and r.position > 1;

create unique index channel_connections_active_provider_identity_idx
  on channel_connections (channel_type, provider, external_id)
  where status = 'connected' and external_id is not null;

-- Atomic self-service signup: organization, owner membership, business
-- hours and the first web-chat channel either all exist or none do.
create or replace function create_organization_with_chatbot(
  input_name text,
  input_slug text,
  input_industry text,
  input_default_lang text,
  input_timezone text,
  input_support_email text,
  input_brand_voice text,
  input_open_time time,
  input_close_time time,
  input_allowed_origin text,
  input_welcome_message text,
  input_widget_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if (select count(*) from organizations where created_by = auth.uid()) >= 5 then
    raise exception 'Organization creation limit reached';
  end if;

  insert into organizations (
    name, slug, industry, default_lang, timezone, support_email, brand_voice, created_by
  ) values (
    input_name, input_slug, input_industry, input_default_lang, input_timezone,
    input_support_email, input_brand_voice, auth.uid()
  ) returning id into new_organization_id;

  insert into organization_members (organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner');

  if input_open_time is not null and input_close_time is not null then
    insert into business_hours (organization_id, day_of_week, open_time, close_time, is_closed)
    select new_organization_id, day, input_open_time, input_close_time, day in (0, 6)
    from generate_series(0, 6) as day;
  end if;

  insert into channel_connections (
    organization_id, channel_type, provider, external_id, display_name,
    credentials, status, created_by
  ) values (
    new_organization_id, 'web', 'native', input_widget_key::text,
    'Website chatbot',
    jsonb_build_object(
      'welcomeMessage', input_welcome_message,
      'color', '#4f46e5',
      'allowedOrigins', jsonb_build_array(input_allowed_origin)
    ),
    'connected', auth.uid()
  );

  return new_organization_id;
end;
$$;

revoke all on function create_organization_with_chatbot(text, text, text, text, text, text, text, time, time, text, text, uuid) from public, anon;
grant execute on function create_organization_with_chatbot(text, text, text, text, text, text, text, time, time, text, text, uuid) to authenticated;

-- Enforce tenant consistency across foreign keys. Plain UUID foreign keys
-- guarantee that a parent exists but not that it belongs to the same org.
create or replace function validate_tenant_relationships()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'contact_identities' and not exists (
    select 1 from contacts where id = new.contact_id and organization_id = new.organization_id
  ) then raise exception 'Contact identity tenant mismatch'; end if;

  if tg_table_name = 'conversations' then
    if not exists (select 1 from contacts where id = new.contact_id and organization_id = new.organization_id) then
      raise exception 'Conversation contact tenant mismatch';
    end if;
    if new.channel_connection_id is not null and not exists (
      select 1 from channel_connections where id = new.channel_connection_id and organization_id = new.organization_id
    ) then raise exception 'Conversation channel tenant mismatch'; end if;
    if new.assigned_to is not null and not exists (
      select 1 from organization_members where user_id = new.assigned_to and organization_id = new.organization_id
    ) then raise exception 'Conversation assignee is not an organization member'; end if;
  end if;

  if tg_table_name = 'messages' and not exists (
    select 1 from conversations where id = new.conversation_id and organization_id = new.organization_id
  ) then raise exception 'Message conversation tenant mismatch'; end if;

  if tg_table_name = 'knowledge_chunks' and not exists (
    select 1 from knowledge_documents where id = new.document_id and organization_id = new.organization_id
  ) then raise exception 'Knowledge chunk tenant mismatch'; end if;

  if tg_table_name = 'conversation_notes' and not exists (
    select 1 from conversations where id = new.conversation_id and organization_id = new.organization_id
  ) then raise exception 'Conversation note tenant mismatch'; end if;

  return new;
end;
$$;

create trigger contact_identities_validate_tenant before insert or update on contact_identities
  for each row execute function validate_tenant_relationships();
create trigger conversations_validate_tenant before insert or update on conversations
  for each row execute function validate_tenant_relationships();
create trigger messages_validate_tenant before insert or update on messages
  for each row execute function validate_tenant_relationships();
create trigger knowledge_chunks_validate_tenant before insert or update on knowledge_chunks
  for each row execute function validate_tenant_relationships();
create trigger conversation_notes_validate_tenant before insert or update on conversation_notes
  for each row execute function validate_tenant_relationships();
