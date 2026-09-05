import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { CoreError } from '../core.js';
import type { CandidateKind } from './contracts.js';

type CandidateRow = { id: string; run_id: string; kind: CandidateKind; summary: string; question: string | null; requested_action: string | null; expected_result: string | null; resolved_due_at: Date | null; validation_status: string; source_record_id: string; received_at: Date | null; sender: Record<string, unknown> };
const json = (value: unknown) => JSON.stringify(value);
const unassigned = { authority: 'INGRESS_UNRESOLVED', external_id: 'unassigned', display_snapshot: 'UNASSIGNED' };
const unresolvedPerson = (sender: Record<string, unknown>) => ({ authority: 'INGRESS_UNRESOLVED', external_id: typeof sender.value === 'string' ? sender.value.toLowerCase() : 'unknown-sender', display_snapshot: typeof sender.displayName === 'string' ? sender.displayName : 'Unresolved sender' });

export class CanonicalMaterializationService {
  constructor(private readonly db: Pool) {}

  async materialize(candidateId: string) {
    const client = await this.db.connect();
    try {
      await client.query('begin');
      const found = await client.query(`select c.*,r.source_record_id,s.received_at,s.sender from director_interpretation_candidates c join director_interpretation_runs r on r.id=c.run_id join director_communication_source_records s on s.id=r.source_record_id where c.id=$1 for update`, [candidateId]);
      if (!found.rowCount) throw new CoreError('NOT_FOUND', 404, 'Interpretation candidate not found');
      const candidate = found.rows[0] as CandidateRow & { materialization_key: string | null };
      if (candidate.validation_status === 'MATERIALIZED') { await client.query('commit'); return { candidateId, kind: candidate.kind, replay: true }; }
      if (!['VALIDATED', 'ABSTAINED'].includes(candidate.validation_status)) throw new CoreError('INTERPRETATION_NOT_VALIDATED', 409, 'Only validated candidates may materialize');
      const conflict = await client.query(`select id from director_interpretation_candidates where run_id=$1 and id<>$2 and validation_status='VALIDATED' and kind not in ('FYI','NO_ACTION','ABSTAIN')`, [candidate.run_id, candidate.id]);
      if (conflict.rowCount && !['FYI', 'NO_ACTION', 'ABSTAIN'].includes(candidate.kind)) {
        await client.query("update director_interpretation_candidates set validation_status='REJECTED',rejection_reason='INTERPRETATION_CONFLICT' where id=$1", [candidate.id]);
        await client.query("update director_interpretation_runs set status='CONFLICT',completed_at=now(),failure_code='INTERPRETATION_CONFLICT' where id=$1", [candidate.run_id]);
        throw new CoreError('INTERPRETATION_CONFLICT', 409, 'Conflicting interpretation candidates require resolution');
      }
      const materializationKey = `interpretation:${candidate.id}`;
      if (['FYI', 'NO_ACTION', 'ABSTAIN'].includes(candidate.kind)) {
        await client.query("update director_interpretation_candidates set validation_status='MATERIALIZED',materialized_at=now(),materialization_key=$2 where id=$1", [candidate.id, materializationKey]);
        await client.query('commit'); return { candidateId, kind: candidate.kind, canonical: false };
      }
      const eventId = randomUUID(); const correlationId = randomUUID(); const person = unresolvedPerson(candidate.sender);
      const eventType = candidate.kind === 'DECISION_REQUEST' ? 'DECISION_REQUEST_RECEIVED' : candidate.kind === 'ACTION_REQUEST' ? 'ACTION_REQUEST_RECEIVED' : 'EXPECTATION_RECEIVED';
      await client.query(`insert into director_events(event_id,event_type,occurred_at,source_system,source_reference,project_ref,person_ref,correlation_id,idempotency_key,payload,provenance) values($1,$2,$3,'INTERPRETATION',$4,$5,$6,$7,$8,$9,$10)`, [eventId, eventType, candidate.received_at ?? new Date(), json({ source_record_id: candidate.source_record_id, interpretation_candidate_id: candidate.id }), json(unassigned), json(person), correlationId, materializationKey, json({ summary: candidate.summary }), json({ factual: true, materialized_from_candidate: candidate.id })]);
      let obligationId: string | undefined; let decisionId: string | undefined; let openLoopId: string | undefined;
      if (candidate.kind === 'DECISION_REQUEST' || candidate.kind === 'ACTION_REQUEST') {
        obligationId = randomUUID();
        await client.query(`insert into director_obligations(id,owner_ref,project_ref,person_ref,source_event_id,kind,summary,status,due_at,importance,confidence,provenance) values($1,$2,$3,$4,$5,$6,$7,'OPEN',$8,$9,$10,$11)`, [obligationId, json({ authority: 'DIRECTOR', external_id: 'operator', display_snapshot: 'Director' }), json(unassigned), json(person), eventId, candidate.kind === 'DECISION_REQUEST' ? 'DECISION_REQUIRED' : 'ACTION_REQUIRED', candidate.summary, candidate.resolved_due_at, candidate.kind === 'DECISION_REQUEST' ? 80 : 60, .8, json({ interpretation_candidate_id: candidate.id })]);
        if (candidate.kind === 'DECISION_REQUEST') {
          decisionId = randomUUID();
          await client.query(`insert into director_decisions(id,obligation_id,question,options,status,requested_at,required_by,provenance) values($1,$2,$3,$4,'OPEN',now(),$5,$6)`, [decisionId, obligationId, candidate.question ?? candidate.summary, json(['APPROVE', 'DECLINE']), candidate.resolved_due_at, json({ interpretation_candidate_id: candidate.id })]);
        }
      } else if (candidate.kind === 'WAITING_EXPECTATION') {
        openLoopId = randomUUID();
        await client.query(`insert into director_open_loops(id,project_ref,person_ref,expected_result,status,opened_at,expected_by,source_event_id,provenance) values($1,$2,$3,$4,'WAITING',now(),$5,$6,$7)`, [openLoopId, json(unassigned), json(person), candidate.expected_result ?? candidate.summary, candidate.resolved_due_at, eventId, json({ interpretation_candidate_id: candidate.id })]);
      }
      await client.query("update director_interpretation_candidates set validation_status='MATERIALIZED',materialized_at=now(),materialization_key=$2 where id=$1", [candidate.id, materializationKey]);
      await client.query('commit');
      return { candidateId, kind: candidate.kind, canonical: true, eventId, obligationId, decisionId, openLoopId };
    } catch (error) { await client.query('rollback'); throw error; } finally { client.release(); }
  }
}
