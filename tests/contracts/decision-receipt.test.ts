/**
 * @file tests/contracts/decision-receipt.test.ts
 * @description Contract validation tests for DecisionReceipt.
 */

import { describe, it, expect } from "vitest";
import { DecisionReceipt, DecisionReceiptSchema } from "../../packages/contracts/decision-receipt";
import {
  DECISION_ENGINE_VERSION,
  DECISION_RECEIPT_SCHEMA_VERSION,
  DECISION_SCHEMA_VERSION,
} from "../../packages/contracts/versions";

describe("Canonical DecisionReceipt Contract", () => {
  const sampleReceipt: DecisionReceipt = {
    receiptVersion: DECISION_RECEIPT_SCHEMA_VERSION,
    engineVersion: DECISION_ENGINE_VERSION,
    decisionId: "dec_781290",
    generatedAt: "2026-08-17T12:00:00.000Z",
    mode: "live",
    inputs: {
      skinStateAnalysisId: "an_7b382910a",
      skinStateCapturedAt: "2026-08-17T12:00:00.000Z",
      userConstraintsId: "uc_session_9921",
      candidateProductIds: ["prod_01", "prod_02"],
    },
    result: {
      version: DECISION_SCHEMA_VERSION,
      decisionId: "dec_781290",
      type: "decision",
      winningCandidateId: "cand_01",
      confidenceBand: "high_evidence",
      abstention: null,
      candidateDecisions: [
        {
          candidateId: "cand_01",
          productId: "prod_01",
          eligibility: "eligible",
          ineligibilityReasons: [],
          score: {
            coverageMatch: 25,
            finishMatch: 20,
            skinContextMatch: 15,
            evidenceCompleteness: 20,
            preferenceMatch: 10,
            unknownPenalty: 0,
            totalScore: 90,
          },
          reasonCodes: ["COVERAGE_EXACT_MATCH"],
          rank: 1,
        },
      ],
      counterfactuals: [],
      vtoPreviewableCandidateId: "cand_01",
      decidedAt: "2026-08-17T12:00:00.000Z",
    },
    candidateDecisions: [
      {
        candidateId: "cand_01",
        productId: "prod_01",
        eligibility: "eligible",
        ineligibilityReasons: [],
        score: {
          coverageMatch: 25,
          finishMatch: 20,
          skinContextMatch: 15,
          evidenceCompleteness: 20,
          preferenceMatch: 10,
          unknownPenalty: 0,
          totalScore: 90,
        },
        reasonCodes: ["COVERAGE_EXACT_MATCH"],
        rank: 1,
      },
    ],
    winningCandidateId: "cand_01",
    providerTraceReferences: [
      {
        traceId: "tr_a1b2c3d4e5f60718",
        operation: "skin_analysis_poll",
        durationMs: 1450,
        taskId: "tsk_sk_7b382910a",
      },
    ],
    vtoArtifact: {
      taskId: "tsk_vto_98a7c2b",
      artifactUrl: "https://cdn.perfectcorp.com/vto/tsk_vto_98a7c2b.png",
      generatedAt: "2026-08-17T12:00:05.000Z",
    },
    integrity: {
      algorithm: "SHA-256",
      canonicalHash: "placeholder_hash_until_phase_3",
      verified: false,
    },
  };

  it("validates a complete DecisionReceipt structure", () => {
    const parsed = DecisionReceiptSchema.parse(sampleReceipt);
    expect(parsed.receiptVersion).toBe(DECISION_RECEIPT_SCHEMA_VERSION);
    expect(parsed.engineVersion).toBe(DECISION_ENGINE_VERSION);
    expect(parsed.inputs.skinStateAnalysisId).toBe("an_7b382910a");
    expect(parsed.providerTraceReferences).toHaveLength(1);
    expect(parsed.integrity.algorithm).toBe("SHA-256");
  });

  it("rejects invalid date format or malformed decisionId", () => {
    expect(() =>
      DecisionReceiptSchema.parse({
        ...sampleReceipt,
        decisionId: "invalid_no_prefix",
      })
    ).toThrow();
  });
});
