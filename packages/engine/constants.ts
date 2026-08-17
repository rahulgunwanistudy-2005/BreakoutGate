/**
 * @file packages/engine/constants.ts
 * @description Documented, explicit configuration weights, thresholds, and penalty constants for BreakoutGate Decision Engine.
 *
 * Source of Truth: 05_DECISION_ENGINE_SPEC.md & 06_EVIDENCE_AND_DATA_MODEL.md
 * Invariant: ZERO magic numbers buried inside decision logic.
 */

/**
 * Maximum achievable points per score component (Total = 100).
 */
export const SCORE_WEIGHTS = {
  /** @provenance SPECIFIED (05_DECISION_ENGINE_SPEC.md line 138) */
  COVERAGE_MAX: 25,
  /** @provenance SPECIFIED (05_DECISION_ENGINE_SPEC.md line 139) */
  FINISH_MAX: 20,
  /** @provenance SPECIFIED / EXPLICIT IMPLEMENTATION POLICY (05_DECISION_ENGINE_SPEC.md line 140: +15 skin context + 5 context adjustment) */
  SKIN_CONTEXT_MAX: 20,
  /** @provenance SPECIFIED / EXPLICIT IMPLEMENTATION POLICY (05_DECISION_ENGINE_SPEC.md line 141: +20 evidence completeness + metadata quality) */
  EVIDENCE_COMPLETENESS_MAX: 25,
  /** @provenance SPECIFIED (05_DECISION_ENGINE_SPEC.md line 142) */
  PREFERENCE_MAX: 10,
} as const;

/**
 * Coverage match scoring breakdown (Max 25 pts).
 * @provenance EXPLICIT IMPLEMENTATION POLICY
 */
export const COVERAGE_POINTS = {
  EXACT_MATCH: 25,
  PARTIAL_MATCH: 15,
  MISMATCH: 5,
  UNKNOWN: 0,
} as const;

/**
 * Finish match scoring breakdown (Max 20 pts).
 * @provenance EXPLICIT IMPLEMENTATION POLICY
 */
export const FINISH_POINTS = {
  EXACT_MATCH: 20,
  COMPATIBLE_MATCH: 12,
  DIVERGENT_MATCH: 4,
  UNKNOWN: 0,
} as const;

/**
 * Deterministic Unknown Evidence Penalties (Subtracted from Total, Max 50 pts).
 * @provenance EXPLICIT IMPLEMENTATION POLICY
 */
export const UNKNOWN_PENALTIES = {
  MISSING_INGREDIENTS: 10,
  MISSING_FRAGRANCE_DISCLOSURE: 10,
  MISSING_FINISH: 5,
  MISSING_COVERAGE: 5,
  MISSING_PRICE_AVAILABILITY: 5,
  CONFLICTING_FIELD_PENALTY: 10,
} as const;

/**
 * Evidence completeness threshold for minimum acceptable analysis (0.0 to 1.0).
 * @provenance EXPLICIT IMPLEMENTATION POLICY
 */
export const THRESHOLDS = {
  MIN_EVIDENCE_COMPLETENESS_ABSTAIN: 0.4,
  HIGH_EVIDENCE_BAND_COMPLETENESS: 0.8,
  MODERATE_EVIDENCE_BAND_COMPLETENESS: 0.5,
  SCORE_SEPARATION_MARGIN_MIN: 5.0,
  OPTICAL_CONDITION_CONCERN_THRESHOLD: 0.6,
  OPTICAL_CONDITION_CRITICAL_THRESHOLD: 0.4,
} as const;
