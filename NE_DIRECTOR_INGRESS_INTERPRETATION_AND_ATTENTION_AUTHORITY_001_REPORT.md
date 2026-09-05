# NE_DIRECTOR_INGRESS_INTERPRETATION_AND_ATTENTION_AUTHORITY_001

## Verdict

`NE_DIRECTOR_INGRESS_INTERPRETATION_AND_ATTENTION_AUTHORITY_001_PROVEN`

The first cognitive authority is a bounded, evidence-driven interpretation
layer. It is separate from ingress source facts and from canonical Core truth.
Only deterministic validation and a transactional materialization service can
write Core state. It has no external action, provider mutation, agent-runtime,
Contacts, ORDO, NARRATE, or PRESENCE capability.

## Baseline

- Base: `ded65c2059cd205d15fdd0ffddb60830af812a4b` on frozen `main`.
- Frozen tags verified: Core Operational Model and Communication + Schedule
  Ingress Authority.
- Work branch: `director/ingress-interpretation-attention-001`.
- Gmail and Calendar adapters, Google authorization, and SecretStore were not
  modified by this authority.

## Interpretation contract and model egress

`InterpretationProvider` is provider-neutral. Its bounded input contains one
communication source identity/hash, subject, normalized text, external
identities, timestamps/timezone, and minimal context. Its output permits only
`DECISION_REQUEST`, `ACTION_REQUEST`, `WAITING_EXPECTATION`, `FYI`,
`NO_ACTION`, and `ABSTAIN` candidates.

`ModelEgressPolicy` is `LOCAL_OR_EXPLICITLY_CONFIGURED_ONLY`. The supplied
provider is a deterministic local controlled provider for tests/proof. It
accepts only source rows marked `synthetic_controlled`; non-synthetic source
records get a recorded `MODEL_EGRESS_NOT_AUTHORIZED` failure and are not sent
anywhere. Attachments, secrets, OAuth material, and chain-of-thought are not
input or persistence fields.

## Evidence model and temporal resolution

Additive tables persist interpretation runs, candidates, and evidence pointers.
Candidates do not duplicate an email body. Every materializable candidate has
source-record ID, source field, character span, and SHA-256 evidence hash.
Validation rechecks source existence/current content hash, span bounds, and
the actual span hash before materialization.

`deadline_claim` is retained independently from `resolved_due_at`. Exact `by
HH:MM` and `tomorrow` claims resolve deterministically in the configured source
timezone. Ambiguous claims such as `ASAP` remain unresolved; no timestamp is
invented.

## Identity, materialization, and generic decisions

Unresolved external sender identity is retained as an explicit
`INGRESS_UNRESOLVED` reference. No Contacts ingestion or broad identity/project
authority was added.

`CanonicalMaterializationService` is the sole production path from validated
candidates to Core Events, Obligations, Decisions, and Open Loops. It runs in
one PostgreSQL transaction and uses candidate-specific idempotency keys.

- Decision request: factual `DECISION_REQUEST_RECEIVED`, `DECISION_REQUIRED`
  obligation, and persisted `APPROVE`/`DECLINE` Decision options.
- Action request: factual `ACTION_REQUEST_RECEIVED` and `ACTION_REQUIRED`
  obligation.
- Waiting expectation: factual `EXPECTATION_RECEIVED` and `WAITING` Open Loop.
- FYI, NO_ACTION, and ABSTAIN: successful interpretation states with no Core
  mutation.

Decision recording now accepts a non-empty option and verifies it against the
persisted Decision.options. It no longer relies on the Location A/B enum;
arbitrary options still fail with `INVALID_DECISION_OPTION`.

## Attention, conflicts, and failure behavior

Attention remains derived rather than persisted. Open `DECISION_REQUIRED` and
`ACTION_REQUIRED` obligations become corresponding attention classifications;
resolved decisions disappear. The API carries safe source/interpretation
traceability, and the existing Today card renders “Why is this here?” without
model reasoning or raw source content.

Conflicting materializable candidates stop with `INTERPRETATION_CONFLICT` and
persist a conflict run. Provider outage, schema failure, egress denial, missing
or invalid evidence, and source-content changes produce safe failures with zero
canonical materialization. Prompt-injection text remains untrusted source data;
the controlled injection case abstains and never invokes a provider mutation or
external tool.

## Golden and controlled paths

The disposable proof creates the controlled Anna Meyer/unresolved source:
“Can you confirm Location B by 14:00? Production Design is waiting.” It proves
the evidence-bound decision candidate, exact Berlin deadline resolution,
validated transactional materialization, derived decision attention, valid
`APPROVE` human decision, obligation resolution, attention disappearance, and
one human decision timeline entry.

The same proof covers action, waiting, no-action, ambiguous, injection, egress
denial for real-shaped content, invalid evidence, provider outage, candidate
conflict, duplicate interpretation/materialization, and restart readback.

## Frontend acceptance

The existing API-mode Today/Attention projection maps derived action versus
decision attention and carries safe trace metadata. The minimally added card
copy exposes “Why is this here?” only when a validated interpretation source is
available. No redesign or model-reasoning display was introduced.

## Real model status and remaining gaps

`REAL_MODEL_ACCEPTANCE_PENDING`: no approved real model runtime was used. The
authority is proven with a deterministic local provider and controlled synthetic
content only. A later explicitly authorized runtime authority may add a real
provider adapter and a separately approved synthetic acceptance; it must not
bulk-interpret the real Gmail inbox.

## Validation

- `npm run core:test`: **21/21** passed.
- `npm run interpretation:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed.
- `npm run ingress:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed unchanged.
- `npm run lint`: passed.
- `npm run build`: passed (existing bundle-size advisory only).
