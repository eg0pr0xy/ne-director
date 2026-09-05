create table if not exists director_agent_trigger_occurrences (
  id uuid primary key, trigger_type text not null, trigger_version text not null, trigger_key text not null unique,
  source_type text, source_ref jsonb not null default '{}', source_revision text, due_at timestamptz, observed_at timestamptz not null,
  status text not null check (status in ('PENDING','CONSUMED','SUPPRESSED','SUPERSEDED')), provenance jsonb not null, created_at timestamptz not null default now()
);
create table if not exists director_agent_work_items (
  id uuid primary key, work_type text not null, work_version text not null, trigger_occurrence_id uuid references director_agent_trigger_occurrences(id),
  parent_work_item_id uuid references director_agent_work_items(id), owning_agent_id text not null, assigned_agent_id text,
  status text not null check (status in ('QUEUED','WAITING_FOR_DELEGATION','RUNNING','BLOCKED_POLICY','BLOCKED_CAPABILITY','COMPLETED','FAILED','CANCELLED','SUPERSEDED')),
  priority integer not null default 50, subject_type text, subject_ref jsonb not null default '{}', idempotency_key text not null unique,
  required_capabilities jsonb not null default '[]', created_at timestamptz not null default now(), available_at timestamptz not null default now(), started_at timestamptz,
  completed_at timestamptz, failed_at timestamptz, blocked_at timestamptz, attempt_count integer not null default 0, max_attempts integer not null default 3,
  lease_owner text, lease_expires_at timestamptz, policy_snapshot_hash text, result_artifact_id uuid, failure_code text, provenance jsonb not null default '{}'
);
create table if not exists director_agent_delegations (
  id uuid primary key, work_item_id uuid not null references director_agent_work_items(id), delegating_agent_id text not null, receiving_agent_id text not null,
  reason text not null, required_work_type text not null, policy_decision jsonb not null, created_at timestamptz not null default now(), provenance jsonb not null
);
create table if not exists director_agent_work_artifacts (
  id uuid primary key, work_item_id uuid not null unique references director_agent_work_items(id), artifact_type text not null, artifact_version text not null,
  structured_content jsonb not null, content_hash text not null, created_at timestamptz not null default now(), superseded_at timestamptz, provenance jsonb not null
);
alter table director_agent_work_items add constraint director_agent_work_items_artifact_fk foreign key(result_artifact_id) references director_agent_work_artifacts(id) deferrable initially deferred;
create table if not exists director_agent_runtime_events (
  id uuid primary key, work_item_id uuid references director_agent_work_items(id), trigger_occurrence_id uuid references director_agent_trigger_occurrences(id),
  event_type text not null, occurred_at timestamptz not null default now(), detail jsonb not null default '{}', provenance jsonb not null
);
create table if not exists director_agent_runtime_cursors (key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now());
create index if not exists director_agent_work_claim_idx on director_agent_work_items(status, available_at, lease_expires_at);
create index if not exists director_agent_runtime_events_work_idx on director_agent_runtime_events(work_item_id, occurred_at);
