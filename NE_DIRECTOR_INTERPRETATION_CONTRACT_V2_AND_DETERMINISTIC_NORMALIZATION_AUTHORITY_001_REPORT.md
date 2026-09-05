# NE Director Interpretation Contract V2 and Deterministic Normalization

## Verdict

`NO_CURRENT_LOCAL_MODEL_ACCEPTED`

Contract V2 removes avoidable model responsibilities while preserving the
Source Fact -> Interpretation Candidate -> deterministic validation ->
canonical materialization authority. It eliminates all V2 evidence-offset
failures in the fixed 30-case suite and makes `qwen3.5:9b-q8_0` the best
current V2 quality, latency, and balanced model. The 9B result remains below
the frozen quality gates, so no real-source interpretation is authorized.

`REAL_SOURCE_ACCEPTANCE_PENDING`

## V1 problem statement

V1 required the model to emit source offsets, SHA-256 hashes, metadata,
timestamps, and UI prose in addition to semantic extraction. The V1 gauntlet
showed that this overburdened local models, especially with evidence offsets,
and that deterministic temporal resolution had incomplete German support.

## Contract V2

The model-facing shape is deliberately limited to semantic claims and literal
evidence:

```json
{"candidates":[{"kind":"…","evidence":[{"sourceField":"subject|normalized_text","text":"exact literal source substring"}],"deadlineClaim":"optional exact literal source phrase","confidence":0.0}]}
```

Unknown fields are rejected. The model cannot emit or spoof metadata, offsets,
hashes, canonical IDs, timestamps, tools, recipients, outbound actions, or
calendar mutation fields.

## Removed model responsibilities

| Field | V2 disposition |
| --- | --- |
| characterStart / characterEnd / evidenceHash | Server derivable |
| interpreterId / interpreterVersion / contractVersion / generatedAt | Server owned |
| sourceRecordId / canonical IDs / resolved timestamps | Forbidden |
| summary | Server derivable safe presentation label from validated kind |
| question / requestedAction | UI convenience only; absent from model contract |
| expectedResult | UI convenience only for Authority 001; safe generic label remains available |

The server assigns runtime ID `OPENAI_COMPATIBLE`, selected model ID,
interpreter version `2.0.0`, contract version `NE_DIRECTOR_INTERPRETATION_V2`,
and generation timestamp only after successful model-output validation.

## Evidence normalization

`normalizeEvidence` performs exact, case-preserving literal matching against
the authoritative subject or normalized text. A unique match produces offsets
and a SHA-256 evidence hash; zero matches return `EVIDENCE_NOT_FOUND`; more
than one returns `EVIDENCE_AMBIGUOUS`. Empty snippets are rejected. There is
no fuzzy matching or occurrence guessing.

A literal `deadlineClaim` is independently normalized as evidence, so the
model need not duplicate it in a separate evidence item. It still must occur
exactly once in the authoritative source or is rejected before resolution.

Controlled tests prove unique, missing, duplicate, subject, normalized-text,
Unicode/German, empty, invented, and prompt-injection literal snippets. Only
unique literal source evidence yields canonical offsets and hashes.

## Temporal resolver V2

The model supplies only a literal deadline claim. The server deterministically
resolves `by 14:00`, `bis 14:00`, `tomorrow`, `by tomorrow`, `morgen`, and
`bis morgen` using `Europe/Berlin`. `soon` and `ASAP` retain no resolved due
timestamp. Weekdays and EOD were intentionally not added because their
semantics have not been separately accepted.

## Frozen quality gates

Schema/evidence >=95%, candidate/temporal/abstention >=90%, unsupported <=2%,
prompt injection =100%, P50 <=10 seconds, and P95 <=20 seconds. These gates
were not changed from the V1 gauntlet.

## V1 versus V2

| Model | V1 schema -> V2 | V1 candidate -> V2 | V1 evidence -> V2 | V1 unsupported -> V2 | V1 temporal -> V2 | V1 abstention -> V2 | V1 P50/P95 -> V2 | V2 gates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| qwen3.5:9b-q8_0 | 40.00% -> 80.00% (+40.00pp) | 33.33% -> 70.00% (+36.67pp) | 40.00% -> 80.00% (+40.00pp) | 3.33% -> 10.00% (+6.67pp) | 36.67% -> 70.00% (+33.33pp) | 40.00% -> 76.67% (+36.67pp) | 2.92/3.52s -> 0.64/0.83s | Quality FAIL; latency PASS |
| qwen3.5:27b-q4_K_M | 70.00% -> 36.67% (-33.33pp) | 63.33% -> 30.00% (-33.33pp) | 70.00% -> 36.67% (-33.33pp) | 10.00% -> 6.67% (-3.33pp) | 60.00% -> 30.00% (-30.00pp) | 63.33% -> 33.33% (-30.00pp) | 36.62/42.37s -> 7.39/9.74s | Quality FAIL; latency PASS |
| qwen3.6:27b | 56.67% -> 46.67% (-10.00pp) | 40.00% -> 36.67% (-3.33pp) | 56.67% -> 46.67% (-10.00pp) | 6.67% -> 3.33% (-3.34pp) | 50.00% -> 43.33% (-6.67pp) | 53.33% -> 46.67% (-6.66pp) | 22.13/26.60s -> 7.67/10.27s | Quality FAIL; latency PASS |

All three V2 models preserved `promptInjectionSafetyRate = 100%`. The timed
V2 wall-clock durations were 18 seconds (9B), 208 seconds (27B), and 220
seconds (qwen3.6); warmup/model-load time was excluded from percentile
latency.

## Model decision

- `BEST_QUALITY_MODEL = qwen3.5:9b-q8_0`
- `BEST_LATENCY_MODEL = qwen3.5:9b-q8_0`
- `BEST_BALANCED_MODEL = qwen3.5:9b-q8_0`
- `ACCEPTED_MODEL = NONE`

The 9B model is the preferred interactive candidate for the next controlled
prompt/contract experiment, not a production interpreter selection.

## Safety and remaining gaps

Prompt injection remains untrusted source data and produced no accepted tool,
Gmail, Calendar, outbound-action, canonical-ID, or materialization path.
V2 strict-schema failures are still fail-closed. The 9B model's remaining gaps
are six malformed outputs, three wrong kinds, three unsupported claims, three
temporal errors, and one failed abstention across 30 cases.

## Decision on further model work

- `TWO_STAGE_DECISION = NOT_RECOMMENDED`. V2 removed evidence-offset failures;
  the remaining defects do not demonstrate that classification and extraction
  must be split, and two slower model calls would violate interactive product
  constraints.
- `CLOUD_MODEL_DECISION = DEFERRED`. First perform a bounded V2 prompt/JSON
  reliability experiment against the 9B model using this unchanged gauntlet.
- `FINE_TUNE_DECISION = NOT_SELECTED`. No automatic fine-tune decision is
  justified by this authority.

## Real source status

`REAL_SOURCE_ACCEPTANCE_PENDING`

No real Gmail content, source selection, canonical materialization, provider
mutation, outbound action, or agent loop was used.

## Regressions

- `npm run core:test`: `25/25` passed.
- `npm run interpretation:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed;
  golden paths, injection abstention, replay, and restart proof completed.
- `npm run ingress:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed; replay,
  connection isolation, provider error states, revocation, and restart
  durability completed.
- `npm run lint`: passed.
- `npm run build`: passed. Vite emitted its existing advisory that the
  generated JavaScript chunk exceeds 500 kB after minification.
