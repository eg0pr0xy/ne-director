export const workTypes = ['MEETING_PREPARATION', 'DAILY_BRIEF', 'END_OF_DAY_REVIEW'] as const;
export type WorkType = typeof workTypes[number];
export interface RuntimeWorkDefinition {
  workVersion: '1.0.0';
  owningAgent: string;
  allowedDelegates: string[];
  requiredCapabilities: string[];
  inputSchema: Record<string, unknown>;
  resultSchema: Record<string, unknown>;
  sideEffectClass: 'INTERNAL_ONLY';
  retryPolicy: { maxAttempts: number; retryable: boolean };
  idempotencyKeyStrategy: string;
  provenanceAuthority: string;
  maxAttempts: number;
}

const internalOnly = {
  sideEffectClass: 'INTERNAL_ONLY' as const,
  retryPolicy: { maxAttempts: 3, retryable: true },
  provenanceAuthority: 'NE_DIRECTOR_AGENT_RUNTIME_DELEGATION_AND_TRIGGER_AUTHORITY_001'
};

export const runtimeWorkRegistry: Record<WorkType, RuntimeWorkDefinition> = {
  MEETING_PREPARATION: {
    workVersion: '1.0.0', owningAgent: 'CHIEF_OF_STAFF', allowedDelegates: ['CALENDAR_TRAVEL'], requiredCapabilities: ['CALENDAR_READ'],
    inputSchema: { scheduleRecordId: 'uuid', providerRevision: 'string' }, resultSchema: { title: 'string', startsAt: 'timestamp', externalActions: 'NONE' },
    idempotencyKeyStrategy: 'meeting:{scheduleRecordId}:{providerRevision}', maxAttempts: 3, ...internalOnly
  },
  DAILY_BRIEF: {
    workVersion: '1.0.0', owningAgent: 'CHIEF_OF_STAFF', allowedDelegates: [], requiredCapabilities: [],
    inputSchema: { operatorDay: 'Berlin local date' }, resultSchema: { facts: 'canonical-read-model', externalActions: 'NONE' },
    idempotencyKeyStrategy: 'daily:{Berlin-local-date}', maxAttempts: 3, ...internalOnly
  },
  END_OF_DAY_REVIEW: {
    workVersion: '1.0.0', owningAgent: 'CHIEF_OF_STAFF', allowedDelegates: [], requiredCapabilities: [],
    inputSchema: { operatorDay: 'Berlin local date' }, resultSchema: { unresolvedObligations: 'canonical-read-model', externalActions: 'NONE' },
    idempotencyKeyStrategy: 'eod:{Berlin-local-date}', maxAttempts: 3, ...internalOnly
  }
};
export interface RuntimeClock { now(): Date; }
export class SystemRuntimeClock implements RuntimeClock { now() { return new Date(); } }
