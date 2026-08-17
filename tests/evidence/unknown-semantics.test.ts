/**
 * @file tests/evidence/unknown-semantics.test.ts
 * @description Ingestion tests proving missing evidence is strictly preserved as UNKNOWN (INV-02).
 */

import { describe, it, expect } from "vitest";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";
import { RawProductRecord } from "../../packages/evidence/types";

describe("Product Evidence UNKNOWN Semantics", () => {
  const baseRecord: RawProductRecord = {
    sourceId: "src_test_retailer",
    sourceType: "retailer",
    sourceMode: "TEST_FIXTURE",
    sourceProductId: "sku_raw_9921",
    sourceUrl: "https://retailer.com/item-9921",
    retrievedAt: "2026-08-17T12:00:00.000Z",
    rawPayload: {
      brand: "Incognito Cosmetics",
      name: "Mystery Fluid",
      category: "foundation",
    },
  };

  it("CRITICAL: missing ingredients MUST result in ingredients=UNKNOWN and fragranceFree=UNKNOWN (null, not false/safe)", () => {
    const rawWithoutIngredients: RawProductRecord = {
      ...baseRecord,
      rawPayload: {
        ...baseRecord.rawPayload,
        // No ingredients provided!
      },
    };

    const evidence = normalizeProductRecord(rawWithoutIngredients);

    // Ingredients
    expect(evidence.ingredients.state).toBe("UNKNOWN");
    expect(evidence.ingredients.value).toBeNull();

    // FragranceFree (NEVER false, NEVER true, NEVER 0)
    expect(evidence.fragranceFree.state).toBe("UNKNOWN");
    expect(evidence.fragranceFree.value).toBeNull();
    expect(evidence.fragranceFree.value).not.toBe(true);
    expect(evidence.fragranceFree.value).not.toBe(false);
    expect(evidence.fragranceFree.value).not.toBe(0);
  });

  it("identifies fragrance as KNOWN=false when fragrance/parfum is in ingredients list", () => {
    const rawWithFragrance: RawProductRecord = {
      ...baseRecord,
      rawPayload: {
        ...baseRecord.rawPayload,
        ingredients: ["water", "cyclopentasiloxane", "fragrance/parfum", "limonene"],
      },
    };

    const evidence = normalizeProductRecord(rawWithFragrance);
    expect(evidence.ingredients.state).toBe("KNOWN");
    expect(evidence.fragranceFree.state).toBe("KNOWN");
    expect(evidence.fragranceFree.value).toBe(false);
  });

  it("identifies fragrance as KNOWN=true when full ingredient list is disclosed and contains NO fragrance", () => {
    const rawClean: RawProductRecord = {
      ...baseRecord,
      rawPayload: {
        ...baseRecord.rawPayload,
        ingredients: ["water", "dimethicone", "glycerin", "niacinamide", "titanium_dioxide"],
      },
    };

    const evidence = normalizeProductRecord(rawClean);
    expect(evidence.ingredients.state).toBe("KNOWN");
    expect(evidence.fragranceFree.state).toBe("KNOWN");
    expect(evidence.fragranceFree.value).toBe(true);
  });

  it("encodes missing finish, coverage, and availability as UNKNOWN with value=null", () => {
    const rawMinimal: RawProductRecord = {
      ...baseRecord,
      rawPayload: {
        brand: "Bare Minimum",
        name: "Basic Drop",
      },
    };

    const evidence = normalizeProductRecord(rawMinimal);
    expect(evidence.finish.state).toBe("UNKNOWN");
    expect(evidence.finish.value).toBeNull();
    expect(evidence.coverage.state).toBe("UNKNOWN");
    expect(evidence.coverage.value).toBeNull();
    expect(evidence.availability?.state).toBe("UNKNOWN");
    expect(evidence.availability?.value).toBeNull();
  });
});
