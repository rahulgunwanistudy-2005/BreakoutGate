/**
 * @file packages/contracts/versions.ts
 * @description Authoritative schema and engine version identifiers for deterministic validation and receipts.
 */

export const SKIN_STATE_SCHEMA_VERSION = "1.0.0" as const;
export const USER_CONSTRAINTS_SCHEMA_VERSION = "1.0.0" as const;
export const PRODUCT_EVIDENCE_SCHEMA_VERSION = "1.0.0" as const;
export const CANDIDATE_SCHEMA_VERSION = "1.0.0" as const;
export const DECISION_SCHEMA_VERSION = "1.0.0" as const;
export const DECISION_RECEIPT_SCHEMA_VERSION = "1.0.0" as const;
export const DECISION_ENGINE_VERSION = "1.0.0" as const;

export const SCHEMA_VERSIONS = {
  skinState: SKIN_STATE_SCHEMA_VERSION,
  userConstraints: USER_CONSTRAINTS_SCHEMA_VERSION,
  productEvidence: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  candidate: CANDIDATE_SCHEMA_VERSION,
  decision: DECISION_SCHEMA_VERSION,
  decisionReceipt: DECISION_RECEIPT_SCHEMA_VERSION,
  decisionEngine: DECISION_ENGINE_VERSION,
} as const;
