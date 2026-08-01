-- Knowledge base and AI reply generation.

create table knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  type text not null check (type in ('manual', 'url', 'pdf', 'txt', 'docx', 'csv')),
  title text not null,
  source_url text,
  file_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  error_message text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger knowledge_sources_set_updated_at before update on knowledge_sources
  for each row execute function set_updated_at();

create table knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  source_id uuid references knowledge_sources (id) on delete set null,
  title text not null,
  content text not null default '',
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  updated_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger knowledge_documents_set_updated_at before update on knowledge_documents
  for each row execute function set_updated_at();
create index knowledge_documents_org_status_idx on knowledge_documents (organization_id, status);

-- MVP retrieval: PostgreSQL full-text search (ADR: docs/adr — semantic
-- search via pgvector is a deliberate later upgrade, not day-one scope).
create table knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  document_id uuid not null references knowledge_documents (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  created_at timestamptz not null default now()
);
create index knowledge_chunks_search_idx on knowledge_chunks using gin (search_vector);
create index knowledge_chunks_org_idx on knowledge_chunks (organization_id);

create table ai_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  message_id uuid references messages (id),
  draft text not null,
  citations jsonb not null default '[]'::jsonb,
  confidence numeric,
  needs_human boolean not null default false,
  reason text,
  detected_intent text,
  sensitive_data_detected boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'edited', 'rejected', 'sent')),
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index ai_reply_drafts_conversation_idx on ai_reply_drafts (conversation_id, created_at desc);

create table ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid references conversations (id),
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  latency_ms int,
  cost_usd numeric(10, 6),
  created_at timestamptz not null default now()
);
create index ai_usage_events_org_created_idx on ai_usage_events (organization_id, created_at desc);

create table ai_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  draft_id uuid not null references ai_reply_drafts (id) on delete cascade,
  rating text not null check (rating in ('up', 'down')),
  comment text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
