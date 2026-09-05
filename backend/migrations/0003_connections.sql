create table if not exists director_connections (
  id uuid primary key,
  display_name text not null,
  provider text not null,
  account_identifier text not null,
  enabled boolean not null default true,
  capabilities jsonb not null default '[]',
  authorization_state text not null check (authorization_state in ('NOT_CONFIGURED','PENDING_OPERATOR','AUTHORIZED','REVOKED')),
  connection_state text not null check (connection_state in ('CONNECTED','DEGRADED','AUTH_REQUIRED','DISABLED','UNAVAILABLE')),
  configuration_metadata jsonb not null default '{}',
  last_attempt_at timestamptz,
  last_successful_sync_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table director_source_accounts add column if not exists connection_id uuid references director_connections(id);
alter table director_source_accounts add column if not exists selection_metadata jsonb not null default '{}';
alter table director_source_accounts drop constraint if exists director_source_accounts_capability_check;
alter table director_source_accounts add constraint director_source_accounts_capability_check check (capability in ('COMMUNICATION','SCHEDULE','CONTACTS'));
alter table director_source_accounts drop constraint if exists director_source_accounts_provider_capability_account_identifier_key;
alter table director_source_accounts add constraint director_source_accounts_connection_capability_account_identifier_key unique(connection_id, capability, account_identifier);

create index if not exists director_source_accounts_connection_idx on director_source_accounts(connection_id, capability);
