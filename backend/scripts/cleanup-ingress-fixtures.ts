import 'dotenv/config';
import { pool } from '../persistence/db.js';
import { isOpaqueSecretReference, localDevelopmentSecretStore } from '../secrets/store.js';

const candidates = await pool.query(`
  select c.id,c.display_name,c.provider,c.account_identifier,c.configuration_metadata,
    coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[]) as source_capabilities
  from director_connections c
  left join director_source_accounts sa on sa.connection_id=c.id
  where (
      (c.display_name='Marcus Private' and c.provider='ICLOUD' and c.account_identifier='marcus@example.test')
      or (c.display_name='NE Work' and c.provider='MICROSOFT_365' and c.account_identifier='marcus@ne.example.test')
      or (c.display_name='Shared Production' and c.provider='GOOGLE' and c.account_identifier='production@example.test')
      or (c.display_name='Google Private' and c.provider='GOOGLE' and c.account_identifier='private@example.test')
      or (c.display_name='Google Shared' and c.provider='GOOGLE' and c.account_identifier='shared@example.test')
      or (c.display_name='Google Failed Secret' and c.provider='GOOGLE' and c.account_identifier='failed@example.test')
    )
  group by c.id,c.display_name,c.provider,c.account_identifier,c.configuration_metadata
  having (c.display_name='Marcus Private' and c.configuration_metadata->>'googleRefreshTokenSecretRef' is null and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array['COMMUNICATION','CONTACTS','SCHEDULE']::text[])
      or (c.display_name='NE Work' and c.configuration_metadata->>'googleRefreshTokenSecretRef' is null and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array['COMMUNICATION','SCHEDULE']::text[])
      or (c.display_name='Shared Production' and c.configuration_metadata->>'googleRefreshTokenSecretRef' is null and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array['SCHEDULE']::text[])
      or (c.display_name='Google Private' and c.capabilities='["MAIL"]'::jsonb and c.authorization_state='REVOKED' and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array[]::text[])
      or (c.display_name='Google Shared' and c.capabilities='["CALENDAR"]'::jsonb and c.authorization_state='AUTHORIZED' and c.configuration_metadata->>'googleRefreshTokenSecretRef' like 'secret://local-development/windows-dpapi/%' and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array[]::text[])
      or (c.display_name='Google Failed Secret' and c.capabilities='["MAIL"]'::jsonb and c.authorization_state='PENDING_OPERATOR' and coalesce(array_agg(sa.capability order by sa.capability) filter (where sa.id is not null), array[]::text[])=array[]::text[])
`);

// These rows are created only by the isolated proof harness.  Keep the proof
// predicate exact: no real connected account can qualify by display name alone.
const standaloneCandidates = await pool.query(`
  select id,display_name,provider,capability,account_identifier
  from director_source_accounts
  where connection_id is null and (
    (display_name='Fixture Mail' and provider='FAKE_STANDARD' and capability='COMMUNICATION' and account_identifier='fixture-mail')
    or (display_name='Fixture Calendar' and provider='FAKE_STANDARD' and capability='SCHEDULE' and account_identifier='fixture-calendar')
    or (display_name='Fault fixture' and provider='FAULT_STANDARD' and capability='COMMUNICATION' and account_identifier='fault-mail')
    or (display_name='Foreign fixture' and provider='FOREIGN_STANDARD' and capability='COMMUNICATION' and account_identifier='foreign-mail')
  )
`);

const confirmed = process.argv.includes('--confirm');
console.log(JSON.stringify({ mode: confirmed ? 'CONFIRM' : 'DRY_RUN', candidates: candidates.rows.map(row => ({ displayName: row.display_name, provider: row.provider, accountIdentifier: row.account_identifier, sourceCapabilities: row.source_capabilities, hasOpaqueSecretReference: isOpaqueSecretReference(row.configuration_metadata?.googleRefreshTokenSecretRef) })), standaloneCandidates: standaloneCandidates.rows.map(row => ({ displayName: row.display_name, provider: row.provider, capability: row.capability, accountIdentifier: row.account_identifier })) }));
if (!confirmed || (candidates.rows.length === 0 && standaloneCandidates.rows.length === 0)) { await pool.end(); process.exit(0); }

const connectionIds = candidates.rows.map(row => row.id);
const sourceAccounts = await pool.query('select id from director_source_accounts where connection_id = any($1::uuid[])', [connectionIds]);
const sourceAccountIds = [...sourceAccounts.rows.map(row => row.id), ...standaloneCandidates.rows.map(row => row.id)];
const client = await pool.connect();
try {
  await client.query('begin');
  await client.query('delete from director_external_identities where source_account_id = any($1::uuid[])', [sourceAccountIds]);
  await client.query('delete from director_ingress_sync_cursors where source_account_id = any($1::uuid[])', [sourceAccountIds]);
  await client.query('delete from director_communication_source_records where source_account_id = any($1::uuid[])', [sourceAccountIds]);
  await client.query('delete from director_schedule_source_records where source_account_id = any($1::uuid[])', [sourceAccountIds]);
  await client.query("delete from director_events where source_reference->>'source_account_id' = any($1::text[])", [sourceAccountIds]);
  await client.query('delete from director_source_accounts where id = any($1::uuid[])', [sourceAccountIds]);
  await client.query('delete from director_connections where id = any($1::uuid[])', [connectionIds]);
  await client.query('commit');
  const secretStore = localDevelopmentSecretStore(); const references = candidates.rows.map(row => row.configuration_metadata?.googleRefreshTokenSecretRef).filter(isOpaqueSecretReference).filter(reference => reference.startsWith('secret://'));
  await Promise.all(references.map(reference => secretStore.delete(reference).catch(() => undefined)));
  console.log(JSON.stringify({ deletedConnections: connectionIds.length, deletedSourceAccounts: sourceAccountIds.length, deletedStandaloneProofAccounts: standaloneCandidates.rows.length }));
} catch (error) { await client.query('rollback'); throw error; } finally { client.release(); await pool.end(); }
