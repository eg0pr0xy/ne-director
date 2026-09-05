create table if not exists director_operator_controls (
  singleton boolean primary key default true check (singleton),
  global_autonomy jsonb not null,
  chief_of_staff jsonb not null,
  global_pause boolean not null default false,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists director_agent_operator_policies (
  agent_id text primary key check (agent_id in ('CHIEF_OF_STAFF','CALENDAR_TRAVEL','COMMUNICATION','PROJECT_DOCUMENT','PRODUCTION_LIAISON','RESEARCH','PERSONAL_LOGISTICS')),
  status text not null check (status in ('ACTIVE','PAUSED')),
  delegation_mode text not null check (delegation_mode in ('MANUAL_ONLY','AUTOMATIC_WHEN_ALLOWED')),
  model_strategy text not null check (model_strategy in ('AUTOMATIC','LOCAL_ONLY','PRIVATE_ONLY','HIGHEST_QUALITY')),
  version integer not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists director_agent_capability_overrides (
  agent_id text not null references director_agent_operator_policies(agent_id) on delete cascade,
  capability_id text not null,
  permission text not null check (permission in ('SUGGEST_ONLY','APPROVAL_REQUIRED','ALLOWED')),
  updated_at timestamptz not null default now(),
  primary key(agent_id, capability_id)
);
create table if not exists director_agent_source_scope_overrides (
  agent_id text not null references director_agent_operator_policies(agent_id) on delete cascade,
  source_scope text not null,
  access_level text not null check (access_level in ('NONE','CONTEXT_ONLY','READ')),
  updated_at timestamptz not null default now(),
  primary key(agent_id, source_scope)
);
create table if not exists director_agent_policy_events (
  id uuid primary key,
  occurred_at timestamptz not null default now(),
  actor jsonb not null,
  event_type text not null,
  agent_id text,
  policy_key text not null,
  previous_value jsonb,
  new_value jsonb,
  correlation_id uuid not null,
  provenance jsonb not null
);
create index if not exists director_agent_policy_events_occurred_idx on director_agent_policy_events(occurred_at desc);
