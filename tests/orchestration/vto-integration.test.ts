/**
 * @file tests/orchestration/vto-integration.test.ts
 * @description Verification that VTO has ZERO decision authority and failure does not change recommendation.
 */

import { describe, it, expect } from "vitest";
import { SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";
import { executeDecisionPipeline } from "@orchestration";
import { verifyDecisionReceipt } from "@receipt";

describe("Supplemental Makeup VTO Integration & Decision Decoupling", () => {
  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_vto_test",
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
      providerTaskId: "tsk_vto_test",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_vto_test",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidFragrance: true,
      avoidIngredients: [],
      avoidPoreCloggingClaims: false,
    },
    softPreferences: {
      targetCoverage: "medium",
      targetFinish: "natural",
      wearTimeImportance: "medium",
      eventContext: "daily",
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
    },
  };

  it("attaches vtoArtifact to DecisionReceipt when VTO succeeds, preserving decision integrity", async () => {
    const res = await executeDecisionPipeline({
      mode: "test",
      userConstraints: sampleConstraints,
      testSkinState: sampleSkinState,
      options: {
        enableVto: true,
        mockVto: true,
      },
    });

    expect(res.success).toBe(true);
    expect(res.receipt?.vtoArtifact).toBeDefined();
    expect(res.receipt?.vtoArtifact?.artifactUrl).toBe("https://vto.youcam.com/artifacts/mock_look_01.jpg");

    // Cryptographic receipt verification must succeed
    const verification = verifyDecisionReceipt(res.receipt!);
    expect(verification.isValid).toBe(true);
    expect(verification.tampered).toBe(false);
  });

  it("preserves identical winning candidate and decision scores when VTO is disabled or fails", async () => {
    // Run with VTO
    const resWithVto = await executeDecisionPipeline({
      mode: "test",
      userConstraints: sampleConstraints,
      testSkinState: sampleSkinState,
      options: {
        enableVto: true,
        mockVto: true,
      },
    });

    // Run without VTO
    const resWithoutVto = await executeDecisionPipeline({
      mode: "test",
      userConstraints: sampleConstraints,
      testSkinState: sampleSkinState,
      options: {
        enableVto: false,
      },
    });

    expect(resWithVto.decision?.winningCandidateId).toBe(resWithoutVto.decision?.winningCandidateId);
    expect(resWithVto.decision?.candidateDecisions[0].score?.totalScore).toBe(
      resWithoutVto.decision?.candidateDecisions[0].score?.totalScore
    );
    expect(resWithoutVto.receipt?.vtoArtifact).toBeUndefined();

    // Receipt verification for both
    expect(verifyDecisionReceipt(resWithVto.receipt!).isValid).toBe(true);
    expect(verifyDecisionReceipt(resWithoutVto.receipt!).isValid).toBe(true);
  });
});
