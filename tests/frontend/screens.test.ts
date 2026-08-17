/**
 * @file tests/frontend/screens.test.ts
 * @description Lean frontend rendering and state verification tests.
 */

import { describe, it, expect } from "vitest";
import { DecisionReceipt, SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";
import { decide } from "@engine";
import { ProductEvidenceCatalog } from "@evidence";
import { TestFixtureSourceAdapter } from "@evidence";
import { buildDecisionReceipt, verifyDecisionReceipt } from "@receipt";

describe("Frontend Presentation & State Integrity", () => {
  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_front_test",
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
      providerTaskId: "tsk_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_front_test",
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
      confidence: 1,
    },
  };

  it("verifies receipt integrity correctly on client side", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidates = catalogService.buildCandidates(evidences);

    const decisionExec = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    const receipt = buildDecisionReceipt({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
      result: decisionExec.result,
      mode: "test",
    });

    // Valid check
    const validCheck = verifyDecisionReceipt(receipt);
    expect(validCheck.isValid).toBe(true);
    expect(validCheck.tampered).toBe(false);

    // Tampered check
    const tamperedReceipt: DecisionReceipt = {
      ...receipt,
      winningCandidateId: "cand_tampered_fake",
      result: {
        ...receipt.result,
        winningCandidateId: "cand_tampered_fake",
      },
    };
    const tamperedCheck = verifyDecisionReceipt(tamperedReceipt);
    expect(tamperedCheck.isValid).toBe(false);
    expect(tamperedCheck.tampered).toBe(true);
  });

  it("handles engine abstention properly without fabricating recommendations", () => {
    const catalogService = new ProductEvidenceCatalog();
    const candidates = catalogService.buildCandidates([]); // Empty candidates -> abstain

    const decisionExec = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    expect(decisionExec.result.type).toBe("abstain");
    expect(decisionExec.result.winningCandidateId).toBeNull();
    expect(decisionExec.result.abstention?.code).toBe("ABSTAIN_ALL_INELIGIBLE");
  });
});
