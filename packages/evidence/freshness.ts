/**
 * @file packages/evidence/freshness.ts
 * @description Deterministic evidence freshness evaluation and configurable TTL policies.
 *
 * CRITICAL INVARIANT:
 * Freshness checks accept clock injection for deterministic, non-flaky property tests.
 */

export interface FreshnessPolicy {
  priceMaxAgeMs: number;
  availabilityMaxAgeMs: number;
  ingredientsMaxAgeMs: number;
  claimsMaxAgeMs: number;
  defaultMaxAgeMs: number;
}

export const DEFAULT_FRESHNESS_POLICY: FreshnessPolicy = {
  priceMaxAgeMs: 24 * 60 * 60 * 1000, // 24 hours
  availabilityMaxAgeMs: 1 * 60 * 60 * 1000, // 1 hour
  ingredientsMaxAgeMs: 90 * 24 * 60 * 60 * 1000, // 90 days
  claimsMaxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  defaultMaxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export interface FreshnessEvaluationResult {
  isFresh: boolean;
  isStale: boolean;
  isFuture: boolean;
  ageMs: number;
  maxAgeMs: number;
}

export interface FreshnessEvaluationOptions {
  policy?: Partial<FreshnessPolicy>;
  now?: Date | string | number;
}

/**
 * Evaluates the freshness of an evidence item based on its retrievedAt timestamp.
 */
export function evaluateFreshness(
  retrievedAt: string,
  fieldCategory: "price" | "availability" | "ingredients" | "claims" | "general" = "general",
  options?: FreshnessEvaluationOptions
): FreshnessEvaluationResult {
  const parsedDate = new Date(retrievedAt);
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid ISO timestamp provided for freshness evaluation: "${retrievedAt}"`);
  }

  const currentDate = options?.now ? new Date(options.now) : new Date();
  if (isNaN(currentDate.getTime())) {
    throw new Error(`Invalid reference date provided for freshness evaluation.`);
  }

  const ageMs = currentDate.getTime() - parsedDate.getTime();
  const isFuture = ageMs < 0;

  const policy: FreshnessPolicy = {
    ...DEFAULT_FRESHNESS_POLICY,
    ...(options?.policy ?? {}),
  };

  let maxAgeMs = policy.defaultMaxAgeMs;
  if (fieldCategory === "price") {
    maxAgeMs = policy.priceMaxAgeMs;
  } else if (fieldCategory === "availability") {
    maxAgeMs = policy.availabilityMaxAgeMs;
  } else if (fieldCategory === "ingredients") {
    maxAgeMs = policy.ingredientsMaxAgeMs;
  } else if (fieldCategory === "claims") {
    maxAgeMs = policy.claimsMaxAgeMs;
  }

  const isStale = ageMs > maxAgeMs || isFuture;
  const isFresh = !isStale && !isFuture;

  return {
    isFresh,
    isStale,
    isFuture,
    ageMs: Math.max(0, ageMs),
    maxAgeMs,
  };
}
