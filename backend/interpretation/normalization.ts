import { createHash } from 'node:crypto';
import type { EvidencePointer, InterpretationInput } from './contracts.js';

export type LiteralEvidence = { sourceField: 'subject' | 'normalized_text'; text: string };
export class EvidenceNormalizationError extends Error {
  constructor(readonly code: 'EVIDENCE_EMPTY' | 'EVIDENCE_NOT_FOUND' | 'EVIDENCE_AMBIGUOUS') { super(code); }
}

const sourceFor = (input: InterpretationInput, sourceField: LiteralEvidence['sourceField']) => sourceField === 'subject' ? input.subject : input.normalizedText;
const occurrences = (source: string, text: string) => { let count = 0; let index = source.indexOf(text); while (index >= 0) { count += 1; index = source.indexOf(text, index + text.length); } return count; };

export const normalizeEvidence = (input: InterpretationInput, evidence: LiteralEvidence): EvidencePointer => {
  if (!evidence.text.length) throw new EvidenceNormalizationError('EVIDENCE_EMPTY');
  const source = sourceFor(input, evidence.sourceField);
  const count = occurrences(source, evidence.text);
  if (!count) throw new EvidenceNormalizationError('EVIDENCE_NOT_FOUND');
  if (count !== 1) throw new EvidenceNormalizationError('EVIDENCE_AMBIGUOUS');
  const characterStart = source.indexOf(evidence.text);
  return { sourceField: evidence.sourceField, characterStart, characterEnd: characterStart + evidence.text.length, evidenceHash: createHash('sha256').update(evidence.text).digest('hex') };
};

export const normalizeDeadlineEvidence = (input: InterpretationInput, text: string): EvidencePointer => {
  const matches = (['subject', 'normalized_text'] as const).flatMap(sourceField => {
    const source = sourceFor(input, sourceField);
    return occurrences(source, text) === 1 ? [{ sourceField, text }] : [];
  });
  if (!matches.length) throw new EvidenceNormalizationError('EVIDENCE_NOT_FOUND');
  if (matches.length !== 1) throw new EvidenceNormalizationError('EVIDENCE_AMBIGUOUS');
  return normalizeEvidence(input, matches[0]);
};

export const safePresentationLabel = (kind: string) => ({ DECISION_REQUEST: 'Decision required', ACTION_REQUEST: 'Action requested', WAITING_EXPECTATION: 'Awaiting expected result', FYI: 'Informational item', NO_ACTION: 'No action required', ABSTAIN: 'Insufficient validated evidence' }[kind] ?? 'Interpretation candidate');
