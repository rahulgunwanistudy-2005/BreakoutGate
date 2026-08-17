# 05 — Decision Engine Specification

## Core rule

The engine does not output:
“safe” or “unsafe for acne.”

It outputs:
- eligible / ineligible based on user-declared constraints
- ranked preference fit
- evidence confidence
- missing evidence
- reasons

---

# Inputs

## SkinState

Derived from YouCam.

Example:

```json
{
  "version": "1",
  "signals": {
    "acne": {"value": 0.72, "source": "youcam"},
    "redness": {"value": 0.61, "source": "youcam"},
    "hydration": {"value": 0.35, "source": "youcam"},
    "oiliness": {"value": 0.58, "source": "youcam"},
    "texture": {"value": 0.66, "source": "youcam"}
  }
}
```

Values should use whatever normalized scale the adapter defines. Preserve raw provider values separately.

## UserConstraints

Example:

```json
{
  "knownAvoids": ["fragrance"],
  "requiredCoverage": "medium",
  "finishPreference": "natural",
  "event": "interview"
}
```

## ProductEvidence

Example:

```json
{
  "name": "Candidate B",
  "finish": {"value": "natural", "confidence": 1, "source": "..."},
  "coverage": {"value": "medium", "confidence": 1, "source": "..."},
  "fragrance": {"value": false, "confidence": 0.9, "source": "..."},
  "claims": [],
  "ingredients": [],
  "evidenceCompleteness": 0.88
}
```

---

# Decision stages

## Stage 1: Hard constraints

Only rules grounded in:
- user-declared allergy/sensitivity/avoid
- directly sourced product fact

Example:
user says “avoid fragrance”
and product evidence confidently says fragrance present
→ ineligible

Unknown fragrance status
→ not automatically eligible
→ unknown flag + uncertainty penalty

## Stage 2: Preference compatibility

Coverage match.

Finish match.

Optional heuristic mapping between current signals and finish preference should be conservative.

Example:
If texture/hydration signals are elevated/low, the product may apply a soft penalty to an extreme matte preference only if the logic is clearly framed as appearance/comfort preference, not clinical safety.

## Stage 3: Evidence completeness

Strongly penalize products with missing key evidence.

A high score with poor evidence should not beat a slightly lower but well-supported candidate without showing uncertainty.

## Stage 4: Confidence

Confidence derives from:
- evidence completeness
- number of unresolved unknowns
- score margin between top candidates
- presence of hard constraints
- provider signal availability

Do not manufacture probabilistic calibration unless actually validated.

Use qualitative bands if necessary:
- high evidence
- moderate evidence
- low evidence / abstain

## Stage 5: Abstention

Return `abstain` if:
- no eligible candidate
- top candidates have insufficient evidence
- critical product property required by user is unknown
- skin analysis unavailable and current-skin logic is essential
- data conflicts

---

# Example scoring model

Not final; tune only with documented rationale.

```text
score =
  + 25 coverage_match
  + 20 finish_match
  + 15 current_skin_context_match
  + 20 evidence_completeness
  + 10 user_preference_match
  + 10 retail_metadata_quality
  - unknown_penalties
```

Hard constraints happen before scoring.

The score is not a health score.

---

# Required properties

1. Determinism:
same canonical input → same output.

2. Hard-constraint monotonicity:
adding a confirmed conflict can never improve rank.

3. Evidence monotonicity:
turning a known favorable fact into unknown cannot increase confidence.

4. Missingness honesty:
unknown ≠ false.

5. Abstention:
insufficient evidence must be representable.

6. Explainability:
every score contribution has a stable reason code.

---

# Reason codes

```text
HARD_USER_AVOID_CONFLICT
COVERAGE_EXACT_MATCH
COVERAGE_PARTIAL_MATCH
FINISH_EXACT_MATCH
FINISH_CONTEXT_PENALTY
EVIDENCE_COMPLETE
EVIDENCE_MISSING_FRAGRANCE
EVIDENCE_MISSING_INGREDIENTS
USER_PREFERENCE_MATCH
LOW_SCORE_MARGIN
ABSTAIN_INSUFFICIENT_EVIDENCE
```

UI explanations map from reason codes.

Do not let an LLM invent reason codes.

---

# Counterfactual feature

High-value judge feature:

“Why didn’t Candidate A win?”

Compute from score decomposition:

> Candidate A matched your coverage need, but its fragrance status is unknown and its finish is a weaker match to your current preferences. Candidate B has stronger evidence completeness.

This feels intelligent while remaining deterministic.
