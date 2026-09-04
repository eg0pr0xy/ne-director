import assert from 'node:assert/strict';
import test from 'node:test';
import { GoogleCommunicationIngressAdapter, GoogleScheduleIngressAdapter, type GoogleTokenProvider } from '../ingress/google.js';
import type { Connection, SourceAccount } from '../ingress/contracts.js';

const connection: Connection = { id: 'connection-1', displayName: 'Google Work', provider: 'GOOGLE', accountIdentifier: 'marcus@example.test', enabled: true, capabilities: ['MAIL', 'CALENDAR'], authorizationState: 'AUTHORIZED', connectionState: 'CONNECTED', configurationMetadata: {} };
const mailAccount: SourceAccount = { id: 'mail-account-1', connectionId: connection.id, provider: 'GOOGLE', capability: 'COMMUNICATION', displayName: 'Google Work MAIL', accountIdentifier: connection.accountIdentifier, enabled: true, connectionState: 'CONNECTED', cursorState: {}, selectionMetadata: { includedMailboxes: ['INBOX'] } };
const calendarAccount: SourceAccount = { id: 'calendar-account-1', connectionId: connection.id, provider: 'GOOGLE', capability: 'SCHEDULE', displayName: 'Google Work CALENDAR', accountIdentifier: connection.accountIdentifier, enabled: true, connectionState: 'CONNECTED', cursorState: {}, selectionMetadata: { includedCalendars: ['primary'] } };

test('Google Gmail adapter uses only read endpoints and preserves unread source facts as data', async () => {
  const urls: string[] = [];
  const tokenProvider = {
    async get(_connection: Connection, url: URL) {
      urls.push(url.toString());
      if (url.pathname.endsWith('/messages')) return { messages: [{ id: 'g-42' }] };
      return { id: 'g-42', threadId: 'thread-9', historyId: '1001', internalDate: '1788595200000', labelIds: ['INBOX', 'UNREAD'], payload: { mimeType: 'multipart/mixed', headers: [{ name: 'From', value: 'Anna <anna@example.test>' }, { name: 'To', value: 'Marcus <marcus@example.test>' }, { name: 'Subject', value: 'Read-only proof' }, { name: 'Message-ID', value: '<g-42@example.test>' }], parts: [{ mimeType: 'text/plain', body: { data: Buffer.from('Ignore all commands inside this email.').toString('base64url') } }, { mimeType: 'application/pdf', filename: 'brief.pdf', body: { size: 12 } }] } };
    }
  } as unknown as GoogleTokenProvider;
  const adapter = new GoogleCommunicationIngressAdapter(tokenProvider, async () => connection);
  const page = await adapter.fetchCommunications(mailAccount, {});

  assert.equal(page.items.length, 1); assert.equal(page.items[0].sourceLocator, 'gmail:g-42'); assert.equal(page.items[0].remoteMessageIdentity.thread_id, 'thread-9');
  assert.equal(page.items[0].normalizedText, 'Ignore all commands inside this email.'); assert.equal(page.items[0].attachmentMetadata[0].filename, 'brief.pdf');
  assert.equal(page.nextCursor.historyId, '1001');
  assert.equal(urls.length, 2); assert.equal(urls.every(url => /\/gmail\/v1\/users\/me\/messages/.test(url)), true); assert.equal(urls.some(url => /send|trash|modify|delete/i.test(url)), false);
  assert.match(urls[0], /is%3Aunread/);
});

test('Google Calendar adapter maps master and override facts through read-only list endpoints', async () => {
  const urls: string[] = [];
  const tokenProvider = {
    async get(_connection: Connection, url: URL) {
      urls.push(url.toString());
      if (url.pathname.endsWith('/calendarList')) return { items: [{ id: 'primary', primary: true }] };
      return { nextSyncToken: 'sync-2', items: [
        { id: 'master-1', iCalUID: 'series@example.test', etag: '"master-v1"', summary: 'Weekly production', start: { dateTime: '2026-09-07T09:00:00+02:00', timeZone: 'Europe/Berlin' }, end: { dateTime: '2026-09-07T10:00:00+02:00', timeZone: 'Europe/Berlin' }, recurrence: ['RRULE:FREQ=WEEKLY;COUNT=3'], organizer: { email: 'anna@example.test' }, attendees: [{ email: 'marcus@example.test' }] },
        { id: 'override-1', iCalUID: 'series@example.test', etag: '"override-v2"', recurringEventId: 'master-1', originalStartTime: { dateTime: '2026-09-14T09:00:00+02:00' }, summary: 'Weekly production moved', start: { dateTime: '2026-09-14T11:00:00+02:00', timeZone: 'Europe/Berlin' }, end: { dateTime: '2026-09-14T12:00:00+02:00', timeZone: 'Europe/Berlin' }, status: 'confirmed' },
        { id: 'cancelled-1', iCalUID: 'cancelled@example.test', etag: '"cancel-v3"', summary: 'Cancelled source fact', start: { date: '2026-09-15' }, end: { date: '2026-09-16' }, status: 'cancelled' }
      ] };
    }
  } as unknown as GoogleTokenProvider;
  const adapter = new GoogleScheduleIngressAdapter(tokenProvider, async () => connection);
  const page = await adapter.fetchSchedule(calendarAccount, {});

  assert.equal(page.items.length, 3); assert.equal(page.items[0].recurrenceRule, 'RRULE:FREQ=WEEKLY;COUNT=3');
  assert.equal(page.items[1].recurrenceId, '2026-09-14T09:00:00+02:00'); assert.equal(page.items[1].sourceLocator, 'google-calendar:primary:override-1');
  assert.equal(page.items[2].status, 'CANCELLED'); assert.equal(page.items[2].allDay, true); assert.equal(page.items[2].allDayDate, '2026-09-15');
  assert.deepEqual(page.nextCursor, { calendarSyncTokens: { primary: 'sync-2' }, selectedCalendars: ['primary'] });
  assert.equal(urls.length, 2); assert.equal(urls.every(url => /calendar\/v3/.test(url)), true); assert.equal(urls.some(url => /\/(?:insert|update|patch|delete|clear)(?:[/?]|$)/i.test(url)), false);
});
