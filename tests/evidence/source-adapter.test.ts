/**
 * @file tests/evidence/source-adapter.test.ts
 * @description Integration tests for TestFixtureSourceAdapter and normalization pipeline.
 */

import { describe, it, expect } from "vitest";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { normalizeProductRecord } from "../../packages/evidence/normalizer";

describe("TestFixtureSourceAdapter & Ingestion Pipeline", () => {
  it("fetches all products from test adapter with explicit sourceMode=TEST_FIXTURE", async () => {
    const adapter = new TestFixtureSourceAdapter();
    expect(adapter.sourceMode).toBe("TEST_FIXTURE");

    const records = await adapter.fetchCatalog();
    expect(records).toHaveLength(10);

    for (const rec of records) {
      expect(rec.sourceMode).toBe("TEST_FIXTURE");
      const normalized = normalizeProductRecord(rec);
      expect(normalized.sourceMode).toBe("TEST_FIXTURE");
      expect(normalized.productId).toMatch(/^prod_/);
    }
  });

  it("fetches single product fixture by ID", async () => {
    const adapter = new TestFixtureSourceAdapter();
    const raw = await adapter.fetchProduct("prod_test_01_complete");

    expect(raw.sourceProductId).toBe("prod_test_01_complete");
    expect(raw.sourceMode).toBe("TEST_FIXTURE");

    const normalized = normalizeProductRecord(raw);
    expect(normalized.name).toBe("HydraSilk Balanced Serum Foundation");
    expect(normalized.finish.value).toBe("natural");
    expect(normalized.evidenceCompleteness).toBe(1.0);
  });

  it("throws error when non-existent product ID is requested from adapter", async () => {
    const adapter = new TestFixtureSourceAdapter();
    await expect(adapter.fetchProduct("non_existent_id")).rejects.toThrowError("not found");
  });
});
