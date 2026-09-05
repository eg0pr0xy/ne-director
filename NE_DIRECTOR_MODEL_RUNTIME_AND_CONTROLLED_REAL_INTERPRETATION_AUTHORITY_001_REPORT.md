# NE Director Model Runtime and Controlled Real Interpretation Authority

## Verdict

`REAL_MODEL_ACCEPTANCE = PROVEN`

The configured local OpenAI-compatible runtime was reached successfully at
`http://127.0.0.1:11434/v1` as `qwen3.5:27b-q4_K_M`. Its health projection
reported `AVAILABLE`, and the actual runtime completed a controlled 30-case
synthetic evaluation through `InterpretationInput ->
StructuredLlmInterpretationProvider -> OpenAiCompatibleRuntime`.

`MODEL_QUALITY_VERDICT = MODEL_REQUIRES_IMPROVEMENT`

The runtime and authority boundary are proven; the measured extraction quality
is not sufficient to authorize real-source interpretation. No real Gmail,
Calendar, or other source data was supplied to the model.

`SYNTHETIC_REAL_MODEL_ACCEPTANCE_PROVEN`

`REAL_SOURCE_OPERATOR_SELECTION_REQUIRED`

## Live runtime evidence

- `GET /api/v1/model-runtime/health` returned `AVAILABLE` with runtime ID
  `OPENAI_COMPATIBLE` and model ID `qwen3.5:27b-q4_K_M`.
- The adapter uses the OpenAI-compatible `chat/completions` endpoint with an
  explicit bounded 90-second default request limit, a bounded 450-token
  completion limit, zero temperature, `reasoning_effort: none`, and JSON mode.
- There is no model fallback. A transport, malformed JSON, schema, evidence,
  canonical-ID, or timeout failure fails closed.

## Controlled real-model evaluation

Thirty deterministic synthetic/adversarial `InterpretationInput` records were
sent to the configured Qwen model. The suite covers direct/implicit
decision/action/waiting/FYI/no-action/abstention, exact/relative/ambiguous/no
deadlines, German/English/mixed language, negatives/cancellations,
quotes/forwards/multiple requests and dates, unsupported project/identity/
option inference, malformed and short text, and six prompt-injection-style
messages.

| Measure | Result |
| --- | ---: |
| caseCount | 30 |
| schemaPassRate | 70.00% (21/30) |
| candidateKindAccuracy | 63.33% (19/30) |
| evidencePassRate | 70.00% (21/30) |
| unsupportedClaimRate | 10.00% (3/30 accepted outputs) |
| temporalAccuracy | 60.00% (18/30) |
| abstentionAccuracy | 63.33% (19/30) |
| promptInjectionSafetyRate | 100.00% (6/6 targeted safety pass) |
| latencyP50 | 38,542 ms |
| latencyP95 | 45,503 ms |

The prompt-injection safety rate is independently measured over the six
injection cases. A response was safe only when it was a validated non-action
classification or failed closed before acceptance. No tool call, outbound
request, Gmail mutation, Calendar mutation, or canonical mutation exists in
either path.

## Evidence and authority safety

- The model selects evidence spans only. The server checks their bounds against
  the supplied controlled source and derives the SHA-256 evidence hash locally.
  A model-supplied evidence hash is never trusted.
- Non-abstaining candidates without evidence, out-of-bounds spans, malformed
  JSON, unknown fields, and canonical UUID-like IDs are rejected before the
  structured provider returns output.
- The evaluation imports no database connection, has no materialization step,
  and invokes no ingress/provider mutation API. Failed validation therefore
  cannot create a canonical candidate, event, timeline entry, or source fact.
- Evaluation output contains only case number, pass/fail state, safe failure
  category, latency, and aggregate metrics. It never logs prompts, model raw
  responses, secrets, access tokens, refresh tokens, or real-source content.
- The real-model HTTP route remains constrained to an exact
  `DIRECTOR_REAL_SOURCE_RECORD_ID` and `materialize=false`; no such operator
  selection was set or exercised for this authority.

## Failure isolation and quality conclusion

Nine of the 30 full-suite outputs were rejected by the strict schema/evidence
boundary (seven schema and two evidence-span failures). The targeted injection
subset had three safe valid classifications and three safe schema rejections.
These are model-quality failures, not authority-safety failures. The required
quality verdict is therefore `MODEL_REQUIRES_IMPROVEMENT`; remediation must
improve structured-output and temporal/candidate behavior before any operator
selects a real source.

## Regression evidence

- `npm run core:test`: **24/24 passed**.
- `npm run interpretation:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed;
  deterministic replay and restart evidence retained.
- `npm run ingress:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed;
  ingress replay, restart durability, scoped connections, and revocation
  evidence retained.
- `npm run lint`: passed.
- `npm run build`: passed (Vite emitted its existing >500 kB chunk-size warning;
  build succeeded).

## Real-source status

`REAL_SOURCE_ACCEPTANCE_PENDING`

No operator has selected a real source, no real Gmail content has been
interpreted, and this authority stops before any such use.
