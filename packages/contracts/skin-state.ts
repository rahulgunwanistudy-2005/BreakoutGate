/**
 * @file packages/contracts/skin-state.ts
 * @description Canonical SkinState contract for normalized, non-diagnostic skin context measurements.
 *
 * CRITICAL INVARIANTS:
 * 1. SkinState represents measured optical signals, never clinical diagnoses.
 * 2. Unmeasured signals remain state = "UNKNOWN" with value = null.
 */

import { z } from "zod";
import {
  createEvidenceFieldSchema,
  EvidenceClassEnum,
  EvidenceStateEnum,
  ProvenanceSchema,
} from "./evidence";
import { SKIN_STATE_SCHEMA_VERSION } from "./versions";

export const SkinSignalNameEnum = z.enum([
  "spots",
  "wrinkles",
  "texture",
  "dark_circles",
  "redness",
  "oiliness",
  "moisture",
  "pores",
  "radiance",
  "firmness",
  "acne",
]);
export type SkinSignalName = z.infer<typeof SkinSignalNameEnum>;

export const SkinSignalMeasurementSchema = z
  .object({
    state: EvidenceStateEnum,
    value: z.number().min(0).max(1).nullable(),
    evidenceClass: EvidenceClassEnum,
    provenance: ProvenanceSchema,
    rawScore: z.number().optional(),
    rawLevel: z.number().optional(),
    rawCategory: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.state === "UNKNOWN" || data.state === "NOT_APPLICABLE") {
        return data.value === null;
      }
      if (data.state === "KNOWN") {
        return data.value !== null && typeof data.value === "number";
      }
      return true;
    },
    {
      message: "When signal state is UNKNOWN, value must be null. When KNOWN, value must be a number between 0 and 1.",
    }
  );

export type SkinSignalMeasurement = z.infer<typeof SkinSignalMeasurementSchema>;

export const FaceInfoSchema = z.object({
  box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type FaceInfo = z.infer<typeof FaceInfoSchema>;

export const SkinStateProviderMetadataSchema = z.object({
  provider: z.literal("youcam"),
  providerTaskId: z.string().min(1),
  engineMode: z.string().optional(),
  rawOutputChecksum: z.string().optional(),
});
export type SkinStateProviderMetadata = z.infer<typeof SkinStateProviderMetadataSchema>;

export const SkinStateSchema = z.object({
  version: z.literal(SKIN_STATE_SCHEMA_VERSION),
  analysisId: z.string().regex(/^an_[a-zA-Z0-9_-]+$/, "analysisId must start with an_ prefix"),
  capturedAt: z.string().datetime({ message: "capturedAt must be a valid ISO-8601 UTC string" }),
  signals: z.object({
    spots: SkinSignalMeasurementSchema,
    wrinkles: SkinSignalMeasurementSchema,
    texture: SkinSignalMeasurementSchema,
    dark_circles: SkinSignalMeasurementSchema,
    redness: SkinSignalMeasurementSchema,
    oiliness: SkinSignalMeasurementSchema,
    moisture: SkinSignalMeasurementSchema,
    pores: SkinSignalMeasurementSchema,
    radiance: SkinSignalMeasurementSchema,
    firmness: SkinSignalMeasurementSchema,
    acne: SkinSignalMeasurementSchema,
  }),
  overallQuality: createEvidenceFieldSchema(z.number().min(0).max(1)).optional(),
  faceInfo: FaceInfoSchema.optional(),
  providerMetadata: SkinStateProviderMetadataSchema,
  provenance: ProvenanceSchema,
});

export type SkinState = z.infer<typeof SkinStateSchema>;
