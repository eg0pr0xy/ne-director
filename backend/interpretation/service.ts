import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { CoreError } from '../core.js';
import type { CandidateKind, CandidateValidationStatus, InterpretationCandidate, InterpretationInput, InterpretationProvider, ModelEgressPolicy } from './contracts.js';
import { validCandidateKind, evidenceHash } from './provider.js';
import { CanonicalMaterializationService } from './materialization.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const json = (value: unknown) => JSON.stringify(value);
const sourceText = (source: any, field: string) => field === 'subject' ? source.subject : field === 'normalized_text' ? source.normalized_text : undefined;

const localParts = (value: Date, timeZone: string) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(value).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)])) as Record<string, number>;
const inZone = (year: number, month: number, day: number, hour: number, minute: number, timeZone: string) => {
  let instant = Date.UTC(year, month - 1, day, hour, minute);
  for (let i = 0; i < 2; i += 1) { const parts = localParts(new Date(instant), timeZone); instant += Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute); }
  return new Date(instant);
};

export const resolveDeadline = (claim: string | undefined, receivedAt: Date | undefined, timeZone: string | undefined): Date | undefined => {
  if (!claim || !receivedAt || !timeZone) return undefined;
  const exact = /^(?:by|bis) (\d{1,2}):(\d{2})$/i.exec(claim.trim()); const parts = localParts(receivedAt, timeZone);
  if (exact) { const hour = Number(exact[1]); const minute = Number(exact[2]); if (hour <= 23 && minute <= 59) return inZone(parts.year, parts.month, parts.day, hour, minute, timeZone); }
  if (/^(?:by )?tomorrow$/i.test(claim.trim()) || /^(?:bis )?morgen$/i.test(claim.trim())) { const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + 86400000); return inZone(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), parts.hour, parts.minute, timeZone); }
  return undefined;
};

export class InterpretationService {
  private readonly materializer: CanonicalMaterializationService;
  constructor(private readonly db: Pool, private readonly provider: InterpretationProvider, private readonly egressPolicy: ModelEgressPolicy) { this.materializer = new CanonicalMaterializationService(db); }

  async interpret(sourceRecordId: string) {
    const sourceResult = await this.db.query(`select id,subject,normalized_text,content_hash,sender,recipients,received_at,provenance from director_communication_source_records where id=$1 and is_current=true`, [sourceRecordId]);
    if (!sourceResult.rowCount) throw new CoreError('INTERPRETATION_SOURCE_NOT_FOUND', 404, 'Current communication source record not found');
    const source = sourceResult.rows[0];
    const input: InterpretationInput = { sourceRecordId: source.id, sourceType: 'COMMUNICATION', sourceContentHash: source.content_hash, subject: source.subject, normalizedText: source.normalized_text, sender: source.sender, recipients: source.recipients, receivedAt: source.received_at?.toISOString(), sourceTimezone: typeof source.provenance?.source_timezone === 'string' ? source.provenance.source_timezone : 'Europe/Berlin', minimalContext: { source_system: 'INGRESS', attachment_content_included: false } };
    const existing = await this.db.query(`select id from director_interpretation_runs where source_record_id=$1 and source_content_hash=$2 and interpreter_id=$3 and interpreter_version=$4 and contract_version=$5`, [source.id, source.content_hash, this.provider.interpreterId, this.provider.interpreterVersion, this.provider.contractVersion]);
    if (existing.rowCount) return this.getRun(existing.rows[0].id);
    const runId = randomUUID();
    await this.db.query(`insert into director_interpretation_runs(id,source_record_id,source_record_type,source_content_hash,interpreter_id,interpreter_version,contract_version,status,started_at,provenance) values($1,$2,'COMMUNICATION',$3,$4,$5,$6,'RUNNING',now(),$7)`, [runId, source.id, source.content_hash, this.provider.interpreterId, this.provider.interpreterVersion, this.provider.contractVersion, json({ model_egress: this.egressPolicy.mode, source_content_untrusted: true, attachment_content_included: false })]);
    try {
      this.egressPolicy.authorize(input, source.provenance ?? {});
      const output = await this.provider.interpret(input);
      if (output.interpreterId !== this.provider.interpreterId || typeof output.modelId !== 'string' || !output.modelId || output.interpreterVersion !== this.provider.interpreterVersion || output.contractVersion !== this.provider.contractVersion || !Array.isArray(output.candidates)) throw new CoreError('INTERPRETATION_SCHEMA_INVALID', 422, 'Interpretation provider output is invalid');
      for (const candidate of output.candidates) await this.persistCandidate(runId, source, input, candidate, output);
      await this.db.query("update director_interpretation_runs set status='COMPLETED',completed_at=now(),provenance=provenance || $2::jsonb where id=$1", [runId, json({ output_hash: hash(JSON.stringify(output.candidates)), model_id: output.modelId, generated_at: output.generatedAt, latency_metadata_only: true })]);
    } catch (error) {
      const code = error instanceof CoreError ? error.code : 'INTERPRETATION_PROVIDER_UNAVAILABLE';
      await this.db.query("update director_interpretation_runs set status='FAILED',completed_at=now(),failure_code=$2 where id=$1", [runId, code]);
    }
    return this.getRun(runId);
  }

  private async persistCandidate(runId: string, source: any, input: InterpretationInput, candidate: InterpretationCandidate, output: any) {
    const candidateId = randomUUID(); let status: CandidateValidationStatus = candidate.kind === 'ABSTAIN' ? 'ABSTAINED' : 'PROPOSED'; let rejection: string | undefined; let due: Date | undefined;
    if (!validCandidateKind(candidate.kind) || typeof candidate.summary !== 'string' || !candidate.summary || typeof candidate.confidence !== 'number' || candidate.confidence < 0 || candidate.confidence > 1 || !Array.isArray(candidate.evidence)) rejection = 'INTERPRETATION_SCHEMA_INVALID';
    if (!rejection && candidate.kind !== 'ABSTAIN') {
      for (const evidence of candidate.evidence) {
        const value = sourceText(source, evidence.sourceField);
        if (typeof value !== 'string' || !Number.isInteger(evidence.characterStart) || !Number.isInteger(evidence.characterEnd) || evidence.characterStart < 0 || evidence.characterEnd > value.length || evidence.characterEnd <= evidence.characterStart || evidenceHash(value.slice(evidence.characterStart, evidence.characterEnd)) !== evidence.evidenceHash) { rejection = 'INTERPRETATION_EVIDENCE_INVALID'; break; }
      }
      if (!candidate.evidence.length) rejection = 'INTERPRETATION_EVIDENCE_MISSING';
      if (!rejection && candidate.deadlineClaim) {
        const deadlineEvidence = candidate.evidence.some(evidence => sourceText(source, evidence.sourceField)?.slice(evidence.characterStart, evidence.characterEnd) === candidate.deadlineClaim);
        if (!deadlineEvidence) rejection = 'INTERPRETATION_DEADLINE_UNEVIDENCED';
        else due = resolveDeadline(candidate.deadlineClaim, source.received_at, input.sourceTimezone);
      }
      if (!rejection) status = 'VALIDATED';
    }
    if (rejection) status = 'REJECTED';
    await this.db.query(`insert into director_interpretation_candidates(id,run_id,kind,summary,question,requested_action,expected_result,deadline_claim,resolved_due_at,confidence,validation_status,rejection_reason,provenance) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [candidateId, runId, candidate.kind, candidate.summary, candidate.question ?? null, candidate.requestedAction ?? null, candidate.expectedResult ?? null, candidate.deadlineClaim ?? null, due ?? null, candidate.confidence, status, rejection ?? null, json({ interpreter_id: output.interpreterId, contract_version: output.contractVersion, no_chain_of_thought: true })]);
    for (const evidence of candidate.evidence ?? []) await this.db.query(`insert into director_interpretation_evidence(id,candidate_id,source_record_id,source_field,character_start,character_end,evidence_hash) values($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(), candidateId, source.id, evidence.sourceField, evidence.characterStart, evidence.characterEnd, evidence.evidenceHash]);
  }

  async materialize(runId: string) {
    const run = await this.getRun(runId); if (run.status !== 'COMPLETED') throw new CoreError('INTERPRETATION_NOT_READY', 409, 'Interpretation run is not ready');
    const results = [];
    try {
      for (const candidate of run.candidates.filter((candidate: any) => ['VALIDATED', 'ABSTAINED', 'MATERIALIZED'].includes(candidate.validationStatus))) {
        if (candidate.validationStatus === 'VALIDATED') await this.verifyEvidence(candidate.id, run.sourceRecordId, run.sourceContentHash);
        results.push(await this.materializer.materialize(candidate.id));
      }
    } catch (error) {
      if (error instanceof CoreError && error.code === 'INTERPRETATION_CONFLICT') await this.db.query("update director_interpretation_runs set status='CONFLICT',completed_at=now(),failure_code='INTERPRETATION_CONFLICT' where id=$1", [runId]);
      throw error;
    }
    return { runId, results };
  }

  private async verifyEvidence(candidateId: string, sourceRecordId: string, sourceHash: string) {
    const source = await this.db.query('select subject,normalized_text,content_hash from director_communication_source_records where id=$1 and is_current=true', [sourceRecordId]);
    if (!source.rowCount || source.rows[0].content_hash !== sourceHash) throw new CoreError('INTERPRETATION_SOURCE_CHANGED', 409, 'Source content changed since interpretation');
    const evidence = await this.db.query('select * from director_interpretation_evidence where candidate_id=$1', [candidateId]);
    if (!evidence.rowCount) throw new CoreError('INTERPRETATION_EVIDENCE_MISSING', 422, 'Candidate evidence is missing');
    for (const item of evidence.rows) { const value = sourceText(source.rows[0], item.source_field); if (typeof value !== 'string' || item.character_start < 0 || item.character_end > value.length || evidenceHash(value.slice(item.character_start, item.character_end)) !== item.evidence_hash) throw new CoreError('INTERPRETATION_EVIDENCE_INVALID', 422, 'Candidate evidence is invalid'); }
  }

  async getRun(id: string): Promise<any> {
    const result = await this.db.query('select * from director_interpretation_runs where id=$1', [id]); if (!result.rowCount) throw new CoreError('NOT_FOUND', 404, 'Interpretation run not found');
    const candidates = await this.db.query('select * from director_interpretation_candidates where run_id=$1 order by id', [id]);
    const withEvidence = await Promise.all(candidates.rows.map(async candidate => ({ id: candidate.id, kind: candidate.kind, summary: candidate.summary, question: candidate.question, requestedAction: candidate.requested_action, expectedResult: candidate.expected_result, deadlineClaim: candidate.deadline_claim, resolvedDueAt: candidate.resolved_due_at?.toISOString(), confidence: candidate.confidence, validationStatus: candidate.validation_status, rejectionReason: candidate.rejection_reason, materializedAt: candidate.materialized_at?.toISOString(), evidence: (await this.db.query('select source_field,character_start,character_end,evidence_hash from director_interpretation_evidence where candidate_id=$1 order by character_start', [candidate.id])).rows.map(item => ({ sourceField: item.source_field, characterStart: item.character_start, characterEnd: item.character_end, evidenceHash: item.evidence_hash })) })));
    const run = result.rows[0]; return { id: run.id, sourceRecordId: run.source_record_id, sourceContentHash: run.source_content_hash, interpreterId: run.interpreter_id, interpreterVersion: run.interpreter_version, contractVersion: run.contract_version, status: run.status, failureCode: run.failure_code, startedAt: run.started_at.toISOString(), completedAt: run.completed_at?.toISOString(), candidates: withEvidence };
  }

  async list(sourceRecordId?: string) { const rows = await this.db.query(`select id from director_interpretation_runs ${sourceRecordId ? 'where source_record_id=$1' : ''} order by started_at desc`, sourceRecordId ? [sourceRecordId] : []); return Promise.all(rows.rows.map(row => this.getRun(row.id))); }
}
