# 10 — Test, Security, Reliability, and Audit Plan

# Test pyramid

## Unit

- product evidence normalization
- hard constraints
- scoring
- confidence
- abstention
- reason codes
- receipt canonicalization
- claim phrase guardrails

## Property tests

Examples:

- adding a hard conflict cannot improve rank
- deleting evidence cannot increase confidence
- unknown cannot equal false
- identical inputs produce identical receipt hash
- changing non-scoring display fields cannot change ranking
- ineligible candidate never wins
- if all candidates ineligible, engine abstains

## Integration

- YouCam Skin fixture normalization
- YouCam Makeup VTO fixture normalization
- task state machine
- timeout
- provider failure
- rate limit handling
- stale fixture version detection

## End to end

- replay happy path
- live smoke path
- user sensitivity conflict
- insufficient evidence
- VTO failure after successful decision
- delete session
- mobile viewport
- keyboard navigation

---

# Claim safety tests

Create automated string/pattern tests for forbidden phrases such as:

- “will not break you out”
- “safe for acne”
- “diagnosed”
- “cures”
- “guaranteed”
- “dermatologist approved” unless exactly sourced
- “clinically proven” unless attached to a verified source and relevant product fact

Prefer structured copy generation over free-form model output.

---

# Security

## Secrets

- YouCam key server-only
- `.env.example` contains placeholders only
- git secret scan in CI

## Inputs

- MIME allowlist
- file size limit
- image dimensions
- one-face requirement if applicable
- URL allowlist/SSRF protection for product imports
- sanitize user-supplied text

## Abuse

- rate limit expensive routes
- bounded polling
- no unbounded task fan-out
- cache duplicate provider work

## Privacy

- no raw face images in logs
- no base64 image payload logging
- delete local temp files
- document storage TTL
- user-triggered delete

---

# Observability

Log structured fields:

- request ID
- provider task state
- adapter version
- latency
- outcome
- API call class
- fixture/live mode

Do not log:
- API keys
- raw user face images
- full sensitive user notes

---

# CI gates

Suggested:

```text
lint
typecheck
unit
property
integration-fixture
e2e-replay
secret-scan
dependency-audit
claim-audit
build
```

Live provider tests should be opt-in/manual to avoid cost and flaky CI.

---

# Reliability budget

Judge Mode must not depend on live provider latency.

Live mode may.

This is not deception if replay is explicitly labeled.

Judge Mode should use real previously recorded outputs and the same production normalization/decision code.
