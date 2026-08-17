/**
 * @file tests/evidence/identity.test.ts
 * @description Deterministic tests for product identity derivation and stability.
 */

import { describe, it, expect } from "vitest";
import {
  createDeterministicProductId,
  createProductIdFromSku,
  isValidProductId,
} from "../../packages/evidence/identity";

describe("Product Identity Derivation", () => {
  it("derives identical productId for identical brand, name, and shade across calls", () => {
    const id1 = createDeterministicProductId("Fenty Beauty", "Pro Filt'r Soft Matte", "210");
    const id2 = createDeterministicProductId("Fenty Beauty", "Pro Filt'r Soft Matte", "210");

    expect(id1).toBe("prod_fenty_beauty_pro_filtr_soft_matte_210");
    expect(id1).toBe(id2);
    expect(isValidProductId(id1)).toBe(true);
  });

  it("produces distinct productIds for different shades of the same product", () => {
    const shadeA = createDeterministicProductId("Haus Labs", "Triclone Skin Tech", "100_LIGHT");
    const shadeB = createDeterministicProductId("Haus Labs", "Triclone Skin Tech", "110_LIGHT");

    expect(shadeA).not.toBe(shadeB);
    expect(shadeA).toBe("prod_haus_labs_triclone_skin_tech_100_light");
    expect(shadeB).toBe("prod_haus_labs_triclone_skin_tech_110_light");
  });

  it("derives stable productId from SKU", () => {
    const skuId = createProductIdFromSku("SEPH-889123", "sephora");
    expect(skuId).toBe("prod_sephora_seph_889123");
    expect(isValidProductId(skuId)).toBe(true);
  });
});
