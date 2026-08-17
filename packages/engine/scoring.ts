/**
 * @file packages/engine/scoring.ts
 * @description Deterministic scoring model decomposing fit into inspectable components with stable reason codes.
 *
 * Source of Truth: 05_DECISION_ENGINE_SPEC.md
 * Total Points = coverageMatch + finishMatch + skinContextMatch + evidenceCompleteness + preferenceMatch - unknownPenalty
 */

import { Candidate, ReasonCode, ScoreBreakdown, SkinState, UserConstraints } from "@contracts";
import {
  COVERAGE_POINTS,
  FINISH_POINTS,
  SCORE_WEIGHTS,
  THRESHOLDS,
  UNKNOWN_PENALTIES,
} from "./constants";
import { ScoringResult } from "./types";

/**
 * Calculates decomposed score components and associated reason codes for an eligible candidate.
 */
export function scoreCandidate(
  candidate: Candidate,
  skinState: SkinState,
  constraints: UserConstraints
): ScoringResult {
  const product = candidate.productEvidence;
  const reasonCodes: ReasonCode[] = [];

  const soft = constraints.softPreferences;

  // 1. Coverage Match (0-25 pts)
  let coverageMatch: number;
  if (product.coverage.state === "KNOWN" && product.coverage.value) {
    if (soft.targetCoverage) {
      if (product.coverage.value === soft.targetCoverage) {
        coverageMatch = COVERAGE_POINTS.EXACT_MATCH;
        reasonCodes.push("COVERAGE_EXACT_MATCH");
      } else if (isAdjacentCoverage(product.coverage.value, soft.targetCoverage)) {
        coverageMatch = COVERAGE_POINTS.PARTIAL_MATCH;
        reasonCodes.push("COVERAGE_PARTIAL_MATCH");
      } else {
        coverageMatch = COVERAGE_POINTS.MISMATCH;
        reasonCodes.push("COVERAGE_MISMATCH");
      }
    } else {
      // Default neutral score if user specified no target coverage
      coverageMatch = COVERAGE_POINTS.PARTIAL_MATCH;
    }
  } else {
    coverageMatch = COVERAGE_POINTS.UNKNOWN;
    reasonCodes.push("COVERAGE_MISMATCH");
  }

  // 2. Finish Match (0-20 pts)
  let finishMatch: number;
  if (product.finish.state === "KNOWN" && product.finish.value) {
    if (soft.targetFinish) {
      if (product.finish.value === soft.targetFinish) {
        finishMatch = FINISH_POINTS.EXACT_MATCH;
        reasonCodes.push("FINISH_EXACT_MATCH");
      } else if (isCompatibleFinish(product.finish.value, soft.targetFinish)) {
        finishMatch = FINISH_POINTS.COMPATIBLE_MATCH;
      } else {
        finishMatch = FINISH_POINTS.DIVERGENT_MATCH;
        reasonCodes.push("FINISH_CONTEXT_PENALTY");
      }
    } else {
      finishMatch = FINISH_POINTS.COMPATIBLE_MATCH;
    }
  } else {
    finishMatch = FINISH_POINTS.UNKNOWN;
  }

  // 3. Skin Context Match (0-20 pts)
  let skinContextScore = 10; // Base baseline
  const signals = skinState.signals;

  // Moisture context (value is condition-oriented: < 0.50 means low hydration / dry)
  if (signals.moisture.state === "KNOWN" && signals.moisture.value !== null) {
    if (signals.moisture.value < THRESHOLDS.OPTICAL_CONDITION_CONCERN_THRESHOLD) {
      if (product.finish.value === "dewy" || product.finish.value === "radiant" || product.finish.value === "natural") {
        skinContextScore += 3;
        reasonCodes.push("SKIN_CONTEXT_HYDRATION_MATCH");
      } else if (product.finish.value === "matte") {
        skinContextScore -= 3;
      }
    }
  }

  // Oiliness context (value is condition-oriented: < 0.50 means elevated sebum)
  if (signals.oiliness.state === "KNOWN" && signals.oiliness.value !== null) {
    if (signals.oiliness.value < THRESHOLDS.OPTICAL_CONDITION_CONCERN_THRESHOLD) {
      if (product.finish.value === "matte" || product.finish.value === "natural") {
        skinContextScore += 3;
        reasonCodes.push("SKIN_CONTEXT_OILINESS_MATCH");
      } else if (product.finish.value === "dewy") {
        skinContextScore -= 3;
      }
    }
  }

  // Redness context (< 0.60 condition index indicates optical redness)
  if (signals.redness.state === "KNOWN" && signals.redness.value !== null) {
    if (signals.redness.value < THRESHOLDS.OPTICAL_CONDITION_CONCERN_THRESHOLD) {
      if (product.coverage.value === "medium" || product.coverage.value === "full") {
        skinContextScore += 3;
        reasonCodes.push("SKIN_CONTEXT_REDNESS_MATCH");
      }
    }
  }

  // Texture context (< 0.60 condition index indicates surface unevenness)
  if (signals.texture.state === "KNOWN" && signals.texture.value !== null) {
    if (signals.texture.value < THRESHOLDS.OPTICAL_CONDITION_CONCERN_THRESHOLD) {
      if (product.finish.value === "natural" || product.finish.value === "satin") {
        skinContextScore += 2;
        reasonCodes.push("SKIN_CONTEXT_TEXTURE_MATCH");
      }
    }
  }

  const skinContextMatch = Math.max(0, Math.min(SCORE_WEIGHTS.SKIN_CONTEXT_MAX, skinContextScore));

  // 4. Evidence Completeness (0-25 pts)
  const completenessRatio = Math.max(0, Math.min(1, product.evidenceCompleteness));
  const evidenceCompleteness = Math.round(completenessRatio * SCORE_WEIGHTS.EVIDENCE_COMPLETENESS_MAX * 100) / 100;
  if (completenessRatio >= 0.85) {
    reasonCodes.push("EVIDENCE_COMPLETE");
  } else {
    reasonCodes.push("EVIDENCE_PARTIAL");
  }

  // 5. Preference Match (0-10 pts)
  let preferenceMatch = 0;
  if (soft.skinFeelPreference === "hydrating" && (product.finish.value === "dewy" || product.finish.value === "natural")) {
    preferenceMatch += 5;
    reasonCodes.push("USER_PREFERENCE_MATCH");
  } else if (soft.skinFeelPreference === "oil_controlling" && (product.finish.value === "matte" || product.finish.value === "natural")) {
    preferenceMatch += 5;
    reasonCodes.push("USER_PREFERENCE_MATCH");
  }
  if (product.nonComedogenicClaim.state === "KNOWN" && product.nonComedogenicClaim.value === true) {
    preferenceMatch += 5;
    reasonCodes.push("USER_PREFERENCE_MATCH");
  }
  preferenceMatch = Math.min(SCORE_WEIGHTS.PREFERENCE_MAX, preferenceMatch);

  // 6. Unknown Penalties (Subtracted)
  let unknownPenalty = 0;
  if (product.ingredients.state === "UNKNOWN") {
    unknownPenalty += UNKNOWN_PENALTIES.MISSING_INGREDIENTS;
    reasonCodes.push("EVIDENCE_MISSING_INGREDIENTS");
  } else if (product.fragranceFree.state === "UNKNOWN") {
    // Only apply separate fragrance penalty if ingredients are disclosed but fragrance remains undisclosed
    unknownPenalty += UNKNOWN_PENALTIES.MISSING_FRAGRANCE_DISCLOSURE;
    reasonCodes.push("EVIDENCE_MISSING_FRAGRANCE");
  }
  if (product.finish.state === "UNKNOWN") {
    unknownPenalty += UNKNOWN_PENALTIES.MISSING_FINISH;
  }
  if (product.coverage.state === "UNKNOWN") {
    unknownPenalty += UNKNOWN_PENALTIES.MISSING_COVERAGE;
  }
  if (product.price?.state === "UNKNOWN" || product.availability?.state === "UNKNOWN") {
    unknownPenalty += UNKNOWN_PENALTIES.MISSING_PRICE_AVAILABILITY;
  }

  // Conflicting fields penalty
  if (product.finish.state === "CONFLICTING") unknownPenalty += UNKNOWN_PENALTIES.CONFLICTING_FIELD_PENALTY;
  if (product.coverage.state === "CONFLICTING") unknownPenalty += UNKNOWN_PENALTIES.CONFLICTING_FIELD_PENALTY;
  if (product.price?.state === "CONFLICTING") unknownPenalty += UNKNOWN_PENALTIES.CONFLICTING_FIELD_PENALTY;
  if (product.availability?.state === "CONFLICTING") unknownPenalty += UNKNOWN_PENALTIES.CONFLICTING_FIELD_PENALTY;

  unknownPenalty = Math.min(50, unknownPenalty);

  // 7. Total Score
  const rawTotal =
    coverageMatch +
    finishMatch +
    skinContextMatch +
    evidenceCompleteness +
    preferenceMatch -
    unknownPenalty;

  const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal * 100) / 100));

  const score: ScoreBreakdown = {
    coverageMatch,
    finishMatch,
    skinContextMatch,
    evidenceCompleteness,
    preferenceMatch,
    unknownPenalty,
    totalScore,
  };

  // Deduplicate reason codes
  const uniqueReasons = Array.from(new Set(reasonCodes));

  return {
    score,
    reasonCodes: uniqueReasons,
  };
}

function isAdjacentCoverage(product: string, requested: string): boolean {
  const levels = ["sheer", "light", "medium", "full"];
  const pIdx = levels.indexOf(product);
  const rIdx = levels.indexOf(requested);
  if (pIdx === -1 || rIdx === -1) return false;
  return Math.abs(pIdx - rIdx) === 1;
}

function isCompatibleFinish(product: string, requested: string): boolean {
  if (product === "natural" || requested === "natural") return true;
  if ((product === "dewy" || product === "radiant") && (requested === "dewy" || requested === "radiant")) return true;
  if ((product === "satin" || product === "natural") && (requested === "satin" || requested === "natural")) return true;
  return false;
}
