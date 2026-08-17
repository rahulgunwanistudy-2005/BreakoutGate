/**
 * @file packages/contracts/evidence.ts
 * @description Canonical evidence taxonomy, provenance models, conflict handling, and first-class UNKNOWN state definitions.
 *
 * CRITICAL INVARIANTS:
 * 1. UNKNOWN is never silently converted into FALSE, SAFE, GOOD, or ZERO (INV-02).
 * 2. UNKNOWN is a first-class state with value = null.
 * 3. CONFLICTING preserves all conflicting sources rather than silently resolving them.
 */

import { z } from "zod";

export const SourceModeEnum = z.enum(["LIVE", "TEST_FIXTURE", "REPLAY"]);
export type SourceMode = z.infer<typeof SourceModeEnum>;

export const EvidenceClassEnum = z.enum([
  "E0_USER_DECLARED",
  "E1_PROVIDER_MEASURED",
  "E2_MANUFACTURER_RETAILER",
  "E3_THIRD_PARTY",
  "E4_DERIVED",
]);
export type EvidenceClass = z.infer<typeof EvidenceClassEnum>;

export const EvidenceStateEnum = z.enum([
  "KNOWN",
  "UNKNOWN",
  "CONFLICTING",
  "STALE",
  "NOT_APPLICABLE",
]);
export type EvidenceState = z.infer<typeof EvidenceStateEnum>;

export const SourceTypeEnum = z.enum([
  "user",
  "youcam",
  "manufacturer",
  "retailer",
  "third_party",
  "derived",
]);
export type SourceType = z.infer<typeof SourceTypeEnum>;

export const ProvenanceSchema = z.object({
  sourceType: SourceTypeEnum,
  sourceUrl: z.string().url().optional(),
  retrievedAt: z.string().datetime({ message: "retrievedAt must be a valid ISO-8601 UTC string" }),
  rawLabel: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  derivationRule: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export interface ConflictingSourceItem<T> {
  value: T;
  evidenceClass: EvidenceClass;
  provenance: Provenance;
}

/**
 * Creates a runtime Zod schema for a strongly-typed evidence field.
 * Enforces that when state is UNKNOWN, value MUST be null.
 */
export function createEvidenceFieldSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z
    .object({
      state: EvidenceStateEnum,
      value: valueSchema.nullable(),
      evidenceClass: EvidenceClassEnum,
      provenance: ProvenanceSchema,
      conflictingSources: z
        .array(
          z.object({
            value: valueSchema,
            evidenceClass: EvidenceClassEnum,
            provenance: ProvenanceSchema,
          })
        )
        .optional(),
    })
    .refine(
      (data) => {
        if (data.state === "UNKNOWN" || data.state === "NOT_APPLICABLE") {
          return data.value === null;
        }
        if (data.state === "KNOWN") {
          return data.value !== null;
        }
        if (data.state === "CONFLICTING") {
          return Array.isArray(data.conflictingSources) && data.conflictingSources.length >= 2;
        }
        return true;
      },
      {
        message:
          "When evidence state is UNKNOWN or NOT_APPLICABLE, value must be null. When KNOWN, value must not be null. When CONFLICTING, at least 2 conflictingSources must be recorded.",
      }
    );
}

export type EvidenceField<T> = {
  state: EvidenceState;
  value: T | null;
  evidenceClass: EvidenceClass;
  provenance: Provenance;
  conflictingSources?: ConflictingSourceItem<T>[];
};

/**
 * Helper to construct a verified KNOWN evidence field.
 */
export function createKnownEvidenceField<T>(
  value: T,
  evidenceClass: EvidenceClass,
  provenance: Provenance
): EvidenceField<T> {
  return {
    state: "KNOWN",
    value,
    evidenceClass,
    provenance,
  };
}

/**
 * Helper to construct an explicit UNKNOWN evidence field.
 */
export function createUnknownEvidenceField<T>(
  evidenceClass: EvidenceClass,
  provenance: Provenance
): EvidenceField<T> {
  return {
    state: "UNKNOWN",
    value: null,
    evidenceClass,
    provenance,
  };
}

/**
 * Helper to construct an explicit CONFLICTING evidence field preserving all conflicting facts.
 */
export function createConflictingEvidenceField<T>(
  conflictingSources: ConflictingSourceItem<T>[],
  evidenceClass: EvidenceClass = "E2_MANUFACTURER_RETAILER",
  primaryProvenance?: Provenance
): EvidenceField<T> {
  if (conflictingSources.length < 2) {
    throw new Error("createConflictingEvidenceField requires at least 2 conflicting sources.");
  }
  return {
    state: "CONFLICTING",
    value: null,
    evidenceClass,
    provenance: primaryProvenance ?? conflictingSources[0].provenance,
    conflictingSources,
  };
}
