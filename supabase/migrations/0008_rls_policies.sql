-- Enable RLS on every tenant table and grant access via the helper
-- functions from 0007. Tables with no INSERT/UPDATE/DELETE policy
-- below are intentionally write-blocked for authenticated users —
-- those are written only by server code using the service-role key
-- (which bypasses RLS entirely), per the "service-role only" rule for
-- webhook/system-generated data (usage events, audit log, billing, etc).

-- ── organizations ─────────────────────────────────────────────────────────
alter table organizations enable row level security;

create policy organizations_select on organizations for select
  using (is_org_member(id));
create policy organizations_insert on organizations for insert
  with check (auth.uid() is not null);
create policy organizations_update on organizations for update
  using (has_org_role_at_least(id, 'admin'))
  with check (has_org_role_at_least(id, 'admin'));
create policy organizations_delete on organizations for delete
  using (has_org_role_at_least(id, 'owner'));

-- ── profiles ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;

create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from organization_members mine
      join organization_members theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );
create policy profiles_insert on profiles for insert
  with check (id = auth.uid());
create policy profiles_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── organization_members ─────────────────────────────────────────────────
alter table organization_members enable row level security;

create policy organization_members_select on organization_members for select
  using (is_org_member(organization_id));
create policy organization_members_insert on organization_members for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy organization_members_update on organization_members for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy organization_members_delete on organization_members for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── invitations (admin+ only; token-based accept flow runs server-side
--    with the service-role key, so it isn't exposed as a client policy) ──
alter table invitations enable row level security;

create policy invitations_select on invitations for select
  using (has_org_role_at_least(organization_id, 'admin'));
create policy invitations_insert on invitations for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy invitations_update on invitations for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy invitations_delete on invitations for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── audit_logs (admin+ read; writes are service-role only) ────────────────
alter table audit_logs enable row level security;

create policy audit_logs_select on audit_logs for select
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── channel_connections (agent+ read, admin+ manage) ───────────────────────
alter table channel_connections enable row level security;

create policy channel_connections_select on channel_connections for select
  using (is_org_member(organization_id));
create policy channel_connections_insert on channel_connections for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy channel_connections_update on channel_connections for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy channel_connections_delete on channel_connections for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── contacts (agent+ manage, viewer reads) ─────────────────────────────────
alter table contacts enable row level security;

create policy contacts_select on contacts for select
  using (is_org_member(organization_id));
create policy contacts_insert on contacts for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy contacts_update on contacts for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy contacts_delete on contacts for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── contact_identities ──────────────────────────────────────────────────
alter table contact_identities enable row level security;

create policy contact_identities_select on contact_identities for select
  using (is_org_member(organization_id));
create policy contact_identities_insert on contact_identities for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy contact_identities_delete on contact_identities for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── conversations (agent+ manage, viewer reads) ────────────────────────────
alter table conversations enable row level security;

create policy conversations_select on conversations for select
  using (is_org_member(organization_id));
create policy conversations_insert on conversations for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy conversations_update on conversations for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy conversations_delete on conversations for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── conversation_assignments ────────────────────────────────────────────
alter table conversation_assignments enable row level security;

create policy conversation_assignments_select on conversation_assignments for select
  using (is_org_member(organization_id));
create policy conversation_assignments_insert on conversation_assignments for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy conversation_assignments_update on conversation_assignments for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));

-- ── messages (agent+ write, viewer reads; provider webhooks write via
--    service role, bypassing RLS, so no separate "system" policy needed) ──
alter table messages enable row level security;

create policy messages_select on messages for select
  using (is_org_member(organization_id));
create policy messages_insert on messages for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy messages_update on messages for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));

-- ── message_attachments ─────────────────────────────────────────────────
alter table message_attachments enable row level security;

create policy message_attachments_select on message_attachments for select
  using (is_org_member(organization_id));
create policy message_attachments_insert on message_attachments for insert
  with check (has_org_role_at_least(organization_id, 'agent'));

-- ── tags / conversation_tags (agent+ manage) ───────────────────────────────
alter table tags enable row level security;

create policy tags_select on tags for select
  using (is_org_member(organization_id));
create policy tags_insert on tags for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy tags_delete on tags for delete
  using (has_org_role_at_least(organization_id, 'agent'));

alter table conversation_tags enable row level security;

create policy conversation_tags_select on conversation_tags for select
  using (is_org_member(organization_id));
create policy conversation_tags_insert on conversation_tags for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy conversation_tags_delete on conversation_tags for delete
  using (has_org_role_at_least(organization_id, 'agent'));

-- ── knowledge base (agent+ authors, admin+ manages sources) ────────────────
alter table knowledge_sources enable row level security;

create policy knowledge_sources_select on knowledge_sources for select
  using (is_org_member(organization_id));
create policy knowledge_sources_insert on knowledge_sources for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy knowledge_sources_update on knowledge_sources for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy knowledge_sources_delete on knowledge_sources for delete
  using (has_org_role_at_least(organization_id, 'admin'));

alter table knowledge_documents enable row level security;

create policy knowledge_documents_select on knowledge_documents for select
  using (is_org_member(organization_id));
create policy knowledge_documents_insert on knowledge_documents for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy knowledge_documents_update on knowledge_documents for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy knowledge_documents_delete on knowledge_documents for delete
  using (has_org_role_at_least(organization_id, 'admin'));

alter table knowledge_chunks enable row level security;

create policy knowledge_chunks_select on knowledge_chunks for select
  using (is_org_member(organization_id));

-- ── AI reply drafts / usage / feedback ─────────────────────────────────────
alter table ai_reply_drafts enable row level security;

create policy ai_reply_drafts_select on ai_reply_drafts for select
  using (is_org_member(organization_id));
create policy ai_reply_drafts_update on ai_reply_drafts for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));

alter table ai_usage_events enable row level security;

create policy ai_usage_events_select on ai_usage_events for select
  using (has_org_role_at_least(organization_id, 'admin'));

alter table ai_feedback enable row level security;

create policy ai_feedback_select on ai_feedback for select
  using (is_org_member(organization_id));
create policy ai_feedback_insert on ai_feedback for insert
  with check (has_org_role_at_least(organization_id, 'agent'));

-- ── automation (admin+ configures rules; run/action history is admin+ read,
--    written by server code with the service-role key) ────────────────────
alter table automation_rules enable row level security;

create policy automation_rules_select on automation_rules for select
  using (is_org_member(organization_id));
create policy automation_rules_insert on automation_rules for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy automation_rules_update on automation_rules for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy automation_rules_delete on automation_rules for delete
  using (has_org_role_at_least(organization_id, 'admin'));

alter table automation_runs enable row level security;

create policy automation_runs_select on automation_runs for select
  using (has_org_role_at_least(organization_id, 'admin'));

alter table automation_actions enable row level security;

create policy automation_actions_select on automation_actions for select
  using (has_org_role_at_least(organization_id, 'admin'));

-- background_jobs: no org-scoped client access at all (system-internal,
-- some rows aren't tenant-scoped) — service-role only.
alter table background_jobs enable row level security;

-- ── business settings (admin+ manage, everyone reads) ──────────────────────
alter table business_hours enable row level security;

create policy business_hours_select on business_hours for select
  using (is_org_member(organization_id));
create policy business_hours_insert on business_hours for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy business_hours_update on business_hours for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy business_hours_delete on business_hours for delete
  using (has_org_role_at_least(organization_id, 'admin'));

alter table saved_replies enable row level security;

create policy saved_replies_select on saved_replies for select
  using (is_org_member(organization_id));
create policy saved_replies_insert on saved_replies for insert
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy saved_replies_update on saved_replies for update
  using (has_org_role_at_least(organization_id, 'agent'))
  with check (has_org_role_at_least(organization_id, 'agent'));
create policy saved_replies_delete on saved_replies for delete
  using (has_org_role_at_least(organization_id, 'agent'));

alter table sla_policies enable row level security;

create policy sla_policies_select on sla_policies for select
  using (is_org_member(organization_id));
create policy sla_policies_insert on sla_policies for insert
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy sla_policies_update on sla_policies for update
  using (has_org_role_at_least(organization_id, 'admin'))
  with check (has_org_role_at_least(organization_id, 'admin'));
create policy sla_policies_delete on sla_policies for delete
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── analytics/metrics (admin+ read; server-written) ────────────────────────
alter table events enable row level security;

create policy events_select on events for select
  using (has_org_role_at_least(organization_id, 'admin'));

alter table daily_metrics enable row level security;

create policy daily_metrics_select on daily_metrics for select
  using (has_org_role_at_least(organization_id, 'admin'));

-- ── billing (admin+ read; all writes are service-role only, driven by
--    signed billing-provider webhooks — never trust the client) ───────────
alter table subscriptions enable row level security;

create policy subscriptions_select on subscriptions for select
  using (has_org_role_at_least(organization_id, 'admin'));

alter table usage_counters enable row level security;

create policy usage_counters_select on usage_counters for select
  using (has_org_role_at_least(organization_id, 'admin'));

-- webhook_events: raw provider payloads, never client-readable.
alter table webhook_events enable row level security;
