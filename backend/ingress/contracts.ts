export type IngressCapability = 'COMMUNICATION' | 'SCHEDULE' | 'CONTACTS';
export type ConnectionCapability = 'MAIL' | 'CALENDAR' | 'CONTACTS';
export type ConnectionState = 'CONNECTED' | 'DEGRADED' | 'AUTH_REQUIRED' | 'DISABLED' | 'UNAVAILABLE';
export type AuthorizationState = 'NOT_CONFIGURED' | 'PENDING_OPERATOR' | 'AUTHORIZED' | 'REVOKED';
export type IdentityResolution = 'RESOLVED' | 'UNRESOLVED' | 'AMBIGUOUS';
export type ProviderFailureCategory = 'AUTH_REQUIRED' | 'CONFIGURATION_REQUIRED' | 'PROVIDER_RATE_LIMITED' | 'PROVIDER_UNAVAILABLE';

/**
 * A provider-safe failure envelope.  It deliberately contains no response body,
 * request URL, credential, or other potentially sensitive provider material.
 */
export interface ProviderFailure {
  category: ProviderFailureCategory;
  status?: number;
  providerReason?: string;
  retryable: boolean;
}

export interface ExternalIdentity {
  value: string;
  displayName?: string;
  resolutionState: IdentityResolution;
  canonicalPersonRef?: Record<string, unknown>;
}

export interface SourceAccount {
  id: string;
  connectionId?: string;
  provider: string;
  capability: IngressCapability;
  displayName: string;
  accountIdentifier: string;
  enabled: boolean;
  connectionState: ConnectionState;
  cursorState: Record<string, unknown>;
  selectionMetadata?: Record<string, unknown>;
  lastAttemptAt?: string;
  lastSuccessfulSyncAt?: string;
  lastErrorCode?: string;
}

/** Provider-neutral Settings authority. Secrets and provider tokens never live here. */
export interface Connection {
  id: string;
  displayName: string;
  provider: string;
  accountIdentifier: string;
  enabled: boolean;
  capabilities: ConnectionCapability[];
  authorizationState: AuthorizationState;
  connectionState: ConnectionState;
  configurationMetadata: Record<string, unknown>;
  lastAttemptAt?: string;
  lastSuccessfulSyncAt?: string;
  lastErrorCode?: string;
}

export interface InboundCommunication {
  id: string;
  sourceAccountId: string;
  sourceSystem: string;
  sourceLocator: string;
  providerRevision: string;
  remoteMessageIdentity: Record<string, unknown>;
  messageId?: string;
  references: string[];
  inReplyTo?: string;
  sender: ExternalIdentity;
  recipients: ExternalIdentity[];
  subject: string;
  receivedAt?: string;
  sentAt?: string;
  flags: string[];
  normalizedText: string;
  contentHash: string;
  attachmentMetadata: Array<Record<string, unknown>>;
  observedAt: string;
  provenance: Record<string, unknown>;
}

export interface ScheduleRecord {
  id: string;
  sourceAccountId: string;
  sourceSystem: string;
  sourceLocator: string;
  calendarRef: string;
  remoteUid: string;
  recurrenceId?: string;
  providerRevision: string;
  title: string;
  description?: string;
  location?: string;
  organizer?: ExternalIdentity;
  attendees: ExternalIdentity[];
  startsAt?: string;
  endsAt?: string;
  sourceTimezone?: string;
  allDay: boolean;
  allDayDate?: string;
  recurrenceRule?: string;
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED' | 'REMOVED';
  observedAt: string;
  provenance: Record<string, unknown>;
}

export interface ProviderPage<T> { items: T[]; nextCursor: Record<string, unknown>; }
export interface CommunicationIngressProvider {
  readonly provider: string;
  fetchCommunications(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<InboundCommunication>>;
}
export interface ScheduleIngressProvider {
  readonly provider: string;
  fetchSchedule(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<ScheduleRecord>>;
}

/** Intentionally narrow: no IMAP mutation operation can be reached from this authority. */
export interface ReadOnlyMailTransport {
  listUnreadOrChanged(cursor: Record<string, unknown>, limit: number): Promise<{ locator: string; revision: string; identity: Record<string, unknown> }[]>;
  fetchBodyPeek(locator: string): Promise<Omit<InboundCommunication, 'id' | 'sourceAccountId' | 'sourceSystem' | 'sourceLocator' | 'providerRevision' | 'remoteMessageIdentity' | 'observedAt'>>;
}

/** Intentionally narrow: no CalDAV PUT, DELETE, or PROPPATCH can be reached. */
export interface ReadOnlyScheduleTransport {
  discoverCalendars(): Promise<Array<{ ref: string; displayName: string }>>;
  readSchedule(cursor: Record<string, unknown>, allowedCalendars: string[]): Promise<ProviderPage<Omit<ScheduleRecord, 'id' | 'sourceAccountId' | 'sourceSystem' | 'observedAt'>>>;
}
