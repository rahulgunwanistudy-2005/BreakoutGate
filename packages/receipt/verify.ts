/**
 * @file packages/receipt/verify.ts
 * @description Cryptographic verification of DecisionReceipt integrity without circular dependencies.
 */

import { DecisionReceipt } from "@contracts";
import { computeCanonicalHash } from "./hasher";

export interface ReceiptVerificationResult {
  isValid: boolean;
  expectedHash: string;
  computedHash: string;
  tampered: boolean;
  reason?: string;
}

/**
 * Verifies that a DecisionReceipt has not been modified since creation.
 */
export function verifyDecisionReceipt(receipt: DecisionReceipt): ReceiptVerificationResult {
  // Extract all fields in the unsigned receipt payload (strictly omitting integrity)
  const unsignedPayload = {
    receiptVersion: receipt.receiptVersion,
    engineVersion: receipt.engineVersion,
    decisionId: receipt.decisionId,
    generatedAt: receipt.generatedAt,
    mode: receipt.mode,
    inputs: receipt.inputs,
    result: receipt.result,
    candidateDecisions: receipt.candidateDecisions,
    winningCandidateId: receipt.winningCandidateId,
    providerTraceReferences: receipt.providerTraceReferences,
    vtoArtifact: receipt.vtoArtifact,
  };

  const computedHash = computeCanonicalHash(unsignedPayload);
  const expectedHash = receipt.integrity.canonicalHash;
  const isValid = computedHash === expectedHash;

  return {
    isValid,
    expectedHash,
    computedHash,
    tampered: !isValid,
    reason: isValid ? undefined : "Computed canonical SHA-256 hash does not match integrity block (receipt data was modified).",
  };
}
