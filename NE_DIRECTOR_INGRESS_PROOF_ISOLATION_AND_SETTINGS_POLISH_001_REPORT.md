# NE_DIRECTOR_INGRESS_PROOF_ISOLATION_AND_SETTINGS_POLISH_001

## VERDICT

`PROVEN_FOR_LOCAL_DEVELOPMENT` for proof-database isolation, targeted fixture
cleanup, and Settings scrollbar/scroll-container behavior. Google real-account
acceptance remains intentionally unrun.

## ROOT CAUSE AND CANONICAL DB RISK

The former `backend/scripts/ingress-proof.ts` imported the canonical
`backend/persistence/db.ts` pool and truncated ingress/Core tables through
`DIRECTOR_DATABASE_URL`. This was a material development-safety defect: a proof
run could erase or contaminate the normal Director development database.

## PROOF DB CONTRACT AND FAIL-CLOSED GUARD

`backend/persistence/proof-db.ts` now constructs the proof runner's sole Pool
from `DIRECTOR_PROOF_DATABASE_URL`. There is no normal-pool import or fallback.
The URL is rejected before any SQL unless its database name ends in `_proof` and
is neither canonical nor production-like; failures use
`PROOF_DATABASE_REQUIRED` without printing a credential value.

`docker-compose.core.yml` provides a separate disposable `ne_director_proof`
PostgreSQL service on local port `55435`. Canonical `ne_director` remains on
`55434`; this does not create a second product authority.

The automated isolation harness first runs the proof with a canonical URL but
without a proof URL, verifies `PROOF_DATABASE_REQUIRED`, and compares canonical
row-count fingerprints before/after. It then runs the full proof against
`ne_director_proof` and repeats the canonical fingerprint comparison. Both
comparisons were unchanged.

## FIXTURE CONTAMINATION AND CLEANUP

Inspection found the known original proof fixtures and three additional prior
Secret Authority controlled fixtures in the canonical database. Cleanup was not
performed by display name alone: each candidate required exact provider,
`.example.test` identifier, capability shape, authorization state, linked
SourceAccount shape, and (where applicable) an expected opaque local proof
reference. `dev:cleanup-ingress-fixtures` defaults to `DRY_RUN`; only
`--confirm` performs a targeted transaction and invalidates matching local DPAPI
references. It deleted six original fixture SourceAccounts and six proven
fixture Connections. A follow-up dry run found no candidates.

The normal API now returns `items: []` from `GET /api/v1/ingress/connections`.
Therefore Settings → Connections truthfully shows **No connections configured**;
Google remains available but is not seeded as demo data.

## SECRET AND GOOGLE REGRESSION

The pre-existing provider-neutral DPAPI SecretStore, opaque references, PKCE
authorization intent/callback, local revoke, and read-only Gmail/Calendar
adapters were retained. The focused regression suite includes these paths and
passed. No real OAuth consent, Gmail access, or Calendar access was attempted.
The honest remaining status is `GOOGLE_REAL_AUTHORIZATION_REQUIRED`.

## SCROLLBAR AND DOUBLE-SCROLL AUDIT

Global CSS introduces theme variables `--scrollbar-track`,
`--scrollbar-thumb`, and `--scrollbar-thumb-hover`, with Firefox thin-scrollbar
properties and Chromium/Edge 8px rounded WebKit treatment. Dark uses restrained
white alpha; White uses restrained black alpha; tracks are transparent, avoiding
a bright gutter while retaining native discoverability.

Settings now uses border-box full-height containment. The main shell does not
overflow; the right Settings content is the only overflowing primary container.
The left navigation gains an independent scrollbar only at desktop height when
needed. Both employ stable scrollbar gutters.

Headless Chromium runtime checks at 1440, 1280, and 1024 dark viewports and a
1440 white viewport confirmed: API-backed empty Connections state, no main-shell
overflow, exactly one overflowing vertical container, visible Add Connection
action, and the expected dark/white scrollbar variables. No clipping or
inaccessible bottom action was observed by the DOM/layout checks.

## VALIDATION

- Focused tests: **15/15 passed**.
- `ingress:isolation:proof`: passed; fail-closed absence and canonical
  before/after equality proven.
- TypeScript lint: passed.
- Vite production build: passed (existing bundle-size warning only).

## REMAINING REAL GOOGLE GAP

The local OAuth client configuration and browser consent have not been supplied
or run. Do not paste credentials/tokens into chat. After local OAuth setup,
open Settings → Connections → Google → Connect and complete consent to begin
the separately authorized real-provider acceptance.
