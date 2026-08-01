-- Instagram OAuth connections (bring-your-own Instagram Business account
-- via Meta). Page access tokens are as sensitive as the Twilio auth
-- tokens in channel_secrets (0016) and get identical treatment: RLS
-- enabled, zero policies for anon/authenticated, service-role only.
create table channel_instagram_credentials (
  channel_connection_id uuid primary key references channel_connections (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  page_id text not null,
  page_access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger channel_instagram_credentials_set_updated_at before update on channel_instagram_credentials
  for each row execute function set_updated_at();
alter table channel_instagram_credentials enable row level security;

create trigger channel_instagram_credentials_validate_tenant before insert or update on channel_instagram_credentials
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

  if tg_table_name = 'channel_instagram_credentials' then
    if not exists (
      select 1 from channel_connections where id = new.channel_connection_id and organization_id = new.organization_id
    ) then raise exception 'Instagram credential tenant mismatch'; end if;
  end if;

  return new;
end;
$$;
