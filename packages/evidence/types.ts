/**
 * @file packages/evidence/types.ts
 * @description Product source abstraction, raw source records, and normalizer interfaces.
 *
 * CRITICAL INVARIANT:
 * Raw source payloads are isolated at the source boundary and never leaked directly to decision engine or frontend.
 */

import { z } from "zod";
import { ProductEvidence, SourceMode, SourceModeEnum, SourceType, SourceTypeEnum } from "@contracts";

export const RawProductRecordSchema = z.object({
  sourceId: z.string().min(1),
  sourceType: SourceTypeEnum,
  sourceMode: SourceModeEnum,
  sourceProductId: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  retrievedAt: z.string().datetime({ message: "retrievedAt must be a valid ISO-8601 UTC string" }),
  rawPayload: z.record(z.unknown()),
});
export type RawProductRecord = z.infer<typeof RawProductRecordSchema>;

export interface ProductSource {
  readonly sourceId: string;
  readonly sourceType: SourceType;
  readonly sourceMode: SourceMode;
  fetchProduct(sourceProductId: string): Promise<RawProductRecord>;
  fetchCatalog?(): Promise<RawProductRecord[]>;
}

export interface SourceNormalizer {
  normalize(record: RawProductRecord): ProductEvidence;
}
