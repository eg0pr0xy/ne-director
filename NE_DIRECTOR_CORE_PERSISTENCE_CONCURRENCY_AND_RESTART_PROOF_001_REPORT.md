# NE DIRECTOR core persistence, concurrency and restart proof

## Verdict

`NE_DIRECTOR_CORE_OPERATIONAL_MODEL_AND_API_AUTHORITY_001_PARTIAL`.

The persistent PostgreSQL core is operational and the decision-transition, idempotency, conflict-concurrency, rollback, and Location B restart evidence below is real. The parent authority remains partial because browser API-mode/reload evidence and a complete automated API-process/Open Loop restart suite are not yet present.

## Git and runtime

- Repository: `/mnt/d/code/ne-director`
- Branch: `director/core-operational-model-001`
- Baseline HEAD: `1ec1e429285745f8af2371b1226067fe393937e7`
- Database: PostgreSQL 16 in `ne-director-postgres-1`, persistent Docker volume `ne-director_ne_director_postgres`.
- Main migration: `TMPDIR=/tmp DIRECTOR_DATABASE_URL=<redacted> npm run core:migrate`.
- API: `TMPDIR=/tmp DIRECTOR_DATABASE_URL=<redacted> DIRECTOR_PORT=4600 npm run core:dev`.

## Proven backend facts

1. A same-key Location B event is deduplicated by PostgreSQL's unique event idempotency constraint. The dedicated proof database ends with exactly one event, obligation, decision, and two pre-decision internal timeline records.
2. Two overlapping `recordDecision` operations with conflicting options result in exactly one `DECIDED` decision, one resolved obligation, one `DIRECTOR_DECISION_RECORDED` event, and an `INVALID_STATE_TRANSITION` loser.
3. A test-only function, unmounted from HTTP composition, updates the decision then faults before resolving the obligation. PostgreSQL rollback leaves decision and obligation OPEN with null completion timestamps and zero decision timeline events.
4. After restarting the PostgreSQL container without removing its named volume and starting a fresh API process, the API reported zero active attention, zero HARBOUR/Anna counts, and retained “You approved Location B” in timeline. This is durable database state, not React state.

## Truth boundary

The persisted Location B timeline contains only `DECISION_REQUEST_RECEIVED`, `OBLIGATION_CREATED`, and `DIRECTOR_DECISION_RECORDED` / “You approved Location B”. It contains no Producer informed, ORDO dependency resolved, email, or other external-world claim.

## Exact checks

- `backend/scripts/proof.ts`: one idempotency case and one conflicting-concurrency case.
- `backend/scripts/rollback-proof.ts`: one real PostgreSQL rollback case.
- `npm run lint`: passed.
- `npm run build`: passed; Vite reports its existing 548 kB bundle-size warning.

## Remaining gaps

- Automated API-process and Open Loop restart harness.
- Browser network and reload proof of frontend API mode.
- Separate same-option concurrency assertion (the locking invariant is shared, but it has not been independently captured).
