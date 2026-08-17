/**
 * @file packages/contracts/decision.ts
 * @description Canonical Decision contracts for eligibility, decomposed scores, reason codes, and abstentions.
 *
 * CRITICAL INVARIANTS:
 * 1. Output is strictly deterministic and inspectable (INV-01).
 * 2. Every score factor has a stable reason code (no free-form LLM hallucination).
 * 3. Ineligible candidates have score = null and rank = null.
 */

import { z } from "zod";
import { ProvenanceSchema } from "./evidence";
import { DECISION_SCHEMA_VERSION } from "./versions";

export const ReasonCodeEnum = z.enum([
  "HARD_USER_AVOID_CONFLICT",
  "HARD_FRAGRANCE_CONFLICT",
  "HARD_INGREDIENT_CONFLICT",
  "COVERAGE_EXACT_MATCH",
  "COVERAGE_PARTIAL_MATCH",
  "COVERAGE_MISMATCH",
  "FINISH_EXACT_MATCH",
  "FINISH_CONTEXT_PENALTY",
  "SKIN_CONTEXT_HYDRATION_MATCH",
  "SKIN_CONTEXT_TEXTURE_MATCH",
  "SKIN_CONTEXT_OILINESS_MATCH",
  "SKIN_CONTEXT_REDNESS_MATCH",
  "EVIDENCE_COMPLETE",
  "EVIDENCE_PARTIAL",
  "EVIDENCE_MISSING_FRAGRANCE",
  "EVIDENCE_MISSING_INGREDIENTS",
  "USER_PREFERENCE_MATCH",
  "LOW_SCORE_MARGIN",
  "ABSTAIN_INSUFFICIENT_EVIDENCE",
  "ABSTAIN_ALL_INELIGIBLE",
  "ABSTAIN_SKIN_STATE_UNAVAILABLE",
]);
export type ReasonCode = z.infer<typeof ReasonCodeEnum>;

export const EligibilityStatusEnum = z.enum(["eligible", "ineligible"]);
export type EligibilityStatus = z.infer<typeof EligibilityStatusEnum>;

export const IneligibilityReasonSchema = z.object({
  code: ReasonCodeEnum,
  message: z.string().min(1),
  conflictingField: z.string().min(1),
  conflictingValue: z.unknown(),
  provenance: ProvenanceSchema,
});
export type IneligibilityReason = z.infer<typeof IneligibilityReasonSchema>;

export const ScoreBreakdownSchema = z.object({
  coverageMatch: z.number().min(0).max(25),
  finishMatch: z.number().min(0).max(20),
  skinContextMatch: z.number().min(0).max(20),
  evidenceCompleteness: z.number().min(0).max(25),
  preferenceMatch: z.number().min(0).max(10),
  unknownPenalty: z.number().min(0).max(50),
  totalScore: z.number().min(0).max(100),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const CandidateDecisionSchema = z
  .object({
    candidateId: z.string().regex(/^cand_[a-zA-Z0-9_-]+$/),
    productId: z.string().regex(/^prod_[a-zA-Z0-9_-]+$/),
    eligibility: EligibilityStatusEnum,
    ineligibilityReasons: z.array(IneligibilityReasonSchema).default([]),
    score: ScoreBreakdownSchema.nullable(),
    reasonCodes: z.array(ReasonCodeEnum).default([]),
    rank: z.number().int().positive().nullable(),
  })
  .refine(
    (data) => {
      if (data.eligibility === "ineligible") {
        return data.score === null && data.rank === null && data.ineligibilityReasons.length > 0;
      }
      if (data.eligibility === "eligible") {
        return data.score !== null && data.rank !== null;
      }
      return true;
    },
    {
      message: "Ineligible candidates must have score=null, rank=null, and at least one ineligibilityReason. Eligible candidates must have score and rank.",
    }
  );

export type CandidateDecision = z.infer<typeof CandidateDecisionSchema>;

export const AbstentionReasonSchema = z.object({
  code: ReasonCodeEnum,
  explanation: z.string().min(1),
  missingFields: z.array(z.string()).default([]),
});
export type AbstentionReason = z.infer<typeof AbstentionReasonSchema>;

export const CounterfactualSchema = z.object({
  targetCandidateId: z.string().regex(/^cand_[a-zA-Z0-9_-]+$/),
  comparedToWinnerId: z.string().regex(/^cand_[a-zA-Z0-9_-]+$/),
  explanation: z.string().min(1),
  primaryDifferentiatingFactors: z.array(z.string()).default([]),
  scoreDifference: z.number().optional(),
});
export type Counterfactual = z.infer<typeof CounterfactualSchema>;

export const DecisionResultSchema = z.object({
  version: z.literal(DECISION_SCHEMA_VERSION),
  decisionId: z.string().regex(/^dec_[a-zA-Z0-9_-]+$/, "decisionId must start with dec_ prefix"),
  type: z.enum(["decision", "abstain"]),
  winningCandidateId: z.string().nullable(),
  confidenceBand: z.enum(["high_evidence", "moderate_evidence", "low_evidence_abstain"]),
  abstention: AbstentionReasonSchema.nullable(),
  candidateDecisions: z.array(CandidateDecisionSchema),
  counterfactuals: z.array(CounterfactualSchema).default([]),
  vtoPreviewableCandidateId: z.string().nullable(),
  decidedAt: z.string().datetime({ message: "decidedAt must be a valid ISO-8601 UTC string" }),
});

export type DecisionResult = z.infer<typeof DecisionResultSchema>;
