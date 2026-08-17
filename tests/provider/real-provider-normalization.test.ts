/**
 * @file tests/provider/real-provider-normalization.test.ts
 * @description Regression tests validating that actual Perfect Corp AI Skin Analysis outputs normalize into canonical SkinState.
 */

import { describe, it, expect } from "vitest";
import sanitizedRealFixture from "../../packages/youcam/fixtures/real-provider-skin-analysis-sanitized.json";
import { normalizeSkinAnalysisResponse } from "../../packages/youcam/normalize/skin-analysis-normalizer";
import { SkinStateSchema } from "../../packages/contracts/skin-state";
import { SKIN_STATE_SCHEMA_VERSION } from "../../packages/contracts/versions";

describe("Real Provider Response Normalization (Sanitized Fixture)", () => {
  it("normalizes real Perfect Corp S2S raw score_info into canonical SkinState", () => {
    const rawPayload = {
      status: 200,
      result: {
        task_status: "success",
        task_id: "tsk_real_perfectcorp_sample_01",
        output: sanitizedRealFixture.rawOutput,
      },
    };

    const skinState = normalizeSkinAnalysisResponse(rawPayload, {
      taskId: "tsk_real_perfectcorp_sample_01",
      capturedAt: "2026-08-17T13:41:25.000Z",
    });

    expect(skinState.version).toBe(SKIN_STATE_SCHEMA_VERSION);
    expect(skinState.signals.acne.state).toBe("KNOWN");
    expect(skinState.signals.acne.value).toBe(0.91);
    expect(skinState.signals.acne.rawScore).toBe(91);

    expect(skinState.signals.redness.state).toBe("KNOWN");
    expect(skinState.signals.redness.value).toBe(0.88);

    expect(skinState.signals.texture.state).toBe("KNOWN");
    expect(skinState.signals.texture.value).toBe(0.77);

    expect(skinState.signals.oiliness.state).toBe("KNOWN");
    expect(skinState.signals.oiliness.value).toBe(0.69);

    // Unmeasured signals in this specific run must be preserved as UNKNOWN (never 0, never false)
    expect(skinState.signals.wrinkles.state).toBe("UNKNOWN");
    expect(skinState.signals.wrinkles.value).toBeNull();

    // Canonical schema validation
    const validated = SkinStateSchema.parse(skinState);
    expect(validated.analysisId).toBe("an_real_perfectcorp_sample_01");
    expect(validated.provenance.sourceType).toBe("youcam");
  });
});
