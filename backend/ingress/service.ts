import { randomUUID } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { CoreError } from '../core.js';
import type { AuthorizationState, CommunicationIngressProvider, Connection, ConnectionCapability, ConnectionState, ExternalIdentity, InboundCommunication, ScheduleIngressProvider, ScheduleRecord, SourceAccount } from './contracts.js';
import { providerById } from './provider-registry.js';

type ProviderRegistry = { communication: Map<string, CommunicationIngressProvider>; schedule: Map<string, ScheduleIngressProvider> };
type Hooks = { afterSourceRecordPersisted?: () => void };

const accountFromRow = (row: any): SourceAccount => ({ id: row.id, connectionId: row.connection_id ?? undefined, provider: row.provider, capability: row.capability, displayName: row.display_name, accountIdentifier: row.account_identifier, enabled: row.enabled, connectionState: row.connection_state, cursorState: row.cursor_state ?? {}, selectionMetadata: row.selection_metadata ?? {}, lastAttemptAt: row.last_attempt_at?.toISOString(), lastSuccessfulSyncAt: row.last_successful_sync_at?.toISOString(), lastErrorCode: row.last_error_code ?? undefined });
const connectionFromRow = (row: any): Connection => ({ id: row.id, displayName: row.display_name, provider: row.provider, accountIdentifier: row.account_identifier, enabled: row.enabled, capabilities: row.capabilities ?? [], authorizationState: row.authorization_state, connectionState: row.connection_state, configurationMetadata: row.configuration_metadata ?? {}, lastAttemptAt: row.last_attempt_at?.toISOString(), lastSuccessfulSyncAt: row.last_successful_sync_at?.toISOString(), lastErrorCode: row.last_error_code ?? undefined });
const identity = (value: ExternalIdentity) => ({ value: value.value, displayName: value.displayName, resolutionState: value.resolutionState, canonicalPersonRef: value.canonicalPersonRef });
const json = (value: unknown) => JSON.stringify(value);
const unassigned = { authority: 'INGRESS', external_id: 'unassigned', display_snapshot: 'UNASSIGNED' };
const sourceCapability = (capability: ConnectionCapability) => capability === 'MAIL' ? 'COMMUNICATION' : capability === 'CALENDAR' ? 'SCHEDULE' : 'CONTACTS';

export class IngressService {
  constructor(private readonly db: Pool, private readonly providers: ProviderRegistry, private readonly hooks: Hooks = {}) {}

  async createConnection(input: Omit<Connection, 'id' | 'authorizationState' | 'connectionState'> & { authorizationState?: AuthorizationState; connectionState?: ConnectionState }) {
    if (!providerById(input.provider)) throw new CoreError('INGRESS_PROVIDER_UNKNOWN', 422, 'Provider is not registered');
    const id = randomUUID();
    await this.db.query('insert into director_connections(id,display_name,provider,account_identifier,enabled,capabilities,authorization_state,connection_state,configuration_metadata) values($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, input.displayName, input.provider, input.accountIdentifier, input.enabled, json(input.capabilities), input.authorizationState ?? 'NOT_CONFIGURED', input.connectionState ?? 'UNAVAILABLE', json(input.configurationMetadata ?? {})]);
    return this.getConnection(id);
  }

  async getConnection(id: string) {
    const result = await this.db.query('select * from director_connections where id=$1', [id]);
    if (!result.rowCount) throw new CoreError('NOT_FOUND', 404, 'Connection not found');
    return connectionFromRow(result.rows[0]);
  }

  async listConnections() { return (await this.db.query('select * from director_connections order by created_at')).rows.map(connectionFromRow); }

  async addConnectionCapability(connectionId: string, capability: ConnectionCapability, selectionMetadata: Record<string, unknown> = {}) {
    const connection = await this.getConnection(connectionId);
    if (!connection.capabilities.includes(capability)) throw new CoreError('INGRESS_CAPABILITY_NOT_ENABLED', 422, 'Capability is not enabled for this connection');
    const existing = await this.db.query('select * from director_source_accounts where connection_id=$1 and capability=$2', [connectionId, sourceCapability(capability)]);
    if (existing.rowCount) {
      await this.db.query("update director_source_accounts set enabled=$2,connection_state=case when $2=true and connection_state='DISABLED' then 'UNAVAILABLE' else connection_state end,updated_at=now() where id=$1", [existing.rows[0].id, connection.enabled]);
      return this.getAccount(existing.rows[0].id);
    }
    return this.createSourceAccount({ connectionId, provider: connection.provider, capability: sourceCapability(capability), displayName: `${connection.displayName} ${capability}`, accountIdentifier: connection.accountIdentifier, enabled: connection.enabled, selectionMetadata });
  }

  async updateConnection(id: string, input: Partial<Pick<Connection, 'displayName' | 'enabled' | 'capabilities' | 'configurationMetadata'>>) {
    const existing = await this.getConnection(id);
    const enabled = input.enabled ?? existing.enabled;
    await this.db.query('update director_connections set display_name=$2,enabled=$3,capabilities=$4,configuration_metadata=$5,connection_state=case when $3=false then \'DISABLED\' when connection_state=\'DISABLED\' then \'UNAVAILABLE\' else connection_state end,updated_at=now() where id=$1', [id, input.displayName ?? existing.displayName, enabled, json(input.capabilities ?? existing.capabilities), json(input.configurationMetadata ?? existing.configurationMetadata)]);
    if (!enabled) await this.db.query("update director_source_accounts set enabled=false,connection_state='DISABLED',updated_at=now() where connection_id=$1", [id]);
    if (input.capabilities) await this.db.query("update director_source_accounts set enabled=false,connection_state='DISABLED',updated_at=now() where connection_id=$1 and capability <> all($2::text[])", [id, input.capabilities.map(sourceCapability)]);
    return this.getConnection(id);
  }

  /** Records an operator authorization handoff; provider implementations perform the actual authorization later. */
  async beginAuthorization(id: string) {
    const connection = await this.getConnection(id);
    if (!connection.enabled) throw new CoreError('INGRESS_DISABLED', 409, 'Connection is disabled');
    await this.db.query("update director_connections set authorization_state='PENDING_OPERATOR',connection_state='AUTH_REQUIRED',last_attempt_at=now(),last_error_code='AUTHORIZATION_PENDING',updated_at=now() where id=$1", [id]);
    return this.getConnection(id);
  }

  async requestAuthorization(id: string) {
    const connection = await this.getConnection(id);
    if (!connection.enabled) throw new CoreError('INGRESS_DISABLED', 409, 'Connection is disabled');
    throw new CoreError('PROVIDER_ADAPTER_NOT_IMPLEMENTED', 409, 'Provider authorization is not implemented');
  }

  /** Provider callback/composition seam: only a verified provider flow may mark authorization complete. */
  async confirmAuthorization(id: string) {
    await this.getConnection(id);
    await this.db.query("update director_connections set authorization_state='AUTHORIZED',connection_state='UNAVAILABLE',last_error_code=null,updated_at=now() where id=$1 and enabled=true", [id]);
    return this.getConnection(id);
  }

  /** Local revocation disables all attached source accounts; secret revocation is owned by the configured secret authority. */
  async revokeConnection(id: string) {
    await this.getConnection(id);
    const client = await this.db.connect();
    try {
      await client.query('begin');
      await client.query("update director_connections set enabled=false,authorization_state='REVOKED',connection_state='DISABLED',updated_at=now() where id=$1", [id]);
      await client.query("update director_source_accounts set enabled=false,connection_state='DISABLED',updated_at=now() where connection_id=$1", [id]);
      await client.query('commit');
    } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
    return this.getConnection(id);
  }

  async createSourceAccount(input: Omit<SourceAccount, 'id' | 'connectionState' | 'cursorState'> & { connectionState?: ConnectionState; cursorState?: Record<string, unknown> }) {
    if (input.connectionId) {
      const connection = await this.getConnection(input.connectionId);
      if (connection.provider !== input.provider) throw new CoreError('INGRESS_CONNECTION_PROVIDER_MISMATCH', 422, 'Source account provider must match its connection');
    }
    const id = randomUUID();
    await this.db.query('insert into director_source_accounts(id,connection_id,provider,capability,display_name,account_identifier,enabled,connection_state,cursor_state,selection_metadata) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [id, input.connectionId ?? null, input.provider, input.capability, input.displayName, input.accountIdentifier, input.enabled, input.connectionState ?? 'UNAVAILABLE', json(input.cursorState ?? {}), json(input.selectionMetadata ?? {})]);
    return this.getAccount(id);
  }

  async getAccount(id: string) {
    const result = await this.db.query('select * from director_source_accounts where id=$1', [id]);
    if (!result.rowCount) throw new CoreError('NOT_FOUND', 404, 'Source account not found');
    return accountFromRow(result.rows[0]);
  }

  async listAccounts() { return (await this.db.query('select * from director_source_accounts order by created_at')).rows.map(accountFromRow); }

  async updateSourceAccount(id: string, input: Partial<Pick<SourceAccount, 'displayName' | 'enabled' | 'selectionMetadata'>>) {
    const existing = await this.getAccount(id);
    const enabled = input.enabled ?? existing.enabled;
    await this.db.query("update director_source_accounts set display_name=$2,enabled=$3,selection_metadata=$4,connection_state=case when $3=false then 'DISABLED' when connection_state='DISABLED' then 'UNAVAILABLE' else connection_state end,updated_at=now() where id=$1", [id, input.displayName ?? existing.displayName, enabled, json(input.selectionMetadata ?? existing.selectionMetadata ?? {})]);
    await this.refreshConnectionHealth(existing.connectionId);
    return this.getAccount(id);
  }

  async sync(accountId: string) {
    const account = await this.getAccount(accountId);
    if (!account.enabled || account.connectionState === 'DISABLED') throw new CoreError('INGRESS_DISABLED', 409, 'Source account is disabled');
    if (account.capability === 'CONTACTS') throw new CoreError('INGRESS_CAPABILITY_NOT_IMPLEMENTED', 409, 'Contacts ingress is not implemented in this authority');
    if (account.connectionId) {
      const connection = await this.getConnection(account.connectionId);
      if (!connection.enabled || connection.authorizationState === 'REVOKED') throw new CoreError('INGRESS_DISABLED', 409, 'Connection is disabled');
      if (connection.authorizationState !== 'AUTHORIZED') {
        await this.db.query("update director_source_accounts set connection_state='AUTH_REQUIRED',last_error_code='AUTHORIZATION_REQUIRED',updated_at=now() where id=$1", [account.id]);
        await this.refreshConnectionHealth(account.connectionId);
        throw new CoreError('INGRESS_AUTH_REQUIRED', 503, 'Provider authorization required');
      }
    }
    await this.db.query("update director_source_accounts set last_attempt_at=now(),updated_at=now() where id=$1", [account.id]);
    const provider = account.capability === 'COMMUNICATION' ? this.providers.communication.get(account.provider) : this.providers.schedule.get(account.provider);
    if (!provider) throw new CoreError('INGRESS_PROVIDER_NOT_CONFIGURED', 409, 'Provider is not configured');
    let page;
    try {
      page = account.capability === 'COMMUNICATION'
        ? await (provider as CommunicationIngressProvider).fetchCommunications(account, account.cursorState)
        : await (provider as ScheduleIngressProvider).fetchSchedule(account, account.cursorState);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Provider unavailable';
      const state = /auth|credential|password|unauthor/i.test(message) ? 'AUTH_REQUIRED' : 'DEGRADED';
      await this.db.query('update director_source_accounts set connection_state=$2,last_error_code=$3,updated_at=now() where id=$1', [account.id, state, state === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'PROVIDER_UNAVAILABLE']);
      await this.refreshConnectionHealth(account.connectionId);
      throw new CoreError(state === 'AUTH_REQUIRED' ? 'INGRESS_AUTH_REQUIRED' : 'INGRESS_UNAVAILABLE', 503, state === 'AUTH_REQUIRED' ? 'Provider authorization required' : 'Provider unavailable');
    }

    {
      const client = await this.db.connect();
      try {
        await client.query('begin');
        await client.query('select id from director_source_accounts where id=$1 for update', [account.id]);
        let persisted = 0;
        for (const item of page.items) {
          if (item.sourceAccountId !== account.id) throw new CoreError('INGRESS_INVALID_SOURCE_FACT', 502, 'Provider returned a source fact for a different account');
          persisted += account.capability === 'COMMUNICATION'
            ? await this.persistCommunication(client, item as InboundCommunication)
            : await this.persistSchedule(client, item as ScheduleRecord);
        }
        await client.query("insert into director_ingress_sync_cursors(source_account_id,provider,capability,cursor) values($1,$2,$3,$4) on conflict(source_account_id) do update set cursor=excluded.cursor,updated_at=now()", [account.id, account.provider, account.capability, json(page.nextCursor)]);
        await client.query("update director_source_accounts set cursor_state=$2,connection_state='CONNECTED',last_successful_sync_at=now(),last_error_code=null,updated_at=now() where id=$1", [account.id, json(page.nextCursor)]);
        await client.query('commit');
        await this.refreshConnectionHealth(account.connectionId);
        return { accountId: account.id, persisted, cursor: page.nextCursor };
      } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
    }
  }

  async listCommunications(limit = 50, offset = 0) {
    return (await this.db.query('select id,source_account_id,source_system,source_locator,provider_revision,remote_identity,message_id,references_header,in_reply_to,sender,recipients,subject,received_at,sent_at,flags,content_hash,attachment_metadata,observed_at,provenance,is_current from director_communication_source_records where is_current=true order by observed_at desc limit $1 offset $2', [limit, offset])).rows;
  }

  async listSchedule(limit = 50, offset = 0) {
    return (await this.db.query('select * from director_schedule_source_records where is_current=true order by starts_at nulls last limit $1 offset $2', [limit, offset])).rows;
  }

  async todaySchedule() {
    return (await this.db.query("select * from director_schedule_source_records where is_current=true and is_active=true and ((all_day=true and all_day_date=current_date) or (all_day=false and starts_at >= date_trunc('day', now()) and starts_at < date_trunc('day', now()) + interval '1 day')) order by all_day_date nulls last, starts_at")).rows;
  }

  private async refreshConnectionHealth(connectionId?: string) {
    if (!connectionId) return;
    const state = await this.db.query("select case when bool_and(enabled=false) then 'DISABLED' when bool_or(connection_state='AUTH_REQUIRED') then 'AUTH_REQUIRED' when bool_or(connection_state='DEGRADED') then 'DEGRADED' when bool_or(connection_state='CONNECTED') then 'CONNECTED' else 'UNAVAILABLE' end as connection_state, max(last_attempt_at) as last_attempt_at, max(last_successful_sync_at) as last_successful_sync_at, (array_agg(last_error_code order by updated_at desc) filter (where last_error_code is not null))[1] as last_error_code from director_source_accounts where connection_id=$1", [connectionId]);
    await this.db.query('update director_connections set connection_state=$2,last_attempt_at=$3,last_successful_sync_at=$4,last_error_code=$5,updated_at=now() where id=$1', [connectionId, state.rows[0].connection_state, state.rows[0].last_attempt_at, state.rows[0].last_successful_sync_at, state.rows[0].last_error_code]);
  }

  private async persistCommunication(client: PoolClient, item: InboundCommunication) {
    const prior = await client.query('select id from director_communication_source_records where source_account_id=$1 and source_locator=$2 and is_current=true', [item.sourceAccountId, item.sourceLocator]);
    const inserted = await client.query("insert into director_communication_source_records(id,source_account_id,source_system,source_locator,provider_revision,remote_identity,message_id,references_header,in_reply_to,sender,recipients,subject,received_at,sent_at,flags,normalized_text,content_hash,attachment_metadata,observed_at,provenance) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) on conflict(source_account_id,source_locator,provider_revision) do nothing returning id", [item.id, item.sourceAccountId, item.sourceSystem, item.sourceLocator, item.providerRevision, json(item.remoteMessageIdentity), item.messageId ?? null, json(item.references), item.inReplyTo ?? null, json(identity(item.sender)), json(item.recipients.map(identity)), item.subject, item.receivedAt ?? null, item.sentAt ?? null, json(item.flags), item.normalizedText, item.contentHash, json(item.attachmentMetadata), item.observedAt, json(item.provenance)]);
    if (!inserted.rowCount) return 0;
    await client.query('update director_communication_source_records set is_current=false where source_account_id=$1 and source_locator=$2 and id<>$3', [item.sourceAccountId, item.sourceLocator, item.id]);
    await this.persistIdentities(client, item.sourceAccountId, [item.sender, ...item.recipients]);
    await this.hooks.afterSourceRecordPersisted?.();
    const eventType = prior.rowCount ? 'COMMUNICATION_UPDATED' : 'COMMUNICATION_RECEIVED';
    const idempotencyKey = `ingress:communication:${item.sourceAccountId}:${item.sourceLocator}:${item.providerRevision}`;
    await client.query("insert into director_events(event_id,event_type,occurred_at,source_system,source_reference,project_ref,person_ref,correlation_id,idempotency_key,payload,provenance) values($1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10) on conflict(idempotency_key) do nothing", [randomUUID(), eventType, item.receivedAt ?? item.observedAt, item.sourceSystem, json({ source_account_id: item.sourceAccountId, source_locator: item.sourceLocator, source_record_id: item.id, remote_identity: item.remoteMessageIdentity }), json(unassigned), randomUUID(), idempotencyKey, json({ subject: item.subject, message_id: item.messageId ?? null, content_hash: item.contentHash }), json({ ...item.provenance, factual: true, untrusted_content: true })]);
    return 1;
  }

  private async persistSchedule(client: PoolClient, item: ScheduleRecord) {
    const prior = await client.query('select id from director_schedule_source_records where source_account_id=$1 and source_locator=$2 and is_current=true', [item.sourceAccountId, item.sourceLocator]);
    const active = !['CANCELLED', 'REMOVED'].includes(item.status);
    const inserted = await client.query("insert into director_schedule_source_records(id,source_account_id,source_system,source_locator,calendar_ref,remote_uid,recurrence_id,provider_revision,title,description,location,organizer,attendees,starts_at,ends_at,source_timezone,all_day,all_day_date,recurrence_rule,status,observed_at,provenance,is_active) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) on conflict(source_account_id,source_locator,provider_revision) do nothing returning id", [item.id, item.sourceAccountId, item.sourceSystem, item.sourceLocator, item.calendarRef, item.remoteUid, item.recurrenceId ?? '', item.providerRevision, item.title, item.description ?? null, item.location ?? null, item.organizer ? json(identity(item.organizer)) : null, json(item.attendees.map(identity)), item.startsAt ?? null, item.endsAt ?? null, item.sourceTimezone ?? null, item.allDay, item.allDayDate ?? null, item.recurrenceRule ?? null, item.status, item.observedAt, json(item.provenance), active]);
    if (!inserted.rowCount) return 0;
    await client.query('update director_schedule_source_records set is_current=false where source_account_id=$1 and source_locator=$2 and id<>$3', [item.sourceAccountId, item.sourceLocator, item.id]);
    await this.persistIdentities(client, item.sourceAccountId, [...(item.organizer ? [item.organizer] : []), ...item.attendees]);
    await this.hooks.afterSourceRecordPersisted?.();
    const eventType = item.status === 'CANCELLED' ? 'SCHEDULE_ITEM_CANCELLED' : item.status === 'REMOVED' ? 'SCHEDULE_ITEM_REMOVED' : prior.rowCount ? 'SCHEDULE_ITEM_UPDATED' : 'SCHEDULE_ITEM_OBSERVED';
    const idempotencyKey = `ingress:schedule:${item.sourceAccountId}:${item.sourceLocator}:${item.providerRevision}`;
    await client.query("insert into director_events(event_id,event_type,occurred_at,source_system,source_reference,project_ref,person_ref,correlation_id,idempotency_key,payload,provenance) values($1,$2,$3,$4,$5,$6,null,$7,$8,$9,$10) on conflict(idempotency_key) do nothing", [randomUUID(), eventType, item.startsAt ?? item.observedAt, item.sourceSystem, json({ source_account_id: item.sourceAccountId, source_locator: item.sourceLocator, source_record_id: item.id, calendar_ref: item.calendarRef, remote_uid: item.remoteUid, recurrence_id: item.recurrenceId ?? null }), json(unassigned), randomUUID(), idempotencyKey, json({ title: item.title, status: item.status, all_day: item.allDay }), json({ ...item.provenance, factual: true })]);
    return 1;
  }

  private async persistIdentities(client: PoolClient, sourceAccountId: string, identities: ExternalIdentity[]) {
    for (const external of identities.filter(value => value.value)) {
      await client.query("insert into director_external_identities(id,source_account_id,identity_type,external_value,display_name,resolution_state,canonical_person_ref,first_observed_at,last_observed_at) values($1,$2,'EMAIL',$3,$4,$5,$6,now(),now()) on conflict(source_account_id,identity_type,external_value) do update set display_name=excluded.display_name,resolution_state=excluded.resolution_state,canonical_person_ref=excluded.canonical_person_ref,last_observed_at=now()", [randomUUID(), sourceAccountId, external.value.toLowerCase(), external.displayName ?? null, external.resolutionState, external.canonicalPersonRef ? json(external.canonicalPersonRef) : null]);
    }
  }
}
