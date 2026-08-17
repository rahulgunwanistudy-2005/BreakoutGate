/**
 * @file tests/contracts/skin-state.test.ts
 * @description Contract validation tests for canonical SkinState.
 */

import { describe, it, expect } from "vitest";
import { SkinState, SkinStateSchema } from "../../packages/contracts/skin-state";
import { SKIN_STATE_SCHEMA_VERSION } from "../../packages/contracts/versions";

describe("Canonical SkinState Contract", () => {
  const validProvenance = {
    sourceType: "youcam" as const,
    retrievedAt: "2026-08-17T12:00:00.000Z",
    confidence: 1,
    rawLabel: "YouCam Skin API",
  };

  const createSignal = (value: number | null, state: "KNOWN" | "UNKNOWN" = "KNOWN") => ({
    state,
    value,
    evidenceClass: "E1_PROVIDER_MEASURED" as const,
    provenance: validProvenance,
    rawScore: value !== null ? value * 100 : undefined,
  });

  const validSkinState: SkinState = {
    version: SKIN_STATE_SCHEMA_VERSION,
    analysisId: "an_7b382910a",
    capturedAt: "2026-08-17T12:00:00.000Z",
    signals: {
      spots: createSignal(0.4),
      wrinkles: createSignal(0.2),
      texture: createSignal(0.66),
      dark_circles: createSignal(0.35),
      redness: createSignal(0.61),
      oiliness: createSignal(0.58),
      moisture: createSignal(0.35),
      pores: createSignal(0.54),
      radiance: createSignal(0.45),
      firmness: createSignal(0.5),
      acne: createSignal(0.72),
    },
    providerMetadata: {
      provider: "youcam",
      providerTaskId: "tsk_sk_7b382910a",
      engineMode: "standard",
    },
    provenance: validProvenance,
  };

  it("validates a fully populated canonical SkinState", () => {
    const parsed = SkinStateSchema.parse(validSkinState);
    expect(parsed.version).toBe(SKIN_STATE_SCHEMA_VERSION);
    expect(parsed.signals.acne.value).toBe(0.72);
    expect(parsed.signals.redness.value).toBe(0.61);
  });

  it("validates SkinState with explicit UNKNOWN signals having value=null", () => {
    const stateWithUnknownAcne: SkinState = {
      ...validSkinState,
      signals: {
        ...validSkinState.signals,
        acne: createSignal(null, "UNKNOWN"),
      },
    };

    const parsed = SkinStateSchema.parse(stateWithUnknownAcne);
    expect(parsed.signals.acne.state).toBe("UNKNOWN");
    expect(parsed.signals.acne.value).toBeNull();
  });

  it("rejects SkinState with invalid schema version or malformed analysisId", () => {
    expect(() =>
      SkinStateSchema.parse({
        ...validSkinState,
        version: "0.0.1", // Invalid version
      })
    ).toThrow();

    expect(() =>
      SkinStateSchema.parse({
        ...validSkinState,
        analysisId: "invalid_no_prefix",
      })
    ).toThrow();
  });

  it("rejects signal values out of 0-1 range", () => {
    expect(() =>
      SkinStateSchema.parse({
        ...validSkinState,
        signals: {
          ...validSkinState.signals,
          redness: createSignal(1.5), // > 1.0
        },
      })
    ).toThrow();
  });
});
