# 02 — Product Requirements Document

# Product

BreakoutGate

## Tagline

**Your skin gets a vote before makeup reaches your cart.**

Alternative demo line:

**Bad skin day. Big moment. Make the better makeup decision.**

---

# Problem

When someone who considers their skin acne-prone, sensitive, oily, dehydrated, red, or texture-prone needs complexion makeup for a near-term event, they face an information mismatch.

They can see:
- marketing claims
- finish
- coverage
- ingredient lists
- reviews
- virtual makeup

But those pieces are disconnected from their current skin state and personal constraints.

A generic VTO can answer:
“How does this shade/look appear?”

It cannot answer:
“Which candidate is worth trying first today, given what I care about and what my skin looks like right now?”

---

# User

Primary:
people who self-identify as acne-prone or sensitive and shop for foundation/concealer complexion products.

Secondary:
beauty retailers that want a more meaningful decision layer before VTO.

---

# Job to be done

“When my skin looks stressed and I need makeup soon, help me compare the products I am already considering, tell me what evidence supports the choice, and show me the best eligible option on my face.”

---

# Core flow

## 1. Set the moment

Options:
- interview
- wedding
- date
- presentation
- night out
- custom

Capture desired:
- coverage
- finish
- wear time importance

Event context affects preference weighting only, not medical claims.

## 2. Skin snapshot

User captures or uploads a selfie.

Quality checks:
- one face
- sufficient resolution
- useful lighting
- minimal obstruction if provider requires it

YouCam Skin Analysis returns provider-level signals.

BreakoutGate normalizes only the signals used.

## 3. Personal constraints

Optional but high value:
- known allergy/sensitivity
- fragrance avoidance
- ingredient avoid list
- finish preference
- coverage requirement

Hard constraints come from the user, not from model inference.

## 4. Candidate products

Compare up to 3 candidates in demo mode.

Each product contains:
- name
- brand
- finish
- coverage
- product claims
- ingredient list if available
- provenance
- evidence completeness
- optional shade/Makeup VTO mapping

## 5. Eligibility

Hard constraints first.

Example:
User says “avoid fragrance.”

A product with a sourced fragrance-present fact is ineligible.

If fragrance status is unknown:
do not mark it safe; reduce confidence / show missing evidence.

## 6. Ranking

For eligible candidates:
- evidence completeness
- desired finish match
- desired coverage match
- current skin-signal compatibility heuristics
- user preferences
- uncertainty penalty

No disease prediction.

## 7. Explanation

Show:
- why winner ranks first
- why alternatives rank lower
- what evidence is missing
- what came from YouCam
- what came from product data
- what came from the user

## 8. Visual proof

Use YouCam Makeup VTO on top candidate(s).

VTO is a visualization layer, not a clinical prediction.

## 9. Decision Receipt

Create a signed/canonical structured record of:
- inputs
- normalized skin signals
- user constraints
- product evidence
- rules applied
- score decomposition
- confidence
- sources
- VTO linkage
- disclaimer version

---

# Functional requirements

FR-1 Capture selfie.
FR-2 Run real YouCam Skin Analysis.
FR-3 Normalize provider output.
FR-4 Accept user constraints.
FR-5 Add 1–3 products.
FR-6 Calculate evidence completeness.
FR-7 Apply hard eligibility rules.
FR-8 Rank eligible products deterministically.
FR-9 Abstain when evidence is insufficient.
FR-10 Explain ranking factors.
FR-11 Run YouCam Makeup VTO.
FR-12 Preserve recommendation if VTO fails.
FR-13 Generate Decision Receipt.
FR-14 Provide replay Judge Mode.
FR-15 Provide clear Live API mode.
FR-16 Delete session data.
FR-17 Never expose API secret.

---

# Non-functional requirements

NFR-1 Core UI responsive.
NFR-2 Main flow keyboard accessible.
NFR-3 Reduced motion supported.
NFR-4 API calls server-side.
NFR-5 Provider timeouts bounded.
NFR-6 Deterministic ranking.
NFR-7 Reproducible fixture tests.
NFR-8 Dependency security scan.
NFR-9 No sensitive image retention by default beyond session requirement.
NFR-10 Clear consent before image processing.

---

# Success metrics for the hackathon prototype

Do not fabricate commercial KPI uplift.

Measure engineering/product metrics:

- median judge-flow completion time
- percent of decision factors with provenance
- deterministic replay consistency
- number of unsupported-claim tests passing
- provider adapter success/failure coverage
- API units consumed per complete live flow
- time to first meaningful decision
- accessibility test coverage
- number of hidden “unknown → safe” conversions: must be zero

---

# Explicit non-goals

- diagnose skin disease
- prescribe treatment
- replace dermatologist advice
- predict whether a product will cause acne
- produce a generalized skincare routine
- model long-term skin progress
- sell products directly
- support every makeup category in v1
