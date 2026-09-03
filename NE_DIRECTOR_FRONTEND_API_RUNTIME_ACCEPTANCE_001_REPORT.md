# NE_DIRECTOR_FRONTEND_API_RUNTIME_ACCEPTANCE_001

## 1. Verdict

`NE_DIRECTOR_FRONTEND_API_RUNTIME_ACCEPTANCE_001_PROVEN`

The existing React UI was run in explicit API mode against the persistent Director API. Browser runtime requests, a real browser approval, backend revalidation, full reload, outage, recovery, and persistent Open Loop projection were all exercised. No mock operational data was used in API mode.

## 2. Git state

- Repository: `/mnt/d/code/ne-director`
- Branch: `director/core-operational-model-001`
- Starting HEAD: `4aa49a1fa69533327ec54f9fd38bb8d4f26522e4`
- Origin: `https://github.com/eg0pr0xy/ne-director.git`
- Ahead/behind before this acceptance commit: `0/0`
- Working tree at report creation: intentional acceptance changes only, including this report; no unrelated or unexpected untracked files.

## 3. Runtime configuration

API mode was started explicitly with:

```bash
VITE_DIRECTOR_RUNTIME_MODE=api \
VITE_DIRECTOR_API_BASE_URL=http://127.0.0.1:4601/api/v1 \
npm run dev -- --host 127.0.0.1
```

The API ran on `127.0.0.1:4601` using the existing PostgreSQL proof database. The API permits only `http://127.0.0.1:3000` by default through an exact CORS origin; it does not use a wildcard.

## 4. DirectorApiService

`DirectorApiService` is selected only when `VITE_DIRECTOR_RUNTIME_MODE=api`. It reads Today, Attention, Projects, each project detail, People, each person detail, Timeline, and Open Loops through the service seam. Decision recording uses `POST /decisions/:id/record`. React components do not own raw operational fetches.

## 5. Mock/API boundary

`mock` remains an explicit demo mode and was separately loaded at port 3001; it displayed the pre-existing fixture dashboard. API mode at port 3000 displayed only Director API data. There is no API-to-mock fallback: initial load failure renders `Director API unavailable. No mock data is being shown.`

## 6. Initial Location B state

The proof database was truncated and seeded through the existing dev fixture. Direct PostgreSQL verification returned:

| Event | Obligation | Decision | Decision status | Obligation status |
|---|---|---|---|---|
| `c02c13ae-8968-451f-8f50-91f7d986e1ed` | `834c8f66-9178-41fb-bc0d-de6877e48d32` | `d9400e95-215d-4326-8679-479db46c2acc` | `OPEN` | `OPEN` |

Before approval the API reported one active Attention item, and the browser rendered `LOCATION B` in Today / Needs You.

## 7. Network/API evidence

Chrome performance-resource evidence from the API-mode page recorded these real requests:

- `GET /api/v1/today`
- `GET /api/v1/attention`
- `GET /api/v1/projects`
- `GET /api/v1/projects/harbour`
- `GET /api/v1/people`
- `GET /api/v1/people/anna`
- `GET /api/v1/timeline`
- `GET /api/v1/open-loops`

No Gemini, Google AI Studio, Firebase, Supabase, OpenAI, Anthropic, or other external operational service request was observed.

## 8. Decision command

From the rendered browser card, `Approve B` and then the confirmation control were clicked. Runtime evidence recorded:

`POST /api/v1/decisions/d9400e95-215d-4326-8679-479db46c2acc/record`

Canonical follow-up response was `200` and returned `status: DECIDED`, `selected_option: LOCATION_B`, and the same decision ID. The recorded human actor was Marcus Director.

## 9. Revalidation

After command success, AppStore refetched Today, People, Projects, Attention, and Timeline from the API before replacing its render projections. It does not synthesize API-mode records. The historical `subsequentEvents` fixture code remains solely below the explicit mock-mode return.

## 10. Post-decision projections

The browser changed to no Needs You items. Direct canonical projections returned `HARBOUR needsYouCount: 0, openDecisions: 0` and `Anna Meyer openItemsCount: 0`. Timeline contained exactly the truthful records:

- `You approved Location B`
- `Location B decision requested`
- `Location B requires a director decision`

It did not contain Producer informed, ORDO dependency resolved, email sent, or NARRATE updated.

## 11. Browser reload

A full Chrome navigation reload after the real approval retained zero Needs You items. The Timeline page retained `You approved Location B`; Projects rendered HARBOUR and People rendered Anna Meyer from the API-backed lists. This was a browser reload, not a React state remount.

## 12. API outage and mutation denial

With an already API-loaded Location B card, the API process was stopped. The browser approval attempt visibly returned `Decision could not be recorded. No mock fallback was used.` Location B remained open in the UI; no local success state or synthetic timeline entry was inserted. Reloading during the outage displayed the explicit unavailable banner with no mock operational content.

## 13. API recovery

Restarting the same API in API mode and reloading returned the canonical still-open Location B record. A subsequent real browser approval persisted `LOCATION_B`; no switch to mock mode or local-storage reset was required.

## 14. PostgreSQL outage

Not rerun through the browser in this slice. The parent backend proof already established API `503 PERSISTENCE_UNAVAILABLE` and pool recovery. The frontend maps any unavailable load to the same truthful unavailable banner.

## 15. Open Loop

The existing budget-loop fixture created `c5a13d14-ce3e-4e33-b726-926e7832cbf0` for HARBOUR / Anna Meyer with expected result `Budget confirmation`. After a full browser reload, Today / Waiting For rendered `Producer · Anna — Budget confirmation`. The loop was resolved through the existing API endpoint, then a browser reload removed it from Waiting For.

## 16. localStorage authority audit

Source and live browser inspection found only `ne_director_profile_v1` and `ne_director_settings`. No operational Attention, Decision, Obligation, Open Loop, Timeline, Project count, or Person count key existed in localStorage or sessionStorage.

## 17. Theme and width sanity

Chrome runtime checks at 1440px, 1280px, and 1024px produced `scrollWidth === innerWidth` in both Black and White themes. Navigation and content remained available; no horizontal overflow was detected. The user preference was restored to Black after the check.

## 18. Tests

- Manual browser runtime: passed (Chrome DevTools Protocol evidence listed above).
- Backend focused command: `TMPDIR=/tmp npm run core:test` passed with `0` discovered test files.
- Persistent idempotency/concurrency proof: passed.
- Transaction rollback proof: passed.

No additional browser-test framework was introduced for this focused acceptance slice.

## 19. lint/build

- `npm run lint`: passed.
- `npm run build`: passed.
- Existing Vite chunk-size warning (~548 kB) remains non-blocking and unchanged in scope.

## 20. Defects repaired

- Added exact-origin CORS/preflight handling for the separately served frontend and made all async API routes pass through the existing error bridge.
- Added a visible, truthful API-unavailable state instead of an indefinite loading shell.
- Made Project and Person detail reads and Open Loop reads real adapter calls.
- Corrected Open Loop mapping to its canonical `expected_result` contract.
- Removed unproven external-outcome wording from the confirmation copy.

## 21. Remaining parent gaps

This slice does not add integrations, external effects, or new product capability. PostgreSQL failure was not repeated through this browser run; the previously proven parent behavior remains the relevant backend evidence.

## 22. Files changed

- `backend/server.ts`
- `src/services/api.ts`
- `src/store/AppStore.tsx`
- `src/layouts/AppLayout.tsx`
- `src/components/ApproveConfirmModal.tsx`
- `NE_DIRECTOR_FRONTEND_API_RUNTIME_ACCEPTANCE_001_REPORT.md`

## Acceptance matrix

| Check | Result |
|---|---|
| API-mode startup | PASS |
| Today from API | PASS |
| Attention from API | PASS |
| HARBOUR from API | PASS |
| Anna from API | PASS |
| Timeline from API | PASS |
| Location B POST through frontend | PASS |
| Backend revalidation | PASS |
| Full browser reload persistence | PASS |
| API-down degraded behavior | PASS |
| Mutation denied while API down | PASS |
| API recovery | PASS |
| Open Loop projection | PASS |
| Mock/API isolation | PASS |
| Black theme sanity | PASS |
| White theme sanity | PASS |
| 1440px | PASS |
| 1280px | PASS |
| 1024px | PASS |
