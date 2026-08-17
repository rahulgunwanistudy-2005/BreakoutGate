/**
 * @file packages/engine/confidence.ts
 * @description Deterministic confidence band derivation based strictly on evidence completeness and score margin.
 *
 * Source of Truth: 05_DECISION_ENGINE_SPEC.md
 * Invariant: Never manufactures probabilistic statistical confidence (e.g. "97%"). Uses structured qualitative bands.
 */

import { CandidateDecision } from "@contracts";
import { THRESHOLDS } from "./constants";

export type ConfidenceBand = "high_evidence" | "moderate_evidence" | "low_evidence_abstain";

/**
 * Derives qualitative confidence band from top candidates and evidence completeness.
 */
export function deriveConfidenceBand(
  rankedDecisions: CandidateDecision[],
  isAbstained: boolean
): ConfidenceBand {
  if (isAbstained || rankedDecisions.length === 0) {
    return "low_evidence_abstain";
  }

  const eligible = rankedDecisions.filter((d) => d.eligibility === "eligible" && d.score !== null);
  if (eligible.length === 0) {
    return "low_evidence_abstain";
  }

  const winner = eligible[0];
  const winnerCompleteness = (winner.score?.evidenceCompleteness ?? 0) / 25; // converted back to 0-1 ratio
  const winnerUnknownPenalty = winner.score?.unknownPenalty ?? 0;

  if (winnerCompleteness < THRESHOLDS.MODERATE_EVIDENCE_BAND_COMPLETENESS) {
    return "low_evidence_abstain";
  }

  if (eligible.length > 1) {
    const runnerUp = eligible[1];
    const scoreMargin = (winner.score?.totalScore ?? 0) - (runnerUp.score?.totalScore ?? 0);

    if (
      winnerCompleteness >= THRESHOLDS.HIGH_EVIDENCE_BAND_COMPLETENESS &&
      winnerUnknownPenalty <= 5 &&
      scoreMargin >= THRESHOLDS.SCORE_SEPARATION_MARGIN_MIN
    ) {
      return "high_evidence";
    }

    return "moderate_evidence";
  }

  // Single candidate scenario
  if (winnerCompleteness >= THRESHOLDS.HIGH_EVIDENCE_BAND_COMPLETENESS && winnerUnknownPenalty <= 5) {
    return "high_evidence";
  }

  return "moderate_evidence";
}
