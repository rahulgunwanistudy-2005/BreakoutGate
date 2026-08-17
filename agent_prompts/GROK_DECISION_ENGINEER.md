# Grok Decision Engine Prompt

You own BreakoutGate's deterministic decision engine.

Read:
- 02_PRODUCT_PRD.md
- 05_DECISION_ENGINE_SPEC.md
- 06_EVIDENCE_AND_DATA_MODEL.md
- 14_REVIEWER_BENCHMARK.md

Build:
- SkinState
- ProductEvidence
- UserConstraints
- eligibility
- scoring
- uncertainty
- abstention
- reason codes
- counterfactual explanations
- Decision Receipt canonicalization/hash

Do not:
- diagnose
- predict acne
- use an LLM as source of truth
- convert unknown to favorable
- invent product evidence
- modify provider adapter

Required tests:
- determinism
- hard constraint monotonicity
- evidence monotonicity
- unknown != false
- all ineligible → abstain
- low evidence → lower confidence
- VTO metadata cannot affect ranking

Return:
- architecture note
- score formula
- all reason codes
- test report
- assumptions you believe a skeptical judge will attack
