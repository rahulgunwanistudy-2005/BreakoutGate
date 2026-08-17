/**
 * @file tests/contracts/product-evidence.test.ts
 * @description Contract validation tests for canonical ProductEvidence and Candidate models.
 */

import { describe, it, expect } from "vitest";
import { CandidateSchema } from "../../packages/contracts/candidate";
import { createKnownEvidenceField, createUnknownEvidenceField } from "../../packages/contracts/evidence";
import { ProductEvidence, ProductEvidenceSchema } from "../../packages/contracts/product-evidence";
import { CANDIDATE_SCHEMA_VERSION, PRODUCT_EVIDENCE_SCHEMA_VERSION } from "../../packages/contracts/versions";

describe("Canonical ProductEvidence & Candidate Contracts", () => {
  const sampleProvenance = {
    sourceType: "manufacturer" as const,
    sourceUrl: "https://sephora.com/product/clean-foundation",
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
    rawLabel: "Sephora Product Page",
  };

  const sampleProduct: ProductEvidence = {
    version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
    productId: "prod_clean_foundation_01",
    sourceMode: "TEST_FIXTURE",
    brand: "Luminous Labs",
    name: "Pure Silk Serum Foundation",
    category: "foundation",
    shade: {
      code: "WARM_SAND_02",
      name: "Warm Sand",
      hex: "#d9b38c",
    },
    finish: createKnownEvidenceField("natural", "E2_MANUFACTURER_RETAILER", sampleProvenance),
    coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", sampleProvenance),
    fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", sampleProvenance),
    nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", sampleProvenance),
    ingredients: createKnownEvidenceField(
      ["water", "dimethicone", "glycerin", "niacinamide", "titanium_dioxide"],
      "E2_MANUFACTURER_RETAILER",
      sampleProvenance
    ),
    claims: [
      {
        claimId: "cl_01",
        claim: "Fragrance-Free and Non-Comedogenic",
        evidenceClass: "E2_MANUFACTURER_RETAILER",
        state: "KNOWN",
        provenance: sampleProvenance,
        verified: true,
      },
    ],
    evidenceCompleteness: 0.95,
    vtoMapping: {
      category: "foundation",
      shadeCode: "WARM_SAND_02",
      intensity: 0.85,
      finish: "natural",
    },
    price: createKnownEvidenceField(
      {
        amountMinorUnits: 4200,
        currency: "USD",
        formattedPrice: "$42.00",
      },
      "E2_MANUFACTURER_RETAILER",
      sampleProvenance
    ),
    provenance: sampleProvenance,
    retrievedAt: "2026-08-17T12:00:00.000Z",
  };

  it("validates a fully populated ProductEvidence record", () => {
    const parsed = ProductEvidenceSchema.parse(sampleProduct);
    expect(parsed.productId).toBe("prod_clean_foundation_01");
    expect(parsed.finish.value).toBe("natural");
    expect(parsed.fragranceFree.value).toBe(true);
  });

  it("validates ProductEvidence with UNKNOWN fragrance status having value=null", () => {
    const productWithUnknownFragrance: ProductEvidence = {
      ...sampleProduct,
      fragranceFree: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", sampleProvenance),
      evidenceCompleteness: 0.7,
    };

    const parsed = ProductEvidenceSchema.parse(productWithUnknownFragrance);
    expect(parsed.fragranceFree.state).toBe("UNKNOWN");
    expect(parsed.fragranceFree.value).toBeNull();
  });

  it("validates Candidate wrapping the ProductEvidence", () => {
    const candidate = {
      version: CANDIDATE_SCHEMA_VERSION,
      candidateId: "cand_01_silk",
      productId: sampleProduct.productId,
      productEvidence: sampleProduct,
      selectionSource: "curated_catalog" as const,
      selectedAt: "2026-08-17T12:00:00.000Z",
    };

    const parsed = CandidateSchema.parse(candidate);
    expect(parsed.candidateId).toBe("cand_01_silk");
    expect(parsed.productEvidence.name).toBe("Pure Silk Serum Foundation");
  });

  it("rejects invalid productId or malformed shade hex", () => {
    expect(() =>
      ProductEvidenceSchema.parse({
        ...sampleProduct,
        productId: "invalid_id_no_prefix",
      })
    ).toThrow();

    expect(() =>
      ProductEvidenceSchema.parse({
        ...sampleProduct,
        shade: {
          code: "SHADE_01",
          hex: "not-a-hex",
        },
      })
    ).toThrow();
  });
});
