# 06 — Evidence and Data Model

## Goal

Make every important factual statement traceable.

---

# Evidence classes

## E0 — User declared

Examples:
- “I avoid fragrance.”
- “I want medium coverage.”
- “I prefer a natural finish.”

Strong for preference/constraint logic.

## E1 — Provider measured

YouCam Skin Analysis signals.

Do not relabel as diagnoses.

## E2 — Manufacturer/retailer fact

Examples:
- finish
- coverage
- ingredient list
- “fragrance-free” claim
- “non-comedogenic” claim

Preserve wording as a claim unless independently verified.

## E3 — Third-party evidence

Only if used and authorized.

Could include reputable ingredient/product metadata.

## E4 — Derived

Examples:
- evidence completeness
- ranking
- reason codes
- confidence band

Must identify the derivation/version.

---

# Provenance fields

Every sourced field should support:

```json
{
  "value": "natural",
  "sourceType": "manufacturer",
  "sourceUrl": "...",
  "retrievedAt": "ISO-8601",
  "confidence": 1,
  "rawLabel": "Natural Finish"
}
```

---

# Claim ledger

Create `claims/claim-ledger.json`.

Every judge-facing claim should be classified:

- verified product behavior
- measured prototype metric
- sourced market/problem evidence
- hypothesis
- forbidden

Example:

```json
{
  "claim": "BreakoutGate never treats missing fragrance data as fragrance-free.",
  "class": "verified_product_behavior",
  "proof": "unit/property tests"
}
```

Do not put unverified ROI claims in Devpost.

---

# Image privacy

Recommended prototype policy:

- upload only with explicit user action
- process server-side
- use provider only for requested feature
- do not train on user images
- avoid permanent storage
- delete local/server copy after session or short TTL
- document provider retention separately based on actual Perfect Corp terms/docs
- provide “Delete my session” action
- hash canonical artifacts where useful without storing raw images

Do not promise provider deletion behavior unless verified.

---

# Product data strategy

For the hackathon, use a curated mini-catalog of 6–12 products with explicit source provenance.

Why:

- guarantees evidence quality
- controls demo reliability
- lets you deeply validate logic
- avoids scraping/legal mess
- keeps visual polish high

Then add “paste product URL” as an experimental feature only if stable.

A winning prototype does not need a full Sephora crawler.

---

# Evidence completeness

Per candidate:

Required fields can depend on user constraints.

Example:
If user says “avoid fragrance,” fragrance evidence becomes critical.

Compute:

- complete
- partial
- insufficient

Show a visual evidence meter that cannot be mistaken for product quality.

Label:
**Evidence coverage**, not **Safety score**.
