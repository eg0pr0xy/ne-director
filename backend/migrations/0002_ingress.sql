create table if not exists director_source_accounts (
  id uuid primary key,
  provider text not null,
  capability text not null check (capability in ('COMMUNICATION','SCHEDULE')),
  display_name text not null,
  account_identifier text not null,
  enabled boolean not null default true,
  connection_state text not null check (connection_state in ('CONNECTED','DEGRADED','AUTH_REQUIRED','DISABLED','UNAVAILABLE')),
  last_attempt_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error_code text,
  cursor_state jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, capability, account_identifier)
);

create table if not exists director_communication_source_records (
  id uuid primary key,
  source_account_id uuid not null references director_source_accounts(id),
  source_system text not null,
  source_locator text not null,
  provider_revision text not null,
  remote_identity jsonb not null,
  message_id text,
  references_header jsonb not null default '[]',
  in_reply_to text,
  sender jsonb not null,
  recipients jsonb not null default '[]',
  subject text not null,
  received_at timestamptz,
  sent_at timestamptz,
  flags jsonb not null default '[]',
  normalized_text text not null,
  content_hash text not null,
  attachment_metadata jsonb not null default '[]',
  observed_at timestamptz not null,
  provenance jsonb not null,
  is_current boolean not null default true,
  unique(source_account_id, source_locator, provider_revision)
);

create table if not exists director_schedule_source_records (
  id uuid primary key,
  source_account_id uuid not null references director_source_accounts(id),
  source_system text not null,
  source_locator text not null,
  calendar_ref text not null,
  remote_uid text not null,
  recurrence_id text not null default '',
  provider_revision text not null,
  title text not null,
  description text,
  location text,
  organizer jsonb,
  attendees jsonb not null default '[]',
  starts_at timestamptz,
  ends_at timestamptz,
  source_timezone text,
  all_day boolean not null default false,
  all_day_date date,
  recurrence_rule text,
  status text not null,
  observed_at timestamptz not null,
  provenance jsonb not null,
  is_current boolean not null default true,
  is_active boolean not null default true,
  unique(source_account_id, source_locator, provider_revision)
);

create table if not exists director_ingress_sync_cursors (
  source_account_id uuid primary key references director_source_accounts(id),
  provider text not null,
  capability text not null,
  cursor jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists director_external_identities (
  id uuid primary key,
  source_account_id uuid not null references director_source_accounts(id),
  identity_type text not null,
  external_value text not null,
  display_name text,
  resolution_state text not null check (resolution_state in ('RESOLVED','UNRESOLVED','AMBIGUOUS')),
  canonical_person_ref jsonb,
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  unique(source_account_id, identity_type, external_value)
);

create index if not exists director_schedule_source_records_today_idx on director_schedule_source_records(is_current, is_active, starts_at);
create index if not exists director_communication_source_records_account_idx on director_communication_source_records(source_account_id, observed_at desc);
