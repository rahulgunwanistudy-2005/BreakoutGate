/**
 * @file packages/engine/types.ts
 * @description Internal type definitions for the pure BreakoutGate Decision Engine.
 */

import {
  Candidate,
  CandidateDecision,
  DecisionResult,
  IneligibilityReason,
  ReasonCode,
  ScoreBreakdown,
  SkinState,
  UserConstraints,
} from "@contracts";

export interface DecisionEngineInput {
  skinState: SkinState;
  userConstraints: UserConstraints;
  candidates: Candidate[];
  options?: {
    decisionId?: string;
    decidedAt?: string;
    minEvidenceCompleteness?: number;
  };
}

export interface EligibilityResult {
  isEligible: boolean;
  reasons: IneligibilityReason[];
}

export interface ScoringResult {
  score: ScoreBreakdown;
  reasonCodes: ReasonCode[];
}

export interface EvaluatedCandidate {
  candidate: Candidate;
  eligibility: EligibilityResult;
  scoring?: ScoringResult;
  decision: CandidateDecision;
}

export interface DecisionEngineTrace {
  decisionId: string;
  evaluatedAt: string;
  candidateCount: number;
  eligibleCount: number;
  ineligibleCount: number;
  winningCandidateId: string | null;
  confidenceBand: "high_evidence" | "moderate_evidence" | "low_evidence_abstain";
  abstentionReason?: string;
  candidateTraces: Array<{
    candidateId: string;
    productId: string;
    status: "eligible" | "ineligible";
    totalScore: number | null;
    rank: number | null;
    reasonCodes: ReasonCode[];
  }>;
}

export interface IDecisionEngine {
  decide(input: DecisionEngineInput): {
    result: DecisionResult;
    trace: DecisionEngineTrace;
  };
}
