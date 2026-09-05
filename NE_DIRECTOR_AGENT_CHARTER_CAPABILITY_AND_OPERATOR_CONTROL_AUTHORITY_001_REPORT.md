# NE Director Agent Charter, Capability, and Operator Control Authority

## VERDICT

`PROVEN`

This slice creates canonical PostgreSQL-backed configuration authority for the internal NE Director agent team. It creates no agent runtime, scheduler, invocation, outbound action, provider mutation, or model call.

## BASELINE

Started from parent commit `f661d0f360f04ba5646f28e62ec6c6f1dd486394`: Interpretation Contract V2, no locally accepted real-source model, and no Agent Runtime.

## STACKED BRANCH STATUS

Implemented on `director/agent-charter-capability-operator-control-001`, stacked on the stated parent. It was neither merged nor tagged.

## AGENT TEAM V1

Exactly seven version-controlled IDs are frozen: `CHIEF_OF_STAFF`, `CALENDAR_TRAVEL`, `COMMUNICATION`, `PROJECT_DOCUMENT`, `PRODUCTION_LIAISON`, `RESEARCH`, and `PERSONAL_LOGISTICS`. There is no arbitrary-agent creation path and no main-navigation Agents destination.

## CHARTER CONTRACT

Every `AgentCharter` is version `1.0.0` and owns purpose, responsibilities, exclusions, declared capabilities, source scopes, escalation, default policy, model-policy support, non-disableability, and version-controlled provenance. Operator settings cannot rewrite a charter.

## CHIEF OF STAFF

Chief of Staff remains the primary experience. It is prominent in Settings → Chief of Staff → Agents and cannot be independently disabled. Global Pause All projects it as `OPERATOR_PAUSED` without changing its row.

## SPECIALIST CHARTERS

Calendar & Travel, Communication, Project & Documents, Production Liaison, Research, and Personal Logistics have bounded charters. Personal Logistics defaults to `PAUSED`. No charter creates a side effect.

## CAPABILITY CONTRACT

The typed registry includes capability ID, domain, action class, risk class, required system/authority, mutation flag, global autonomy key where relevant, and availability evaluator. Risk is informational, never permission.

## CAPABILITY AVAILABILITY

Availability is separate from permission. Only connected Google accounts in `CONNECTED` state can make `MAIL_READ` or `CALENDAR_READ` available. Calendar/mail/production mutations, travel, web research, ORDO, PRESENCE, NARRATE, MNEME, and IMPERIUM MENTIS remain `NOT_IMPLEMENTED` or `NOT_CONNECTED` absent a real integration. `COMMUNICATION_INTERPRET` is always `QUALITY_BLOCKED`: no model passed the real-source quality gauntlet.

## GLOBAL AUTONOMY

Global autonomy is a versioned PostgreSQL control row using `SUGGEST_ONLY`, `APPROVAL_REQUIRED`, and `ALLOWED`. API-mode Settings Behavior and Autonomy now update it through the API instead of localStorage. Global Pause All is persisted independently and never overwrites individual policy rows.

## AGENT-SPECIFIC POLICY

Per-agent PostgreSQL policy stores status, delegation mode, strategy, version, capability restrictions, and source-scope restrictions. Strategies are Automatic, Local only, Private only, and Highest quality; strategy cannot bypass quality gates.

## EFFECTIVE PERMISSION RESOLUTION

Resolution applies hard implementation/authority limits, actual availability, global autonomy, the most-restrictive valid override, global pause, then agent pause. An override above global authority is rejected with `AGENT_POLICY_CANNOT_ESCALATE`.

## SOURCE ACCESS

Source access has `NONE`, `CONTEXT_ONLY`, and `READ`. Policy may only lower charter scope. The effective projection emits `NONE` when the source is unconnected, so policy cannot make an unconnected source accessible. Personal/project sharing defaults remain denied.

## MODEL POLICY

Agents are charter identities, not model identities. The UI exposes strategy rather than raw model IDs. Advanced readiness truthfully reports unavailable or blocked state.

## QUALITY-BLOCKED MODEL BEHAVIOR

`COMMUNICATION_INTERPRET` remains `QUALITY_BLOCKED` for every Communication projection regardless of operator model strategy.

## PERSISTENCE

Migration `0005_agent_operator_controls.sql` adds global controls, policies, capability/source overrides, and append-only policy events. Writes are transactional and optimistic-version protected. The proof recreates the service against the same database to demonstrate restart durability.

## LOCALSTORAGE AUTHORITY REMOVAL

In API mode the App Store neither reads nor writes `ne_director_settings` for authority. It loads API controls, writes versioned API updates, and renders authority unavailable when the API fails. Cosmetic preferences remain outside this authority.

## API

Implemented `GET /api/v1/agents`, `GET /api/v1/agents/:agentId`, `GET /api/v1/agents/:agentId/capabilities`, `PATCH /api/v1/agents/:agentId/operator-policy`, `GET/PATCH /api/v1/operator-controls`, and `GET /api/v1/agent-policy-events`. Responses contain no secrets or prompts.

## SETTINGS AGENTS OVERVIEW

Chief of Staff settings order is Behavior, Attention, Agents, Autonomy, Focus Modes. Agents presents the Chief first, then six specialists with derived state, policy status, capability count, strategy, and Configure.

## AGENT DETAIL

The Settings detail includes Status, Responsibilities, Autonomy, Escalation, Access, Model Strategy, and Advanced Readiness. Chief of Staff has no disable control. Overrides offer only non-escalating choices.

## GLOBAL PAUSE

The proof enables Pause All, reloads, observes `OPERATOR_PAUSED`, disables Pause All, and proves individual states return unchanged.

## AUDIT

Every authority mutation appends a safe event with time, human operator actor, event, agent where relevant, key, safe previous/new values, correlation ID, and authority provenance. No source content or secrets are recorded. The proof read six events.

## BROWSER ACCEPTANCE

Chrome API-mode acceptance at 1440×900 passed: Settings → Agents showed exactly seven Configure controls; Communication pause/resume persisted through the UI; Communication visibly remained quality-blocked; global Pause All survived reload; API outage renders unavailable rather than mock authority.

## RESTART

The proof paused Communication, created a new service instance, and read `PAUSED` from PostgreSQL before resuming it. Global Pause preserves individual state.

## NO RUNTIME BOUNDARY

No Agent Runtime, scheduler, watcher, delegation, tool invocation, outbound communication, email/calendar/ORDO/NARRATE/PRESENCE mutation, real Gmail interpretation, or settings-triggered model invocation exists in this authority.

## TESTS

`npm run core:test` passed 28/28. `npm run agent-controls:proof` passed PostgreSQL and API control proof including exact team, quality block, capability connection awareness, pauses, stale rejection, audit, and no-runtime assertions.

## REGRESSIONS

- `npm run core:test`: passed, 28/28.
- `npm run agent-controls:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed.
- `npm run interpretation:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed.
- `npm run ingress:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; existing Vite >500 kB chunk advisory remains.

## REMAINING GAPS

Next authorized slice: `NE_DIRECTOR_AGENT_RUNTIME_DELEGATION_AND_TRIGGER_AUTHORITY_001`. It may consume this policy/capability authority for event subscriptions, work items, bounded delegation, scheduling, invocation, and activity provenance. It is not implemented here.
