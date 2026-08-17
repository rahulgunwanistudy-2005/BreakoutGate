/**
 * @file tests/evidence/conflict-semantics.test.ts
 * @description Ingestion tests proving conflicting evidence from multiple sources is preserved as CONFLICTING.
 */

import { describe, it, expect } from "vitest";
import { createConflictingEvidenceField } from "../../packages/contracts/evidence";
import { FIXTURE_PROD_04_CONFLICTING_FINISH } from "../../packages/evidence/fixtures/test-catalog";

describe("Product Evidence CONFLICTING Semantics", () => {
  it("preserves multiple conflicting sources in finish field without silent resolution", () => {
    const product = FIXTURE_PROD_04_CONFLICTING_FINISH;

    expect(product.finish.state).toBe("CONFLICTING");
    expect(product.finish.value).toBeNull();
    expect(product.finish.conflictingSources).toHaveLength(2);

    const sourceA = product.finish.conflictingSources?.[0];
    const sourceB = product.finish.conflictingSources?.[1];

    expect(sourceA?.value).toBe("matte");
    expect(sourceA?.provenance.sourceType).toBe("retailer");

    expect(sourceB?.value).toBe("dewy");
    expect(sourceB?.provenance.sourceType).toBe("manufacturer");
  });

  it("throws an error if createConflictingEvidenceField is called with fewer than 2 sources", () => {
    expect(() =>
      createConflictingEvidenceField([
        {
          value: "matte",
          evidenceClass: "E2_MANUFACTURER_RETAILER",
          provenance: {
            sourceType: "retailer",
            retrievedAt: "2026-08-17T12:00:00.000Z",
          },
        },
      ])
    ).toThrowError("createConflictingEvidenceField requires at least 2 conflicting sources.");
  });
});
