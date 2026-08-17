/**
 * @file packages/evidence/claim-ledger.ts
 * @description Claim ledger for deterministic auditing of product facts and traceability.
 *
 * CRITICAL INVARIANT:
 * Every factual claim made about a product is recorded with source provenance, evidence class, and state.
 */

import { z } from "zod";
import { EvidenceClassEnum, EvidenceStateEnum } from "@contracts";

export const ClaimLedgerItemSchema = z.object({
  claimId: z.string().min(1),
  productId: z.string().regex(/^prod_[a-zA-Z0-9_-]+$/),
  field: z.string().min(1),
  value: z.unknown(),
  state: EvidenceStateEnum,
  source: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  retrievedAt: z.string().datetime({ message: "retrievedAt must be a valid ISO-8601 UTC string" }),
  evidenceClass: EvidenceClassEnum,
  rawLabel: z.string().optional(),
  derivationRule: z.string().optional(),
});
export type ClaimLedgerItem = z.infer<typeof ClaimLedgerItemSchema>;

export class ClaimLedger {
  private readonly items: Map<string, ClaimLedgerItem> = new Map();

  /**
   * Records a new claim into the ledger.
   */
  public recordClaim(claim: ClaimLedgerItem): void {
    const validated = ClaimLedgerItemSchema.parse(claim);
    this.items.set(validated.claimId, validated);
  }

  /**
   * Retrieves all claims recorded for a specific product ID.
   */
  public getClaimsForProduct(productId: string): ClaimLedgerItem[] {
    const results: ClaimLedgerItem[] = [];
    for (const item of this.items.values()) {
      if (item.productId === productId) {
        results.push(item);
      }
    }
    return results;
  }

  /**
   * Retrieves claims for a specific product and field (e.g. fragranceFree or finish).
   */
  public getClaimsForField(productId: string, field: string): ClaimLedgerItem[] {
    return this.getClaimsForProduct(productId).filter((item) => item.field === field);
  }

  /**
   * Checks if multiple claims for a product attribute conflict with each other.
   */
  public detectConflicts(
    productId: string,
    field: string
  ): { hasConflict: boolean; claims: ClaimLedgerItem[] } {
    const claims = this.getClaimsForField(productId, field);
    if (claims.length <= 1) {
      return { hasConflict: false, claims };
    }

    // Check if distinct non-null values exist
    const distinctValues = new Set(
      claims
        .map((c) => (typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value)))
        .filter((v) => v !== "null" && v !== "undefined")
    );

    const hasConflict = distinctValues.size > 1;
    return { hasConflict, claims };
  }

  /**
   * Returns all recorded claims in the ledger.
   */
  public getAllClaims(): ClaimLedgerItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Clears the ledger.
   */
  public clear(): void {
    this.items.clear();
  }
}
