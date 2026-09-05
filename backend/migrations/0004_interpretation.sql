create table if not exists director_interpretation_runs (
  id uuid primary key,
  source_record_id uuid not null references director_communication_source_records(id),
  source_record_type text not null check (source_record_type in ('COMMUNICATION')),
  source_content_hash text not null,
  interpreter_id text not null,
  interpreter_version text not null,
  contract_version text not null,
  status text not null check (status in ('RUNNING','COMPLETED','FAILED','CONFLICT')),
  started_at timestamptz not null,
  completed_at timestamptz,
  failure_code text,
  provenance jsonb not null default '{}',
  unique(source_record_id, source_content_hash, interpreter_id, interpreter_version, contract_version)
);

create table if not exists director_interpretation_candidates (
  id uuid primary key,
  run_id uuid not null references director_interpretation_runs(id),
  kind text not null check (kind in ('DECISION_REQUEST','ACTION_REQUEST','WAITING_EXPECTATION','FYI','NO_ACTION','ABSTAIN')),
  summary text not null,
  question text,
  requested_action text,
  expected_result text,
  deadline_claim text,
  resolved_due_at timestamptz,
  confidence double precision not null check (confidence >= 0 and confidence <= 1),
  validation_status text not null check (validation_status in ('PROPOSED','VALIDATED','REJECTED','ABSTAINED','SUPERSEDED','MATERIALIZED')),
  rejection_reason text,
  provenance jsonb not null default '{}',
  materialized_at timestamptz,
  materialization_key text unique
);

create table if not exists director_interpretation_evidence (
  id uuid primary key,
  candidate_id uuid not null references director_interpretation_candidates(id) on delete cascade,
  source_record_id uuid not null references director_communication_source_records(id),
  source_field text not null check (source_field in ('subject','normalized_text')),
  character_start integer not null check (character_start >= 0),
  character_end integer not null check (character_end >= character_start),
  evidence_hash text not null,
  unique(candidate_id, source_field, character_start, character_end)
);

create index if not exists director_interpretation_runs_source_idx on director_interpretation_runs(source_record_id, started_at desc);
create index if not exists director_interpretation_candidates_run_idx on director_interpretation_candidates(run_id, validation_status);
