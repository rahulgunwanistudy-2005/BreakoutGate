/**
 * @file packages/evidence/identity.ts
 * @description Deterministic product identity derivation and validation.
 *
 * CRITICAL INVARIANT:
 * Stable identity prevents duplicate candidates and enables multi-source evidence fusion.
 */

/**
 * Derives a deterministic, slug-based productId from brand, product name, and optional shade code.
 */
export function createDeterministicProductId(
  brand: string,
  name: string,
  shadeCode?: string
): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const brandSlug = sanitize(brand);
  const nameSlug = sanitize(name);
  const shadeSlug = shadeCode ? sanitize(shadeCode) : undefined;

  const base = shadeSlug ? `${brandSlug}_${nameSlug}_${shadeSlug}` : `${brandSlug}_${nameSlug}`;
  return `prod_${base}`;
}

/**
 * Derives a deterministic productId from a manufacturer or retailer SKU.
 */
export function createProductIdFromSku(sku: string, prefix = "sku"): string {
  const cleanSku = sku.trim().toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/^_+|_+$/g, "");
  return `prod_${prefix}_${cleanSku}`;
}

/**
 * Validates that a string is a valid canonical productId.
 */
export function isValidProductId(id: string): boolean {
  return /^prod_[a-zA-Z0-9_-]+$/.test(id);
}
