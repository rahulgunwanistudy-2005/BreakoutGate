/**
 * @file tests/contracts/evidence.test.ts
 * @description Contract tests for canonical evidence taxonomy, provenance, and UNKNOWN semantics.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createEvidenceFieldSchema,
  createKnownEvidenceField,
  createUnknownEvidenceField,
  ProvenanceSchema,
} from "../../packages/contracts/evidence";

describe("Canonical Evidence Taxonomy & UNKNOWN Semantics", () => {
  const sampleProvenance = {
    sourceType: "manufacturer" as const,
    sourceUrl: "https://brand.com/products/foundation-01",
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  it("validates well-formed Provenance object", () => {
    const parsed = ProvenanceSchema.parse(sampleProvenance);
    expect(parsed.sourceType).toBe("manufacturer");
    expect(parsed.retrievedAt).toBe("2026-08-17T12:00:00.000Z");
  });

  it("rejects invalid non-UTC or non-ISO dates in Provenance", () => {
    expect(() =>
      ProvenanceSchema.parse({
        ...sampleProvenance,
        retrievedAt: "yesterday afternoon",
      })
    ).toThrow();
  });

  it("enforces that state=KNOWN requires a non-null value", () => {
    const stringFieldSchema = createEvidenceFieldSchema(z.string());

    const validKnown = createKnownEvidenceField("fragrance_free", "E2_MANUFACTURER_RETAILER", sampleProvenance);
    expect(stringFieldSchema.parse(validKnown).value).toBe("fragrance_free");

    // Invalid: state=KNOWN but value=null
    expect(() =>
      stringFieldSchema.parse({
        state: "KNOWN",
        value: null,
        evidenceClass: "E2_MANUFACTURER_RETAILER",
        provenance: sampleProvenance,
      })
    ).toThrow();
  });

  it("enforces that state=UNKNOWN requires value=null (INV-02)", () => {
    const booleanFieldSchema = createEvidenceFieldSchema(z.boolean());

    const validUnknown = createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", sampleProvenance);
    const parsed = booleanFieldSchema.parse(validUnknown);
    expect(parsed.state).toBe("UNKNOWN");
    expect(parsed.value).toBeNull();

    // Invalid: state=UNKNOWN but value=false (unknown is not false!)
    expect(() =>
      booleanFieldSchema.parse({
        state: "UNKNOWN",
        value: false,
        evidenceClass: "E2_MANUFACTURER_RETAILER",
        provenance: sampleProvenance,
      })
    ).toThrow();

    // Invalid: state=UNKNOWN but value=0 (unknown is not zero!)
    const numberFieldSchema = createEvidenceFieldSchema(z.number());
    expect(() =>
      numberFieldSchema.parse({
        state: "UNKNOWN",
        value: 0,
        evidenceClass: "E1_PROVIDER_MEASURED",
        provenance: sampleProvenance,
      })
    ).toThrow();
  });
});
