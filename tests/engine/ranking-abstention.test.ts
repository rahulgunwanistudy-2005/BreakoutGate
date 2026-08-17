/**
 * @file tests/engine/ranking-abstention.test.ts
 * @description Test suite for ranking, tie-breaking, abstention conditions, and counterfactuals.
 */

import { describe, it, expect } from "vitest";
import { decide } from "../../packages/engine";
import { Candidate, SkinState, UserConstraints } from "../../packages/contracts";
import { createKnownEvidenceField } from "../../packages/contracts/evidence";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Ranking, Abstention & Counterfactuals", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const dummySkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_rank_test",
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
      providerTaskId: "tsk_rank_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const createConstraints = (hard?: Partial<UserConstraints["hardConstraints"]>, soft?: Partial<UserConstraints["softPreferences"]>): UserConstraints => ({
    version: "1.0.0",
    constraintId: "uc_rank_01",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidFragrance: false,
      avoidIngredients: [],
      avoidPoreCloggingClaims: false,
      ...hard,
    },
    softPreferences: {
      wearTimeImportance: "medium",
      eventContext: "daily",
      ...soft,
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
    },
  });

  it("ranks eligible candidates deterministically and assigns rank=1 to winner", async () => {
    const raw01 = await adapter.fetchProduct("prod_test_01_complete");
    const raw09 = await adapter.fetchProduct("prod_test_09_full_coverage_matte");

    const cand01: Candidate = {
      version: "1.0.0",
      candidateId: "cand_01",
      productId: raw01.sourceProductId,
      productEvidence: normalizeProductRecord(raw01),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const cand09: Candidate = {
      version: "1.0.0",
      candidateId: "cand_09",
      productId: raw09.sourceProductId,
      productEvidence: normalizeProductRecord(raw09),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const result = decide({
      skinState: dummySkinState,
      userConstraints: createConstraints({}, { targetCoverage: "medium", targetFinish: "natural" }),
      candidates: [cand01, cand09],
    });

    expect(result.result.type).toBe("decision");
    expect(result.result.winningCandidateId).toBe("cand_01");

    const d01 = result.result.candidateDecisions.find((d) => d.candidateId === "cand_01");
    const d09 = result.result.candidateDecisions.find((d) => d.candidateId === "cand_09");

    expect(d01?.rank).toBe(1);
    expect(d09?.rank).toBe(2);
    expect(d01?.score?.totalScore).toBeGreaterThan(d09?.score?.totalScore ?? 0);

    // Counterfactual generated for non-winner
    expect(result.result.counterfactuals).toHaveLength(1);
    expect(result.result.counterfactuals[0].targetCandidateId).toBe("cand_09");
    expect(result.result.counterfactuals[0].comparedToWinnerId).toBe("cand_01");
  });

  it("triggers abstention when all candidates are ineligible", async () => {
    const raw03 = await adapter.fetchProduct("prod_test_03_fragrance_present");
    const cand03: Candidate = {
      version: "1.0.0",
      candidateId: "cand_03",
      productId: raw03.sourceProductId,
      productEvidence: normalizeProductRecord(raw03),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const result = decide({
      skinState: dummySkinState,
      userConstraints: createConstraints({ avoidFragrance: true }),
      candidates: [cand03],
    });

    expect(result.result.type).toBe("abstain");
    expect(result.result.winningCandidateId).toBeNull();
    expect(result.result.abstention?.code).toBe("ABSTAIN_ALL_INELIGIBLE");
  });
});
