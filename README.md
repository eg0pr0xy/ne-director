# NE_DIRECTOR_FRONTEND_PROTOTYPE_001

> The first frozen frontend North Star for the NE Director Chief of Staff product.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Local core API (development only)

```bash
docker compose -f docker-compose.core.yml up -d
export DIRECTOR_DATABASE_URL='postgres://ne_director:ne_director_local_only@127.0.0.1:55434/ne_director'
TMPDIR=/tmp npm run core:migrate
TMPDIR=/tmp npm run core:dev
```

Set `VITE_DIRECTOR_RUNTIME_MODE=api` and `VITE_DIRECTOR_API_BASE_URL=http://127.0.0.1:4600/api/v1` to use the API service seam. `mock` remains explicit; API failure does not fall back to mock data.

## Communication and schedule ingress

`NE_DIRECTOR_COMMUNICATION_AND_SCHEDULE_INGRESS_AUTHORITY_001` adds a
provider-neutral, read-only perception boundary. It persists normalized
communication and schedule source facts, preserves external identities as
unresolved unless explicitly mapped, emits only factual Director Events, and
projects active schedule observations into `GET /api/v1/today`.

The service exposes `GET /api/v1/ingress/accounts`,
`GET /api/v1/ingress/communications`, `GET /api/v1/ingress/schedule`, and
`POST /api/v1/ingress/sync`. Sync writes local evidence only. Server
composition registers the selected Google Provider 001 read-only Gmail and
Calendar adapters, which remain unavailable until an operator configures
approved local secret injection. It contains no send/reply, mailbox mutation,
calendar mutation, AppleScript, or local client-database access path.

Connections are provider-neutral and user-managed rather than singleton
operator configuration. `GET`/`POST`/`PATCH`
`/api/v1/ingress/connections` supports multiple named connections, for example
private, work, and shared-production accounts. A connection owns its provider,
non-secret configuration metadata, authorization state, health state, and the
enabled `MAIL`, `CALENDAR`, and `CONTACTS` capabilities. Each enabled
capability has its own SourceAccount and selection metadata for included
mailboxes or calendars. For Google,
`POST /connections/:id/authorization-intent` returns an OAuth 2.0
Authorization Code + PKCE handoff URL. After the callback verifies the token
exchange, the provider-neutral SecretStore writes the refresh token outside
PostgreSQL and returns an opaque `secret://` reference; only that reference is
persisted in connection metadata. The local-development backend uses the
current Windows user's DPAPI-protected LocalAppData store and owner-only ACLs.
The core reads only the
following local environment names: `DIRECTOR_GOOGLE_OAUTH_CLIENT_ID`,
`DIRECTOR_GOOGLE_OAUTH_CLIENT_SECRET`,
`DIRECTOR_GOOGLE_OAUTH_REDIRECT_URI`, and either
`DIRECTOR_GOOGLE_REFRESH_TOKEN` as an explicit read-only environment fallback.
Environment refresh-token injection is not the product persistence path. Values
must never be added to `.env.example`, Git, reports, or chat.
`POST /connections/:id/revoke` disables all linked source accounts locally.
Contacts is a configurable future capability only—there is no Contacts
ingestion or identity merge in this authority.

Run the deterministic PostgreSQL proof only against a disposable database:

```bash
TMPDIR=/tmp DIRECTOR_DATABASE_URL='postgres://USER:PASSWORD@HOST:PORT/DATABASE' npm run core:migrate
TMPDIR=/tmp DIRECTOR_DATABASE_URL='postgres://USER:PASSWORD@HOST:PORT/DATABASE' npm run ingress:proof
```

The placeholders above are deliberately non-secret. Do not paste provider
credentials into source control, `.env.example`, reports, or chat.

## Architecture

This project is a React-based frontend prototype for the NE Director Chief of Staff application.

*   **Pages**: Found in `/src/pages/`, representing the primary workspace views (Today, Attention, Projects, People, Timeline, Search, Chat, Settings).
*   **Features**: Domain-specific UI modules (e.g., `/src/features/today/`).
*   **Components**: Reusable UI elements (e.g., CommandBar, ContextDrawer).
*   **Shared State**: Managed globally via `AppStore.tsx` using React Context.
*   **Mock Data**: Canonical state is initialized from `/src/data.ts`.
*   **Service Boundary**: The UI interfaces with `/src/services/api.ts` which currently resolves static mock data.

## Future backend

The current mock infrastructure is intended to be replaced by the **NE Director Chief of Staff API**, which will orchestrate:

*   **ORDO**: Production logistics platform.
*   **NARRATE**: Creative knowledge base.
*   **PRESENCE**: Real-time scheduling.
*   **MNEME**: Archival and references.
*   **IMPERIUM MENTIS**: Strategic decision engine.

*Do not implement these integrations in this repository at this phase.*
