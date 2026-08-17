/**
 * @file packages/engine/eligibility.ts
 * @description Pure, deterministic hard-constraint evaluation for Candidate ProductEvidence.
 *
 * CRITICAL INVARIANT (INV-02 & INV-05):
 * 1. Ineligible candidates receive status="ineligible", score=null, rank=null.
 * 2. UNKNOWN under a hard avoid constraint CANNOT be assumed safe (triggers ineligibility).
 * 3. Ineligibility cannot be overridden by soft preference match or high scores.
 */

import { Candidate, IneligibilityReason, UserConstraints } from "@contracts";
import { EligibilityResult } from "./types";

/**
 * Evaluates candidate product evidence against user's hard constraints.
 */
export function evaluateCandidateEligibility(
  candidate: Candidate,
  constraints: UserConstraints
): EligibilityResult {
  const product = candidate.productEvidence;
  const reasons: IneligibilityReason[] = [];

  const hard = constraints.hardConstraints;

  // Rule 1: Hard Fragrance Avoidance
  if (hard.avoidFragrance) {
    const fragrance = product.fragranceFree;
    if (fragrance.state === "KNOWN" && fragrance.value === false) {
      reasons.push({
        code: "HARD_FRAGRANCE_CONFLICT",
        message: `Product "${product.name}" contains fragrance, violating user hard fragrance avoidance constraint.`,
        conflictingField: "fragranceFree",
        conflictingValue: false,
        provenance: fragrance.provenance,
      });
    } else if (fragrance.state === "UNKNOWN") {
      reasons.push({
        code: "HARD_FRAGRANCE_CONFLICT",
        message: `Product "${product.name}" fragrance status is UNKNOWN; cannot verify fragrance-free compliance for hard avoid constraint.`,
        conflictingField: "fragranceFree",
        conflictingValue: null,
        provenance: fragrance.provenance,
      });
    } else if (fragrance.state === "CONFLICTING") {
      reasons.push({
        code: "HARD_FRAGRANCE_CONFLICT",
        message: `Product "${product.name}" has conflicting fragrance disclosure across sources; cannot safely verify fragrance-free status.`,
        conflictingField: "fragranceFree",
        conflictingValue: null,
        provenance: fragrance.provenance,
      });
    }
  }

  // Rule 2: Hard Ingredient Exclusions
  if (hard.avoidIngredients && hard.avoidIngredients.length > 0) {
    const productIngredients = product.ingredients;
    if (productIngredients.state === "KNOWN" && Array.isArray(productIngredients.value)) {
      const normalizedIngredients = productIngredients.value.map((i) => i.trim().toLowerCase());
      for (const excluded of hard.avoidIngredients) {
        const cleanExcluded = excluded.trim().toLowerCase();
        if (normalizedIngredients.includes(cleanExcluded) || normalizedIngredients.some((ing) => ing.includes(cleanExcluded))) {
          reasons.push({
            code: "HARD_INGREDIENT_CONFLICT",
            message: `Product "${product.name}" contains user-excluded ingredient: "${excluded}".`,
            conflictingField: "ingredients",
            conflictingValue: excluded,
            provenance: productIngredients.provenance,
          });
        }
      }
    } else if (productIngredients.state === "UNKNOWN") {
      reasons.push({
        code: "HARD_INGREDIENT_CONFLICT",
        message: `Product "${product.name}" ingredient list is UNKNOWN; cannot verify absence of user-excluded ingredients: ${hard.avoidIngredients.join(", ")}.`,
        conflictingField: "ingredients",
        conflictingValue: null,
        provenance: productIngredients.provenance,
      });
    } else if (productIngredients.state === "CONFLICTING") {
      reasons.push({
        code: "HARD_INGREDIENT_CONFLICT",
        message: `Product "${product.name}" ingredient list has conflicting source disclosures.`,
        conflictingField: "ingredients",
        conflictingValue: null,
        provenance: productIngredients.provenance,
      });
    }
  }

  // Rule 3: Hard Required Coverage
  if (hard.requiredCoverage) {
    const coverage = product.coverage;
    if (coverage.state === "KNOWN" && coverage.value && coverage.value !== hard.requiredCoverage) {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product coverage "${coverage.value}" does not meet strictly required coverage "${hard.requiredCoverage}".`,
        conflictingField: "coverage",
        conflictingValue: coverage.value,
        provenance: coverage.provenance,
      });
    } else if (coverage.state === "UNKNOWN" || coverage.state === "CONFLICTING") {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product coverage is ${coverage.state}; cannot verify strictly required coverage "${hard.requiredCoverage}".`,
        conflictingField: "coverage",
        conflictingValue: null,
        provenance: coverage.provenance,
      });
    }
  }

  // Rule 4: Hard Required Finish
  if (hard.requiredFinish) {
    const finish = product.finish;
    if (finish.state === "KNOWN" && finish.value && finish.value !== hard.requiredFinish) {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product finish "${finish.value}" does not meet strictly required finish "${hard.requiredFinish}".`,
        conflictingField: "finish",
        conflictingValue: finish.value,
        provenance: finish.provenance,
      });
    } else if (finish.state === "UNKNOWN" || finish.state === "CONFLICTING") {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product finish is ${finish.state}; cannot verify strictly required finish "${hard.requiredFinish}".`,
        conflictingField: "finish",
        conflictingValue: null,
        provenance: finish.provenance,
      });
    }
  }

  // Rule 5: Hard Avoid Pore-Clogging Claims
  if (hard.avoidPoreCloggingClaims) {
    const claim = product.nonComedogenicClaim;
    if (claim.state === "KNOWN" && claim.value === false) {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product "${product.name}" does not possess non-comedogenic claim, violating hard pore-clogging avoidance constraint.`,
        conflictingField: "nonComedogenicClaim",
        conflictingValue: false,
        provenance: claim.provenance,
      });
    } else if (claim.state === "UNKNOWN" || claim.state === "CONFLICTING") {
      reasons.push({
        code: "HARD_USER_AVOID_CONFLICT",
        message: `Product non-comedogenic claim status is ${claim.state}; cannot verify pore-clogging safety for hard constraint.`,
        conflictingField: "nonComedogenicClaim",
        conflictingValue: null,
        provenance: claim.provenance,
      });
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}
