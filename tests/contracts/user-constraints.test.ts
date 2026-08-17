/**
 * @file tests/contracts/user-constraints.test.ts
 * @description Contract validation tests for canonical UserConstraints.
 */

import { describe, it, expect } from "vitest";
import { UserConstraints, UserConstraintsSchema } from "../../packages/contracts/user-constraints";
import { USER_CONSTRAINTS_SCHEMA_VERSION } from "../../packages/contracts/versions";

describe("Canonical UserConstraints Contract", () => {
  const validProvenance = {
    sourceType: "user" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
    rawLabel: "User Intake Form",
  };

  const sampleConstraints: UserConstraints = {
    version: USER_CONSTRAINTS_SCHEMA_VERSION,
    constraintId: "uc_session_9921",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidIngredients: ["fragrance", "essential_oils"],
      avoidFragrance: true,
      avoidPoreCloggingClaims: false,
      requiredCoverage: "medium",
    },
    softPreferences: {
      targetCoverage: "medium",
      targetFinish: "natural",
      wearTimeImportance: "high",
      eventContext: "interview",
      skinFeelPreference: "lightweight",
    },
    provenance: validProvenance,
  };

  it("validates a complete UserConstraints object", () => {
    const parsed = UserConstraintsSchema.parse(sampleConstraints);
    expect(parsed.hardConstraints.avoidFragrance).toBe(true);
    expect(parsed.hardConstraints.avoidIngredients).toContain("fragrance");
    expect(parsed.softPreferences.targetFinish).toBe("natural");
  });

  it("applies sensible defaults for optional soft preference fields", () => {
    const minimalConstraints = {
      version: USER_CONSTRAINTS_SCHEMA_VERSION,
      constraintId: "uc_minimal_12",
      declaredAt: "2026-08-17T12:00:00.000Z",
      hardConstraints: {
        avoidIngredients: [],
        avoidFragrance: false,
        avoidPoreCloggingClaims: false,
      },
      softPreferences: {},
      provenance: validProvenance,
    };

    const parsed = UserConstraintsSchema.parse(minimalConstraints);
    expect(parsed.softPreferences.wearTimeImportance).toBe("medium");
    expect(parsed.softPreferences.eventContext).toBe("daily");
  });

  it("rejects invalid constraintId prefix or bad date format", () => {
    expect(() =>
      UserConstraintsSchema.parse({
        ...sampleConstraints,
        constraintId: "invalid_prefix_123",
      })
    ).toThrow();

    expect(() =>
      UserConstraintsSchema.parse({
        ...sampleConstraints,
        declaredAt: "2026-08-17", // not ISO-8601 UTC with time
      })
    ).toThrow();
  });
});
