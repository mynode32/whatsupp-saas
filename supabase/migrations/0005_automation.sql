-- Automation rule engine.

create table automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  trigger_type text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  priority int not null default 0,
  is_active boolean not null default true,
  respects_business_hours boolean not null default true,
  max_runs_per_conversation int,
  cooldown_seconds int,
  on_failure text not null default 'stop' check (on_failure in ('stop', 'retry', 'ignore')),
  last_run_at timestamptz,
  created_by uuid references profiles (id),
  updated_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger automation_rules_set_updated_at before update on automation_rules
  for each row execute function set_updated_at();
create index automation_rules_org_active_idx on automation_rules (organization_id, is_active);

create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  rule_id uuid not null references automation_rules (id) on delete cascade,
  conversation_id uuid references conversations (id),
  -- e.g. the triggering message id. Same (rule_id, trigger_event_id)
  -- must not run twice — this is the "duplicate event" guard from Faz 6.3.
  trigger_event_id text,
  status text not null default 'success' check (status in ('success', 'failed', 'skipped')),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (rule_id, trigger_event_id)
);
create index automation_runs_org_created_idx on automation_runs (organization_id, created_at desc);

create table automation_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  run_id uuid not null references automation_runs (id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'success' check (status in ('success', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);
create index automation_actions_run_idx on automation_actions (run_id);

-- Generic retry-with-backoff queue backing automations, webhook
-- processing, etc. organization_id is nullable because some jobs
-- (e.g. daily_metrics rollups) are system-wide, not tenant-scoped.
create table background_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed', 'dead_letter')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger background_jobs_set_updated_at before update on background_jobs
  for each row execute function set_updated_at();
create index background_jobs_status_run_after_idx on background_jobs (status, run_after);
