/**
 * @file tests/orchestration/orchestration.test.ts
 * @description Integration tests for API Orchestration Pipeline and mode separation.
 */

import { describe, it, expect } from "vitest";
import { SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";
import { executeDecisionPipeline } from "@orchestration";

describe("API Orchestration Pipeline Boundary", () => {
  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_orch_test",
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
      providerTaskId: "tsk_orch_test",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_orch_test",
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

  it("successfully orchestrates end-to-end in TEST mode and produces a verified receipt", async () => {
    const response = await executeDecisionPipeline({
      mode: "test",
      userConstraints: sampleConstraints,
      testSkinState: sampleSkinState,
    });

    expect(response.success).toBe(true);
    expect(response.decision).toBeDefined();
    expect(response.receipt).toBeDefined();
    expect(response.receipt?.integrity.verified).toBe(true);
    expect(response.traceSummary?.candidateCount).toBeGreaterThan(0);
    expect(response.traceSummary?.winnerId).toBeTruthy();
  });

  it("strictly rejects LIVE mode request attempting to inject testSkinState or catalogOverride", async () => {
    const response = await executeDecisionPipeline({
      mode: "live",
      userConstraints: sampleConstraints,
      testSkinState: sampleSkinState, // Illegal in live mode
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.message).toContain("LIVE mode requires an image and strictly rejects testSkinState");
  });

  it("returns defined safe error when LIVE mode has missing image bytes", async () => {
    const response = await executeDecisionPipeline({
      mode: "live",
      userConstraints: sampleConstraints,
      // No imageBuffer or imageBase64
    });

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });
});
