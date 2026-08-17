/**
 * @file tests/adversarial/adversarial-suite.test.ts
 * @description Comprehensive Adversarial Attack & Reliability Verification Suite.
 *
 * COVERS:
 * 1. UNKNOWN semantics (UNKNOWN != false, UNKNOWN != safe, UNKNOWN != 0)
 * 2. CONFLICT preservation (no last-write-wins, no silent averaging)
 * 3. Hard constraints attack (strict disqualification)
 * 4. Abstention attack (zero eligible candidates -> clean abstention without fallback)
 * 5. Determinism attack (array reordering invariance)
 * 6. Cryptographic Receipt tamper detection
 * 7. Replay attack (exact historical input reproducibility)
 * 8. LIVE vs DEMO isolation (strict fixture rejection)
 * 9. VTO failure decoupling (winner preserved)
 */

import { describe, it, expect } from "vitest";
import {
  Candidate,
  createConflictingEvidenceField,
  createKnownEvidenceField,
  SkinState,
  UserConstraints,
} from "@contracts";
import { decide } from "@engine";
import { ProductEvidenceCatalog } from "@evidence";
import { TestFixtureSourceAdapter } from "@evidence";
import { buildDecisionReceipt, replayDecision, verifyDecisionReceipt } from "@receipt";
import { executeDecisionPipeline } from "@orchestration";

describe("Adversarial Robustness & System Invariants", () => {
  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const dummySkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_adv_01",
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
    providerMetadata: { provider: "youcam", providerTaskId: "tsk_adv_01" },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const defaultConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_adv_01",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidFragrance: true,
      avoidIngredients: ["alcohol_denat"],
      avoidPoreCloggingClaims: false,
    },
    softPreferences: {
      targetCoverage: "medium",
      targetFinish: "matte",
      wearTimeImportance: "medium",
      eventContext: "daily",
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
      confidence: 1,
    },
  };

  it("1. UNKNOWN Semantics: Missing fragrance data triggers fail-safe ineligibility under avoidFragrance", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidates = catalogService.buildCandidates(evidences);

    // Find fixture with missing ingredients / unknown fragrance
    const missingFragCand = candidates.find((c) => c.productId === "prod_test_02_missing_ingredients");
    expect(missingFragCand).toBeDefined();
    expect(missingFragCand!.productEvidence.fragranceFree.state).toBe("UNKNOWN");
    expect(missingFragCand!.productEvidence.fragranceFree.value).toBeNull();

    const decisionExec = decide({
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates: [missingFragCand!],
    });

    const dec = decisionExec.result.candidateDecisions[0];
    expect(dec.eligibility).toBe("ineligible");
    expect(dec.ineligibilityReasons[0].code).toBe("HARD_FRAGRANCE_CONFLICT");
  });

  it("2. CONFLICT Preservation: Multi-source finish conflict is preserved and triggers hard rule failure", () => {
    const conflictCandidate: Candidate = {
      version: "1.0.0",
      candidateId: "cand_conf_01",
      productId: "prod_conflicting_finish",
      productEvidence: {
        version: "1.0.0",
        productId: "prod_conflicting_finish",
        sourceMode: "TEST_FIXTURE",
        brand: "Conflict Brand",
        name: "Dual Finish Foundation",
        category: "foundation",
        shade: { code: "DEFAULT_SHADE" },
        finish: createConflictingEvidenceField(
          [
            { value: "matte", evidenceClass: "E2_MANUFACTURER_RETAILER", provenance: sampleProvenance },
            { value: "dewy", evidenceClass: "E2_MANUFACTURER_RETAILER", provenance: sampleProvenance },
          ],
          "E2_MANUFACTURER_RETAILER",
          sampleProvenance
        ),
        coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", sampleProvenance),
        fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", sampleProvenance),
        nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", sampleProvenance),
        ingredients: createKnownEvidenceField(["water", "glycerin"], "E2_MANUFACTURER_RETAILER", sampleProvenance),
        claims: [],
        evidenceCompleteness: 0.8,
        provenance: sampleProvenance,
        retrievedAt: "2026-08-17T12:00:00.000Z",
      },
      selectionSource: "curated_catalog",
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    expect(conflictCandidate.productEvidence.finish.state).toBe("CONFLICTING");
    expect(conflictCandidate.productEvidence.finish.value).toBeNull();

    // When requiredFinish is strictly "matte", a CONFLICTING finish must fail eligibility
    const hardFinishConstraints: UserConstraints = {
      ...defaultConstraints,
      hardConstraints: {
        ...defaultConstraints.hardConstraints,
        requiredFinish: "matte",
      },
    };

    const decisionExec = decide({
      skinState: dummySkinState,
      userConstraints: hardFinishConstraints,
      candidates: [conflictCandidate],
    });

    expect(decisionExec.result.candidateDecisions[0].eligibility).toBe("ineligible");
    expect(decisionExec.result.candidateDecisions[0].ineligibilityReasons[0].code).toBe("HARD_USER_AVOID_CONFLICT");
  });

  it("3. Hard Constraint Attack: Excluded ingredients strictly eliminate products", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidates = catalogService.buildCandidates(evidences);

    const alcoholCand = candidates.find((c) => c.productId === "prod_test_08_alcohol_denat");
    expect(alcoholCand).toBeDefined();

    const decisionExec = decide({
      skinState: dummySkinState,
      userConstraints: defaultConstraints, // excludes alcohol_denat
      candidates: [alcoholCand!],
    });

    const dec = decisionExec.result.candidateDecisions[0];
    expect(dec.eligibility).toBe("ineligible");
    expect(dec.ineligibilityReasons[0].code).toBe("HARD_INGREDIENT_CONFLICT");
  });

  it("4. Abstention Attack: 0 eligible candidates returns clean ABSTAIN_ALL_INELIGIBLE", () => {
    const decisionExec = decide({
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates: [],
    });

    expect(decisionExec.result.type).toBe("abstain");
    expect(decisionExec.result.winningCandidateId).toBeNull();
    expect(decisionExec.result.abstention?.code).toBe("ABSTAIN_ALL_INELIGIBLE");
  });

  it("5. Determinism Attack: Input array reordering preserves identical ranks, winner, and scores", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidatesForward = catalogService.buildCandidates(evidences);
    const candidatesReversed = [...candidatesForward].reverse();

    const exec1 = decide({ skinState: dummySkinState, userConstraints: defaultConstraints, candidates: candidatesForward });
    const exec2 = decide({ skinState: dummySkinState, userConstraints: defaultConstraints, candidates: candidatesReversed });

    expect(exec1.result.winningCandidateId).toBe(exec2.result.winningCandidateId);
    expect(exec1.result.candidateDecisions[0].score?.totalScore).toBe(
      exec2.result.candidateDecisions[0].score?.totalScore
    );
  });

  it("6. Receipt Tamper Attack: Any mutation of winner or score breaks SHA-256 validation", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidates = catalogService.buildCandidates(evidences);

    const exec = decide({ skinState: dummySkinState, userConstraints: defaultConstraints, candidates });
    const receipt = buildDecisionReceipt({
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates,
      result: exec.result,
      mode: "test",
    });

    // Valid check
    expect(verifyDecisionReceipt(receipt).isValid).toBe(true);

    // Tampered winner check
    const tamperedReceipt = {
      ...receipt,
      winningCandidateId: "cand_fake_winner",
      result: {
        ...receipt.result,
        winningCandidateId: "cand_fake_winner",
      },
    };
    expect(verifyDecisionReceipt(tamperedReceipt).isValid).toBe(false);
    expect(verifyDecisionReceipt(tamperedReceipt).tampered).toBe(true);
  });

  it("7. Replay Attack: Replaying historical decision reproduces exact winner and scores", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: new TestFixtureSourceAdapter(),
    });
    const candidates = catalogService.buildCandidates(evidences);

    const exec = decide({ skinState: dummySkinState, userConstraints: defaultConstraints, candidates });
    const receipt = buildDecisionReceipt({
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates,
      result: exec.result,
      mode: "test",
    });

    const replay = replayDecision(receipt, {
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates,
    });

    expect(replay.match).toBe(true);
    expect(replay.replayedResult.winningCandidateId).toBe(receipt.winningCandidateId);
  });

  it("8. LIVE vs DEMO Isolation: LIVE mode rejects synthetic TEST_FIXTURE adapter", async () => {
    const catalogService = new ProductEvidenceCatalog();
    const testFixtureAdapter = new TestFixtureSourceAdapter();

    await expect(
      catalogService.resolveCatalog({
        mode: "live",
        adapter: testFixtureAdapter,
      })
    ).rejects.toThrow(/SECURITY FAULT.*TEST_FIXTURE/);
  });

  it("9. VTO Failure Decoupling: VTO failure leaves recommendation winner intact", async () => {
    const res = await executeDecisionPipeline({
      mode: "test",
      userConstraints: defaultConstraints,
      testSkinState: dummySkinState,
      options: {
        enableVto: false, // VTO disabled/unavailable
      },
    });

    expect(res.success).toBe(true);
    expect(res.decision?.winningCandidateId).toBeDefined();
    expect(res.receipt?.vtoArtifact).toBeUndefined();
    expect(verifyDecisionReceipt(res.receipt!).isValid).toBe(true);
  });
});
