/**
 * @file packages/receipt/replay.ts
 * @description Deterministic replay engine that re-executes decisions using historical inputs and compares digests.
 */

import { Candidate, DecisionReceipt, DecisionResult, SkinState, UserConstraints } from "@contracts";
import { decide } from "@engine";
import { computeCanonicalHash, computeInputDigest } from "./hasher";

export interface ReplayInputs {
  skinState: SkinState;
  userConstraints: UserConstraints;
  candidates: Candidate[];
}

export interface ReplayResult {
  receiptId: string;
  originalResultHash: string;
  replayedResultHash: string;
  match: boolean;
  inputFidelity: {
    skinStateMatch: boolean;
    userConstraintsMatch: boolean;
    candidateEvidenceMatch: boolean;
  };
  mismatches: string[];
  replayedResult: DecisionResult;
}

/**
 * Replays a historical decision against recorded inputs and compares the resulting digest.
 */
export function replayDecision(receipt: DecisionReceipt, inputs: ReplayInputs): ReplayResult {
  const mismatches: string[] = [];

  // 1. Verify Input Fidelity against Receipt Digests
  const currentSkinDigest = computeInputDigest(inputs.skinState);
  const skinStateMatch = !receipt.inputs.skinStateDigest || currentSkinDigest === receipt.inputs.skinStateDigest;
  if (!skinStateMatch) {
    mismatches.push(`SkinState input digest mismatch (expected: ${receipt.inputs.skinStateDigest}, got: ${currentSkinDigest})`);
  }

  const currentConstraintsDigest = computeInputDigest(inputs.userConstraints);
  const userConstraintsMatch =
    !receipt.inputs.userConstraintsDigest || currentConstraintsDigest === receipt.inputs.userConstraintsDigest;
  if (!userConstraintsMatch) {
    mismatches.push(
      `UserConstraints input digest mismatch (expected: ${receipt.inputs.userConstraintsDigest}, got: ${currentConstraintsDigest})`
    );
  }

  const currentCandidateEvidenceDigest = computeInputDigest(inputs.candidates.map((c) => c.productEvidence));
  const candidateEvidenceMatch =
    !receipt.inputs.candidateEvidenceDigest ||
    currentCandidateEvidenceDigest === receipt.inputs.candidateEvidenceDigest;
  if (!candidateEvidenceMatch) {
    mismatches.push(
      `Candidate evidence digest mismatch (expected: ${receipt.inputs.candidateEvidenceDigest}, got: ${currentCandidateEvidenceDigest})`
    );
  }

  // 2. Pure Decision Engine Replay (preserving decisionId and decidedAt)
  const engineExecution = decide({
    skinState: inputs.skinState,
    userConstraints: inputs.userConstraints,
    candidates: inputs.candidates,
    options: {
      decisionId: receipt.decisionId,
      decidedAt: receipt.result.decidedAt,
    },
  });

  const replayedResult = engineExecution.result;

  // 3. Compare Result Hashes
  const originalResultHash = computeCanonicalHash(receipt.result);
  const replayedResultHash = computeCanonicalHash(replayedResult);

  const resultsMatch = originalResultHash === replayedResultHash;
  if (!resultsMatch) {
    mismatches.push(
      `DecisionResult digest mismatch (original: ${originalResultHash}, replayed: ${replayedResultHash})`
    );
    if (receipt.winningCandidateId !== replayedResult.winningCandidateId) {
      mismatches.push(
        `Winner divergence: original="${receipt.winningCandidateId}", replayed="${replayedResult.winningCandidateId}"`
      );
    }
  }

  return {
    receiptId: receipt.decisionId,
    originalResultHash,
    replayedResultHash,
    match: mismatches.length === 0,
    inputFidelity: {
      skinStateMatch,
      userConstraintsMatch,
      candidateEvidenceMatch,
    },
    mismatches,
    replayedResult,
  };
}
