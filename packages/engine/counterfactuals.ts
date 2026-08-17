/**
 * @file packages/engine/counterfactuals.ts
 * @description Pure, deterministic generation of counterfactual explanations for non-winning candidates.
 *
 * Source of Truth: 05_DECISION_ENGINE_SPEC.md ("Why didn't Candidate A win?")
 * Invariant: Never uses free-form LLM hallucinations. All statements derive from score deltas and reason codes.
 */

import { CandidateDecision, Counterfactual } from "@contracts";

/**
 * Generates deterministic counterfactuals comparing non-winning candidates against the winner.
 */
export function generateCounterfactuals(
  rankedDecisions: CandidateDecision[],
  winnerId: string | null
): Counterfactual[] {
  if (!winnerId) {
    return [];
  }

  const winner = rankedDecisions.find((d) => d.candidateId === winnerId);
  if (!winner || !winner.score) {
    return [];
  }

  const counterfactuals: Counterfactual[] = [];
  const nonWinners = rankedDecisions.filter((d) => d.candidateId !== winnerId);

  for (const candidate of nonWinners) {
    // Scenario 1: Candidate is Ineligible
    if (candidate.eligibility === "ineligible") {
      const primaryReason = candidate.ineligibilityReasons[0]?.message ?? "Violated hard user constraint.";
      counterfactuals.push({
        targetCandidateId: candidate.candidateId,
        comparedToWinnerId: winnerId,
        primaryDifferentiatingFactors: ["hard_constraint_ineligibility"],
        explanation: `Candidate did not qualify because: ${primaryReason}`,
      });
      continue;
    }

    // Scenario 2: Candidate is Eligible but scored lower
    if (candidate.score) {
      const factors: string[] = [];
      const reasons: string[] = [];
      const scoreDiff = Math.round((winner.score.totalScore - candidate.score.totalScore) * 100) / 100;

      // Check Coverage
      if (winner.score.coverageMatch > candidate.score.coverageMatch) {
        factors.push("coverage_fit");
        reasons.push("weaker coverage match");
      }

      // Check Finish
      if (winner.score.finishMatch > candidate.score.finishMatch) {
        factors.push("finish_fit");
        reasons.push("less compatible finish");
      }

      // Check Evidence Completeness
      if (winner.score.evidenceCompleteness > candidate.score.evidenceCompleteness) {
        factors.push("evidence_completeness");
        reasons.push("lower evidence completeness");
      }

      // Check Unknown Penalties
      if (candidate.score.unknownPenalty > winner.score.unknownPenalty) {
        factors.push("unknown_penalties");
        reasons.push("more unresolved unknown fields");
      }

      // Check Skin Context
      if (winner.score.skinContextMatch > candidate.score.skinContextMatch) {
        factors.push("skin_context_alignment");
        reasons.push("lower alignment with current skin condition");
      }

      const reasonText = reasons.length > 0 ? reasons.join(", ") : "lower composite preference score";
      const explanation = `Scored ${scoreDiff} points below winner primarily due to ${reasonText}.`;

      counterfactuals.push({
        targetCandidateId: candidate.candidateId,
        comparedToWinnerId: winnerId,
        scoreDifference: scoreDiff,
        primaryDifferentiatingFactors: factors.length > 0 ? factors : ["composite_score"],
        explanation,
      });
    }
  }

  return counterfactuals;
}
