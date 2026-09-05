# NE Director Model Selection and Extraction Quality Gauntlet

## Verdict

`NO_CURRENT_LOCAL_MODEL_ACCEPTED`

All four required local models were evaluated sequentially through the fixed
30-case controlled synthetic harness. No model satisfies every frozen quality
gate. `qwen3.5:9b-q8_0` alone satisfies the latency gate, but its extraction
quality is insufficient. No real-source interpretation is authorized.

`REAL_SOURCE_ACCEPTANCE_PENDING`

## Fixed quality gates

These gates were persisted in `model-runtime-evaluation.ts` before the model
runs and were not changed afterward.

| Metric | Gate |
| --- | ---: |
| schemaPassRate | >= 95% |
| candidateKindAccuracy | >= 90% |
| evidencePassRate | >= 95% |
| unsupportedClaimRate | <= 2% |
| temporalAccuracy | >= 90% |
| abstentionAccuracy | >= 90% |
| promptInjectionSafetyRate | 100% |
| latency P50 | <= 10 s |
| latency P95 | <= 20 s |

## Controlled evaluation comparison

Each model received the exact same fixed 30 synthetic/adversarial inputs. One
controlled warmup preceded its timed suite and is excluded from P50/P95. No
prompt text, raw provider response, secret, or real-source content was logged.

| Model | Schema | Candidate | Evidence | Unsupported | Temporal | Abstention | Injection | P50 | P95 | Quality gate | Latency gate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| qwen3.5:27b-q4_K_M | 70.00% | 63.33% | 70.00% | 10.00% | 60.00% | 63.33% | 100% | 36.62 s | 42.37 s | FAIL | FAIL |
| qwen3.6:27b | 56.67% | 40.00% | 56.67% | 6.67% | 50.00% | 53.33% | 100% | 22.13 s | 26.60 s | FAIL | FAIL |
| mistral-small3.2:24b | 43.33% | 26.67% | 43.33% | 3.33% | 40.00% | 40.00% | 100% | 21.08 s | 33.16 s | FAIL | FAIL |
| qwen3.5:9b-q8_0 | 40.00% | 33.33% | 40.00% | 3.33% | 36.67% | 40.00% | 100% | 2.92 s | 3.52 s | FAIL | PASS |

## Warmup, wall clock, and loaded memory

| Model | Warmup state / excluded latency | Timed wall clock | Loaded memory |
| --- | ---: | ---: | ---: |
| qwen3.5:27b-q4_K_M | completed / 37.35 s | 18 m 50 s | 22,408,928,950 bytes |
| qwen3.6:27b | invalid evidence / 48.23 s | 11 m 35 s | 22,408,928,950 bytes |
| mistral-small3.2:24b | completed / 53.70 s | 11 m 58 s | 22,238,346,608 bytes |
| qwen3.5:9b-q8_0 | completed / 13.09 s | 1 m 25 s | 17,699,354,704 bytes |

Warmup state is an observation only. It is not included in the comparison
metrics and does not downgrade the authority boundary.

## Selection

- `BEST_QUALITY_MODEL = qwen3.5:27b-q4_K_M`.
  It leads the group on schema, candidate-kind, evidence, temporal, and
  abstention measures, despite failing every required quality threshold.
- `BEST_LATENCY_MODEL = qwen3.5:9b-q8_0`.
  It is the only model satisfying both interactive latency targets.
- `BEST_BALANCED_MODEL = qwen3.6:27b`.
  Using frozen-gate attainment, it has the best quality/latency compromise:
  materially faster than Model A while retaining the next-highest overall
  quality. This is not an acceptance recommendation.
- `ACCEPTED_MODEL = NONE`.

Neither `MODEL_ACCEPTABLE_FOR_CONTROLLED_EXTRACTION` nor
`MODEL_RECOMMENDED_FOR_DIRECTOR_INTERPRETER` is warranted.

## Safe error taxonomy

Counts are aggregate case-level diagnostic observations. A malformed or
invalid-evidence output was rejected before an interpretation candidate could
be accepted.

| Model | Malformed schema | Invalid evidence | Wrong kind | Unsupported claim | Temporal error | Failed abstention | Multi-request collapse | Quoted-text confusion | Negation error | Other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| qwen3.5:27b-q4_K_M | 7 | 2 | 2 | 3 | 3 | 2 | 1 | 0 | 1 | 0 |
| qwen3.6:27b | 4 | 9 | 5 | 2 | 2 | 1 | 1 | 0 | 1 | 0 |
| mistral-small3.2:24b | 17 | 0 | 5 | 1 | 1 | 1 | 1 | 0 | 2 | 0 |
| qwen3.5:9b-q8_0 | 15 | 3 | 2 | 1 | 1 | 0 | 1 | 0 | 0 | 0 |

The dominant failure sources are model capability and output-schema/prompt
contract complexity. Model B additionally has a material evidence-offset task
failure. Quoted-text confusion was not observed under the fixed definition.

## Evidence offset diagnostic

`EVIDENCE_OFFSET_BOTTLENECK = YES for qwen3.6:27b; NO as a universal finding.`

The production contract remains unchanged: the model emits character offsets,
the server validates those offsets, and it derives evidence hashes locally.

For Model B, all nine cases rejected for invalid offsets were re-run with a
diagnostic-only alternate contract that requested exact literal evidence
snippets. Each of the nine responses resolved to one unique local source span.
This shows that exact snippet normalization could recover **9/9** of Model B's
offset failures without accepting invented evidence. It does not recover its
other quality failures and is not enabled in production.

For Models A, C, and D, invalid-offset cases were respectively 2/9, 0/17, and
3/18 of their rejected cases; no evidence-offset majority was demonstrated.

## Temporal diagnostic

The model never calculates canonical timestamps. It only supplies a deadline
claim, and the deterministic `resolveDeadline` function remains authoritative.

| Model | Deadline-claim extraction errors | Deterministic resolution errors |
| --- | ---: | ---: |
| qwen3.5:27b-q4_K_M | 3 | 3 |
| qwen3.6:27b | 2 | 3 |
| mistral-small3.2:24b | 1 | 4 |
| qwen3.5:9b-q8_0 | 1 | 0 |

`TEMPORAL_FAILURE_SOURCE = MIXED, with deterministic resolution limitations
slightly dominant (10 resolution errors vs. 7 extraction errors).` The
resolution count includes exact language-specific source phrases that the
current resolver intentionally does not normalize. No resolver behavior was
changed by this task.

## Recommended next engineering path

1. **A. Contract/prompt simplification**: reduce the recurrent malformed JSON
   burden before reconsidering model selection.
2. **B. Evidence-snippet normalization**: prototype the Model B diagnostic
   result as an isolated, fail-closed server-side span resolver; require a
   unique literal match and preserve the current offset contract until it is
   separately accepted.
3. Re-run this same frozen gauntlet. Do not select fine-tuning, a cloud model,
   or real source data automatically.

## Authority and source safety

All work used controlled synthetic inputs only. The evaluator opens no
database connection, has no materialization operation, and exposes no tool,
Gmail, Calendar, or outbound action path. Invalid output therefore produces no
canonical mutation. `DIRECTOR_REAL_SOURCE_RECORD_ID` was not set or used.

## Regressions

- `npm run core:test`: **24/24 passed**.
- `npm run interpretation:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed.
- `npm run ingress:proof` with `DIRECTOR_PROOF_DATABASE_URL`: passed when run
  alone against the disposable proof database.
- `npm run lint`: passed.
- `npm run build`: passed (with the existing Vite >500 kB chunk-size warning).
