/**
 * @file packages/engine/abstention.ts
 * @description Evaluates conditions under which the Decision Engine must abstain from choosing a winner.
 *
 * Source of Truth: 05_DECISION_ENGINE_SPEC.md (Stage 5)
 * Invariant: Abstention is a first-class safety output, not an unhandled error.
 */

import { AbstentionReason, Candidate, CandidateDecision, SkinState, UserConstraints } from "@contracts";
import { THRESHOLDS } from "./constants";

export interface AbstentionEvaluation {
  shouldAbstain: boolean;
  abstentionReason: AbstentionReason | null;
}

/**
 * Evaluates whether the decision engine must abstain.
 */
export function evaluateAbstention(
  rankedDecisions: CandidateDecision[],
  candidates: Candidate[],
  skinState: SkinState,
  _constraints: UserConstraints
): AbstentionEvaluation {
  const eligible = rankedDecisions.filter((d) => d.eligibility === "eligible" && d.score !== null);

  // Condition 1: All candidates ineligible (or 0 candidates)
  if (eligible.length === 0) {
    return {
      shouldAbstain: true,
      abstentionReason: {
        code: "ABSTAIN_ALL_INELIGIBLE",
        explanation: "All evaluated candidates violated user hard constraints or had incompatible exclusions.",
        missingFields: [],
      },
    };
  }

  // Condition 2: Top candidate has insufficient evidence completeness (< 0.40)
  const winner = eligible[0];
  const winnerCandidate = candidates.find((c) => c.candidateId === winner.candidateId);
  const completeness = winnerCandidate?.productEvidence.evidenceCompleteness ?? 0;

  if (completeness < THRESHOLDS.MIN_EVIDENCE_COMPLETENESS_ABSTAIN) {
    const missing: string[] = [];
    if (winnerCandidate?.productEvidence.ingredients.state === "UNKNOWN") missing.push("ingredients");
    if (winnerCandidate?.productEvidence.fragranceFree.state === "UNKNOWN") missing.push("fragranceFree");
    if (winnerCandidate?.productEvidence.finish.state === "UNKNOWN") missing.push("finish");
    if (winnerCandidate?.productEvidence.coverage.state === "UNKNOWN") missing.push("coverage");

    return {
      shouldAbstain: true,
      abstentionReason: {
        code: "ABSTAIN_INSUFFICIENT_EVIDENCE",
        explanation: `Top-scoring candidate "${winnerCandidate?.productEvidence.name}" has insufficient evidence completeness (${Math.round(completeness * 100)}%), which is below the safe threshold of ${Math.round(THRESHOLDS.MIN_EVIDENCE_COMPLETENESS_ABSTAIN * 100)}%.`,
        missingFields: missing,
      },
    };
  }

  // Condition 3: Entire SkinState has 0 known signals
  const knownSignalsCount = Object.values(skinState.signals).filter((s) => s.state === "KNOWN").length;
  if (knownSignalsCount === 0) {
    return {
      shouldAbstain: true,
      abstentionReason: {
        code: "ABSTAIN_SKIN_STATE_UNAVAILABLE",
        explanation: "No valid skin analysis signals were available to evaluate skin context compatibility.",
        missingFields: ["skin_signals"],
      },
    };
  }

  return {
    shouldAbstain: false,
    abstentionReason: null,
  };
}
