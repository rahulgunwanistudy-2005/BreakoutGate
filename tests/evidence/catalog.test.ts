/**
 * @file tests/evidence/catalog.test.ts
 * @description Unit tests for ProductEvidenceCatalog resolution and candidate construction.
 */

import { describe, it, expect } from "vitest";
import { ProductEvidenceCatalog } from "../../packages/evidence/catalog";
import { TestFixtureSourceAdapter } from "../../packages/evidence/adapters/fixture-adapter";
import { createDeterministicProductId } from "../../packages/evidence/identity";
import { decide } from "../../packages/engine";
import { SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";

describe("Product Evidence Catalog & Candidate Construction", () => {
  const catalogService = new ProductEvidenceCatalog();

  const sampleProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
  };

  const dummySkinState: SkinState = {
    version: "1.0.0",
    analysisId: "an_catalog_test",
    signals: {
      spots: createKnownEvidenceField(0.75, "E1_PROVIDER_MEASURED", sampleProvenance),
      wrinkles: createKnownEvidenceField(0.79, "E1_PROVIDER_MEASURED", sampleProvenance),
      texture: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      dark_circles: createKnownEvidenceField(0.78, "E1_PROVIDER_MEASURED", sampleProvenance),
      redness: createKnownEvidenceField(0.88, "E1_PROVIDER_MEASURED", sampleProvenance),
      oiliness: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleProvenance),
      moisture: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleProvenance),
      pores: createKnownEvidenceField(0.61, "E1_PROVIDER_MEASURED", sampleProvenance),
      radiance: createKnownEvidenceField(0.73, "E1_PROVIDER_MEASURED", sampleProvenance),
      firmness: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleProvenance),
      acne: createKnownEvidenceField(0.91, "E1_PROVIDER_MEASURED", sampleProvenance),
    },
    overallQuality: createKnownEvidenceField(0.76, "E1_PROVIDER_MEASURED", sampleProvenance),
    providerMetadata: {
      provider: "youcam",
      providerTaskId: "tsk_cat_01",
    },
    provenance: sampleProvenance,
    capturedAt: "2026-08-17T12:00:00.000Z",
  };

  const defaultConstraints: UserConstraints = {
    version: "1.0.0",
    constraintId: "uc_cat_01",
    declaredAt: "2026-08-17T12:00:00.000Z",
    hardConstraints: {
      avoidFragrance: false,
      avoidIngredients: [],
      avoidPoreCloggingClaims: false,
    },
    softPreferences: {
      wearTimeImportance: "medium",
      eventContext: "daily",
    },
    provenance: {
      sourceType: "user",
      retrievedAt: "2026-08-17T12:00:00.000Z",
    },
  };

  it("creates stable, deterministic product IDs from brand, name, and shade", () => {
    const id1 = createDeterministicProductId("Brand A", "Matte Foundation", "100 Light");
    const id2 = createDeterministicProductId("Brand A", "Matte Foundation", "100 Light");
    const id3 = createDeterministicProductId("Brand B", "Matte Foundation", "100 Light");

    expect(id1).toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id1).toBe("prod_brand_a_matte_foundation_100_light");
  });

  it("builds candidates deterministically in binary ASCII sorted order", async () => {
    const fixtureAdapter = new TestFixtureSourceAdapter();
    const evidences = await catalogService.resolveCatalog({
      mode: "test",
      adapter: fixtureAdapter,
    });

    const candidates = catalogService.buildCandidates(evidences);

    expect(candidates.length).toBe(evidences.length);
    expect(candidates[0].candidateId).toBe("cand_01");
    expect(candidates[1].candidateId).toBe("cand_02");

    // Verify sorted by productId
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].productId < candidates[i].productId).toBe(true);
    }
  });

  it("strictly rejects TEST_FIXTURE in LIVE mode when an adapter outputs test data", async () => {
    const fixtureAdapter = new TestFixtureSourceAdapter();

    await expect(
      catalogService.resolveCatalog({
        mode: "live",
        adapter: fixtureAdapter,
      })
    ).rejects.toThrow(/SECURITY FAULT.*TEST_FIXTURE/);
  });

  it("triggers abstention when catalog contains zero candidates", () => {
    const candidates = catalogService.buildCandidates([]);
    const res = decide({
      skinState: dummySkinState,
      userConstraints: defaultConstraints,
      candidates,
    });

    expect(res.result.type).toBe("abstain");
    expect(res.result.winningCandidateId).toBeNull();
    expect(res.result.abstention?.code).toBe("ABSTAIN_ALL_INELIGIBLE");
  });
});
