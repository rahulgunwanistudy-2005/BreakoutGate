/**
 * @file packages/evidence/normalizer.ts
 * @description Ingestion normalizer converting raw product records into validated canonical ProductEvidence.
 *
 * CRITICAL INVARIANTS:
 * 1. Missing ingredients NEVER produce fragranceFree = true (INV-02). Missing = state:"UNKNOWN" and value:null.
 * 2. Controlled vocabulary normalization is deterministic without LLMs or probabilistic guessing.
 * 3. Test fixtures preserve sourceMode = "TEST_FIXTURE".
 */

import {
  ConflictingSourceItem,
  CoverageLevel,
  createConflictingEvidenceField,
  createKnownEvidenceField,
  createUnknownEvidenceField,
  EvidenceField,
  FinishType,
  PRODUCT_EVIDENCE_SCHEMA_VERSION,
  ProductAvailability,
  ProductCategory,
  ProductEvidence,
  ProductEvidenceSchema,
  ProductPrice,
  ProductShade,
  Provenance,
} from "@contracts";
import { createDeterministicProductId } from "./identity";
import { RawProductRecord, RawProductRecordSchema, SourceNormalizer } from "./types";

const FRAGRANCE_KEYWORDS = [
  "fragrance",
  "parfum",
  "perfume",
  "aroma",
  "essential oil",
  "citrus aurantium",
  "lavandula angustifolia",
  "linalool",
  "limonene",
  "geraniol",
  "citronellol",
  "eugenol",
];

export class DefaultProductNormalizer implements SourceNormalizer {
  public normalize(record: RawProductRecord): ProductEvidence {
    const validatedRecord = RawProductRecordSchema.parse(record);
    const raw = validatedRecord.rawPayload;

    const brand = String(raw.brand ?? raw.manufacturer ?? "Unknown Brand").trim();
    const name = String(raw.name ?? raw.productName ?? raw.title ?? "Unknown Product").trim();

    const shadeCode = raw.shadeCode ? String(raw.shadeCode).trim() : raw.shade ? String((raw.shade as Record<string, unknown>).code ?? raw.shade).trim() : undefined;
    const shadeName = raw.shadeName ? String(raw.shadeName).trim() : raw.shade ? String((raw.shade as Record<string, unknown>).name ?? "").trim() : undefined;
    const shadeHex = raw.shadeHex ? String(raw.shadeHex).trim() : raw.shade ? String((raw.shade as Record<string, unknown>).hex ?? "").trim() : undefined;

    const productId =
      typeof raw.productId === "string" && raw.productId.startsWith("prod_")
        ? raw.productId
        : createDeterministicProductId(brand, name, shadeCode);

    const provenance: Provenance = {
      sourceType: validatedRecord.sourceType,
      sourceUrl: validatedRecord.sourceUrl,
      retrievedAt: validatedRecord.retrievedAt,
      rawLabel: `${brand} - ${name}`,
      confidence: 1,
    };

    // 1. Category normalization
    const category = this.normalizeCategory(raw.category);

    // 2. Shade
    const shade: ProductShade = {
      code: shadeCode || "DEFAULT_SHADE",
      name: shadeName || undefined,
      hex: shadeHex && /^#[0-9a-fA-F]{6}$/.test(shadeHex) ? shadeHex : undefined,
    };

    // 3. Finish normalization
    const finish = this.normalizeFinish(raw.finish, provenance);

    // 4. Coverage normalization
    const coverage = this.normalizeCoverage(raw.coverage, provenance);

    // 5. Ingredients normalization
    const ingredients = this.normalizeIngredients(raw.ingredients, provenance);

    // 6. Fragrance-Free (CRITICAL UNKNOWN INVARIANT)
    const fragranceFree = this.evaluateFragranceFree(ingredients, raw.fragranceFreeClaim, provenance);

    // 7. Non-comedogenic claim
    const nonComedogenicClaim = this.normalizeNonComedogenic(raw.nonComedogenicClaim ?? raw.nonComedogenic, provenance);

    // 8. Availability
    const availability = this.normalizeAvailability(raw.availability, provenance);

    // 9. Price normalization
    const price = this.normalizePrice(raw.price, provenance);

    // 10. Claims list
    const claims = Array.isArray(raw.claims)
      ? raw.claims.map((c, i) => {
          const claimStr = typeof c === "string" ? c : String((c as Record<string, unknown>).claim ?? "");
          return {
            claimId: `cl_${productId}_${i + 1}`,
            claim: claimStr,
            evidenceClass: validatedRecord.sourceType === "manufacturer" || validatedRecord.sourceType === "retailer"
              ? ("E2_MANUFACTURER_RETAILER" as const)
              : ("E3_THIRD_PARTY" as const),
            state: "KNOWN" as const,
            provenance,
            verified: Boolean(typeof c === "object" && (c as Record<string, unknown>).verified),
          };
        })
      : [];

    // 11. Evidence Completeness calculation
    const coreFields: Array<EvidenceField<unknown> | undefined> = [
      finish,
      coverage,
      fragranceFree,
      ingredients,
      nonComedogenicClaim,
    ];
    const knownCount = coreFields.filter((f) => f && f.state === "KNOWN").length;
    const evidenceCompleteness = Number((knownCount / coreFields.length).toFixed(2));

    // 12. VTO Mapping
    const vtoMapping =
      typeof raw.vtoMapping === "object" && raw.vtoMapping !== null
        ? {
            category: String((raw.vtoMapping as Record<string, unknown>).category ?? "foundation"),
            shadeCode: String((raw.vtoMapping as Record<string, unknown>).shadeCode ?? shade.code),
            intensity: typeof (raw.vtoMapping as Record<string, unknown>).intensity === "number"
              ? (raw.vtoMapping as Record<string, unknown>).intensity as number
              : 0.85,
            finish: finish.value ?? undefined,
          }
        : undefined;

    const payload: ProductEvidence = {
      version: PRODUCT_EVIDENCE_SCHEMA_VERSION,
      productId,
      sourceMode: validatedRecord.sourceMode,
      brand,
      name,
      category,
      sku: raw.sku ? String(raw.sku) : undefined,
      upc: raw.upc ? String(raw.upc) : undefined,
      sourceProductId: validatedRecord.sourceProductId,
      canonicalUrl: validatedRecord.sourceUrl,
      shade,
      finish,
      coverage,
      fragranceFree,
      nonComedogenicClaim,
      ingredients,
      availability,
      price,
      claims,
      evidenceCompleteness,
      vtoMapping,
      provenance,
      retrievedAt: validatedRecord.retrievedAt,
    };

    return ProductEvidenceSchema.parse(payload);
  }

  private normalizeCategory(rawCategory: unknown): ProductCategory {
    const str = String(rawCategory ?? "").toLowerCase().trim();
    if (str.includes("conceal")) return "concealer";
    if (str.includes("tint")) return "skin_tint";
    if (str.includes("bb") || str.includes("cc")) return "bb_cream";
    return "foundation";
  }

  private normalizeFinish(rawFinish: unknown, provenance: Provenance): EvidenceField<FinishType> {
    if (!rawFinish) {
      return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
    }

    // If already structured evidence field with conflicting sources
    if (typeof rawFinish === "object" && (rawFinish as Record<string, unknown>).state === "CONFLICTING") {
      const conf = rawFinish as Record<string, unknown>;
      return createConflictingEvidenceField(
        conf.conflictingSources as ConflictingSourceItem<FinishType>[],
        "E2_MANUFACTURER_RETAILER",
        provenance
      );
    }

    const str = String(rawFinish).toLowerCase().trim();
    if (str.includes("matte") || str.includes("velvet")) {
      return createKnownEvidenceField("matte", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("dewy") || str.includes("glow") || str.includes("luminous")) {
      return createKnownEvidenceField("dewy", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("satin") || str.includes("semi-matte")) {
      return createKnownEvidenceField("satin", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("radiant")) {
      return createKnownEvidenceField("radiant", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("natural")) {
      return createKnownEvidenceField("natural", "E2_MANUFACTURER_RETAILER", provenance);
    }

    return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
  }

  private normalizeCoverage(rawCoverage: unknown, provenance: Provenance): EvidenceField<CoverageLevel> {
    if (!rawCoverage) {
      return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
    }

    const str = String(rawCoverage).toLowerCase().trim();
    if (str.includes("full") || str.includes("maximum") || str.includes("total")) {
      return createKnownEvidenceField("full", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("medium") || str.includes("moderate")) {
      return createKnownEvidenceField("medium", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("light") || str.includes("sheer-to-light")) {
      return createKnownEvidenceField("light", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str.includes("sheer")) {
      return createKnownEvidenceField("sheer", "E2_MANUFACTURER_RETAILER", provenance);
    }

    return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
  }

  private normalizeIngredients(rawIngredients: unknown, provenance: Provenance): EvidenceField<string[]> {
    if (!rawIngredients) {
      return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
    }

    let list: string[] = [];
    if (Array.isArray(rawIngredients)) {
      list = rawIngredients.map((item) => String(item).toLowerCase().trim()).filter(Boolean);
    } else if (typeof rawIngredients === "string") {
      list = rawIngredients
        .split(/[,;\n]/)
        .map((s) => s.toLowerCase().trim())
        .filter((s) => s.length > 0 && !s.startsWith("may contain"));
    }

    if (list.length === 0) {
      return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
    }

    return createKnownEvidenceField(list, "E2_MANUFACTURER_RETAILER", provenance);
  }

  private evaluateFragranceFree(
    ingredientsField: EvidenceField<string[]>,
    rawClaim: unknown,
    provenance: Provenance
  ): EvidenceField<boolean> {
    // If ingredients are known, inspect for fragrance keywords
    if (ingredientsField.state === "KNOWN" && ingredientsField.value !== null) {
      const ingredients = ingredientsField.value;
      const hasFragrance = ingredients.some((ing) =>
        FRAGRANCE_KEYWORDS.some((keyword) => ing.includes(keyword))
      );

      if (hasFragrance) {
        return createKnownEvidenceField(false, "E2_MANUFACTURER_RETAILER", provenance);
      }

      // Ingredients list known and contains NO fragrance keywords
      return createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", provenance);
    }

    // Ingredients are UNKNOWN -> Check if explicit manufacturer claim exists
    if (typeof rawClaim === "boolean") {
      return createKnownEvidenceField(rawClaim, "E2_MANUFACTURER_RETAILER", provenance);
    }

    // INVARIANT: When ingredients are UNKNOWN and no verified claim exists -> fragranceFree MUST BE UNKNOWN
    return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
  }

  private normalizeNonComedogenic(rawClaim: unknown, provenance: Provenance): EvidenceField<boolean> {
    if (typeof rawClaim === "boolean") {
      return createKnownEvidenceField(rawClaim, "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (typeof rawClaim === "string") {
      const str = rawClaim.toLowerCase().trim();
      if (str.includes("non-comedogenic") || str.includes("won't clog pores") || str.includes("wont clog pores")) {
        return createKnownEvidenceField(true, "E2_MANUFACTURER_RETAILER", provenance);
      }
    }
    return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
  }

  private normalizeAvailability(rawAvailability: unknown, provenance: Provenance): EvidenceField<ProductAvailability> {
    if (!rawAvailability) {
      return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
    }
    const str = String(rawAvailability).toUpperCase().trim();
    if (str === "IN_STOCK" || str === "AVAILABLE") {
      return createKnownEvidenceField("IN_STOCK", "E2_MANUFACTURER_RETAILER", provenance);
    }
    if (str === "OUT_OF_STOCK" || str === "UNAVAILABLE") {
      return createKnownEvidenceField("OUT_OF_STOCK", "E2_MANUFACTURER_RETAILER", provenance);
    }
    return createUnknownEvidenceField("E2_MANUFACTURER_RETAILER", provenance);
  }

  private normalizePrice(rawPrice: unknown, provenance: Provenance): EvidenceField<ProductPrice> | undefined {
    if (rawPrice === undefined || rawPrice === null) {
      return undefined;
    }

    let amountMinorUnits: number | undefined;
    let currency = "USD";

    if (typeof rawPrice === "number") {
      amountMinorUnits = Math.round(rawPrice * 100);
    } else if (typeof rawPrice === "object") {
      const obj = rawPrice as Record<string, unknown>;
      if (typeof obj.amountMinorUnits === "number") {
        amountMinorUnits = Math.round(obj.amountMinorUnits);
      } else if (typeof obj.amount === "number") {
        amountMinorUnits = Math.round(obj.amount * 100);
      }
      if (typeof obj.currency === "string") {
        currency = obj.currency.toUpperCase();
      }
    }

    if (amountMinorUnits === undefined || isNaN(amountMinorUnits) || amountMinorUnits < 0) {
      return undefined;
    }

    const formattedPrice = `$${(amountMinorUnits / 100).toFixed(2)}`;
    return createKnownEvidenceField(
      {
        amountMinorUnits,
        currency,
        formattedPrice,
      },
      "E2_MANUFACTURER_RETAILER",
      provenance
    );
  }
}

export function normalizeProductRecord(record: RawProductRecord): ProductEvidence {
  const normalizer = new DefaultProductNormalizer();
  return normalizer.normalize(record);
}
