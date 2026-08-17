/**
 * @file packages/contracts/user-constraints.ts
 * @description Canonical UserConstraints contract strictly separating hard exclusions from soft preference weights.
 *
 * CRITICAL INVARIANTS:
 * 1. Hard constraints (INV-03) dominate ranking and strictly eliminate conflicting candidates.
 * 2. Soft preferences only adjust ranking score among surviving eligible candidates.
 */

import { z } from "zod";
import { ProvenanceSchema } from "./evidence";
import { USER_CONSTRAINTS_SCHEMA_VERSION } from "./versions";

export const CoverageLevelEnum = z.enum(["sheer", "light", "medium", "full"]);
export type CoverageLevel = z.infer<typeof CoverageLevelEnum>;

export const FinishTypeEnum = z.enum(["matte", "dewy", "natural", "satin", "radiant"]);
export type FinishType = z.infer<typeof FinishTypeEnum>;

export const EventContextEnum = z.enum([
  "interview",
  "wedding",
  "date",
  "presentation",
  "night_out",
  "daily",
  "custom",
]);
export type EventContext = z.infer<typeof EventContextEnum>;

export const WearTimeImportanceEnum = z.enum(["low", "medium", "high"]);
export type WearTimeImportance = z.infer<typeof WearTimeImportanceEnum>;

export const SkinFeelPreferenceEnum = z.enum([
  "lightweight",
  "hydrating",
  "oil_controlling",
  "balancing",
]);
export type SkinFeelPreference = z.infer<typeof SkinFeelPreferenceEnum>;

export const UserHardConstraintsSchema = z.object({
  avoidIngredients: z.array(z.string().min(1)).default([]),
  avoidFragrance: z.boolean().default(false),
  avoidPoreCloggingClaims: z.boolean().default(false),
  requiredCoverage: CoverageLevelEnum.optional(),
  requiredFinish: FinishTypeEnum.optional(),
});
export type UserHardConstraints = z.infer<typeof UserHardConstraintsSchema>;

export const UserSoftPreferencesSchema = z.object({
  targetCoverage: CoverageLevelEnum.optional(),
  targetFinish: FinishTypeEnum.optional(),
  wearTimeImportance: WearTimeImportanceEnum.default("medium"),
  eventContext: EventContextEnum.default("daily"),
  skinFeelPreference: SkinFeelPreferenceEnum.optional(),
});
export type UserSoftPreferences = z.infer<typeof UserSoftPreferencesSchema>;

export const UserConstraintsSchema = z.object({
  version: z.literal(USER_CONSTRAINTS_SCHEMA_VERSION),
  constraintId: z.string().regex(/^uc_[a-zA-Z0-9_-]+$/, "constraintId must start with uc_ prefix"),
  declaredAt: z.string().datetime({ message: "declaredAt must be a valid ISO-8601 UTC string" }),
  hardConstraints: UserHardConstraintsSchema,
  softPreferences: UserSoftPreferencesSchema,
  provenance: ProvenanceSchema,
});

export type UserConstraints = z.infer<typeof UserConstraintsSchema>;
