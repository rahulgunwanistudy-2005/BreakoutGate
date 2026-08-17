/**
 * @file packages/orchestration/types.ts
 * @description Typed contracts and Zod schemas for the BreakoutGate API Orchestration Boundary.
 */

import { z } from "zod";
import {
  CandidateSchema,
  DecisionReceiptSchema,
  DecisionResultSchema,
  SkinStateSchema,
  UserConstraintsSchema,
} from "@contracts";

export const RequestModeEnum = z.enum(["live", "demo", "test"]);
export type RequestMode = z.infer<typeof RequestModeEnum>;

export const DecisionRequestSchema = z
  .object({
    mode: RequestModeEnum.default("live"),
    userConstraints: UserConstraintsSchema,
    imageBuffer: z.instanceof(Uint8Array).optional(),
    imageBase64: z.string().optional(),
    testSkinState: SkinStateSchema.optional(),
    catalogOverride: z.array(CandidateSchema).optional(),
    options: z
      .object({
        minEvidenceCompleteness: z.number().min(0).max(1).optional(),
        enableVto: z.boolean().default(true).optional(),
        mockVto: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // In live mode, testSkinState or catalogOverride must NOT be provided
      if (data.mode === "live") {
        if (data.testSkinState) return false;
        if (data.catalogOverride) return false;
        // Image must be provided in live mode
        if (!data.imageBuffer && !data.imageBase64) return false;
      }
      return true;
    },
    {
      message: "LIVE mode requires an image and strictly rejects testSkinState or catalogOverride injections.",
    }
  );

export type DecisionRequest = z.infer<typeof DecisionRequestSchema>;

export const DecisionResponseSchema = z.object({
  success: z.boolean(),
  mode: RequestModeEnum,
  decision: DecisionResultSchema.optional(),
  receipt: DecisionReceiptSchema.optional(),
  traceSummary: z
    .object({
      decisionId: z.string(),
      durationMs: z.number().nonnegative(),
      candidateCount: z.number().int().nonnegative(),
      eligibleCount: z.number().int().nonnegative(),
      winnerId: z.string().nullable(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
});

export type DecisionResponse = z.infer<typeof DecisionResponseSchema>;
