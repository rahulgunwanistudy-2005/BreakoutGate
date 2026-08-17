# 09 — AI Agent Orchestration

## Rule 1

Do not ask five agents to “build BreakoutGate.”

Assign bounded interfaces.

---

# Agent roles

## Agent A — Provider engineer

Own:
- YouCam clients
- upload/task/poll
- fixtures
- live smoke scripts
- provider error mapping

Cannot:
- redesign product
- edit ranking rules

## Agent B — Decision engineer

Own:
- schemas
- ranking
- uncertainty
- receipts
- property tests

Cannot:
- use provider raw JSON directly
- invent product evidence

## Agent C — Frontend product engineer

Own:
- UX
- accessibility
- visual system
- Judge Mode presentation

Cannot:
- rewrite decision rules
- invent claims

## Agent D — Evidence/data engineer

Own:
- curated product catalog
- provenance
- claim ledger
- evidence completeness

Cannot:
- label unknown facts as safe

## Agent E — Reliability/security auditor

Own:
- threat model
- secret scanning
- dependency audit
- failure mode testing
- privacy audit
- replay honesty

Cannot:
- “fix” product copy by making stronger unsupported claims

## Agent F — Judge/reviewer

Own:
- rubric grading
- adversarial critique
- demo timing
- repo clarity
- skeptical sponsor-engineer review

Cannot:
- implement major new features at final stage unless they fix a scoring blocker

---

# Shared contracts

Agents may coordinate only through versioned schemas in `packages/contracts`.

Required shared artifacts:

- `SkinState`
- `ProductEvidence`
- `UserConstraints`
- `Decision`
- `DecisionReceipt`
- `ProviderTrace`

---

# Daily/iteration review format

Every agent returns:

1. What changed
2. Files changed
3. Tests run
4. Claims introduced
5. Assumptions introduced
6. Known limitations
7. Interface changes
8. Exact next dependency

This makes AI work auditable.

---

# Merge rule

No merge if any of these are true:

- tests not run
- new schema undocumented
- unknown product data treated as fact
- API secret appears in client bundle
- replay shown as live
- medical guarantee introduced
- core flow broken
- generated copy contradicts code

---

# Reviewer bench

Run final repo through three separate review personas:

1. **Staff engineer / sponsor API judge**
2. **Product/design judge**
3. **Safety/evidence skeptic**

Then run Claude/Grok/Kimi with the benchmark in `14_REVIEWER_BENCHMARK.md`.
