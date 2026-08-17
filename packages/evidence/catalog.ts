/**
 * @file packages/evidence/catalog.ts
 * @description Authoritative Product Evidence Catalog and Deterministic Candidate Builder.
 *
 * CRITICAL INVARIANTS:
 * 1. LIVE mode strictly rejects synthetic/test fixtures (INV-01).
 * 2. Candidate construction is 100% deterministic (identical inputs -> identical candidate IDs & order).
 * 3. Candidate wraps canonical ProductEvidence without raw provider/source dumps.
 */

import { Candidate, ProductEvidence } from "@contracts";
import { TestFixtureSourceAdapter } from "./adapters/fixture-adapter";
import { ProductionCatalogSourceAdapter } from "./adapters/production-adapter";
import { normalizeProductRecord } from "./normalizer";
import { ProductSource, RawProductRecord } from "./types";

export interface CatalogResolveOptions {
  mode: "live" | "test" | "demo";
  adapter?: ProductSource;
  selectedAt?: string;
}

export class ProductEvidenceCatalog {
  private readonly defaultFixtureAdapter: TestFixtureSourceAdapter;
  private readonly defaultProductionAdapter: ProductionCatalogSourceAdapter;

  constructor() {
    this.defaultFixtureAdapter = new TestFixtureSourceAdapter();
    this.defaultProductionAdapter = new ProductionCatalogSourceAdapter();
  }

  /**
   * Resolves canonical ProductEvidence array based on runtime mode.
   */
  public async resolveCatalog(options: CatalogResolveOptions): Promise<ProductEvidence[]> {
    const { mode, adapter } = options;

    if (mode === "live") {
      const activeAdapter = adapter ?? this.defaultProductionAdapter;
      if (!activeAdapter.fetchCatalog) {
        return [];
      }
      const rawRecords: RawProductRecord[] = await activeAdapter.fetchCatalog();
      const evidences: ProductEvidence[] = rawRecords.map((r: RawProductRecord) => normalizeProductRecord(r));

      // Strictly verify no test fixtures entered LIVE mode
      const hasTestFixtures = evidences.some((e: ProductEvidence) => e.sourceMode === "TEST_FIXTURE");
      if (hasTestFixtures) {
        throw new Error("SECURITY FAULT: TEST_FIXTURE detected inside LIVE mode catalog resolution.");
      }

      return evidences;
    }

    // TEST / DEMO mode
    const activeAdapter = adapter ?? this.defaultFixtureAdapter;
    const rawRecords: RawProductRecord[] = activeAdapter.fetchCatalog ? await activeAdapter.fetchCatalog() : [];
    return rawRecords.map((r: RawProductRecord) => normalizeProductRecord(r));
  }

  /**
   * Builds deterministic Candidate[] from canonical ProductEvidence[].
   */
  public buildCandidates(evidences: ProductEvidence[], selectedAt?: string): Candidate[] {
    // 1. Deterministic Binary ASCII Sort by productId
    const sortedEvidences = [...evidences].sort((a, b) =>
      a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0
    );

    // 2. Deterministic Candidate Construction
    return sortedEvidences.map((evidence, idx) => ({
      version: "1.0.0",
      candidateId: `cand_${String(idx + 1).padStart(2, "0")}`,
      productId: evidence.productId,
      productEvidence: evidence,
      selectionSource: "curated_catalog" as const,
      selectedAt: selectedAt ?? evidence.retrievedAt,
    }));
  }
}
