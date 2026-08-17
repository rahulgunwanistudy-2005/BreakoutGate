/**
 * @file tests/engine/determinism.test.ts
 * @description Core determinism and reproducibility tests for BreakoutGate Decision Engine.
 */

import { describe, it, expect } from "vitest";
import { decide } from "../../packages/engine";
import { Candidate, SkinState, UserConstraints } from "../../packages/contracts";
import { createKnownEvidenceField } from "../../packages/contracts/evidence";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Decision Engine Determinism & Pure Execution", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_test_face_01",
    signals: {
      spots: createKnownEvidenceField(0.75, "E1_PROVIDER_MEASURED", sampleProvenance),
      wrinkles: createKnownEvidenceField(0.79, "E1_PROVIDER_MEASURED", sampleProvenance),
      texture: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      dark_circles: createKnownEvidenceField(0.78, "E1_PROVIDER_MEASURED", sampleProvenance),
      redness: createKnownEvidenceField(0.88, "E1_PROVIDER_MEASURED", sampleProvenance),
      oiliness: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleProvenance),
      moisture: createKnownEvidenceField(0.45, "E1_PROVIDER_MEASURED", sampleProvenance), // low moisture condition
      pores: createKnownEvidenceField(0.61, "E1_PROVIDER_MEASURED", sampleProvenance),
      radiance: createKnownEvidenceField(0.73, "E1_PROVIDER_MEASURED", sampleProvenance),
      firmness: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      acne: createKnownEvidenceField(0.91, "E1_PROVIDER_MEASURED", sampleProvenance),
    },
    overallQuality: createKnownEvidenceField(0.76, "E1_PROVIDER_MEASURED", sampleProvenance),
    providerMetadata: {
      provider: "youcam",
      providerTaskId: "tsk_demo_face_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_test_01",
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
      skinFeelPreference: "hydrating",
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
    },
  };

  it("produces identical JSON outputs across multiple independent runs with same inputs", async () => {
    const rawCatalog = await adapter.fetchCatalog();
    const candidates: Candidate[] = rawCatalog.map((raw, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: raw.sourceProductId,
      productEvidence: normalizeProductRecord(raw),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    }));

    const run1 = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    const run2 = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    const run3 = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    expect(JSON.stringify(run1.result)).toBe(JSON.stringify(run2.result));
    expect(JSON.stringify(run2.result)).toBe(JSON.stringify(run3.result));
    expect(run1.result.decisionId).toBe(run2.result.decisionId);
    expect(run1.result.winningCandidateId).toBeTruthy();
  });
});
