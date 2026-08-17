/**
 * @file packages/engine/trace.ts
 * @description Structured, safe decision trace builder for auditable inspection without sensitive data leaks.
 */

import { DecisionResult } from "@contracts";
import { DecisionEngineTrace } from "./types";

/**
 * Builds an auditable decision trace from a DecisionResult.
 */
export function buildDecisionTrace(result: DecisionResult): DecisionEngineTrace {
  const eligible = result.candidateDecisions.filter((d) => d.eligibility === "eligible");
  const ineligible = result.candidateDecisions.filter((d) => d.eligibility === "ineligible");

  return {
    decisionId: result.decisionId,
    evaluatedAt: result.decidedAt,
    candidateCount: result.candidateDecisions.length,
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length,
    winningCandidateId: result.winningCandidateId,
    confidenceBand: result.confidenceBand,
    abstentionReason: result.abstention ? `${result.abstention.code}: ${result.abstention.explanation}` : undefined,
    candidateTraces: result.candidateDecisions.map((d) => ({
      candidateId: d.candidateId,
      productId: d.productId,
      status: d.eligibility,
      totalScore: d.score?.totalScore ?? null,
      rank: d.rank,
      reasonCodes: d.reasonCodes,
    })),
  };
}
