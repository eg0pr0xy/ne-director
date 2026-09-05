import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { AgentOperatorControlService } from '../agents/service.js';
import { CoreError } from '../core.js';
import { migrateDatabase } from '../persistence/migration-runner.js';
import { createProofPool } from '../persistence/proof-db.js';
import { AgentRuntimeRunner } from '../runtime/service.js';
import { createDirectorApp } from '../server.js';

class FakeClock { constructor(public at: Date) {} now() { return new Date(this.at); } set(value: Date) { this.at = value; } }
const pool = createProofPool();
await migrateDatabase(pool);
await pool.query('truncate director_agent_runtime_events, director_agent_delegations, director_agent_work_artifacts, director_agent_work_items, director_agent_trigger_occurrences, director_agent_runtime_cursors, director_agent_policy_events, director_agent_source_scope_overrides, director_agent_capability_overrides, director_agent_operator_policies, director_operator_controls, director_schedule_source_records, director_source_accounts, director_open_loops, director_decisions, director_obligations, director_timeline, director_events cascade');

const controls = new AgentOperatorControlService(pool);
const clock = new FakeClock(new Date('2026-09-05T08:29:00.000Z'));
const calendarAccount = randomUUID();
await pool.query("insert into director_source_accounts(id,provider,capability,display_name,account_identifier,enabled,connection_state) values($1,'GOOGLE','SCHEDULE','Runtime proof calendar','runtime-proof-calendar',true,'CONNECTED')", [calendarAccount]);
const updateControls = async (patch: any) => { const current = await controls.getControls(); return controls.updateControls({ version: current.version, ...patch }); };
const updateCalendarPolicy = async (patch: any) => { const agent = await controls.getAgent('CALENDAR_TRAVEL'); return controls.updateAgentPolicy('CALENDAR_TRAVEL', { version: agent.operatorPolicy.version, ...patch }); };
await updateControls({ chiefOfStaff: { autoMeetingPrep: true, meetingPrepMinutes: 30, dailyBrief: false, endOfDayReview: false }, globalPause: false });
await updateCalendarPolicy({ status: 'ACTIVE', delegationMode: 'AUTOMATIC_WHEN_ALLOWED' });

const insertMeeting = async (id: string, revision: string, startsAt: Date, status = 'CONFIRMED') => pool.query("insert into director_schedule_source_records(id,source_account_id,source_system,source_locator,calendar_ref,remote_uid,provider_revision,title,attendees,starts_at,ends_at,source_timezone,all_day,status,observed_at,provenance,is_current,is_active) values($1,$2,'PROOF',$3,'primary',$4,$5,$6,'[]',$7,$8,'Europe/Berlin',false,$9,$10,'{}',true,true)", [id, calendarAccount, `runtime:${id}`, id, revision, `Proof meeting ${id}`, startsAt, new Date(startsAt.getTime() + 3_600_000), status, clock.now()]);
const count = async (table: string, where = 'true') => Number((await pool.query(`select count(*)::int as count from ${table} where ${where}`)).rows[0].count);
const runner = new AgentRuntimeRunner(pool, clock, 'proof-primary');

// Golden path: no work before T-30, then exactly one durable chain despite 100 ticks.
const goldenMeeting = randomUUID(); const goldenStart = new Date(clock.now().getTime() + 31 * 60_000);
await insertMeeting(goldenMeeting, 'A', goldenStart);
await runner.tick(clock.now(), true);
assert.equal(await count('director_agent_work_items'), 0);
clock.set(new Date(goldenStart.getTime() - 30 * 60_000));
for (let index = 0; index < 100; index += 1) await runner.tick(clock.now(), true);
assert.equal(await count('director_agent_trigger_occurrences'), 1);
assert.equal(await count('director_agent_work_items'), 1);
assert.equal(await count('director_agent_delegations'), 1);
assert.equal(await count('director_agent_work_artifacts'), 1);
const goldenWork = (await pool.query('select * from director_agent_work_items')).rows[0];
assert.equal(goldenWork.assigned_agent_id, 'CALENDAR_TRAVEL'); assert.equal(goldenWork.status, 'COMPLETED');
assert.equal(await count('director_agent_runtime_events', "event_type='WORK_COMPLETED'"), 1);
assert.equal((await pool.query('select structured_content from director_agent_work_artifacts')).rows[0].structured_content.externalActions, 'NONE');

// Manual delegation remains durable but cannot execute itself.
await updateCalendarPolicy({ delegationMode: 'MANUAL_ONLY' });
const manualMeeting = randomUUID(); const manualStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(manualMeeting, 'A', manualStart); clock.set(manualStart); await runner.tick(clock.now(), true);
const manualWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [manualMeeting])).rows[0];
assert.equal(manualWork.status, 'WAITING_FOR_DELEGATION'); assert.equal(await count('director_agent_work_artifacts', "work_item_id='" + manualWork.id + "'"), 0);

// Global pause blocks creation/consumption, then resumes the same semantic work once.
await updateCalendarPolicy({ delegationMode: 'AUTOMATIC_WHEN_ALLOWED' });
const pausedMeeting = randomUUID(); const pausedStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(pausedMeeting, 'A', pausedStart);
await updateControls({ globalPause: true }); clock.set(pausedStart); assert.equal((await runner.tick(clock.now(), true)).state, 'PAUSED');
assert.equal(await count('director_agent_work_items', `subject_ref->>'scheduleRecordId'='${pausedMeeting}'`), 0);
await updateControls({ globalPause: false }); await runner.tick(clock.now(), true);
assert.equal(await count('director_agent_work_artifacts', `work_item_id in (select id from director_agent_work_items where subject_ref->>'scheduleRecordId'='${pausedMeeting}')`), 1);

// The final authority check prevents result publication if the operator pauses during execution.
const revokedMeeting = randomUUID(); const revokedStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(revokedMeeting, 'A', revokedStart); clock.set(revokedStart);
const revokingRunner = new AgentRuntimeRunner(pool, clock, 'proof-revocation', async () => { await updateControls({ globalPause: true }); });
await revokingRunner.tick(clock.now(), true); await updateControls({ globalPause: false });
const revokedWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [revokedMeeting])).rows[0];
assert.equal(revokedWork.status, 'BLOCKED_POLICY'); assert.equal(await count('director_agent_work_artifacts', `work_item_id='${revokedWork.id}'`), 0);

// A live connection loss blocks, recovery safely requeues and completes exactly once.
const disconnectedMeeting = randomUUID(); const disconnectedStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(disconnectedMeeting, 'A', disconnectedStart); clock.set(disconnectedStart);
await pool.query("update director_source_accounts set connection_state='DEGRADED' where id=$1", [calendarAccount]); await runner.tick(clock.now(), true);
const disconnectedWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [disconnectedMeeting])).rows[0]; assert.equal(disconnectedWork.status, 'BLOCKED_CAPABILITY');
await pool.query("update director_source_accounts set connection_state='CONNECTED' where id=$1", [calendarAccount]); await runner.tick(clock.now(), true);
assert.equal((await pool.query('select status from director_agent_work_items where id=$1', [disconnectedWork.id])).rows[0].status, 'COMPLETED'); assert.equal(await count('director_agent_work_artifacts', `work_item_id='${disconnectedWork.id}'`), 1);

// A transient internal executor failure gets bounded backoff and a single successful retry.
const retryMeeting = randomUUID(); const retryStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(retryMeeting, 'A', retryStart); clock.set(retryStart); let firstAttempt = true;
const retryRunner = new AgentRuntimeRunner(pool, clock, 'proof-retry', async () => { if (firstAttempt) { firstAttempt = false; throw new Error('controlled transient failure'); } });
await retryRunner.tick(clock.now(), true); const retryWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [retryMeeting])).rows[0]; assert.equal(retryWork.status, 'QUEUED'); assert.equal(retryWork.attempt_count, 1); clock.set(new Date(clock.now().getTime() + 1_000)); await retryRunner.tick(clock.now(), true); assert.equal((await pool.query('select status,attempt_count from director_agent_work_items where id=$1', [retryWork.id])).rows[0].status, 'COMPLETED'); assert.equal(await count('director_agent_runtime_events', `work_item_id='${retryWork.id}' and event_type='WORK_RETRY_SCHEDULED'`), 1);

// Calendar A is superseded by B; cancellation cannot generate a completed current brief.
await updateCalendarPolicy({ delegationMode: 'MANUAL_ONLY' });
const revisedMeeting = randomUUID(); const revisedStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(revisedMeeting, 'A', revisedStart); clock.set(revisedStart); await runner.tick(clock.now(), true);
await pool.query('update director_schedule_source_records set is_current=false,is_active=false where id=$1 and provider_revision=$2', [revisedMeeting, 'A']);
await pool.query("update director_schedule_source_records set provider_revision='B',is_current=true,is_active=true where id=$1 and provider_revision='A'", [revisedMeeting]);
await updateCalendarPolicy({ delegationMode: 'AUTOMATIC_WHEN_ALLOWED' }); await runner.tick(clock.now(), true);
const revisedWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1 order by created_at", [revisedMeeting])).rows;
assert.equal(revisedWork[0].status, 'SUPERSEDED'); assert.equal(revisedWork.some((work: any) => work.status === 'COMPLETED'), true);
const cancelledMeeting = randomUUID(); const cancelledStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(cancelledMeeting, 'A', cancelledStart); clock.set(cancelledStart); await updateCalendarPolicy({ delegationMode: 'MANUAL_ONLY' }); await runner.tick(clock.now(), true); await pool.query("update director_schedule_source_records set status='CANCELLED',is_active=false where id=$1", [cancelledMeeting]); await updateCalendarPolicy({ delegationMode: 'AUTOMATIC_WHEN_ALLOWED' }); await runner.tick(clock.now(), true);
const cancelledWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [cancelledMeeting])).rows[0]; assert.equal(cancelledWork.status, 'SUPERSEDED'); assert.equal(await count('director_agent_work_artifacts', `work_item_id='${cancelledWork.id}'`), 0);

// Daily brief is keyed by Berlin day and survives a fresh runner (restart simulation).
await updateControls({ chiefOfStaff: { dailyBrief: true, dailyBriefTime: '10:00', endOfDayReview: true, endOfDayReviewTime: '18:00' } });
clock.set(new Date('2026-09-06T07:59:00.000Z')); await runner.tick(clock.now(), true); assert.equal(await count('director_agent_work_items', "work_type='DAILY_BRIEF'"), 0);
clock.set(new Date('2026-09-06T08:00:00.000Z')); await runner.tick(clock.now(), true); await new AgentRuntimeRunner(pool, clock, 'proof-after-restart').tick(clock.now(), true); assert.equal(await count('director_agent_work_items', "work_type='DAILY_BRIEF'"), 1);
clock.set(new Date('2026-09-07T08:00:00.000Z')); await new AgentRuntimeRunner(pool, clock, 'proof-next-day').tick(clock.now(), true); assert.equal(await count('director_agent_work_items', "work_type='DAILY_BRIEF'"), 2);

// PostgreSQL lease recovery: an expired lease is reclaimed by another worker and has one artifact.
const leaseMeeting = randomUUID(); const leaseStart = new Date(clock.now().getTime() + 30 * 60_000); await insertMeeting(leaseMeeting, 'A', leaseStart); await updateControls({ chiefOfStaff: { dailyBrief: false, endOfDayReview: false } }); clock.set(leaseStart); await updateCalendarPolicy({ delegationMode: 'MANUAL_ONLY' }); await runner.tick(clock.now(), true); const leaseWork = (await pool.query("select * from director_agent_work_items where subject_ref->>'scheduleRecordId'=$1", [leaseMeeting])).rows[0]; await updateCalendarPolicy({ delegationMode: 'AUTOMATIC_WHEN_ALLOWED' }); await pool.query("update director_agent_work_items set status='RUNNING',lease_owner='dead-worker',lease_expires_at=$2 where id=$1", [leaseWork.id, new Date(clock.now().getTime() - 1_000)]); await new AgentRuntimeRunner(pool, clock, 'recovery-worker').tick(clock.now(), true); assert.equal((await pool.query('select status from director_agent_work_items where id=$1', [leaseWork.id])).rows[0].status, 'COMPLETED'); assert.equal(await count('director_agent_work_artifacts', `work_item_id='${leaseWork.id}'`), 1);

// Communication quality remains a hard capability gate; no model or source text is supplied.
await assert.rejects(() => controls.authorizeAgentWork('COMMUNICATION', ['COMMUNICATION_INTERPRET']), (error: unknown) => error instanceof CoreError && error.code === 'QUALITY_BLOCKED');

const app = createDirectorApp(pool); const http = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => http.once('listening', resolve)); const address = http.address(); assert.ok(address && typeof address !== 'string'); const base = `http://127.0.0.1:${address.port}/api/v1`;
const health = await (await fetch(`${base}/agent-runtime/health`)).json() as any; assert.equal(health.runtime.enabled, false); const today = await (await fetch(`${base}/today`)).json() as any; assert.equal(today.handled.every((item: any) => item.externalActions === 'NONE'), true); assert.equal(today.handled.some((item: any) => item.artifactId), true); const events = await (await fetch(`${base}/agent-work/${goldenWork.id}/events`)).json() as any; assert.equal(events.items.some((item: any) => item.event_type === 'WORK_COMPLETED'), true); await new Promise<void>((resolve, reject) => http.close(error => error ? reject(error) : resolve()));

console.log(JSON.stringify({ goldenPath: true, repeatedTicks: 100, delegation: true, manualBlocked: true, globalPause: true, liveRevocation: true, connectionRecovery: true, boundedRetry: true, calendarRevision: true, cancellation: true, dailyBrief: true, restartDurability: true, leaseRecovery: true, qualityBlocked: true, api: true, externalActions: 'NONE' }));
await pool.end();
