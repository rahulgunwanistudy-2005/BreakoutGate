# 04 — System Architecture

# Architecture principles

1. Separate provider responses from domain models.
2. Separate product facts from inferred preferences.
3. Separate deterministic decision logic from natural-language explanation.
4. Separate live provider mode from replay mode.
5. Treat every external fact as provenance-bearing evidence.
6. Treat missing data as uncertainty.
7. Make VTO optional to decision correctness.
8. Keep all secrets server-side.

---

# Proposed module tree

```text
apps/web
  app/
  components/
  lib/
  server/

packages/domain
  skin-state.ts
  product-evidence.ts
  user-constraints.ts
  decision.ts
  receipt.ts

packages/youcam
  client.ts
  upload.ts
  skin-analysis.ts
  makeup-vto.ts
  polling.ts
  errors.ts
  fixtures/

packages/decision-engine
  eligibility.ts
  scoring.ts
  uncertainty.ts
  explanations.ts
  canonicalize.ts

packages/evidence
  product-normalizer.ts
  provenance.ts
  freshness.ts
  confidence.ts

packages/contracts
  api/
  schemas/

tests
  unit/
  property/
  integration/
  e2e/
  fixtures/

scripts
  live-youcam-smoke.ts
  verify-fixtures.ts
  audit-claims.ts
  judge-replay.ts
```

---

# Request flow

1. Client uploads image to BreakoutGate server.
2. Server validates and normalizes image.
3. YouCam adapter performs provider upload.
4. Skin task is created.
5. Poller waits with bounded retries.
6. Provider response is normalized into `SkinState`.
7. User constraints and product evidence are loaded.
8. Eligibility engine removes hard conflicts.
9. Scoring engine ranks remaining candidates.
10. Uncertainty engine checks evidence completeness and score margin.
11. Receipt is created and canonically hashed.
12. If candidate is previewable, Makeup VTO task runs.
13. VTO artifact is linked to receipt.
14. Client renders human explanation.
15. Evidence drawer renders structured proof.

---

# Provider state machine

```text
idle
  ↓
validating
  ↓
uploading
  ↓
uploaded
  ↓
task_created
  ↓
polling
  ├── success
  ├── provider_failed
  ├── timed_out
  └── canceled
```

Every state transition should be testable.

---

# Failure isolation

## Skin Analysis fails

No recommendation should be fabricated.

User sees:
“Skin signal unavailable. You can retry or compare products using only your declared preferences.”

If the hackathon thesis requires current skin context, prefer retry rather than pretending full feature parity.

## Product source unavailable

Show:
“Evidence incomplete.”

Do not infer missing product facts.

## VTO fails

Decision remains valid.

Show:
“Decision available. Visual preview unavailable.”

## LLM explanation fails

Render deterministic factor text.

The app must not depend on generative explanation.

---

# Live mode vs Judge Mode

## Live mode

Real provider calls.

Show task timing and actual provider status only in developer/evidence view.

## Judge Mode

Uses pre-recorded provider fixtures and VTO output assets from actual successful calls.

Must display:
“Replay of a previously recorded YouCam run.”

The decision engine runs live on fixture inputs.

This proves:
- demo reliability
- same production logic
- no false claim that fixtures are live

---

# API-unit conservation

- Cache identical image+product VTO results by cryptographic hash.
- Do not re-run Skin Analysis if the same processed input was just analyzed in the current session.
- Keep a demo fixture path.
- Live mode should show estimated API units before expensive calls if practical.
- Avoid “run all APIs just to look impressive.”

Judges will value purposeful integration more than wasteful endpoint count.
