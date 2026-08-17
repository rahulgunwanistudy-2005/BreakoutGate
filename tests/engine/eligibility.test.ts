/**
 * @file tests/engine/eligibility.test.ts
 * @description Test suite verifying deterministic hard eligibility rules and UNKNOWN safety.
 */

import { describe, it, expect } from "vitest";
import { decide } from "../../packages/engine";
import { Candidate, SkinState, UserConstraints } from "../../packages/contracts";
import { createKnownEvidenceField } from "../../packages/contracts/evidence";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Hard Eligibility & Unknown Safety Policy", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const dummySkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_elig_test",
    signals: {
      spots: createKnownEvidenceField(0.75, "E1_PROVIDER_MEASURED", sampleProvenance),
      wrinkles: createKnownEvidenceField(0.79, "E1_PROVIDER_MEASURED", sampleProvenance),
      texture: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      dark_circles: createKnownEvidenceField(0.78, "E1_PROVIDER_MEASURED", sampleProvenance),
      redness: createKnownEvidenceField(0.88, "E1_PROVIDER_MEASURED", sampleProvenance),
      oiliness: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleProvenance),
      moisture: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleProvenance),
      pores: createKnownEvidenceField(0.61, "E1_PROVIDER_MEASURED", sampleProvenance),
      radiance: createKnownEvidenceField(0.73, "E1_PROVIDER_MEASURED", sampleProvenance),
      firmness: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      acne: createKnownEvidenceField(0.91, "E1_PROVIDER_MEASURED", sampleProvenance),
    },
    overallQuality: createKnownEvidenceField(0.76, "E1_PROVIDER_MEASURED", sampleProvenance),
    providerMetadata: {
      provider: "youcam",
      providerTaskId: "tsk_elig_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const defaultUserConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_elig_01",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidFragrance: true,
      avoidIngredients: [],
      avoidPoreCloggingClaims: false,
    },
    softPreferences: {
      wearTimeImportance: "medium",
      eventContext: "daily",
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
    },
  };

  it("marks candidate with confirmed fragrance as ineligible when avoidFragrance=true", async () => {
    // prod_test_03 has fragrance
    const raw03 = await adapter.fetchProduct("prod_test_03_fragrance_present");
    const candidate: Candidate = {
      version: "1.0.0",
      candidateId: "cand_03_fragrance",
      productId: raw03.sourceProductId,
      productEvidence: normalizeProductRecord(raw03),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const result = decide({
      skinState: dummySkinState,
      userConstraints: defaultUserConstraints,
      candidates: [candidate],
    });

    const dec = result.result.candidateDecisions[0];
    expect(dec.eligibility).toBe("ineligible");
    expect(dec.score).toBeNull();
    expect(dec.rank).toBeNull();
    expect(dec.ineligibilityReasons[0].code).toBe("HARD_FRAGRANCE_CONFLICT");
  });

  it("marks candidate with UNKNOWN fragrance as ineligible under hard avoidFragrance constraint", async () => {
    // prod_test_02 has missing ingredients -> fragranceFree is UNKNOWN
    const raw02 = await adapter.fetchProduct("prod_test_02_missing_ingredients");
    const candidate: Candidate = {
      version: "1.0.0",
      candidateId: "cand_02_missing_fragrance",
      productId: raw02.sourceProductId,
      productEvidence: normalizeProductRecord(raw02),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const result = decide({
      skinState: dummySkinState,
      userConstraints: defaultUserConstraints,
      candidates: [candidate],
    });

    const dec = result.result.candidateDecisions[0];
    expect(dec.eligibility).toBe("ineligible");
    expect(dec.score).toBeNull();
    expect(dec.rank).toBeNull();
    expect(dec.ineligibilityReasons[0].code).toBe("HARD_FRAGRANCE_CONFLICT");
    expect(dec.ineligibilityReasons[0].message).toContain("UNKNOWN");
  });

  it("marks candidate with excluded ingredient as ineligible", async () => {
    // prod_test_08 contains alcohol_denat
    const raw08 = await adapter.fetchProduct("prod_test_08_alcohol_denat");
    const candidate: Candidate = {
      version: "1.0.0",
      candidateId: "cand_08_alcohol",
      productId: raw08.sourceProductId,
      productEvidence: normalizeProductRecord(raw08),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const result = decide({
      skinState: dummySkinState,
      userConstraints: {
        ...defaultUserConstraints,
        hardConstraints: {
          ...defaultUserConstraints.hardConstraints,
          avoidIngredients: ["alcohol_denat"],
        },
      },
      candidates: [candidate],
    });

    const dec = result.result.candidateDecisions[0];
    expect(dec.eligibility).toBe("ineligible");
    expect(dec.ineligibilityReasons[0].code).toBe("HARD_INGREDIENT_CONFLICT");
  });
});
