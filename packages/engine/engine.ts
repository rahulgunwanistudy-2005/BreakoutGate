/**
 * @file packages/engine/engine.ts
 * @description Pure, deterministic BreakoutGate Decision Engine.
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. PURE: Zero network, database, filesystem, LLM, or hidden random calls.
 * 2. REPRODUCIBLE: Same inputs + same engine version = 100% identical DecisionResult.
 * 3. NO LLM AUTHORITY: All rankings, scores, and eligibility derive from deterministic rules.
 */

import crypto from "crypto";
import {
  DECISION_SCHEMA_VERSION,
  DecisionResult,
  DecisionResultSchema,
} from "@contracts";
import { evaluateAbstention } from "./abstention";
import { deriveConfidenceBand } from "./confidence";
import { generateCounterfactuals } from "./counterfactuals";
import { evaluateCandidateEligibility } from "./eligibility";
import { rankCandidates } from "./ranking";
import { scoreCandidate } from "./scoring";
import { buildDecisionTrace } from "./trace";
import { DecisionEngineInput, DecisionEngineTrace, EvaluatedCandidate, IDecisionEngine } from "./types";

/**
 * Executes deterministic evaluation over a set of candidates given user constraints and skin state.
 */
export function decide(input: DecisionEngineInput): {
  result: DecisionResult;
  trace: DecisionEngineTrace;
} {
  const { skinState, userConstraints, candidates, options } = input;

  // Step 1: Evaluate eligibility and score eligible candidates
  const evaluatedCandidates: EvaluatedCandidate[] = [];

  for (const candidate of candidates) {
    const eligibility = evaluateCandidateEligibility(candidate, userConstraints);

    if (eligibility.isEligible) {
      const scoring = scoreCandidate(candidate, skinState, userConstraints);
      evaluatedCandidates.push({
        candidate,
        eligibility,
        scoring,
        decision: {
          candidateId: candidate.candidateId,
          productId: candidate.productId,
          eligibility: "eligible",
          ineligibilityReasons: [],
          score: scoring.score,
          reasonCodes: scoring.reasonCodes,
          rank: null, // assigned in ranking stage
        },
      });
    } else {
      evaluatedCandidates.push({
        candidate,
        eligibility,
        decision: {
          candidateId: candidate.candidateId,
          productId: candidate.productId,
          eligibility: "ineligible",
          ineligibilityReasons: eligibility.reasons,
          score: null,
          reasonCodes: [],
          rank: null,
        },
      });
    }
  }

  // Step 2: Rank eligible candidates deterministically
  const rankedDecisions = rankCandidates(evaluatedCandidates);

  // Step 3: Evaluate Abstention Conditions
  const abstentionEval = evaluateAbstention(
    rankedDecisions,
    candidates,
    skinState,
    userConstraints
  );

  // Step 4: Derive Confidence Band
  const confidenceBand = deriveConfidenceBand(rankedDecisions, abstentionEval.shouldAbstain);

  // Step 5: Identify Winner & Generate Counterfactuals
  const eligibleDecisions = rankedDecisions.filter((d) => d.eligibility === "eligible" && d.rank !== null);
  const winningCandidateId = !abstentionEval.shouldAbstain && eligibleDecisions.length > 0
    ? eligibleDecisions[0].candidateId
    : null;

  const counterfactuals = winningCandidateId
    ? generateCounterfactuals(rankedDecisions, winningCandidateId)
    : [];

  const vtoPreviewableCandidateId = winningCandidateId;

  // Step 6: Construct Deterministic Decision Identity
  const decidedAt = options?.decidedAt ?? "2026-08-17T12:00:00.000Z";
  const decisionId = options?.decisionId ?? generateDeterministicDecisionId(
    skinState.analysisId,
    candidates.map((c) => c.candidateId)
  );

  const decisionResult: DecisionResult = {
    version: DECISION_SCHEMA_VERSION,
    decisionId,
    type: abstentionEval.shouldAbstain ? "abstain" : "decision",
    winningCandidateId,
    confidenceBand,
    abstention: abstentionEval.abstentionReason,
    candidateDecisions: rankedDecisions,
    counterfactuals,
    vtoPreviewableCandidateId,
    decidedAt,
  };

  // Step 7: Zod Runtime Schema Validation
  const validatedResult = DecisionResultSchema.parse(decisionResult);
  const trace = buildDecisionTrace(validatedResult);

  return {
    result: validatedResult,
    trace,
  };
}

function generateDeterministicDecisionId(analysisId: string, candidateIds: string[]): string {
  const sortedIds = [...candidateIds].sort().join(",");
  const hash = crypto.createHash("sha256").update(`${analysisId}:${sortedIds}`).digest("hex").slice(0, 16);
  return `dec_${hash}`;
}

export class DecisionEngine implements IDecisionEngine {
  decide(input: DecisionEngineInput) {
    return decide(input);
  }
}
