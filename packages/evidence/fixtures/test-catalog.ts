/**
 * @file packages/evidence/fixtures/test-catalog.ts
 * @description Deterministic engineering test fixtures for product evidence and property testing.
 *
 * CRITICAL INVARIANT:
 * All fixtures are explicitly marked sourceMode = "TEST_FIXTURE".
 * They are NOT live market products.
 */

import {
  createConflictingEvidenceField,
  createKnownEvidenceField,
  createUnknownEvidenceField,
  PRODUCT_EVIDENCE_SCHEMA_VERSION,
  ProductEvidence,
} from "@contracts";

const FIXTURE_RETRIEVAL_DATE = "2026-08-17T12:00:00.000Z";
const STALE_RETRIEVAL_DATE = "2026-05-01T00:00:00.000Z";

const baseProvenance = {
  sourceType: "manufacturer" as const,
  sourceUrl: "https://test.fixtures.internal/products/sample",
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
  confidence: 1,
  rawLabel: "Deterministic Test Catalog",
};

/**
 * 1. Complete Evidence: clean ingredients, fragrance-free, natural finish, medium coverage.
 */
export const FIXTURE_PROD_01_COMPLETE: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_01_complete",
  sourceMode: "TEST_FIXTURE",
  brand: "Pure Skin Lab",
  name: "HydraSilk Balanced Serum Foundation",
  category: "foundation",
  sku: "SKU-PSL-01",
  shade: { code: "SAND_100", name: "Warm Sand", hex: "#d8b38a" },
  finish: createKnownEvidenceField("natural", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "dimethicone", "glycerin", "niacinamide", "titanium_dioxide", "tocopherol"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 4200, currency: "USD", formattedPrice: "$42.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [
    {
      claimId: "cl_test_01_1",
      claim: "Non-comedogenic and fragrance-free tested",
      evidenceClass: "E2_MANUFACTURER_RETAILER",
      state: "KNOWN",
      provenance: baseProvenance,
      verified: true,
    },
  ],
  evidenceCompleteness: 1.0,
  vtoMapping: {
    category: "foundation",
    shadeCode: "SAND_100",
    intensity: 0.85,
    finish: "natural",
  },
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 2. Missing Ingredients: ingredient list undisclosed -> fragranceFree MUST BE UNKNOWN.
 */
export const FIXTURE_PROD_02_MISSING_INGREDIENTS: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_02_missing_ingredients",
  sourceMode: "TEST_FIXTURE",
  brand: "Mystery Cosmetics",
  name: "Velvet Glow Complexion Enhancer",
  category: "foundation",
  shade: { code: "IVORY_01", name: "Fair Ivory" },
  finish: createKnownEvidenceField("satin", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("light", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 3400, currency: "USD", formattedPrice: "$34.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [],
  evidenceCompleteness: 0.4,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 3. Fragrance Present: explicit fragrance/parfum in ingredients -> fragranceFree = false.
 */
export const FIXTURE_PROD_03_FRAGRANCE_PRESENT: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_03_fragrance_present",
  sourceMode: "TEST_FIXTURE",
  brand: "Luxury Maison",
  name: "Parfum Infused Luminous Foundation",
  category: "foundation",
  shade: { code: "BEIGE_20", name: "Warm Beige", hex: "#cfa679" },
  finish: createKnownEvidenceField("dewy", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(false, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "cyclopentasiloxane", "parfum", "fragrance", "linalool", "iron_oxides"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 6800, currency: "USD", formattedPrice: "$68.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [],
  evidenceCompleteness: 0.8,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 4. Conflicting Finish: Retailer says matte, Manufacturer says dewy.
 */
export const FIXTURE_PROD_04_CONFLICTING_FINISH: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_04_conflicting_finish",
  sourceMode: "TEST_FIXTURE",
  brand: "Chameleon Beauty",
  name: "Dual Mood Adaptable Tint",
  category: "skin_tint",
  shade: { code: "NEUTRAL_02", name: "Neutral Medium" },
  finish: createConflictingEvidenceField(
    [
      {
        value: "matte",
        evidenceClass: "E2_MANUFACTURER_RETAILER",
        provenance: {
          sourceType: "retailer",
          sourceUrl: "https://retailer-a.com/prod-04",
          retrievedAt: FIXTURE_RETRIEVAL_DATE,
          rawLabel: "Retailer A listing: Ultra Matte",
        },
      },
      {
        value: "dewy",
        evidenceClass: "E2_MANUFACTURER_RETAILER",
        provenance: {
          sourceType: "manufacturer",
          sourceUrl: "https://brand.com/prod-04",
          retrievedAt: FIXTURE_RETRIEVAL_DATE,
          rawLabel: "Brand page: Luminous Dewy Glow",
        },
      },
    ],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  coverage: createKnownEvidenceField("sheer", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "squalane", "glycerin", "zinc_oxide"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  claims: [],
  evidenceCompleteness: 0.8,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 5. Stale Price: retrieved > 30 days ago.
 */
export const FIXTURE_PROD_05_STALE_PRICE: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_05_stale_price",
  sourceMode: "TEST_FIXTURE",
  brand: "Vintage Glow",
  name: "Classic Cream Foundation",
  category: "foundation",
  shade: { code: "BUFF_03" },
  finish: createKnownEvidenceField("satin", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(["water", "glycerin", "iron_oxides"], "E2_MANUFACTURER_RETAILER", baseProvenance),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 2800, currency: "USD", formattedPrice: "$28.00" },
    "E2_MANUFACTURER_RETAILER",
    { ...baseProvenance, retrievedAt: STALE_RETRIEVAL_DATE }
  ),
  claims: [],
  evidenceCompleteness: 0.8,
  provenance: { ...baseProvenance, retrievedAt: STALE_RETRIEVAL_DATE },
  retrievedAt: STALE_RETRIEVAL_DATE,
};

/**
 * 6. Unknown Availability: stock status was not provided.
 */
export const FIXTURE_PROD_06_UNKNOWN_AVAILABILITY: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_06_unknown_availability",
  sourceMode: "TEST_FIXTURE",
  brand: "Ephemeral Aesthetics",
  name: "Radiant Skin Perfector",
  category: "foundation",
  shade: { code: "TAN_05" },
  finish: createKnownEvidenceField("radiant", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("light", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(["water", "mica", "hyaluronic_acid"], "E2_MANUFACTURER_RETAILER", baseProvenance),
  availability: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  claims: [],
  evidenceCompleteness: 1.0,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 7. Multi-Shade Complete Product with VTO configuration.
 */
export const FIXTURE_PROD_07_MULTI_SHADE: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_07_multi_shade",
  sourceMode: "TEST_FIXTURE",
  brand: "Universal Pigments",
  name: "All-Day Flex Fluid",
  category: "foundation",
  shade: { code: "MEDIUM_NEUTRAL_30", name: "Medium Neutral 30", hex: "#c4986b" },
  finish: createKnownEvidenceField("natural", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "dimethicone", "isododecane", "glycerin", "iron_oxides"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 4000, currency: "USD", formattedPrice: "$40.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [],
  evidenceCompleteness: 1.0,
  vtoMapping: {
    category: "foundation",
    shadeCode: "MEDIUM_NEUTRAL_30",
    intensity: 0.85,
    finish: "natural",
  },
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 8. Denatured Alcohol present (for ingredient avoidance testing).
 */
export const FIXTURE_PROD_08_ALCOHOL_DENAT: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_08_alcohol_denat",
  sourceMode: "TEST_FIXTURE",
  brand: "Matte Tech",
  name: "Oil-Lock Quick Dry Foundation",
  category: "foundation",
  shade: { code: "DEEP_WARM_50", name: "Deep Warm" },
  finish: createKnownEvidenceField("matte", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("full", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "alcohol_denat", "silica", "dimethicone", "iron_oxides"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 3200, currency: "USD", formattedPrice: "$32.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [],
  evidenceCompleteness: 0.8,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 9. Full Coverage Ultra Matte.
 */
export const FIXTURE_PROD_09_FULL_COVERAGE_MATTE: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_09_full_coverage_matte",
  sourceMode: "TEST_FIXTURE",
  brand: "Studio Pro",
  name: "Heavy Duty Velvet Matte",
  category: "foundation",
  shade: { code: "LIGHT_COOL_15" },
  finish: createKnownEvidenceField("matte", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("full", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "cyclopentasiloxane", "polymethylsilsesquioxane", "iron_oxides"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 4500, currency: "USD", formattedPrice: "$45.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [],
  evidenceCompleteness: 1.0,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

/**
 * 10. Explicit Non-Comedogenic Claim with Manufacturer Evidence.
 */
export const FIXTURE_PROD_10_PORE_CLOGGING_CLAIM: ProductEvidence = {
  version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
  productId: "prod_test_10_pore_clogging_claim",
  sourceMode: "TEST_FIXTURE",
  brand: "DermaClarity",
  name: "Blemish Prone Skin Fluid",
  category: "foundation",
  shade: { code: "FAIR_05" },
  finish: createKnownEvidenceField("natural", "E2_MANUFACTURER_RETAILER", baseProvenance),
  coverage: createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", baseProvenance),
  fragranceFree: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  nonComedogenicClaim: createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", baseProvenance),
  ingredients: createKnownEvidenceField(
    ["water", "zinc_oxide", "salicylic_acid", "glycerin", "iron_oxides"],
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  availability: createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", baseProvenance),
  price: createKnownEvidenceField(
    { amountMinorUnits: 3800, currency: "USD", formattedPrice: "$38.00" },
    "E2_MANUFACTURER_RETAILER",
    baseProvenance
  ),
  claims: [
    {
      claimId: "cl_test_10_1",
      claim: "Dermatologist Tested: 100% Non-Comedogenic",
      evidenceClass: "E2_MANUFACTURER_RETAILER",
      state: "KNOWN",
      provenance: baseProvenance,
      verified: true,
    },
  ],
  evidenceCompleteness: 1.0,
  provenance: baseProvenance,
  retrievedAt: FIXTURE_RETRIEVAL_DATE,
};

export const DETERMINISTIC_TEST_CATALOG: readonly ProductEvidence[] = [
  FIXTURE_PROD_01_COMPLETE,
  FIXTURE_PROD_02_MISSING_INGREDIENTS,
  FIXTURE_PROD_03_FRAGRANCE_PRESENT,
  FIXTURE_PROD_04_CONFLICTING_FINISH,
  FIXTURE_PROD_05_STALE_PRICE,
  FIXTURE_PROD_06_UNKNOWN_AVAILABILITY,
  FIXTURE_PROD_07_MULTI_SHADE,
  FIXTURE_PROD_08_ALCOHOL_DENAT,
  FIXTURE_PROD_09_FULL_COVERAGE_MATTE,
  FIXTURE_PROD_10_PORE_CLOGGING_CLAIM,
] as const;
