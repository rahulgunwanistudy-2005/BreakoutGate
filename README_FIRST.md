# BreakoutGate — YouCam API Hackathon Winner Plan

## The thesis in one sentence

**BreakoutGate helps someone with acne-prone or visibly stressed skin decide which makeup product is worth trying first right now, explains why, and then proves the top eligible option visually with YouCam Makeup VTO.**

This package is a build-and-win operating system, not a brainstorm.

It is designed for one solo builder working with multiple AI coding/review agents.

---

## Why this shape can win

The current competition is crowded with:

- generic skin scanners
- skin diaries
- routine recommenders
- generic color matching
- generic virtual try-on
- generic “reduce returns” fashion tools
- combined experiences that simply place Skin AI next to VTO

BreakoutGate deliberately avoids those shapes.

Its product loop is:

**moment → skin evidence → product evidence → deterministic decision → uncertainty → YouCam VTO proof → decision receipt**

The key difference is that the YouCam skin output changes the purchase decision logic. It is not decoration.

---

## The single product moment

> “I have a breakout / redness / texture / oiliness today. I still need makeup for tonight. Which of these products is worth trying first?”

Do not dilute this with general skincare, routine tracking, beauty journaling, social feeds, or a large product marketplace.

---

## Non-negotiable credibility rules

1. Do not diagnose acne, dermatitis, allergy, rosacea, or any condition.
2. Do not claim a foundation “will not cause acne.”
3. Do not claim that a single ingredient deterministically causes breakouts.
4. Use YouCam outputs as non-diagnostic skin signals.
5. Use user-declared sensitivities/allergies as hard constraints.
6. Use product metadata with source provenance.
7. Missing evidence must reduce confidence, never silently become “safe.”
8. The recommendation engine must be deterministic and inspectable.
9. LLMs may explain structured results, but must not be the source of truth.
10. Replay fixtures must be visibly labeled as replay/synthetic.
11. A failed VTO must not corrupt the underlying product decision.
12. Never expose the YouCam API key client-side.

---

## Recommended implementation stack

- Next.js + TypeScript
- Tailwind CSS + accessible component primitives
- Server-side YouCam API adapters
- Postgres or SQLite for local development
- Zod for contracts
- Vitest for unit/property tests
- Playwright for end-to-end tests
- Optional queue abstraction for provider polling
- Vercel for deployment if compatible with polling/runtime needs
- Structured JSON fixtures for replay mode

Keep the architecture boring where possible. Spend complexity on the part judges can score: evidence, decision logic, real YouCam integration, UX, reliability.

---

## Package reading order

1. `00_EXECUTIVE_WIN_STRATEGY.md`
2. `01_HACKATHON_GROUND_TRUTH.md`
3. `02_PRODUCT_PRD.md`
4. `03_COMPETITIVE_AND_WINNER_ANALYSIS.md`
5. `04_SYSTEM_ARCHITECTURE.md`
6. `05_DECISION_ENGINE_SPEC.md`
7. `06_EVIDENCE_AND_DATA_MODEL.md`
8. `07_UX_AND_VISUAL_SYSTEM.md`
9. `08_IMPLEMENTATION_PHASES.md`
10. `09_AGENT_ORCHESTRATION.md`
11. `10_TEST_SECURITY_AUDIT.md`
12. `11_JUDGE_MODE_AND_DEMO.md`
13. `12_SUBMISSION_PLAYBOOK.md`
14. `13_RISK_REGISTER.md`
15. `14_REVIEWER_BENCHMARK.md`
16. `15_REFERENCE_SOURCES.md`

Then give each AI agent one file from `agent_prompts/`.

---

## Definition of “ready to submit”

BreakoutGate is submission-ready only when:

- a first-time user understands the value in under 10 seconds
- real YouCam Skin Analysis works end to end
- real YouCam Makeup VTO works end to end
- the same production ranking engine is used by live mode and Judge Mode
- every recommendation has a Decision Receipt
- every score contribution is inspectable
- every product fact has provenance or is explicitly marked missing
- medical-adjacent unsafe language is blocked
- the main path passes Playwright end to end
- the app handles provider timeout/error gracefully
- the repo can be cloned and run from README instructions
- the demo can be completed reliably in under 60 seconds
- the 1–3 minute video shows the actual product functioning
- the final submission copy maps visibly to all four judging criteria
