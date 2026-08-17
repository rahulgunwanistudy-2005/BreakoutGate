/**
 * @file tests/evidence/provenance.test.ts
 * @description Ingestion tests proving provenance is strictly preserved across normalization.
 */

import { describe, it, expect } from "vitest";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";
import { RawProductRecord } from "../../packages/evidence/types";

describe("Product Evidence Provenance Preservation", () => {
  const sampleRecord: RawProductRecord = {
    sourceId: "src_nordstrom_direct",
    sourceType: "retailer",
    sourceMode: "TEST_FIXTURE",
    sourceProductId: "sku_nordstrom_771",
    sourceUrl: "https://nordstrom.com/s/beauty-foundation/771",
    retrievedAt: "2026-08-17T12:00:00.000Z",
    rawPayload: {
      brand: "Estee Lauder",
      name: "Double Wear Stay-in-Place",
      shadeCode: "2N1",
      finish: "matte",
      coverage: "full",
      price: 49.0,
      ingredients: ["water", "cyclopentasiloxane", "trimethylsiloxysilicate", "titanium_dioxide"],
    },
  };

  it("preserves source URL, retrievedAt, and source type across all normalized fields", () => {
    const evidence = normalizeProductRecord(sampleRecord);

    expect(evidence.provenance.sourceType).toBe("retailer");
    expect(evidence.provenance.sourceUrl).toBe("https://nordstrom.com/s/beauty-foundation/771");
    expect(evidence.provenance.retrievedAt).toBe("2026-08-17T12:00:00.000Z");

    expect(evidence.finish.provenance.sourceUrl).toBe("https://nordstrom.com/s/beauty-foundation/771");
    expect(evidence.coverage.provenance.sourceUrl).toBe("https://nordstrom.com/s/beauty-foundation/771");
    expect(evidence.ingredients.provenance.sourceUrl).toBe("https://nordstrom.com/s/beauty-foundation/771");
  });

  it("converts price into integer minor units (4900 cents) with provenance", () => {
    const evidence = normalizeProductRecord(sampleRecord);

    expect(evidence.price?.state).toBe("KNOWN");
    expect(evidence.price?.value?.amountMinorUnits).toBe(4900);
    expect(evidence.price?.value?.currency).toBe("USD");
    expect(evidence.price?.value?.formattedPrice).toBe("$49.00");
  });
});
