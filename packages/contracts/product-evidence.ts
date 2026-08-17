/**
 * @file packages/contracts/product-evidence.ts
 * @description Canonical ProductEvidence contract for sourced cosmetic products, verifiable provenance, and explicit source mode.
 *
 * CRITICAL INVARIANTS:
 * 1. Provenance is mandatory for all externally sourced product facts.
 * 2. Unverified claims cannot be treated as verified facts.
 * 3. Missing fields (e.g. unknown fragrance) must have state = "UNKNOWN" and value = null.
 * 4. Test fixtures must explicitly carry sourceMode = "TEST_FIXTURE".
 */

import { z } from "zod";
import {
  createEvidenceFieldSchema,
  EvidenceClassEnum,
  EvidenceStateEnum,
  ProvenanceSchema,
  SourceModeEnum,
} from "./evidence";
import { CoverageLevelEnum, FinishTypeEnum } from "./user-constraints";
import { PRODUCT_EVIDENCE_SCHEMA_VERSION } from "./versions";

export const ProductCategoryEnum = z.enum([
  "foundation",
  "concealer",
  "skin_tint",
  "bb_cream",
]);
export type ProductCategory = z.infer<typeof ProductCategoryEnum>;

export const ProductAvailabilityEnum = z.enum([
  "IN_STOCK",
  "OUT_OF_STOCK",
  "UNKNOWN",
]);
export type ProductAvailability = z.infer<typeof ProductAvailabilityEnum>;

export const ProductShadeSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
export type ProductShade = z.infer<typeof ProductShadeSchema>;

export const ProductClaimSchema = z.object({
  claimId: z.string().min(1),
  claim: z.string().min(1),
  evidenceClass: EvidenceClassEnum,
  state: EvidenceStateEnum,
  provenance: ProvenanceSchema,
  verified: z.boolean().default(false),
});
export type ProductClaim = z.infer<typeof ProductClaimSchema>;

export const ProductVtoMappingSchema = z.object({
  category: z.string().min(1),
  shadeCode: z.string().min(1),
  intensity: z.number().min(0).max(1).default(0.85),
  finish: FinishTypeEnum.optional(),
});
export type ProductVtoMapping = z.infer<typeof ProductVtoMappingSchema>;

export const ProductPriceSchema = z.object({
  amountMinorUnits: z.number().int().nonnegative({ message: "Price must be non-negative integer minor units (cents)" }),
  currency: z.string().length(3).default("USD"),
  formattedPrice: z.string().optional(),
});
export type ProductPrice = z.infer<typeof ProductPriceSchema>;

export const ProductEvidenceSchema = z.object({
  version: z.literal(PRODUCT_EVIDENCE_SCHEMA_VERSION),
  productId: z.string().regex(/^prod_[a-zA-Z0-9_-]+$/, "productId must start with prod_ prefix"),
  sourceMode: SourceModeEnum.default("LIVE"),
  brand: z.string().min(1),
  name: z.string().min(1),
  category: ProductCategoryEnum,
  sku: z.string().optional(),
  upc: z.string().optional(),
  sourceProductId: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  shade: ProductShadeSchema,
  finish: createEvidenceFieldSchema(FinishTypeEnum),
  coverage: createEvidenceFieldSchema(CoverageLevelEnum),
  fragranceFree: createEvidenceFieldSchema(z.boolean()),
  nonComedogenicClaim: createEvidenceFieldSchema(z.boolean()),
  ingredients: createEvidenceFieldSchema(z.array(z.string().min(1))),
  availability: createEvidenceFieldSchema(ProductAvailabilityEnum).optional(),
  price: createEvidenceFieldSchema(ProductPriceSchema).optional(),
  claims: z.array(ProductClaimSchema).default([]),
  evidenceCompleteness: z.number().min(0).max(1),
  vtoMapping: ProductVtoMappingSchema.optional(),
  provenance: ProvenanceSchema,
  retrievedAt: z.string().datetime({ message: "retrievedAt must be a valid ISO-8601 UTC string" }),
});

export type ProductEvidence = z.infer<typeof ProductEvidenceSchema>;
