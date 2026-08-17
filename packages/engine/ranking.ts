/**
 * @file packages/engine/ranking.ts
 * @description Deterministic ranking and stable tie-breaking for evaluated candidates.
 *
 * CRITICAL INVARIANT:
 * 1. Only eligible candidates receive a positive integer rank.
 * 2. Ineligible candidates have rank: null.
 * 3. Tie-breaking is 100% deterministic (never uses Math.random, timestamp, or object iteration quirks).
 */

import { CandidateDecision } from "@contracts";
import { EvaluatedCandidate } from "./types";

/**
 * Sorts eligible candidates and assigns deterministic ranks.
 */
export function rankCandidates(
  evaluatedCandidates: EvaluatedCandidate[]
): CandidateDecision[] {
  const eligible = evaluatedCandidates.filter((ec) => ec.eligibility.isEligible && ec.scoring);
  const ineligible = evaluatedCandidates.filter((ec) => !ec.eligibility.isEligible);

  // Deterministic multi-factor sort
  eligible.sort((a, b) => {
    const scoreA = a.scoring!.score.totalScore;
    const scoreB = b.scoring!.score.totalScore;

    // Primary: Total Score (descending)
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie-breaker 1: Evidence Completeness (descending)
    const compA = a.candidate.productEvidence.evidenceCompleteness;
    const compB = b.candidate.productEvidence.evidenceCompleteness;
    if (compB !== compA) {
      return compB - compA;
    }

    // Tie-breaker 2: Skin Context Match (descending)
    const skinA = a.scoring!.score.skinContextMatch;
    const skinB = b.scoring!.score.skinContextMatch;
    if (skinB !== skinA) {
      return skinB - skinA;
    }

    // Tie-breaker 3: Unknown Penalty (ascending - fewer penalties wins)
    const penA = a.scoring!.score.unknownPenalty;
    const penB = b.scoring!.score.unknownPenalty;
    if (penA !== penB) {
      return penA - penB;
    }

    // Tie-breaker 4: Stable Binary ASCII Candidate ID Comparison
    if (a.candidate.candidateId < b.candidate.candidateId) return -1;
    if (a.candidate.candidateId > b.candidate.candidateId) return 1;
    return 0;
  });

  // Assign ranks
  const decisions: CandidateDecision[] = [];

  for (let i = 0; i < eligible.length; i++) {
    const ec = eligible[i];
    decisions.push({
      candidateId: ec.candidate.candidateId,
      productId: ec.candidate.productId,
      eligibility: "eligible",
      ineligibilityReasons: [],
      score: ec.scoring!.score,
      reasonCodes: ec.scoring!.reasonCodes,
      rank: i + 1,
    });
  }

  for (const ec of ineligible) {
    decisions.push({
      candidateId: ec.candidate.candidateId,
      productId: ec.candidate.productId,
      eligibility: "ineligible",
      ineligibilityReasons: ec.eligibility.reasons,
      score: null,
      reasonCodes: [],
      rank: null,
    });
  }

  return decisions;
}
