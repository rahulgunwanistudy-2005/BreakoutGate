/**
 * @file packages/evidence/adapters/fixture-adapter.ts
 * @description Deterministic Test Fixture Source Adapter implementing ProductSource interface.
 *
 * CRITICAL INVARIANT:
 * Always explicitly declares sourceMode = "TEST_FIXTURE".
 */

import { DETERMINISTIC_TEST_CATALOG } from "../fixtures/test-catalog";
import { ProductSource, RawProductRecord } from "../types";

export class TestFixtureSourceAdapter implements ProductSource {
  public readonly sourceId = "test_fixture_adapter";
  public readonly sourceType = "manufacturer" as const;
  public readonly sourceMode = "TEST_FIXTURE" as const;

  public async fetchProduct(productId: string): Promise<RawProductRecord> {
    const fixture = DETERMINISTIC_TEST_CATALOG.find((p) => p.productId === productId);
    if (!fixture) {
      throw new Error(`Product fixture with ID "${productId}" not found in test catalog.`);
    }

    return {
      sourceId: this.sourceId,
      sourceType: this.sourceType,
      sourceMode: this.sourceMode,
      sourceProductId: fixture.productId,
      sourceUrl: fixture.provenance.sourceUrl,
      retrievedAt: fixture.retrievedAt,
      rawPayload: {
        productId: fixture.productId,
        brand: fixture.brand,
        name: fixture.name,
        category: fixture.category,
        sku: fixture.sku,
        shadeCode: fixture.shade.code,
        shadeName: fixture.shade.name,
        shadeHex: fixture.shade.hex,
        finish: fixture.finish.value ?? fixture.finish,
        coverage: fixture.coverage.value,
        ingredients: fixture.ingredients.value,
        fragranceFreeClaim: fixture.fragranceFree.value,
        nonComedogenicClaim: fixture.nonComedogenicClaim.value,
        availability: fixture.availability?.value,
        price: fixture.price?.value,
        claims: fixture.claims,
        vtoMapping: fixture.vtoMapping,
      },
    };
  }

  public async fetchCatalog(): Promise<RawProductRecord[]> {
    const promises = DETERMINISTIC_TEST_CATALOG.map((p) => this.fetchProduct(p.productId));
    return Promise.all(promises);
  }
}
