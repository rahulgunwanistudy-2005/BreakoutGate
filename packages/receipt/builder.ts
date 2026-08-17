/**
 * @file packages/receipt/builder.ts
 * @description Deterministic builder for DecisionReceipt with cryptographic SHA-256 integrity hash.
 */

import {
  Candidate,
  DECISION_ENGINE_VERSION,
  DECISION_RECEIPT_SCHEMA_VERSION,
  DecisionReceipt,
  DecisionReceiptSchema,
  DecisionResult,
  ReceiptProviderTraceReference,
  ReceiptVtoArtifactReference,
  SkinState,
  UserConstraints,
} from "@contracts";
import { computeCanonicalHash, computeInputDigest } from "./hasher";

export interface BuildReceiptParams {
  skinState: SkinState;
  userConstraints: UserConstraints;
  candidates: Candidate[];
  result: DecisionResult;
  mode: "live" | "replay" | "test";
  providerTraceReferences?: ReceiptProviderTraceReference[];
  vtoArtifact?: ReceiptVtoArtifactReference;
  generatedAt?: string;
}

/**
 * Builds a cryptographically verifiable DecisionReceipt.
 */
export function buildDecisionReceipt(params: BuildReceiptParams): DecisionReceipt {
  const {
    skinState,
    userConstraints,
    candidates,
    result,
    mode,
    providerTraceReferences = [],
    vtoArtifact,
    generatedAt,
  } = params;

  const skinStateDigest = computeInputDigest(skinState);
  const userConstraintsDigest = computeInputDigest(userConstraints);
  const candidateEvidenceDigest = computeInputDigest(candidates.map((c) => c.productEvidence));

  const unsignedReceipt = {
    receiptVersion: DECISION_RECEIPT_SCHEMA_VERSION,
    engineVersion: DECISION_ENGINE_VERSION,
    decisionId: result.decisionId,
    generatedAt: generatedAt ?? result.decidedAt,
    mode,
    inputs: {
      skinStateAnalysisId: skinState.analysisId,
      skinStateCapturedAt: skinState.capturedAt,
      userConstraintsId: userConstraints.constraintId,
      candidateProductIds: candidates.map((c) => c.productId),
      skinStateDigest,
      userConstraintsDigest,
      candidateEvidenceDigest,
    },
    result,
    candidateDecisions: result.candidateDecisions,
    winningCandidateId: result.winningCandidateId,
    providerTraceReferences,
    vtoArtifact,
  };

  const canonicalHash = computeCanonicalHash(unsignedReceipt);

  const fullReceipt: DecisionReceipt = {
    ...unsignedReceipt,
    integrity: {
      algorithm: "SHA-256",
      canonicalHash,
      verified: true,
    },
  };

  return DecisionReceiptSchema.parse(fullReceipt);
}
