# 14 — Claude / Grok / Kimi Review Benchmark

Run each reviewer independently.

Do not give them the desired score.

Ask them to fail the project aggressively.

---

# Section A — Hackathon rubric

Score 0–10:

## Technological Implementation

Fail if:
- YouCam is a decorative call
- provider integration is not real
- core logic is an opaque LLM prompt
- no failure handling
- no meaningful tests

10 requires:
- real, non-trivial YouCam use
- typed/robust adapters
- deterministic logic
- evidence/provenance
- reliability

## Design

Fail if:
- looks like admin dashboard
- core value unclear
- evidence overwhelms primary flow
- mobile flow poor

10 requires:
- complete coherent product
- premium polish
- progressive disclosure
- accessible main path

## Potential Impact

Fail if:
- target is “everyone”
- problem is generic
- claims unsupported
- no plausible retail path

10 requires:
- sharp recurring moment
- credible audience
- clear consumer value
- plausible retailer integration

## Quality of Idea

Fail if:
- could be summarized as skin scanner or makeup VTO
- copies crowded patterns
- mechanism is obvious API use

10 requires:
- non-obvious use
- clear differentiation
- skin context functionally changes purchase decision

---

# Section B — Engineering

Check:
- secret exposure
- SSRF
- upload validation
- task polling bugs
- race conditions
- stale fixtures
- schema drift
- bad caching keys
- missing timeout
- lack of cancellation
- PII logging
- reproducibility
- dependency issues

---

# Section C — Evidence integrity

Check:
- missing data converted to safe
- brand marketing treated as independent fact
- medical language
- fake metrics
- replay presented as live
- product claims without source
- uncalibrated confidence presented numerically

---

# Section D — Judge Mode

Must answer:
- What is live?
- What is replay?
- What is YouCam?
- What is deterministic?
- What is sourced?
- What is unknown?

If any answer is ambiguous, fail the demo integrity check.

---

# Section E — Adversarial questions

1. Prove this is not an LLM wrapper.
2. Prove the winner changes if user constraints change.
3. Prove missing evidence lowers confidence.
4. Prove an ineligible product cannot win.
5. Prove VTO failure does not change ranking.
6. Prove replay is labeled.
7. Prove the API key is not in client JS.
8. Prove the recommendation is reproducible.
9. Prove every user-facing medical-adjacent phrase is allowed.
10. Explain why YouCam is essential.

---

# Release threshold

Do not submit until all reviewer models independently score:

- Technical >= 9
- Design >= 9
- Impact >= 8.5
- Idea >= 9

and no reviewer identifies:
- critical security issue
- false medical claim
- fake live claim
- core demo failure
