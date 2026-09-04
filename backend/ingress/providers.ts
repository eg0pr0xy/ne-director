import { createHash, randomUUID } from 'node:crypto';
import type { CommunicationIngressProvider, InboundCommunication, ProviderPage, ReadOnlyMailTransport, ReadOnlyScheduleTransport, ScheduleIngressProvider, ScheduleRecord, SourceAccount } from './contracts.js';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');

/** iCloud Mail uses a caller-supplied TLS IMAP transport; this adapter has no SMTP or mutation surface. */
export class ICloudCommunicationIngressAdapter implements CommunicationIngressProvider {
  readonly provider = 'ICLOUD_MAIL';
  constructor(private readonly transport: ReadOnlyMailTransport, private readonly backfillLimit = 100) {}
  async fetchCommunications(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<InboundCommunication>> {
    const listed = await this.transport.listUnreadOrChanged(cursor, this.backfillLimit);
    const items = await Promise.all(listed.map(async item => {
      const body = await this.transport.fetchBodyPeek(item.locator);
      return { ...body, id: randomUUID(), sourceAccountId: account.id, sourceSystem: this.provider, sourceLocator: item.locator, providerRevision: item.revision, remoteMessageIdentity: item.identity, observedAt: new Date().toISOString(), contentHash: body.contentHash || hash(body.normalizedText) };
    }));
    return { items, nextCursor: { ...cursor, lastLocator: listed.at(-1)?.locator ?? cursor.lastLocator } };
  }
}

/** iCloud Calendar is represented through an injected read-only CalDAV-compatible transport. */
export class ICloudScheduleIngressAdapter implements ScheduleIngressProvider {
  readonly provider = 'ICLOUD_CALENDAR';
  constructor(private readonly transport: ReadOnlyScheduleTransport, private readonly allowedCalendars: string[]) {}
  async fetchSchedule(account: SourceAccount, cursor: Record<string, unknown>): Promise<ProviderPage<ScheduleRecord>> {
    const discovered = await this.transport.discoverCalendars();
    const allowed = discovered.filter(calendar => this.allowedCalendars.includes(calendar.ref)).map(calendar => calendar.ref);
    const page = await this.transport.readSchedule(cursor, allowed);
    return { items: page.items.map(item => ({ ...item, id: randomUUID(), sourceAccountId: account.id, sourceSystem: this.provider, observedAt: new Date().toISOString() })), nextCursor: page.nextCursor };
  }
}

/** Test-only second provider: proves the contracts are not iCloud-shaped. */
export class FakeStandardProvider implements CommunicationIngressProvider, ScheduleIngressProvider {
  readonly provider = 'FAKE_STANDARD';
  constructor(private readonly communications: InboundCommunication[] = [], private readonly schedule: ScheduleRecord[] = []) {}
  async fetchCommunications(_account: SourceAccount, cursor: Record<string, unknown>) { return { items: this.communications, nextCursor: { ...cursor, replay: true } }; }
  async fetchSchedule(_account: SourceAccount, cursor: Record<string, unknown>) { return { items: this.schedule, nextCursor: { ...cursor, replay: true } }; }
}
