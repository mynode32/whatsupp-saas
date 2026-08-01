-- Business settings, SLA, metrics, billing, webhook intake log.

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, day_of_week)
);
create trigger business_hours_set_updated_at before update on business_hours
  for each row execute function set_updated_at();

create table saved_replies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  title text not null,
  body text not null,
  shortcut text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger saved_replies_set_updated_at before update on saved_replies
  for each row execute function set_updated_at();

create table sla_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  first_response_target_minutes int not null,
  resolution_target_minutes int,
  respects_business_hours boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sla_policies_set_updated_at before update on sla_policies
  for each row execute function set_updated_at();

-- Generic event log; daily_metrics is the aggregated rollup computed from this.
create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references profiles (id),
  created_at timestamptz not null default now()
);
create index events_org_type_created_idx on events (organization_id, type, created_at desc);

create table daily_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  date date not null,
  metric_key text not null,
  metric_value numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, date, metric_key)
);
create index daily_metrics_org_date_idx on daily_metrics (organization_id, date);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'iyzico', 'paytr')),
  plan_key text not null,
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();

create table usage_counters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  metric_key text not null,
  count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, period_start, metric_key)
);
create trigger usage_counters_set_updated_at before update on usage_counters
  for each row execute function set_updated_at();

-- Raw inbound webhook log (Twilio/Meta/billing). organization_id is
-- nullable because the org isn't known until the payload is parsed
-- and matched to a channel_connection/subscription.
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  provider text not null,
  external_event_id text not null,
  payload jsonb not null,
  status text not null default 'received' check (status in ('received', 'processing', 'processed', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);
create index webhook_events_status_idx on webhook_events (status, received_at);
