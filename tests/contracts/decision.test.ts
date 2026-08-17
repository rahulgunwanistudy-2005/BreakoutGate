/**
 * @file tests/contracts/decision.test.ts
 * @description Contract validation tests for DecisionResult, CandidateDecision, and ReasonCodes.
 */

import { describe, it, expect } from "vitest";
import { CandidateDecisionSchema, DecisionResult, DecisionResultSchema } from "../../packages/contracts/decision";
import { DECISION_SCHEMA_VERSION } from "../../packages/contracts/versions";

describe("Canonical Decision Contracts", () => {
  const sampleProvenance = {
    sourceType: "derived" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
    derivationRule: "Rule: Hard Constraint Evaluation",
  };

  it("validates an eligible CandidateDecision with score and rank", () => {
    const eligibleCandidate = {
      candidateId: "cand_01",
      productId: "prod_01",
      eligibility: "eligible" as const,
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
      reasonCodes: ["COVERAGE_EXACT_MATCH" as const, "FINISH_EXACT_MATCH" as const, "EVIDENCE_COMPLETE" as const],
      rank: 1,
    };

    const parsed = CandidateDecisionSchema.parse(eligibleCandidate);
    expect(parsed.eligibility).toBe("eligible");
    expect(parsed.score?.totalScore).toBe(90);
    expect(parsed.rank).toBe(1);
  });

  it("validates an ineligible CandidateDecision with score=null and ineligibilityReasons", () => {
    const ineligibleCandidate = {
      candidateId: "cand_02",
      productId: "prod_02",
      eligibility: "ineligible" as const,
      ineligibilityReasons: [
        {
          code: "HARD_FRAGRANCE_CONFLICT" as const,
          message: "Product contains fragrance, conflicting with user avoid constraint.",
          conflictingField: "fragranceFree",
          conflictingValue: false,
          provenance: sampleProvenance,
        },
      ],
      score: null,
      reasonCodes: ["HARD_USER_AVOID_CONFLICT" as const],
      rank: null,
    };

    const parsed = CandidateDecisionSchema.parse(ineligibleCandidate);
    expect(parsed.eligibility).toBe("ineligible");
    expect(parsed.score).toBeNull();
    expect(parsed.rank).toBeNull();
    expect(parsed.ineligibilityReasons).toHaveLength(1);
  });

  it("rejects invalid state: eligible candidate with score=null", () => {
    expect(() =>
      CandidateDecisionSchema.parse({
        candidateId: "cand_01",
        productId: "prod_01",
        eligibility: "eligible",
        ineligibilityReasons: [],
        score: null, // Invalid for eligible
        reasonCodes: [],
        rank: 1,
      })
    ).toThrow();
  });

  it("rejects invalid state: ineligible candidate without ineligibilityReasons", () => {
    expect(() =>
      CandidateDecisionSchema.parse({
        candidateId: "cand_02",
        productId: "prod_02",
        eligibility: "ineligible",
        ineligibilityReasons: [], // Invalid: must have at least 1 reason
        score: null,
        reasonCodes: [],
        rank: null,
      })
    ).toThrow();
  });

  it("validates complete DecisionResult object with counterfactuals", () => {
    const decision: DecisionResult = {
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
          reasonCodes: ["COVERAGE_EXACT_MATCH", "FINISH_EXACT_MATCH"],
          rank: 1,
        },
      ],
      counterfactuals: [
        {
          targetCandidateId: "cand_02",
          comparedToWinnerId: "cand_01",
          explanation: "Candidate 2 was ineligible due to fragrance conflict.",
          primaryDifferentiatingFactors: ["fragranceFree"],
        },
      ],
      vtoPreviewableCandidateId: "cand_01",
      decidedAt: "2026-08-17T12:00:00.000Z",
    };

    const parsed = DecisionResultSchema.parse(decision);
    expect(parsed.winningCandidateId).toBe("cand_01");
    expect(parsed.counterfactuals).toHaveLength(1);
  });
});
