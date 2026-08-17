/**
 * @file tests/receipt/replay.test.ts
 * @description Test suite for deterministic replay verification.
 */

import { describe, it, expect } from "vitest";
import { Candidate, SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";
import { decide } from "@engine";
import { buildDecisionReceipt, replayDecision } from "@receipt";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Deterministic Decision Replay", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_replay_test",
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
      providerTaskId: "tsk_replay_test",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_replay_test",
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

  it("replays a decision with identical inputs and achieves match=true with zero mismatches", async () => {
    const rawCatalog = await adapter.fetchCatalog();
    const candidates: Candidate[] = rawCatalog.map((raw, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: raw.sourceProductId,
      productEvidence: normalizeProductRecord(raw),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    }));

    const originalDecision = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    }).result;

    const receipt = buildDecisionReceipt({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
      result: originalDecision,
      mode: "test",
    });

    const replayResult = replayDecision(receipt, {
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    });

    expect(replayResult.match).toBe(true);
    expect(replayResult.mismatches).toHaveLength(0);
    expect(replayResult.originalResultHash).toBe(replayResult.replayedResultHash);
    expect(replayResult.replayedResult.winningCandidateId).toBe(originalDecision.winningCandidateId);
  });

  it("detects input alteration during replay and reports mismatch", async () => {
    const rawCatalog = await adapter.fetchCatalog();
    const candidates: Candidate[] = rawCatalog.map((raw, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: raw.sourceProductId,
      productEvidence: normalizeProductRecord(raw),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    }));

    const originalDecision = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    }).result;

    const receipt = buildDecisionReceipt({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
      result: originalDecision,
      mode: "test",
    });

    // Alter constraints for replay
    const alteredConstraints: UserConstraints = {
      ...sampleConstraints,
      hardConstraints: {
        ...sampleConstraints.hardConstraints,
        avoidFragrance: false,
      },
    };

    const replayResult = replayDecision(receipt, {
      skinState: sampleSkinState,
      userConstraints: alteredConstraints,
      candidates,
    });

    expect(replayResult.match).toBe(false);
    expect(replayResult.inputFidelity.userConstraintsMatch).toBe(false);
    expect(replayResult.mismatches.length).toBeGreaterThan(0);
  });
});
