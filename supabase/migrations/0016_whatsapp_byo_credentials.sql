-- Per-organization WhatsApp credentials (bring-your-own Twilio account).
-- channel_connections.credentials is readable by every org member (agent+,
-- see channel_connections_select in 0008) and is fine for non-secret widget
-- config, but never for a Twilio Auth Token. Secrets live in their own
-- table with RLS enabled and zero policies for anon/authenticated, so only
-- the service-role admin client (used exclusively by server actions and
-- webhook routes, never exposed to the browser) can ever read or write them.
create table channel_secrets (
  channel_connection_id uuid primary key references channel_connections (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  account_sid text not null,
  auth_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger channel_secrets_set_updated_at before update on channel_secrets
  for each row execute function set_updated_at();
alter table channel_secrets enable row level security;

create trigger channel_secrets_validate_tenant before insert or update on channel_secrets
  for each row execute function validate_tenant_relationships();

create or replace function validate_tenant_relationships()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'contact_identities' then
    if not exists (
      select 1 from contacts where id = new.contact_id and organization_id = new.organization_id
    ) then raise exception 'Contact identity tenant mismatch'; end if;
  end if;

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

  if tg_table_name = 'messages' then
    if not exists (
      select 1 from conversations where id = new.conversation_id and organization_id = new.organization_id
    ) then raise exception 'Message conversation tenant mismatch'; end if;
  end if;

  if tg_table_name = 'knowledge_chunks' then
    if not exists (
      select 1 from knowledge_documents where id = new.document_id and organization_id = new.organization_id
    ) then raise exception 'Knowledge chunk tenant mismatch'; end if;
  end if;

  if tg_table_name = 'conversation_notes' then
    if not exists (
      select 1 from conversations where id = new.conversation_id and organization_id = new.organization_id
    ) then raise exception 'Conversation note tenant mismatch'; end if;
  end if;

  if tg_table_name = 'channel_secrets' then
    if not exists (
      select 1 from channel_connections where id = new.channel_connection_id and organization_id = new.organization_id
    ) then raise exception 'Channel secret tenant mismatch'; end if;
  end if;

  return new;
end;
$$;
