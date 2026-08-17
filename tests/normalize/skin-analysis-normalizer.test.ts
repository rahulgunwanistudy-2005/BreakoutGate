/**
 * @file tests/normalize/skin-analysis-normalizer.test.ts
 * @description Normalization boundary tests ensuring raw provider outputs are strictly translated into canonical SkinState.
 *
 * CRITICAL INVARIANTS TESTED:
 * 1. Missing measurements NEVER become false or 0. Missing = state:"UNKNOWN" and value:null.
 * 2. Provider errors and malformed schemas produce typed YouCamErrors.
 */

import { describe, it, expect } from "vitest";
import { normalizeSkinAnalysisResponse } from "../../packages/youcam/normalize/skin-analysis-normalizer";
import { YouCamError } from "../../packages/youcam/errors";
import { SKIN_STATE_SCHEMA_VERSION } from "../../packages/contracts/versions";
import { SkinStateSchema } from "../../packages/contracts/skin-state";

describe("Skin Analysis Provider Normalizer", () => {
  // Test fixture representing a raw YouCam response structure (labeled as static test data, NOT live evidence)
  const completeRawProviderResponse = {
    status: 200,
    result: {
      task_status: "success",
      task_id: "tsk_sk_full_sample_123",
      output: {
        skin_analysis: {
          spots: { score: 40, level: 1, category: "low" },
          wrinkles: { score: 20, level: 1, category: "low" },
          texture: { score: 66, level: 3, category: "high" },
          dark_circles: { score: 35, level: 2, category: "moderate" },
          redness: { score: 61, level: 3, category: "elevated" },
          oiliness: { score: 58, level: 2, category: "moderate" },
          moisture: { score: 35, level: 1, category: "low" },
          pores: { score: 54, level: 2, category: "moderate" },
          radiance: { score: 45, level: 2, category: "moderate" },
          firmness: { score: 50, level: 2, category: "moderate" },
          acne: { score: 72, level: 3, category: "high" },
        },
        face_info: {
          box: [100, 100, 400, 400],
          confidence: 0.99,
        },
        quality_score: 85,
      },
    },
  };

  it("normalizes a complete provider response into canonical SkinState with scaled values", () => {
    const skinState = normalizeSkinAnalysisResponse(completeRawProviderResponse, {
      taskId: "tsk_sk_full_sample_123",
      capturedAt: "2026-08-17T12:00:00.000Z",
    });

    expect(skinState.version).toBe(SKIN_STATE_SCHEMA_VERSION);
    expect(skinState.analysisId).toBe("an_sk_full_sample_123");
    expect(skinState.signals.acne.state).toBe("KNOWN");
    expect(skinState.signals.acne.value).toBe(0.72); // 72 / 100
    expect(skinState.signals.acne.rawScore).toBe(72);
    expect(skinState.signals.acne.rawLevel).toBe(3);
    expect(skinState.signals.redness.value).toBe(0.61);
    expect(skinState.signals.texture.value).toBe(0.66);
    expect(skinState.overallQuality?.value).toBe(0.85);
    expect(skinState.faceInfo?.confidence).toBe(0.99);

    // Validate passes canonical schema check
    expect(() => SkinStateSchema.parse(skinState)).not.toThrow();
  });

  it("CRITICAL: encodes missing provider measurements as UNKNOWN with value=null (NOT 0, NOT false)", () => {
    const partialRawResponse = {
      status: 200,
      result: {
        task_status: "success",
        task_id: "tsk_sk_partial_456",
        output: {
          skin_analysis: {
            redness: { score: 55, level: 2 },
            oiliness: { score: 60, level: 2 },
            // acne, texture, moisture, etc. are omitted by provider!
          },
        },
      },
    };

    const skinState = normalizeSkinAnalysisResponse(partialRawResponse, {
      taskId: "tsk_sk_partial_456",
      capturedAt: "2026-08-17T12:00:00.000Z",
    });

    // Redness was provided -> KNOWN
    expect(skinState.signals.redness.state).toBe("KNOWN");
    expect(skinState.signals.redness.value).toBe(0.55);

    // Acne was NOT provided -> MUST BE UNKNOWN and null
    expect(skinState.signals.acne.state).toBe("UNKNOWN");
    expect(skinState.signals.acne.value).toBeNull();
    expect(skinState.signals.acne.value).not.toBe(0);
    expect(skinState.signals.acne.value).not.toBe(false);

    // Texture was NOT provided -> MUST BE UNKNOWN and null
    expect(skinState.signals.texture.state).toBe("UNKNOWN");
    expect(skinState.signals.texture.value).toBeNull();
    expect(skinState.signals.texture.value).not.toBe(0);

    // Must satisfy canonical schema
    expect(() => SkinStateSchema.parse(skinState)).not.toThrow();
  });

  it("maps alias 'hydration' to canonical 'moisture' when moisture is not directly named", () => {
    const aliasRawResponse = {
      status: 200,
      result: {
        task_status: "success",
        task_id: "tsk_sk_alias_789",
        output: {
          skin_analysis: {
            hydration: { score: 45, level: 2 }, // provider named it hydration
          },
        },
      },
    };

    const skinState = normalizeSkinAnalysisResponse(aliasRawResponse, {
      taskId: "tsk_sk_alias_789",
    });

    expect(skinState.signals.moisture.state).toBe("KNOWN");
    expect(skinState.signals.moisture.value).toBe(0.45);
  });

  it("throws PROVIDER_TASK_FAILED when provider response indicates failure", () => {
    const failedResponse = {
      status: 200,
      result: {
        task_status: "error",
        task_id: "tsk_sk_failed_01",
        error: {
          code: "FACE_NOT_ALIGNED",
          message: "Face was rotated beyond acceptable threshold.",
        },
      },
    };

    expect(() =>
      normalizeSkinAnalysisResponse(failedResponse, { taskId: "tsk_sk_failed_01" })
    ).toThrowError(YouCamError);

    try {
      normalizeSkinAnalysisResponse(failedResponse, { taskId: "tsk_sk_failed_01" });
    } catch (err) {
      expect((err as YouCamError).code).toBe("PROVIDER_TASK_FAILED");
      expect((err as YouCamError).providerErrorCode).toBe("FACE_NOT_ALIGNED");
    }
  });

  it("throws PROVIDER_SCHEMA_ERROR when provider response structure is malformed", () => {
    const malformedResponse = {
      unexpectedKey: 12345,
      // Completely invalid shape
    };

    expect(() =>
      normalizeSkinAnalysisResponse(malformedResponse, { taskId: "tsk_malformed" })
    ).toThrowError(YouCamError);
  });
});
