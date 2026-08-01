-- Faz 9: in-app notifications, internal (non-customer-facing) notes.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on notifications (user_id, read_at, created_at desc);

alter table notifications enable row level security;

-- A user reads/updates only their own notifications. Inserts are
-- service-role/server-action only (no client insert policy) — a
-- notification is always created on the recipient's behalf by
-- trusted server code, never by the recipient themselves.
create policy notifications_select on notifications for select
  using (user_id = auth.uid());
create policy notifications_update on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table conversation_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  conversation_id uuid not null references conversations (id) on delete cascade,
  author_id uuid references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index conversation_notes_conversation_idx on conversation_notes (conversation_id, created_at);

alter table conversation_notes enable row level security;

create policy conversation_notes_select on conversation_notes for select
  using (is_org_member(organization_id));
create policy conversation_notes_insert on conversation_notes for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy conversation_notes_delete on conversation_notes for delete
  using (has_org_role_at_least(organization_id, 'admin'));
