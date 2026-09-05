import { CoreError } from '../core.js';
import type { Connection } from '../ingress/contracts.js';
import { GoogleProviderError, GoogleTokenProvider } from '../ingress/google.js';
import type { CalendarEventCreatePayload, CalendarMutationProvider, CalendarMutationReceipt } from './contracts.js';

export class GoogleCalendarMutationAdapter implements CalendarMutationProvider {
  constructor(private readonly tokens: GoogleTokenProvider, private readonly connectionFor: (id: string) => Promise<Connection>) {}
  async createEvent(connectionId: string, actionId: string, payload: CalendarEventCreatePayload): Promise<CalendarMutationReceipt> {
    if (payload.attendees.length) throw new CoreError('ACTION_ATTENDEES_NOT_AUTHORIZED', 422, 'Calendar attendee invitations are outside this authority');
    const connection = await this.connectionFor(connectionId); const token = await this.tokens.accessToken(connection); const eventId = `nedirector${actionId.replaceAll('-', '')}`;
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(payload.calendarId)}/events`); url.searchParams.set('sendUpdates', 'none');
    let response: Response; try { response = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ id: eventId, summary: payload.title, start: { dateTime: payload.startsAt, timeZone: payload.timezone }, end: { dateTime: payload.endsAt, timeZone: payload.timezone }, location: payload.location, description: payload.description }), signal: AbortSignal.timeout(15000) }); } catch { throw new GoogleProviderError('PROVIDER_UNAVAILABLE', undefined, undefined, true); }
    if (!response.ok) throw new GoogleProviderError(response.status === 401 ? 'AUTH_REQUIRED' : response.status === 403 ? 'CONFIGURATION_REQUIRED' : response.status === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_UNAVAILABLE', response.status, undefined, false);
    const body = await response.json() as any; if (typeof body.id !== 'string') throw new CoreError('ACTION_PROVIDER_RECEIPT_INVALID', 502, 'Calendar provider did not return an event identity'); return { provider: 'GOOGLE', connectionId, remoteEventId: body.id, remoteCalendarId: payload.calendarId, providerRevision: body.etag ?? body.updated, providerStatus: body.status, executedAt: new Date().toISOString() };
  }
  async verifyEvent(connectionId: string, receipt: CalendarMutationReceipt) { const connection = await this.connectionFor(connectionId); const data = await this.tokens.get(connection, new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(receipt.remoteCalendarId)}/events/${encodeURIComponent(receipt.remoteEventId)}`)) as any; return data?.id === receipt.remoteEventId; }
}
