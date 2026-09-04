import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { CoreError } from '../core.js';
import type { CommunicationIngressProvider, Connection, ExternalIdentity, InboundCommunication, ProviderPage, ScheduleIngressProvider, ScheduleRecord, SourceAccount } from './contracts.js';

const gmailScope = 'https://www.googleapis.com/auth/gmail.readonly';
const calendarScope = 'https://www.googleapis.com/auth/calendar.readonly';
const oauthAuthorize = 'https://accounts.google.com/o/oauth2/v2/auth';
const oauthToken = 'https://oauth2.googleapis.com/token';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const asStrings = (value: unknown, fallback: string[]) => Array.isArray(value) && value.every(item => typeof item === 'string') ? value : fallback;
const base64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');
const opaque = () => randomBytes(32).toString('base64url');
const identity = (raw = ''): ExternalIdentity => {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  return { value: (match?.[2] ?? raw).trim(), displayName: match?.[1]?.trim() || undefined, resolutionState: 'UNRESOLVED' };
};
const identities = (raw?: string) => raw ? raw.split(/,(?=(?:[^<]*<[^>]*>)*[^<]*$)/).map(identity).filter(value => value.value) : [];
const headers = (payload: any) => Object.fromEntries((payload?.headers ?? []).map((header: any) => [String(header.name).toLowerCase(), String(header.value)]));
const textParts = (payload: any): string[] => {
  if (!payload) return [];
  const current = payload.mimeType === 'text/plain' && payload.body?.data ? [base64Url(payload.body.data)] : [];
  return [...current, ...(payload.parts ?? []).flatMap(textParts)];
};
const attachments = (payload: any): Array<Record<string, unknown>> => {
  if (!payload) return [];
  const current = payload.filename ? [{ filename: payload.filename, bytes: payload.body?.size ?? 0, mimeType: payload.mimeType ?? 'application/octet-stream' }] : [];
  return [...current, ...(payload.parts ?? []).flatMap(attachments)];
};

export class GoogleTokenProvider {
  private clientId() { return process.env.DIRECTOR_GOOGLE_OAUTH_CLIENT_ID; }
  private clientSecret() { return process.env.DIRECTOR_GOOGLE_OAUTH_CLIENT_SECRET; }
  private refreshToken(connection: Connection) {
    const configured = connection.configurationMetadata.googleRefreshTokenSecretRef;
    const reference = typeof configured === 'string' && /^DIRECTOR_[A-Z0-9_]+$/.test(configured) ? configured : 'DIRECTOR_GOOGLE_REFRESH_TOKEN';
    return process.env[reference];
  }

  async accessToken(connection: Connection) {
    const clientId = this.clientId(); const clientSecret = this.clientSecret(); const refreshToken = this.refreshToken(connection);
    if (!clientId || !clientSecret || !refreshToken) throw new Error('Google authorization credentials are not configured');
    const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' });
    const response = await fetch(oauthToken, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Google authorization failed');
    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error('Google authorization failed');
    return data.access_token;
  }

  async get(connection: Connection, url: URL) {
    const response = await fetch(url, { headers: { authorization: `Bearer ${await this.accessToken(connection)}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      const error = new Error(response.status === 401 || response.status === 403 ? 'Google authorization failed' : `Google read failed (${response.status})`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }
    return response.json();
  }
}

export class GoogleAuthorizationFlow {
  private pending = new Map<string, { connectionId: string; verifier: string; expiresAt: number }>();
  private clientId() { return process.env.DIRECTOR_GOOGLE_OAUTH_CLIENT_ID; }
  private redirectUri() { return process.env.DIRECTOR_GOOGLE_OAUTH_REDIRECT_URI; }

  begin(connection: Connection) {
    const clientId = this.clientId(); const redirectUri = this.redirectUri();
    if (!clientId || !redirectUri) throw new CoreError('GOOGLE_AUTH_CONFIGURATION_REQUIRED', 503, 'Google OAuth client configuration is required');
    const state = opaque(); const verifier = opaque(); const challenge = createHash('sha256').update(verifier).digest('base64url');
    this.pending.set(state, { connectionId: connection.id, verifier, expiresAt: Date.now() + 10 * 60_000 });
    const url = new URL(oauthAuthorize);
    url.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', scope: `${gmailScope} ${calendarScope}`, state, code_challenge: challenge, code_challenge_method: 'S256' }).toString();
    return { authorizationUrl: url.toString(), state };
  }

  async complete(state: string, code: string) {
    const pending = this.pending.get(state); this.pending.delete(state);
    const clientId = this.clientId(); const redirectUri = this.redirectUri(); const clientSecret = process.env.DIRECTOR_GOOGLE_OAUTH_CLIENT_SECRET;
    if (!pending || pending.expiresAt < Date.now() || !clientId || !redirectUri || !clientSecret) throw new CoreError('GOOGLE_AUTH_CALLBACK_REJECTED', 400, 'Google authorization callback rejected');
    const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code', code_verifier: pending.verifier });
    const response = await fetch(oauthToken, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new CoreError('GOOGLE_AUTH_CALLBACK_REJECTED', 400, 'Google authorization callback rejected');
    const tokens = await response.json() as { refresh_token?: string };
    if (!tokens.refresh_token) throw new CoreError('GOOGLE_SECRET_AUTHORITY_REQUIRED', 503, 'A local secret authority must store the Google refresh token');
    // Refresh tokens are intentionally discarded here: this repository has no approved writable secret vault.
    return { connectionId: pending.connectionId, verified: true };
  }
}

export class GoogleCommunicationIngressAdapter implements CommunicationIngressProvider {
  readonly provider = 'GOOGLE';
  constructor(private readonly tokenProvider: GoogleTokenProvider, private readonly connectionFor: (id: string) => Promise<Connection>) {}

  async fetchCommunications(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<InboundCommunication>> {
    if (!account.connectionId) throw new Error('Google source account requires a connection');
    const connection = await this.connectionFor(account.connectionId); const labels = asStrings(account.selectionMetadata?.includedMailboxes, ['INBOX']);
    const ids = new Map<string, any>();
    for (const label of labels.slice(0, 10)) {
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.set('maxResults', '100'); url.searchParams.set('q', 'is:unread'); url.searchParams.append('labelIds', label);
      const listed = await this.tokenProvider.get(connection, url) as any;
      for (const message of listed.messages ?? []) ids.set(message.id, message);
    }
    const items = await Promise.all([...ids.values()].map(async listed => {
      const detail = await this.tokenProvider.get(connection, new URL(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(listed.id)}?format=full`)) as any;
      const messageHeaders = headers(detail.payload); const text = textParts(detail.payload).join('\n').trim();
      return { id: randomUUID(), sourceAccountId: account.id, sourceSystem: this.provider, sourceLocator: `gmail:${detail.id}`, providerRevision: String(detail.historyId ?? detail.internalDate ?? detail.id), remoteMessageIdentity: { gmail_message_id: detail.id, thread_id: detail.threadId, history_id: detail.historyId }, messageId: messageHeaders['message-id'], references: (messageHeaders.references ?? '').split(/\s+/).filter(Boolean), inReplyTo: messageHeaders['in-reply-to'], sender: identity(messageHeaders.from), recipients: [...identities(messageHeaders.to), ...identities(messageHeaders.cc)], subject: messageHeaders.subject ?? '(no subject)', receivedAt: detail.internalDate ? new Date(Number(detail.internalDate)).toISOString() : undefined, sentAt: messageHeaders.date ? new Date(messageHeaders.date).toISOString() : undefined, flags: detail.labelIds ?? [], normalizedText: text, contentHash: hash(text), attachmentMetadata: attachments(detail.payload), observedAt: new Date().toISOString(), provenance: { provider: 'GOOGLE', api: 'gmail.v1', untrusted_content: true } } satisfies InboundCommunication;
    }));
    const latestHistoryId = items.map(item => String(item.remoteMessageIdentity.history_id ?? '')).sort().at(-1) ?? cursor.historyId;
    return { items, nextCursor: { historyId: latestHistoryId, mailboxLabels: labels } };
  }
}

const eventDate = (value: any) => value?.dateTime ? new Date(value.dateTime).toISOString() : undefined;
const eventAllDayDate = (value: any) => value?.date;
const eventIdentity = (value?: any) => value?.email ? { value: value.email, displayName: value.displayName, resolutionState: 'UNRESOLVED' as const } : undefined;

export class GoogleScheduleIngressAdapter implements ScheduleIngressProvider {
  readonly provider = 'GOOGLE';
  constructor(private readonly tokenProvider: GoogleTokenProvider, private readonly connectionFor: (id: string) => Promise<Connection>) {}

  async fetchSchedule(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<ScheduleRecord>> {
    if (!account.connectionId) throw new Error('Google source account requires a connection');
    const connection = await this.connectionFor(account.connectionId);
    const calendarList = await this.tokenProvider.get(connection, new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250')) as any;
    const allowed = asStrings(account.selectionMetadata?.includedCalendars, ['primary']);
    const calendars = (calendarList.items ?? []).filter((calendar: any) => allowed.includes(calendar.id) || (allowed.includes('primary') && calendar.primary));
    const tokens = typeof cursor.calendarSyncTokens === 'object' && cursor.calendarSyncTokens ? cursor.calendarSyncTokens as Record<string, string> : {};
    const nextTokens: Record<string, string> = {}; const items: ScheduleRecord[] = [];
    for (const calendar of calendars) {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
      url.searchParams.set('maxResults', '100'); url.searchParams.set('showDeleted', 'true');
      if (tokens[calendar.id]) url.searchParams.set('syncToken', tokens[calendar.id]);
      else { url.searchParams.set('singleEvents', 'false'); url.searchParams.set('timeMin', new Date(Date.now() - 30 * 86400000).toISOString()); url.searchParams.set('timeMax', new Date(Date.now() + 120 * 86400000).toISOString()); }
      let page: any;
      try { page = await this.tokenProvider.get(connection, url); }
      catch (error) {
        if ((error as Error & { status?: number }).status !== 410) throw error;
        const full = new URL(url); full.searchParams.delete('syncToken'); full.searchParams.set('singleEvents', 'false'); full.searchParams.set('timeMin', new Date(Date.now() - 30 * 86400000).toISOString()); full.searchParams.set('timeMax', new Date(Date.now() + 120 * 86400000).toISOString()); page = await this.tokenProvider.get(connection, full);
      }
      if (page.nextSyncToken) nextTokens[calendar.id] = page.nextSyncToken;
      for (const event of page.items ?? []) {
        const recurrenceId = event.originalStartTime?.dateTime ?? event.originalStartTime?.date;
        items.push({ id: randomUUID(), sourceAccountId: account.id, sourceSystem: this.provider, sourceLocator: `google-calendar:${calendar.id}:${event.id}`, calendarRef: calendar.id, remoteUid: event.iCalUID ?? event.id, recurrenceId, providerRevision: event.updated ?? event.etag ?? event.id, title: event.summary ?? '(untitled)', description: event.description, location: event.location, organizer: eventIdentity(event.organizer), attendees: (event.attendees ?? []).map(eventIdentity).filter(Boolean) as ExternalIdentity[], startsAt: eventDate(event.start), endsAt: eventDate(event.end), sourceTimezone: event.start?.timeZone ?? event.end?.timeZone, allDay: Boolean(event.start?.date), allDayDate: eventAllDayDate(event.start), recurrenceRule: Array.isArray(event.recurrence) ? event.recurrence.join('\n') : undefined, status: event.status === 'cancelled' ? 'CANCELLED' : event.status === 'tentative' ? 'TENTATIVE' : 'CONFIRMED', observedAt: new Date().toISOString(), provenance: { provider: 'GOOGLE', api: 'calendar.v3', recurring_event_id: event.recurringEventId ?? null } });
      }
    }
    return { items, nextCursor: { calendarSyncTokens: nextTokens, selectedCalendars: calendars.map((calendar: any) => calendar.id) } };
  }
}
