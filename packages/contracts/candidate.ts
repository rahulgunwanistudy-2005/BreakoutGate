/**
 * @file packages/contracts/candidate.ts
 * @description Canonical Candidate representation for comparison and decision processing.
 */

import { z } from "zod";
import { ProductEvidenceSchema } from "./product-evidence";
import { CANDIDATE_SCHEMA_VERSION } from "./versions";

export const CandidateSelectionSourceEnum = z.enum(["curated_catalog", "user_import"]);
export type CandidateSelectionSource = z.infer<typeof CandidateSelectionSourceEnum>;

export const CandidateSchema = z.object({
  version: z.literal(CANDIDATE_SCHEMA_VERSION),
  candidateId: z.string().regex(/^cand_[a-zA-Z0-9_-]+$/, "candidateId must start with cand_ prefix"),
  productId: z.string().regex(/^prod_[a-zA-Z0-9_-]+$/),
  productEvidence: ProductEvidenceSchema,
  selectionSource: CandidateSelectionSourceEnum.default("curated_catalog"),
  selectedAt: z.string().datetime({ message: "selectedAt must be a valid ISO-8601 UTC string" }),
});

export type Candidate = z.infer<typeof CandidateSchema>;
