# NE Director Model Runtime and Controlled Real Interpretation Authority

## Verdict

`MODEL_RUNTIME_PARTIAL`

The provider-neutral OpenAI-compatible structured runtime adapter, strict JSON
boundary, explicit configuration, guarded real-model API, and safe runtime
health projection are implemented. No explicit runtime endpoint/model was
configured in this environment, so a real runtime and synthetic gauntlet could
not be executed. No real Gmail source was selected by an operator.

## Base and runtime contract

- Base: `a06eb52764be0d30d0cf2f736e90af60d92fb949`.
- `ModelRuntime` exposes runtime/model identifiers, capability metadata,
  `generateStructured`, and `health`.
- `OpenAiCompatibleRuntime` targets an explicitly configured OpenAI-compatible
  HTTP endpoint; it can therefore be used with compatible local runtimes
  without vendor SDK coupling.
- `StructuredLlmInterpretationProvider` remains behind the existing
  `InterpretationProvider` contract. The deterministic provider remains the
  proof provider.

## Configuration and privacy

The runtime requires explicit `DIRECTOR_MODEL_RUNTIME=OPENAI_COMPATIBLE`, base
URL, and model name. An optional API key must be an opaque SecretStore
reference; no API key is persisted in PostgreSQL. With no configuration,
health is `NOT_CONFIGURED`.

Only one bounded InterpretationInput is sent to a configured runtime. It
excludes attachments, OAuth material, browser state, mailbox batches, database
dumps, hidden prompts, and conversation history. The runtime stores no raw
provider response, prompt, email body, secret, or chain-of-thought.

## Strict output and validation

OpenAI-compatible responses are bounded, JSON-parsed, and validated with a
strict schema. Unknown fields, tool/action fields, canonical IDs, malformed
JSON, empty/oversized output, invalid kinds, and invalid evidence fail closed
before canonical materialization. The existing evidence, temporal, conflict,
and materialization gauntlets remain downstream deterministic authorities.

## Prompt and no-agent boundary

The extraction prompt declares source communication untrusted, forbids tool
use/action/unsupported inference, and requires evidence-backed structured JSON
or abstention. There is no scheduler, background scan, inbox-wide endpoint,
agent loop, outbound action, provider mutation, ORDO/NARRATE/PRESENCE call, or
automatic real materialization.

## Real model and real source status

- `REAL_MODEL_ACCEPTANCE_PENDING`: no configured runtime was reachable, so the
  required 30-case synthetic/adversarial gauntlet was not run through a real
  model.
- `REAL_SOURCE_ACCEPTANCE_PENDING`: no operator configured
  `DIRECTOR_REAL_SOURCE_RECORD_ID`; no real Gmail content was sent anywhere.
- `/api/v1/interpretations/real-model` requires that exact operator-selected
  ID and `materialize=false`; it rejects all other source IDs and cannot
  materialize real mailbox results in this authority.

## Tests and regressions

- `core:test`: **23/23** passed, including strict output and not-configured
  runtime tests.
- `interpretation:proof` and `ingress:proof` passed against
  `DIRECTOR_PROOF_DATABASE_URL`.
- `npm run lint` passed.
- No real runtime claim is made until explicit configuration allows the
  complete synthetic gauntlet.
