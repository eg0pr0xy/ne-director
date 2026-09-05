export const interpretationContractVersion = 'NE_DIRECTOR_INTERPRETATION_V1';
export const candidateKinds = ['DECISION_REQUEST', 'ACTION_REQUEST', 'WAITING_EXPECTATION', 'FYI', 'NO_ACTION', 'ABSTAIN'] as const;
export type CandidateKind = typeof candidateKinds[number];
export type CandidateValidationStatus = 'PROPOSED' | 'VALIDATED' | 'REJECTED' | 'ABSTAINED' | 'SUPERSEDED' | 'MATERIALIZED';

export interface InterpretationInput {
  sourceRecordId: string;
  sourceType: 'COMMUNICATION';
  sourceContentHash: string;
  subject: string;
  normalizedText: string;
  sender: Record<string, unknown>;
  recipients: Record<string, unknown>[];
  receivedAt?: string;
  sourceTimezone?: string;
  minimalContext: Record<string, unknown>;
}

export interface EvidencePointer {
  sourceField: 'subject' | 'normalized_text';
  characterStart: number;
  characterEnd: number;
  evidenceHash: string;
}

export interface InterpretationCandidate {
  kind: CandidateKind;
  summary: string;
  question?: string;
  requestedAction?: string;
  expectedResult?: string;
  deadlineClaim?: string;
  confidence: number;
  evidence: EvidencePointer[];
}

export interface InterpretationOutput {
  candidates: InterpretationCandidate[];
  interpreterId: string;
  interpreterVersion: string;
  contractVersion: string;
  generatedAt: string;
}

/** Model egress is denied unless a provider is explicitly configured and the source is controlled. */
export interface ModelEgressPolicy {
  readonly mode: 'LOCAL_OR_EXPLICITLY_CONFIGURED_ONLY';
  authorize(input: InterpretationInput, provenance: Record<string, unknown>): void;
}

export interface InterpretationProvider {
  readonly interpreterId: string;
  readonly interpreterVersion: string;
  readonly contractVersion: string;
  interpret(input: InterpretationInput): Promise<InterpretationOutput>;
}
