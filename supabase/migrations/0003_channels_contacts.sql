-- Channels, contacts and the unified conversation/message model.

create table channel_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  channel_type text not null check (channel_type in ('whatsapp', 'instagram', 'web')),
  provider text not null check (provider in ('twilio', 'meta', 'native')),
  external_id text, -- phone number / IG page id / widget key
  display_name text,
  -- Faz 3 wires real credential storage (Supabase Vault or equivalent
  -- encryption at rest); this column exists now so the schema shape is
  -- stable, but nothing writes plaintext secrets into it.
  credentials jsonb not null default '{}'::jsonb,
  status text not null default 'disconnected' check (status in ('disconnected', 'connected', 'error')),
  last_event_at timestamptz,
  last_error text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger channel_connections_set_updated_at before update on channel_connections
  for each row execute function set_updated_at();
create unique index channel_connections_org_channel_external_idx
  on channel_connections (organization_id, channel_type, external_id)
  where external_id is not null;

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  display_name text,
  primary_channel text check (primary_channel in ('whatsapp', 'instagram', 'web')),
  locale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contacts_set_updated_at before update on contacts
  for each row execute function set_updated_at();
create index contacts_org_idx on contacts (organization_id);

-- One contact can be reached via several provider identities (WhatsApp
-- number, IG-scoped id, web session). Lookup on inbound webhooks keys
-- off (organization_id, channel, external_id).
create table contact_identities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'instagram', 'web')),
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, channel, external_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  channel_connection_id uuid references channel_connections (id),
  status text not null default 'open' check (status in ('open', 'pending', 'resolved')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  assigned_to uuid references profiles (id),
  unread_count int not null default 0,
  last_message_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger conversations_set_updated_at before update on conversations
  for each row execute function set_updated_at();
create index conversations_org_status_idx on conversations (organization_id, status, last_message_at desc);
create index conversations_org_assigned_idx on conversations (organization_id, assigned_to);

-- History of assignment changes (who assigned/unassigned whom, when) —
-- separate from conversations.assigned_to, which is just current state.
create table conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  assigned_to uuid not null references profiles (id),
  assigned_by uuid references profiles (id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);
create index conversation_assignments_conv_idx on conversation_assignments (conversation_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('contact', 'agent', 'ai', 'system')),
  sender_id uuid references profiles (id),
  body text,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'delivered', 'read', 'failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  error_reason text,
  created_at timestamptz not null default now(),
  -- Idempotency key for inbound/outbound provider webhooks (Faz 3.2/3.3):
  -- a retried webhook with the same provider_message_id must not create
  -- a duplicate row.
  unique (organization_id, provider_message_id)
);
create index messages_conversation_idx on messages (conversation_id, created_at);

create table message_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  message_id uuid not null references messages (id) on delete cascade,
  url text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index message_attachments_message_idx on message_attachments (message_id);

create table tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table conversation_tags (
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, tag_id)
);
