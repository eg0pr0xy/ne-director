export type ExternalActionType = 'CALENDAR_EVENT_CREATE';
export type ExternalActionStatus = 'PROPOSED' | 'AWAITING_APPROVAL' | 'APPROVED' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'SUPERSEDED' | 'EXPIRED' | 'OUTCOME_UNKNOWN' | 'BLOCKED_POLICY' | 'BLOCKED_CAPABILITY';
export interface CalendarEventCreatePayload { calendarId: string; title: string; startsAt: string; endsAt: string; timezone: string; location?: string; description?: string; attendees: unknown[]; }
export interface CalendarMutationReceipt { provider: 'GOOGLE'; connectionId: string; remoteEventId: string; remoteCalendarId: string; providerRevision?: string; providerStatus?: string; executedAt: string; providerRequestCorrelation?: string; }
export interface CalendarMutationProvider { createEvent(connectionId: string, actionId: string, payload: CalendarEventCreatePayload): Promise<CalendarMutationReceipt>; verifyEvent(connectionId: string, receipt: CalendarMutationReceipt): Promise<boolean>; }
