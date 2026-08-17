/**
 * @file packages/contracts/decision-receipt.ts
 * @description Canonical DecisionReceipt contract representing the auditable, cryptographically verifiable record of a decision.
 *
 * NOTE:
 * Full cryptographic SHA-256 canonicalization and hashing will be implemented in Phase 3.
 * P2 defines and freezes the canonical contract shape.
 */

import { z } from "zod";
import { CandidateDecisionSchema, DecisionResultSchema } from "./decision";
import { DECISION_ENGINE_VERSION, DECISION_RECEIPT_SCHEMA_VERSION } from "./versions";

export const ReceiptProviderTraceReferenceSchema = z.object({
  traceId: z.string().regex(/^tr_[a-zA-Z0-9_-]+$/),
  operation: z.string().min(1),
  durationMs: z.number().nonnegative(),
  taskId: z.string().optional(),
});
export type ReceiptProviderTraceReference = z.infer<typeof ReceiptProviderTraceReferenceSchema>;

export const ReceiptVtoArtifactReferenceSchema = z.object({
  taskId: z.string().min(1),
  artifactUrl: z.string().url(),
  generatedAt: z.string().datetime(),
});
export type ReceiptVtoArtifactReference = z.infer<typeof ReceiptVtoArtifactReferenceSchema>;

export const ReceiptIntegritySchema = z.object({
  algorithm: z.literal("SHA-256"),
  canonicalHash: z.string().min(1),
  verified: z.boolean().default(false),
});
export type ReceiptIntegrity = z.infer<typeof ReceiptIntegritySchema>;

export const DecisionReceiptSchema = z.object({
  receiptVersion: z.literal(DECISION_RECEIPT_SCHEMA_VERSION),
  engineVersion: z.literal(DECISION_ENGINE_VERSION),
  decisionId: z.string().regex(/^dec_[a-zA-Z0-9_-]+$/, "decisionId must start with dec_ prefix"),
  generatedAt: z.string().datetime({ message: "generatedAt must be a valid ISO-8601 UTC string" }),
  mode: z.enum(["live", "replay", "test"]),
  inputs: z.object({
    skinStateAnalysisId: z.string().regex(/^an_[a-zA-Z0-9_-]+$/),
    skinStateCapturedAt: z.string().datetime(),
    userConstraintsId: z.string().regex(/^uc_[a-zA-Z0-9_-]+$/),
    candidateProductIds: z.array(z.string().regex(/^prod_[a-zA-Z0-9_-]+$/)),
    skinStateDigest: z.string().optional(),
    userConstraintsDigest: z.string().optional(),
    candidateEvidenceDigest: z.string().optional(),
  }),
  result: DecisionResultSchema,
  candidateDecisions: z.array(CandidateDecisionSchema),
  winningCandidateId: z.string().nullable(),
  providerTraceReferences: z.array(ReceiptProviderTraceReferenceSchema).default([]),
  vtoArtifact: ReceiptVtoArtifactReferenceSchema.optional(),
  integrity: ReceiptIntegritySchema,
});

export type DecisionReceipt = z.infer<typeof DecisionReceiptSchema>;
