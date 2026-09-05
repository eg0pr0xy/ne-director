# NE Director Agent Runtime, Delegation and Trigger Authority 001

## Verdict

**PROVEN — internal read/preparation runtime only.** The runtime is a durable PostgreSQL authority; it is not an LLM loop and has no tool, browser, shell, provider-mutation, or outbound executor.

## Implemented authority

- Migration `0006_agent_runtime.sql` adds durable trigger occurrences, work items, delegations, artifacts, append-only runtime events, cursors, unique semantic idempotency keys, `FOR UPDATE SKIP LOCKED` claims, and expiring leases.
- The bounded registry contains only `MEETING_PREPARATION`, `DAILY_BRIEF`, and `END_OF_DAY_REVIEW`, all `INTERNAL_ONLY`, with typed input/result metadata, explicit owning agent/delegate, retry policy, provenance authority, and idempotency strategy.
- Meeting preparation reads only current, active canonical schedule facts plus explicitly linked canonical obligations. It produces a sparse factual brief when no linked context exists.
- Chief of Staff deterministically delegates meeting preparation to Calendar & Travel only. `MANUAL_ONLY` produces `WAITING_FOR_DELEGATION`; `AUTOMATIC_WHEN_ALLOWED` permits a queued internal claim.
- Server-side authorization rereads global pause, agent policy, charter capability, source access, and current connection state before execution and again before result commit. Read capability is distinct from mutation autonomy.
- A revision/cancellation detected before commit is `SUPERSEDED`; it produces no stale artifact. Completed history is retained rather than overwritten.
- Transient runtime failures use bounded exponential retry (maximum work attempts); policy/capability failures wait for conditions to change.
- `DIRECTOR_AGENT_RUNTIME_ENABLED=true` activates a bounded 5–300 second runner. The runtime health API reports `DISABLED`, `READY`, `RUNNING`, `DEGRADED`, or `PAUSED` without bypassing Global Pause.

## APIs and UI

- Read APIs: runtime health, work list/detail/events, per-agent work, artifact detail.
- Development-only bounded tick endpoint exists outside production and accepts no arbitrary action.
- Today / I Handled projects only persisted completed artifacts with `externalActions: NONE`. Selecting one opens factual provenance (agent, trigger, source reference, completion time, no external actions).
- Settings → Agents shows runtime status, completed/queued/blocked counts, and last tick/completion. It explicitly states the internal-only boundary.

## Proof evidence

`npm run agent-runtime:proof` with `DIRECTOR_PROOF_DATABASE_URL` only passed:

- T-31 no meeting work; T-30 exactly one trigger, work, delegation, claim chain, artifact, and completion after 100 repeated ticks. A controlled transient failure produces one bounded retry and one artifact.
- Manual-only delegation does not execute and has no artifact.
- Global pause, live pause before commit, connection loss/recovery, revision/supersession, cancellation, daily once-per-Berlin-day scheduling, restart simulation, and lease recovery all preserve one semantic artifact at most.
- `COMMUNICATION_INTERPRET` remains `QUALITY_BLOCKED`; the proof invokes no model and uses no real source content.
- Browser acceptance against the proof DB confirmed the Today artifact and provenance detail and the Settings runtime panel.

## Safety invariants retained

- `MODEL_QUALITY_STATUS = NO_CURRENT_LOCAL_MODEL_ACCEPTED`
- `REAL_SOURCE_ACCEPTANCE_PENDING`
- `COMMUNICATION_INTERPRET = QUALITY_BLOCKED`
- All Authority 001 artifacts declare `externalActions: NONE`.
- No MAIL, CALENDAR, ORDO, PRESENCE, NARRATE, travel, financial, reservation, or other external mutation is implemented or callable.

## Acceptance commands

```text
npm run core:test                 # 28 passed
npm run agent-controls:proof      # passed
npm run ingress:proof             # passed
npm run interpretation:proof      # passed
npm run agent-runtime:proof       # passed, proof DB only
npm run lint                      # passed
npm run build                     # passed
```

## Next authority

No outbound/mutation authority follows from this work. A future authority must separately define each side effect, approval path, provider API contract, real-source safety proof, and operator acceptance.
