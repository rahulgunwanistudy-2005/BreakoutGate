/**
 * @file tests/evidence/freshness.test.ts
 * @description Deterministic tests for evidence freshness evaluation with clock injection.
 */

import { describe, it, expect } from "vitest";
import { evaluateFreshness } from "../../packages/evidence/freshness";

describe("Evidence Freshness Evaluator", () => {
  const referenceNow = "2026-08-17T12:00:00.000Z";

  it("marks recent price (< 24h) as fresh", () => {
    const recentTimestamp = "2026-08-17T06:00:00.000Z"; // 6 hours ago
    const result = evaluateFreshness(recentTimestamp, "price", { now: referenceNow });

    expect(result.isFresh).toBe(true);
    expect(result.isStale).toBe(false);
    expect(result.isFuture).toBe(false);
    expect(result.ageMs).toBe(6 * 60 * 60 * 1000);
  });

  it("marks price older than 24h as stale according to policy", () => {
    const oldPriceTimestamp = "2026-08-15T12:00:00.000Z"; // 48 hours ago
    const result = evaluateFreshness(oldPriceTimestamp, "price", { now: referenceNow });

    expect(result.isFresh).toBe(false);
    expect(result.isStale).toBe(true);
    expect(result.isFuture).toBe(false);
  });

  it("marks ingredients list within 90 days as fresh", () => {
    const ingredientTimestamp = "2026-07-01T12:00:00.000Z"; // ~47 days ago
    const result = evaluateFreshness(ingredientTimestamp, "ingredients", { now: referenceNow });

    expect(result.isFresh).toBe(true);
    expect(result.isStale).toBe(false);
  });

  it("flags future timestamps as invalid/future (isFresh: false)", () => {
    const futureTimestamp = "2026-08-18T12:00:00.000Z"; // 1 day in the future
    const result = evaluateFreshness(futureTimestamp, "general", { now: referenceNow });

    expect(result.isFuture).toBe(true);
    expect(result.isFresh).toBe(false);
    expect(result.isStale).toBe(true);
  });

  it("throws error when invalid non-ISO date string is provided", () => {
    expect(() => evaluateFreshness("not-a-date", "price")).toThrowError("Invalid ISO timestamp");
  });
});
