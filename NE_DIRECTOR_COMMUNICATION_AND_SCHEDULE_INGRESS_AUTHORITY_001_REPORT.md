# NE_DIRECTOR_COMMUNICATION_AND_SCHEDULE_INGRESS_AUTHORITY_001

## Verdict

`NE_DIRECTOR_COMMUNICATION_AND_SCHEDULE_INGRESS_AUTHORITY_001_PARTIAL`

The additive, provider-neutral, read-only ingress authority and its
deterministic PostgreSQL proof are complete. The actual backing mail and
calendar providers are `UNKNOWN`: no approved local provider configuration or
secret reference was available for inspection. Therefore no real external read,
unread-state proof, calendar read, or real restart/outage recovery is claimed.

## Frozen prerequisite and branch

- Frozen Core base: `3b0dc5842b2fc475c08450c1a85c8c04bfed0b1a`
- Freeze tag: `NE_DIRECTOR_CORE_OPERATIONAL_MODEL_AND_API_AUTHORITY_001_PROVEN`
- Working branch: `director/communication-schedule-ingress-001`
- Core semantics were not changed. The only Core interaction is factual
  `director_events` insertion through its existing durable Event authority.

## Provider discovery and protocol decision

Apple Mail and Apple Calendar are clients, not evidence of a backing provider.
Available non-secret configuration evidence did not identify an account,
provider, or authorization reference, so both provider classifications remain
`UNKNOWN`; iCloud is not asserted as the active Provider 001.

The optional iCloud-shaped adapters are contract implementations, not a claim
of real iCloud access. Apple documents iCloud Mail IMAP at
`imap.mail.me.com` over TLS/SSL on port 993 and says it does not support POP;
it documents app-specific passwords as the fallback where native Apple Account
authorization is not available. SMTP is deliberately absent from this
authority. Apple also documents third-party Apple Account authorization where
supported, revocation through Account Data Sharing, and revocable app-specific
passwords. Apple’s developer documentation identifies CalDAV/iCloud calendar
type, but the official sources reviewed did not supply a public direct endpoint
or authorization path to invent here. A real iCloud calendar transport remains
an operator-configured, documented transport boundary.

Official sources reviewed:

- [Apple: Mail server settings](https://support.apple.com/en-gb/102525)
- [Apple: app-specific passwords](https://support.apple.com/en-gb/102654)
- [Apple: manage third-party Apple Account access](https://support.apple.com/en-ca/121539)
- [Apple Developer: EKCalendarType.calDAV](https://developer.apple.com/documentation/eventkit/ekcalendartype/caldav)

## Implemented authority

`backend/ingress/contracts.ts` defines provider-neutral `CommunicationIngressProvider`
and `ScheduleIngressProvider` contracts plus normalized communication and
schedule facts. No frozen Core contract imports an iCloud, Gmail, Exchange, or
CalDAV domain type.

`backend/migrations/0002_ingress.sql` adds additive durable tables for source
accounts, communication records, schedule records, account-scoped cursors, and
unresolved external identities. Credentials are not database fields. Account
metadata carries connection state, freshness times, error code, and cursor
metadata only.

`backend/migrations/0003_connections.sql` adds the provider-neutral,
user-managed `director_connections` authority. A Connection has a display
name, provider, non-secret account/configuration metadata, enabled
`MAIL`/`CALENDAR`/`CONTACTS` capabilities, authorization state, and aggregated
health/freshness. It owns multiple SourceAccounts, so it supports simultaneous
connections such as a private iCloud account, Microsoft 365 work account, and
shared Google calendar without hard-coding any provider as a singleton.
SourceAccount selection metadata persists the explicitly included mailboxes or
calendars. Contacts is intentionally configuration-only in this authority: a
Contacts SourceAccount fails closed with `INGRESS_CAPABILITY_NOT_IMPLEMENTED`
until a separately authorized Contacts ingress authority exists.

`backend/ingress/service.ts` uses one transaction for normalized source fact,
factual Event, and cursor update. A failure after source persistence rolls the
transaction back; replay then creates one fact and one Event. Provider fetch
failures are separated from local persistence failures, retain prior records,
and set `DEGRADED` or `AUTH_REQUIRED` without exposing a provider stack trace.

Communication source facts emit only `COMMUNICATION_RECEIVED` or
`COMMUNICATION_UPDATED`. Schedule facts emit only `SCHEDULE_ITEM_OBSERVED`,
`SCHEDULE_ITEM_UPDATED`, `SCHEDULE_ITEM_CANCELLED`, or
`SCHEDULE_ITEM_REMOVED`. No message prose is promoted to an Obligation,
Decision, Open Loop, Attention item, external action, or LLM request.

The iCloud mail adapter exposes only list and `BODY.PEEK` retrieval through a
narrow injected transport; it has no SMTP, send, store, move, copy, expunge,
append, or mailbox-admin operation. The calendar adapter exposes calendar
discovery and read-only schedule retrieval through an explicit allowlist; its
transport has no PUT, DELETE, or PROPPATCH operation. Attachments are metadata
only. Mail content remains untrusted stored source data.

Identity records default to `UNRESOLVED`, with explicit `RESOLVED` and
`AMBIGUOUS` states available. No display-name matching creates a canonical
Person. Schedule identity uses source account, calendar locator, remote UID,
recurrence ID, and provider revision; all-day values retain an `all_day_date`
instead of inventing a UTC-midnight instant.

## API and TODAY

The additive API surfaces are:

- `GET`/`POST`/`PATCH /api/v1/ingress/connections`
- `POST /api/v1/ingress/connections/:id/authorization-intent`
- `POST /api/v1/ingress/connections/:id/revoke`
- `GET /api/v1/ingress/accounts`
- `PATCH /api/v1/ingress/accounts/:id`
- `GET /api/v1/ingress/communications?limit=&offset=`
- `GET /api/v1/ingress/schedule?limit=&offset=`
- `POST /api/v1/ingress/sync` with a source-account UUID

Sync mutates local Director evidence only. Normal server composition registers
no external provider until discovery and authorization are complete. The API
does not return credentials or stored normalized mail bodies. `GET /api/v1/today` now derives `calendar` from
active current schedule source records, retaining all-day local-date semantics;
cancelled or removed revisions remain historical but are excluded.

## Evidence

The conventional Node discovery suite passed **7/7** focused contract tests:
peek-only mail behavior and unread fixture, bounded cursor/backfill identity,
prompt-injection inertness, allowlisted read-only calendar discovery, all-day /
recurrence override facts, timezone/DST preservation, and a second provider
contract.

The disposable PostgreSQL `ingress:proof` passed its asserted end-to-end cases:

- one communication and one schedule source fact/event across replay;
- two persisted account-scoped cursors;
- schedule update creates a current revision and `SCHEDULE_ITEM_UPDATED`;
- cancellation retains three schedule revisions, emits cancellation, and removes
  the item from TODAY;
- all-day event projects by source local date;
- fault after fact persistence rolls back fact and cursor; recovery/replay
  creates exactly one fact and Event;
- a provider fact whose account identity differs from the locked source account
  is rejected before any source fact is written;
- authorization failure becomes `AUTH_REQUIRED` before a separate outage proof
  becomes `DEGRADED`, with records retained;
- API returns safe `400` validation and `409` unconfigured-provider contracts;
- account listing contains no credential value and the communication projection
  omits the stored prompt-injection fixture body;
- Settings-facing connection proof creates three simultaneous generic
  connections (iCloud-shaped private, Microsoft 365 work, and Google shared),
  provisions their independent Mail/Calendar/Contacts SourceAccounts, persists
  an included-calendar selection, records authorization intent without a
  credential, fails closed before authorization, and locally revokes a work
  connection plus both linked SourceAccounts;
- two fresh API child processes read the same persisted communication and TODAY
  schedule IDs after restart.

Core regression was rerun against the same disposable PostgreSQL authority:
Core idempotency/concurrency proof, rollback proof, and API process restart
proof remain separate from ingress and must pass in closure evidence. The build
and TypeScript lint also pass.

## Files changed

- `backend/migrations/0002_ingress.sql`
- `backend/migrations/0003_connections.sql`
- `backend/ingress/contracts.ts`
- `backend/ingress/providers.ts`
- `backend/ingress/service.ts`
- `backend/server.ts`
- `backend/scripts/ingress-proof.ts`
- `backend/tests/ingress.contract.test.ts`
- `src/services/api.ts`
- `package.json`, `README.md`, `.env.example`

## Remaining gap and next authorized slice

`PROVIDER_DISCOVERY_REQUIRED`: an operator must identify the backing mail and
calendar providers and configure their documented local secret/authorization
flow without placing credentials in chat, Git, reports, logs, or `.env.example`.
Then real-provider acceptance must prove controlled read, non-mutation,
replay/restart, update/cancellation, recurrence, and outage/recovery. No iCloud
parity is claimed until that evidence exists.

After real-provider acceptance succeeds, the next authorized authority is
`NE_DIRECTOR_INGRESS_INTERPRETATION_AND_ATTENTION_AUTHORITY_001`.

## Commit history

This branch starts at frozen main `3b0dc5842b2fc475c08450c1a85c8c04bfed0b1a`.
The closure commit is `feat: establish Director communication and schedule
ingress`; its immutable SHA is recorded by `git log` after this report is
committed and pushed.
