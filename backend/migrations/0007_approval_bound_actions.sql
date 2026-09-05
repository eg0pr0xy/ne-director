alter table director_connections add column if not exists authorization_scopes jsonb not null default '[]';

create table if not exists director_external_actions (
  id uuid primary key, action_type text not null check (action_type in ('CALENDAR_EVENT_CREATE')), action_version integer not null default 1,
  owning_agent_id text not null, capability_id text not null, provider_connection_id uuid not null references director_connections(id),
  source_work_item_id uuid references director_agent_work_items(id), source_artifact_id uuid references director_agent_work_artifacts(id),
  context_scope jsonb not null default '{}', payload jsonb not null, payload_hash text not null, approval_requirement text not null check (approval_requirement='APPROVAL_REQUIRED'),
  status text not null check (status in ('PROPOSED','AWAITING_APPROVAL','APPROVED','EXECUTING','SUCCEEDED','FAILED','CANCELLED','SUPERSEDED','EXPIRED','OUTCOME_UNKNOWN','BLOCKED_POLICY','BLOCKED_CAPABILITY')),
  created_by jsonb not null, created_at timestamptz not null default now(), approved_at timestamptz, execution_started_at timestamptz, succeeded_at timestamptz, expires_at timestamptz,
  provider_idempotency_key text not null unique, failure_code text, lease_owner text, lease_expires_at timestamptz, provenance jsonb not null
);
create table if not exists director_external_action_approvals (
  id uuid primary key, action_id uuid not null references director_external_actions(id), action_version integer not null, payload_hash text not null,
  operator_actor jsonb not null, decision text not null check (decision in ('APPROVE','REJECT')), decided_at timestamptz not null default now(), rationale text, correlation_id uuid not null,
  provenance jsonb not null, unique(action_id, action_version)
);
create table if not exists director_provider_receipts (
  id uuid primary key, action_id uuid not null references director_external_actions(id), action_version integer not null, provider text not null,
  connection_id uuid not null references director_connections(id), remote_event_id text not null, remote_calendar_id text not null, provider_revision text, provider_status text,
  executed_at timestamptz not null, payload_hash text not null, provider_request_correlation text, provenance jsonb not null, unique(action_id, action_version), unique(provider, connection_id, remote_calendar_id, remote_event_id)
);
create table if not exists director_external_action_events (
  id uuid primary key, action_id uuid not null references director_external_actions(id), event_type text not null,
  occurred_at timestamptz not null default now(), actor jsonb, detail jsonb not null default '{}', correlation_id uuid not null, provenance jsonb not null
);
create index if not exists director_external_actions_claim_idx on director_external_actions(status, lease_expires_at, created_at);
create index if not exists director_external_action_events_action_idx on director_external_action_events(action_id, occurred_at);
