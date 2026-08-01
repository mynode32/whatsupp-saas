-- Fixes 0014's validate_tenant_relationships(): combining a tg_table_name
-- check with an AND'd EXISTS(...) that references another table's column
-- forced Postgres to resolve that column against the row type of whatever
-- table actually fired the trigger, regardless of the AND's left-hand
-- side, because plpgsql must analyze/prepare the whole boolean expression
-- before it can short-circuit at execution time. Only the 'conversations'
-- branch was written as a true nested IF/END IF, which is why it alone
-- worked; every other branch broke inserts into its own table 100% of the
-- time (contact_identities, conversations, messages, knowledge_chunks,
-- conversation_notes) with "record new has no field ...". This rewrites
-- every branch as a nested IF so field references are only ever prepared
-- while executing for their own table.
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

  return new;
end;
$$;
