# NE_DIRECTOR_COMMUNICATION_AND_SCHEDULE_INGRESS_AUTHORITY_001

## Verdict

`NE_DIRECTOR_COMMUNICATION_AND_SCHEDULE_INGRESS_AUTHORITY_001_PARTIAL`

The additive, provider-neutral, read-only ingress authority and its
deterministic PostgreSQL proof are complete. Provider 001 is now explicitly
`GOOGLE`: Gmail and Google Calendar have read-only adapters and a Google OAuth
2.0 Authorization Code + PKCE handoff. No approved local Google OAuth client or
refresh-token secret reference was available for inspection. Therefore no real
external read, unread-state proof, calendar read, or real restart/outage
recovery is claimed.

## Frozen prerequisite and branch

- Frozen Core base: `3b0dc5842b2fc475c08450c1a85c8c04bfed0b1a`
- Freeze tag: `NE_DIRECTOR_CORE_OPERATIONAL_MODEL_AND_API_AUTHORITY_001_PROVEN`
- Working branch: `director/communication-schedule-ingress-001`
- Core semantics were not changed. The only Core interaction is factual
  `director_events` insertion through its existing durable Event authority.

## Provider discovery and protocol decision

Apple Mail and Apple Calendar are clients, not evidence of a backing provider.
The user selected `GOOGLE` as Provider 001. No account identifier, approved
OAuth client configuration, or refresh-token secret reference was available for
inspection. iCloud is not asserted as the active Provider 001.

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

Settings now contains an API-runtime-only **Connections** surface. It loads
Connection, SourceAccount, and provider-registry truth from PostgreSQL/API on
each page load; mock mode deliberately displays no simulated connection state.
The Add Connection form draws its choices from the backend provider registry,
not scattered React conditionals. Google is marked `AVAILABLE` for Mail and
Calendar with `OAUTH_2_AUTHORIZATION_CODE_PKCE`; iCloud, Microsoft 365, and
Other remain explicitly unavailable. The Google handoff URL requests only
Gmail read-only and Calendar read-only scopes. The UI never marks a connection
authorized itself, never retains secrets in frontend state or local storage,
and displays only safe account metadata, selections, freshness, and safe error
codes. Inbox/primary-calendar choices are labelled planned defaults; real
mailbox/calendar inventory remains provider discovery after verified
authorization, never a React-invented claim of available remote resources.

`backend/ingress/google.ts` implements bounded Gmail discovery using the
`is:unread` query and explicit mailbox labels, then reads message details by
Google message ID. It imports stable message/thread/history identities, RFC
headers, plain-text body data, and attachment metadata only; it has no Gmail
send, modify, trash, delete, move, or label mutation path. Calendar sync first
discovers the user's calendars, reads only selected calendar IDs, retains
calendar/event/iCalUID/recurrence-instance identities and provider revisions,
and stores per-calendar sync tokens. Recurrence masters, overrides, all-day
dates, cancellation facts, and source timezone values remain provider facts.

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
the Google read-only adapters but fails closed until its local secret authority
can refresh an access token. The API does not return credentials or stored
normalized mail bodies. `GET /api/v1/today` now derives `calendar` from
active current schedule source records, retaining all-day local-date semantics;
cancelled or removed revisions remain historical but are excluded.

## Evidence

The conventional Node discovery suite passed **11/11** focused contract tests:
peek-only mail behavior and unread fixture, bounded cursor/backfill identity,
prompt-injection inertness, allowlisted read-only calendar discovery, all-day /
recurrence override facts, timezone/DST preservation, a second provider
contract, two provider-registry tests proving Settings choices are centralized
and adapter availability is explicit, plus deterministic Gmail and Google
Calendar adapter tests proving only read endpoints are called and that Gmail
unread facts, Google message/thread/history identifiers, recurrence overrides,
cancellation, all-day dates, and per-calendar sync tokens are retained.

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
  an included-calendar selection, attempts authorization intent without a
  credential, receives `PROVIDER_ADAPTER_NOT_IMPLEMENTED` before authorization,
  and locally revokes a work
  connection plus both linked SourceAccounts;
- two fresh API child processes read the same persisted communication and TODAY
  schedule IDs after restart.

The PostgreSQL proof additionally covers three simultaneous configured connections,
independent selections, read-only provider-scoped health aggregation,
authorization failure, local revoke, and the guarantee that degradation of one
connection leaves another connected connection healthy. It asserts that the
Connections API response contains no password, token, secret, or app-specific
password field/value.

Core regression was rerun against the same disposable PostgreSQL authority:
Core idempotency/concurrency proof, rollback proof, and API process restart
proof remain separate from ingress and must pass in closure evidence. The build
and TypeScript lint also pass.

## Files changed

- `backend/migrations/0002_ingress.sql`
- `backend/migrations/0003_connections.sql`
- `backend/ingress/contracts.ts`
- `backend/ingress/provider-registry.ts`
- `backend/ingress/google.ts`
- `backend/ingress/providers.ts`
- `backend/ingress/service.ts`
- `backend/server.ts`
- `backend/scripts/ingress-proof.ts`
- `backend/tests/ingress.contract.test.ts`
- `backend/tests/provider-registry.test.ts`
- `backend/tests/google-provider.contract.test.ts`
- `src/services/api.ts`, `src/services/connections.ts`, `src/pages/SettingsPage.tsx`
- `package.json`, `README.md`, `.env.example`

## Remaining gap and next authorized slice

`GOOGLE_LOCAL_SECRET_AUTHORITY_REQUIRED`: an operator must configure the
approved local Google OAuth client ID, client secret, exact callback redirect
URI, and an injected refresh-token secret reference without placing credential
values in chat, Git, reports, logs, or `.env.example`. The callback deliberately
does not write a refresh token because this repository has no approved writable
secret vault; it verifies the OAuth exchange and then fails closed until the
local secret authority owns storage. Once the secret authority is configured,
real-provider acceptance must prove controlled Gmail unread read and replay,
Google Calendar update/cancellation/recurrence, restart, outage/recovery, and
browser-render/reload behavior. No iCloud parity is claimed until that evidence
exists.

After real-provider acceptance succeeds, the next authorized authority is
`NE_DIRECTOR_INGRESS_INTERPRETATION_AND_ATTENTION_AUTHORITY_001`.

## Commit history

This branch starts at frozen main `3b0dc5842b2fc475c08450c1a85c8c04bfed0b1a`.
The closure commit is `feat: establish Director communication and schedule
ingress`; its immutable SHA is recorded by `git log` after this report is
committed and pushed.
