/**
 * @file tests/engine/invariants.test.ts
 * @description Property and invariant verification tests for the BreakoutGate Decision Engine.
 */

import { describe, it, expect } from "vitest";
import { decide } from "../../packages/engine";
import { Candidate, SkinState, UserConstraints } from "../../packages/contracts";
import { createKnownEvidenceField, createUnknownEvidenceField } from "../../packages/contracts/evidence";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Architectural Invariant Tests", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_inv_test",
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
      providerTaskId: "tsk_inv_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const createConstraints = (hard?: Partial<UserConstraints["hardConstraints"]>, soft?: Partial<UserConstraints["softPreferences"]>): UserConstraints => ({
    version: "1.0.0",
    constraintId: "uc_inv_01",
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

  it("INVARIANT 1: Ineligible candidate cannot be winner or receive a rank", async () => {
    const raw03 = await adapter.fetchProduct("prod_test_03_fragrance_present");
    const raw01 = await adapter.fetchProduct("prod_test_01_complete");

    const cand03: Candidate = {
      version: "1.0.0",
      candidateId: "cand_03_inelig",
      productId: raw03.sourceProductId,
      productEvidence: normalizeProductRecord(raw03),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const cand01: Candidate = {
      version: "1.0.0",
      candidateId: "cand_01_elig",
      productId: raw01.sourceProductId,
      productEvidence: normalizeProductRecord(raw01),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const res = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints({ avoidFragrance: true }),
      candidates: [cand03, cand01],
    });

    expect(res.result.winningCandidateId).not.toBe("cand_03_inelig");
    const d03 = res.result.candidateDecisions.find((d) => d.candidateId === "cand_03_inelig");
    expect(d03?.eligibility).toBe("ineligible");
    expect(d03?.rank).toBeNull();
    expect(d03?.score).toBeNull();
  });

  it("INVARIANT 2: Unknown evidence cannot improve a candidate score", async () => {
    const raw01 = await adapter.fetchProduct("prod_test_01_complete");
    const candComplete: Candidate = {
      version: "1.0.0",
      candidateId: "cand_comp",
      productId: raw01.sourceProductId,
      productEvidence: normalizeProductRecord(raw01),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    // Make finish UNKNOWN
    const candUnknown: Candidate = {
      ...candComplete,
      candidateId: "cand_unk",
      productEvidence: {
        ...candComplete.productEvidence,
        finish: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", sampleProvenance),
        evidenceCompleteness: 0.7,
      },
    };

    const res1 = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints({}, { targetFinish: "natural" }),
      candidates: [candComplete],
    });

    const res2 = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints({}, { targetFinish: "natural" }),
      candidates: [candUnknown],
    });

    const score1 = res1.result.candidateDecisions[0].score!.totalScore;
    const score2 = res2.result.candidateDecisions[0].score!.totalScore;
    expect(score2).toBeLessThan(score1);
  });

  it("INVARIANT 3: Adding an unrelated candidate cannot change the score of an existing candidate", async () => {
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

    const resSingle = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints({}, { targetCoverage: "medium" }),
      candidates: [cand01],
    });

    const resPair = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints({}, { targetCoverage: "medium" }),
      candidates: [cand01, cand09],
    });

    const dSingle = resSingle.result.candidateDecisions.find((d) => d.candidateId === "cand_01");
    const dPair = resPair.result.candidateDecisions.find((d) => d.candidateId === "cand_01");

    expect(dPair?.score).toEqual(dSingle?.score);
  });

  it("INVARIANT 4: Hard exclusion cannot be overridden by soft preference", async () => {
    const raw08 = await adapter.fetchProduct("prod_test_08_alcohol_denat");
    const cand08: Candidate = {
      version: "1.0.0",
      candidateId: "cand_08",
      productId: raw08.sourceProductId,
      productEvidence: normalizeProductRecord(raw08),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const res = decide({
      skinState: sampleSkinState,
      userConstraints: createConstraints(
        { avoidIngredients: ["alcohol_denat"] },
        { targetCoverage: "medium", targetFinish: "natural" }
      ),
      candidates: [cand08],
    });

    expect(res.result.candidateDecisions[0].eligibility).toBe("ineligible");
    expect(res.result.winningCandidateId).toBeNull();
    expect(res.result.type).toBe("abstain");
  });
});
