/**
 * @file tests/evidence/claim-ledger.test.ts
 * @description Unit tests for ClaimLedger tracking and conflict detection.
 */

import { describe, it, expect } from "vitest";
import { ClaimLedger, ClaimLedgerItem } from "../../packages/evidence/claim-ledger";

describe("ClaimLedger Factual Traceability", () => {
  it("records claims and queries by product ID and field", () => {
    const ledger = new ClaimLedger();

    const claim1: ClaimLedgerItem = {
      claimId: "cl_prod_01_fragrance",
      productId: "prod_clean_silk_01",
      field: "fragranceFree",
      value: true,
      state: "KNOWN",
      source: "Manufacturer Specification",
      sourceUrl: "https://brand.com/ingredients",
      retrievedAt: "2026-08-17T12:00:00.000Z",
      evidenceClass: "E2_MANUFACTURER_RETAILER",
      rawLabel: "100% Fragrance-Free Formula",
    };

    ledger.recordClaim(claim1);

    const retrieved = ledger.getClaimsForField("prod_clean_silk_01", "fragranceFree");
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].value).toBe(true);
    expect(retrieved[0].evidenceClass).toBe("E2_MANUFACTURER_RETAILER");
  });

  it("detects conflicting claims for the same product field", () => {
    const ledger = new ClaimLedger();

    ledger.recordClaim({
      claimId: "cl_conf_1",
      productId: "prod_dual_tint_04",
      field: "finish",
      value: "matte",
      state: "KNOWN",
      source: "Retailer A",
      retrievedAt: "2026-08-17T12:00:00.000Z",
      evidenceClass: "E2_MANUFACTURER_RETAILER",
    });

    ledger.recordClaim({
      claimId: "cl_conf_2",
      productId: "prod_dual_tint_04",
      field: "finish",
      value: "dewy",
      state: "KNOWN",
      source: "Brand Lab",
      retrievedAt: "2026-08-17T12:00:00.000Z",
      evidenceClass: "E2_MANUFACTURER_RETAILER",
    });

    const conflict = ledger.detectConflicts("prod_dual_tint_04", "finish");
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.claims).toHaveLength(2);
  });
});
