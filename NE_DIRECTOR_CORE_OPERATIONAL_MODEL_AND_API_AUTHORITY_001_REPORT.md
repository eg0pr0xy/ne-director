# NE_DIRECTOR_CORE_OPERATIONAL_MODEL_AND_API_AUTHORITY_001

## 1. Final verdict

`NE_DIRECTOR_CORE_OPERATIONAL_MODEL_AND_API_AUTHORITY_001_PROVEN`

The defined local, single-user Director Core authority is proven. PostgreSQL is the canonical persistence authority; API and browser proofs cover the Location B decision and Open Loop paths, including failures and recovery. This verdict does not claim authentication, external ingress, or external action execution.

## 2. Scope

This closure covers only Event, Obligation, Decision, Open Loop, Timeline, their deterministic projections, the versioned local API, and the existing React UI in explicit API mode. It adds no external integrations, agents, LLMs, Gmail, Calendar, or autonomous actions.

## 3. Git state

- Repository: `/mnt/d/code/ne-director`
- Branch: `director/core-operational-model-001`
- Closure base HEAD: `6fbbdac48b7766005ffe3723233667b856930ef8`
- Origin: `origin` / `https://github.com/eg0pr0xy/ne-director.git`
- Before this closure documentation commit: ahead/behind `0/0`; working tree clean; no untracked files.

Verified proof commits are `6be7328 Prove Director API restart durability`, `4aa49a1 Handle Director database recovery`, and `6fbbdac Prove Director frontend API runtime`.

## 4. Architecture

The Express composition exposes `/api/v1`; PostgreSQL 16 owns canonical rows. `backend/core.ts` owns transactional commands. API projections query canonical rows; the frontend `DirectorApiService` maps API responses through `ChiefOfStaffService`. React state is a render cache only, revalidated after commands and rebuilt after reload.

## 5. Domain authority map

| Canonical PostgreSQL records | Derived records |
|---|---|
| Event, Obligation, Decision, Open Loop, Timeline | Attention, Today, HARBOUR needs-you count, Anna Meyer open-item count, Waiting For, and I Handled where the API provides it |

`TodayState`, `AttentionItem`, `needsYouCount`, and `openItemsCount` are projections. They are not independently persisted authorities. Browser local storage contains only profile and settings preferences.

## 6. PostgreSQL

PostgreSQL 16 ran in `ne-director-postgres-1` with the existing named volume. A disposable `ne_director_closure_proof` database was created from empty state, migrated, exercised through API and PostgreSQL restarts, and treated as proof-only state.

## 7. Migration/schema

`0001_core.sql` applied successfully to the empty closure database. It created `director_schema_migrations`, `director_events`, `director_obligations`, `director_decisions`, `director_open_loops`, and `director_timeline`. Runtime schema inspection confirmed the event idempotency unique constraint, decision/obligation uniqueness and foreign keys, open-loop foreign keys, and the obligation resolution check constraint.

## 8. Event

The structured Location B fixture persists one `DECISION_REQUEST_RECEIVED` Event with HARBOUR and Anna Meyer provenance. In the closure database its event ID was `c02c13ae-8968-451f-8f50-91f7d986e1ed` for the browser fixture; the independent restart-idempotency run used `a6e854fe-20b9-4197-882d-48845d853939` as the associated Decision ID.

## 9. Obligation

Location B creates one `DECISION_REQUIRED` OPEN Obligation. Recording a decision resolves that same obligation inside the transaction. The browser fixture evidence recorded obligation `834c8f66-9178-41fb-bc0d-de6877e48d32`, OPEN before approval and resolved afterwards.

## 10. Decision

`recordDecision` locks the decision row with `FOR UPDATE`, validates existence/state/option, changes the decision to `DECIDED`, resolves the obligation, and appends the human Timeline record in one PostgreSQL transaction. It exposes safe `NOT_FOUND` (404), `INVALID_STATE_TRANSITION` (409), and `INVALID_DECISION_OPTION` (422) domain errors.

## 11. Open Loop

The Budget confirmation fixture creates a persistent OPEN Open Loop for Anna Meyer / HARBOUR with an absolute UTC `expected_by`. Closure evidence used `3a8cd41a-133b-4936-9e1e-bcf29bfa0f0d`; it survived API and PostgreSQL restart, then `POST /api/v1/open-loops/:id/resolve` set it to RESOLVED. Detail retrieval retained its historical row while the active list became empty.

## 12. Attention

Attention is deterministically derived by joining active Obligations to OPEN Decisions. The initial Location B record produced exactly one `DECISION_REQUIRED` / `needs_you` signal; after the decision it produced zero active signals.

## 13. Timeline

Timeline is persisted and ordered from canonical rows. The Location B path records pre-decision internal entries and a human `DIRECTOR_DECISION_RECORDED` entry, `You approved Location B`.

## 14. Projections

The API proves Today, Attention, HARBOUR, Anna Meyer, Timeline, and active Open Loop projections. After Location B, direct canonical projections returned HARBOUR `needsYouCount: 0, openDecisions: 0` and Anna `openItemsCount: 0`; browser API mode rendered the equivalent state.

## 15. API

All operational endpoints use `/api/v1`. The API exposes projection/domain envelopes for Today, Attention, Projects, People, Timeline, Open Loops, and Decisions. The frontend makes real calls for lists and required HARBOUR/Anna detail endpoints. CORS is exact-origin (`http://127.0.0.1:3000` by default), includes a limited GET/POST/OPTIONS preflight, and never uses `*`.

## 16. Failure taxonomy

`CoreError` provides typed safe domain responses. The error bridge maps unavailable PostgreSQL connection errors to `HTTP 503`, `PERSISTENCE_UNAVAILABLE`, `Persistence unavailable`; other unexpected persistence errors are a safe `PERSISTENCE_FAILURE` 500. No raw PostgreSQL error is returned. Browser API mode renders an unavailable banner and does not change to mock mode.

## 17. Location B Golden Path

`structured fixture → Event → OPEN Obligation → OPEN Decision → Attention DECISION_REQUIRED → Today Needs You → HARBOUR / Anna projections → browser POST LOCATION_B → atomic backend commit → Obligation RESOLVED → You approved Location B Timeline → backend refetch → browser projections → full reload → same persisted result`.

Browser fixture evidence: Event `c02c13ae-8968-451f-8f50-91f7d986e1ed`, Obligation `834c8f66-9178-41fb-bc0d-de6877e48d32`, Decision `d9400e95-215d-4326-8679-479db46c2acc`. The browser sent `POST /api/v1/decisions/d9400e95-215d-4326-8679-479db46c2acc/record`; the canonical result was `DECIDED`, `LOCATION_B`.

## 18. Idempotency

Automated PostgreSQL proof `backend/scripts/proof.ts` replayed the same source event/idempotency key and asserted `events=1`, `obligations=1`, `decisions=1`, `timeline=2`. The final output matched exactly.

Closure restart-idempotency was additionally executed through a fresh API process: seed returned `a6e854fe-20b9-4197-882d-48845d853939`; after restarting the process, replay returned the same ID and the database still held `1|1|1|1` for events, obligations, decisions, and open loops. This is runtime proof, not merely an inferred unique constraint.

## 19. Concurrency

`backend/scripts/proof.ts` raced `LOCATION_A` against `LOCATION_B`. One response succeeded and one failed `INVALID_STATE_TRANSITION`; final state was one DECIDED Decision, one selected option, one RESOLVED Obligation, and exactly one `DIRECTOR_DECISION_RECORDED` Timeline entry. There was no double success.

## 20. Rollback

`backend/scripts/rollback-proof.ts` invokes only the unmounted test-only `recordDecisionWithInjectedFailure` seam against real PostgreSQL. It passed with `status=OPEN`, `decided_at=null`, `obligation_status=OPEN`, `resolved_at=null`, and `timeline_count=0`. The seam is not imported into HTTP composition.

## 21. API restart

`backend/scripts/api-restart-proof.ts` starts a real API child process, persists Location B, kills it, starts a new process, and retrieves the same DECIDED `LOCATION_B` Decision with `needsYou=0`. The latest run returned decision `9f38fc57-00b9-4ace-a84b-254217b0a6e7`.

## 22. PostgreSQL restart

The closure database survived PostgreSQL container restart without volume removal. After restart, the same API process returned the same Decision and Open Loop IDs/states. The resolved Open Loop detail remained RESOLVED; the active endpoint returned `items: []`.

## 23. Pool recovery

With the API process kept running, stopping PostgreSQL returned `HTTP 503` with `PERSISTENCE_UNAVAILABLE`. Restarting PostgreSQL without restarting the API then returned `HTTP 200` Today data, including the persisted human decision. API restart, database restart, and same-process pool recovery are independently proven.

## 24. Frontend API runtime

Explicit API mode was run with `VITE_DIRECTOR_RUNTIME_MODE=api` and a local `/api/v1` base URL. Chrome runtime evidence captured GET Today, Attention, Projects, HARBOUR detail, People, Anna detail, Timeline, and Open Loops. React components use the service seam; API mode has no raw operational fetch in components.

## 25. Browser reload

After the real browser approval, a full Chrome navigation reload retained zero Needs You items and retained `You approved Location B` on Timeline. HARBOUR and Anna rendered from API-backed lists. This was an actual reload, not component remounting.

## 26. API outage/recovery

With Location B visible, stopping the API and attempting approval showed `Decision could not be recorded. No mock fallback was used.` The item was not locally resolved and no synthetic Timeline entry was added. A reload displayed `Director API unavailable. No mock data is being shown.` Restarting API and refreshing returned canonical data; the later real approval persisted normally.

## 27. Mock/API isolation

`mock` is an explicit fixture/demo mode. `api` is explicit persistent authority. The acceptance run started mock at port 3001 and API mode separately at port 3000. API failure cannot silently select mock, and mock-only synthetic subsequent events are unreachable below the API-mode return.

## 28. Honesty boundary

The canonical conclusion is **Director decision recorded**. Neither the API nor API-mode UI fabricates `Producer informed`, `ORDO dependency resolved`, email sent, NARRATE updated, or Calendar changed. Those external effects are not canonical without a verified integration and no such integration exists in this scope.

## 29. Security boundary

This is intentionally **LOCAL DEVELOPMENT / SINGLE-USER AUTHORITY**. Authentication, multi-user tenancy, and production deployment are not claimed. `.env*` is ignored. `.env.example` and `docker-compose.core.yml` deliberately contain the local-only Compose database password `ne_director_local_only`; it is not a production credential and must not be reused outside local development. Dev fixture endpoints are absent when `NODE_ENV=production`; request payloads are validated; CORS is exact-origin; errors are sanitized.

## 30. Exact test counts

| Category | Exact evidence/count |
|---|---|
| Domain, Event, Obligation, Decision, Attention, projections | 1 manual/runtime Location B golden-path run plus closure API checks |
| Event/idempotency | 1 automated proof script; 1 additional restart-idempotency runtime replay |
| Concurrency | 1 automated conflicting pair (`LOCATION_A` vs `LOCATION_B`) |
| Rollback | 1 automated injected-fault PostgreSQL transaction proof |
| API restart | 1 automated child-process restart proof |
| PostgreSQL restart / pool recovery | 1 closure runtime restart/recovery sequence |
| Open Loop | 1 frontend/browser projection run and 1 closure API/DB-restart/resolution run |
| Failure taxonomy | 1 closure HTTP 503 assertion plus domain error source/command proof |
| Frontend service/integration | 0 unit tests; 1 manual browser API-mode acceptance run |
| Automated browser E2E | 0 (not introduced) |
| Manual browser runtime acceptance | 1 proven Chrome DevTools Protocol acceptance run |
| `npm run core:test` | 0 discovered test files; 0 failures |

## 31. Build/lint

Latest closure run: `npm run lint` passed and `npm run build` passed. The existing Vite ~548 kB chunk-size warning remains non-blocking and out of scope for this authority.

## 32. Remaining gaps

### Out of scope, non-blocking

- Authentication, authorization, and multi-user tenancy.
- Gmail/Calendar read ingress and all external action execution.
- ORDO/NARRATE/PRESENCE/MNEME/IM integrations.
- Production deployment, CI, monitoring, and bundle code splitting.

### Unproven required core

None.

## 33. Files changed

This closure changes only this parent authority report. Earlier proof commits contain the backend, frontend integration, scripts, migration, and acceptance report.

## 34. Commit history

- `0f2fc3a Add Director core persistence proof`
- `6be7328 Prove Director API restart durability`
- `4aa49a1 Handle Director database recovery`
- `6fbbdac Prove Director frontend API runtime`

## 35. Next authorized slice

`NEXT AUTHORIZED SLICE: NE_DIRECTOR_GMAIL_CALENDAR_INGRESS_AUTHORITY_001`

Intended boundary: **READ / INGRESS ONLY**. No autonomous sending, Calendar mutation, or external action.

## Final proof matrix

| Capability | Proof artifact | Proof level | Status | Notes |
|---|---|---|---|---|
| PostgreSQL 16 real persistence | closure DB/API restart | runtime | PROVEN | Container and persistent volume exercised |
| Empty-database migration | closure `core:migrate` | runtime | PROVEN | Six core tables created from empty DB |
| Schema constraints | `0001_core.sql`, `pg_constraint` query | runtime/schema | PROVEN | PK/FK/unique/check verified |
| Event persistence | Location B fixture | runtime | PROVEN | Canonical Event row |
| Event idempotency | `proof.ts` | automated | PROVEN | 1 event/obligation/decision |
| Restart idempotency | closure API replay | runtime | PROVEN | Same ID after new process |
| Obligation persistence | fixture and decision query | runtime | PROVEN | OPEN then RESOLVED |
| Decision persistence | API restart proof | automated | PROVEN | Same DECIDED decision after process restart |
| Decision atomicity | `recordDecision` + proof | automated/runtime | PROVEN | Decision, obligation, timeline transaction |
| Conflicting double-submit | `proof.ts` | automated | PROVEN | One success, one 409 state conflict |
| Rollback | `rollback-proof.ts` | automated | PROVEN | OPEN/null/null/zero timeline |
| Open Loop persistence | closure loop | runtime | PROVEN | Same ID/state after restarts |
| Open Loop resolution | closure resolve | runtime | PROVEN | Detail remains historical; active list empty |
| Open Loop API restart | closure API process restart | runtime | PROVEN | OPEN ID retained |
| Open Loop PostgreSQL restart | closure DB restart | runtime | PROVEN | RESOLVED ID retained |
| Attention derivation | Today/Attention checks | runtime/browser | PROVEN | One before, zero after decision |
| Project projection | HARBOUR endpoint/browser | runtime/browser | PROVEN | Counts revalidated to zero |
| Person projection | Anna endpoint/browser | runtime/browser | PROVEN | Count revalidated to zero |
| Today projection | `/api/v1/today` | runtime/browser | PROVEN | Needs You, Waiting For, handled |
| Waiting For projection | browser Open Loop acceptance | browser | PROVEN | Budget confirmation displayed/removed |
| Timeline persistence | restart/browser checks | runtime/browser | PROVEN | Human decision retained |
| Truthful timeline | API/browser acceptance | runtime/browser | PROVEN | No unverified external effects |
| API versioning/contracts | `/api/v1`, envelopes | source/runtime | PROVEN | Versioned route surface |
| Failure taxonomy | CoreError/error bridge | source/runtime | PROVEN | 404/409/422/500/503 safe envelopes |
| `PERSISTENCE_UNAVAILABLE` 503 | closure DB stop | runtime | PROVEN | Actual 503 body captured |
| API process restart | `api-restart-proof.ts` | automated | PROVEN | Fresh child process reads persisted state |
| PostgreSQL restart | closure DB restart | runtime | PROVEN | Canonical rows retained |
| Same-process DB recovery | closure stop/start | runtime | PROVEN | API recovered 503 → 200 |
| Mock/API separation | frontend acceptance | browser/source | PROVEN | Explicit modes, no fallback |
| Frontend API runtime | Chrome resource evidence | browser | PROVEN | Required endpoints requested |
| Location B frontend command | Chrome acceptance | browser | PROVEN | Real POST `LOCATION_B` |
| Backend revalidation | AppStore + browser | source/browser | PROVEN | Refetch before render replacement |
| Browser reload persistence | Chrome acceptance | browser | PROVEN | Persisted result retained |
| API-down degraded state | Chrome acceptance | browser | PROVEN | Truthful unavailable banner |
| Mutation denied while API down | Chrome acceptance | browser | PROVEN | No fake local success |
| API recovery | Chrome acceptance | browser | PROVEN | API data returned after restart |
| Black theme sanity | Chrome acceptance | browser | PROVEN | No overflow |
| White theme sanity | Chrome acceptance | browser | PROVEN | No overflow |
| 1440 | Chrome acceptance | browser | PROVEN | `scrollWidth === innerWidth` |
| 1280 | Chrome acceptance | browser | PROVEN | `scrollWidth === innerWidth` |
| 1024 | Chrome acceptance | browser | PROVEN | `scrollWidth === innerWidth` |
| Lint | `npm run lint` | automated | PROVEN | Passed |
| Build | `npm run build` | automated | PROVEN | Passed; known warning only |
