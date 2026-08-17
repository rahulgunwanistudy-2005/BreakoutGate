/**
 * @file tests/receipt/receipt-integrity.test.ts
 * @description Test suite for cryptographic SHA-256 DecisionReceipt generation, verification, and tamper detection.
 */

import { describe, it, expect } from "vitest";
import { Candidate, SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";
import { decide } from "@engine";
import { buildDecisionReceipt, computeInputDigest, verifyDecisionReceipt } from "@receipt";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("Decision Receipt Cryptographic Integrity", () => {
  const adapter = new TestFixtureSourceAdapter();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const sampleSkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_receipt_test_01",
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
      providerTaskId: "tsk_receipt_test",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const sampleConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_receipt_test",
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

  it("builds a valid DecisionReceipt with verified=true", async () => {
    const rawCatalog = await adapter.fetchCatalog();
    const candidates: Candidate[] = rawCatalog.map((raw, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: raw.sourceProductId,
      productEvidence: normalizeProductRecord(raw),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    }));

    const decisionResult = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    }).result;

    const receipt = buildDecisionReceipt({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
      result: decisionResult,
      mode: "test",
    });

    expect(receipt.integrity.algorithm).toBe("SHA-256");
    expect(receipt.integrity.canonicalHash).toHaveLength(64);
    expect(receipt.integrity.verified).toBe(true);

    const verification = verifyDecisionReceipt(receipt);
    expect(verification.isValid).toBe(true);
    expect(verification.tampered).toBe(false);
  });

  it("fails verification when any decision-relevant receipt field is tampered with", async () => {
    const rawCatalog = await adapter.fetchCatalog();
    const candidates: Candidate[] = rawCatalog.map((raw, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: raw.sourceProductId,
      productEvidence: normalizeProductRecord(raw),
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    }));

    const decisionResult = decide({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
    }).result;

    const receipt = buildDecisionReceipt({
      skinState: sampleSkinState,
      userConstraints: sampleConstraints,
      candidates,
      result: decisionResult,
      mode: "test",
    });

    // Tamper with winning candidate
    const tamperedReceipt = {
      ...receipt,
      winningCandidateId: "cand_tampered_fake",
    };

    const verification = verifyDecisionReceipt(tamperedReceipt);
    expect(verification.isValid).toBe(false);
    expect(verification.tampered).toBe(true);
    expect(verification.expectedHash).not.toBe(verification.computedHash);
  });

  it("produces different input digests when input data changes", () => {
    const digest1 = computeInputDigest(sampleConstraints);

    const modifiedConstraints: UserConstraints = {
      ...sampleConstraints,
      hardConstraints: {
        ...sampleConstraints.hardConstraints,
        avoidFragrance: false,
      },
    };

    const digest2 = computeInputDigest(modifiedConstraints);
    expect(digest1).not.toBe(digest2);
  });
});
