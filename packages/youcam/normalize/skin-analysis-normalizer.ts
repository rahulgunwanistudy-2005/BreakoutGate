/**
 * @file packages/youcam/normalize/skin-analysis-normalizer.ts
 * @description Provider normalization boundary: converts raw Perfect Corp JSON into canonical SkinState.
 *
 * CRITICAL INVARIANT:
 * 1. Missing provider measurements MUST become state = "UNKNOWN" with value = null.
 * 2. Missing data NEVER collapses to false, 0, or "safe".
 */

import {
  EvidenceField,
  Provenance,
  SKIN_STATE_SCHEMA_VERSION,
  SkinSignalMeasurement,
  SkinSignalName,
  SkinState,
  SkinStateSchema,
} from "@contracts";
import { YouCamError } from "../errors";
import {
  RawSkinAnalysisPollResponse,
  RawSkinAnalysisPollResponseSchema,
  RawSkinMetricItem,
} from "../schemas/raw-provider-responses";

const ALL_CANONICAL_SIGNALS: readonly SkinSignalName[] = [
  "spots",
  "wrinkles",
  "texture",
  "dark_circles",
  "redness",
  "oiliness",
  "moisture",
  "pores",
  "radiance",
  "firmness",
  "acne",
] as const;

export interface NormalizationOptions {
  taskId: string;
  capturedAt?: string;
  analysisId?: string;
  engineMode?: string;
}

/**
 * Normalizes raw Perfect Corp Skin Analysis response into the canonical SkinState contract.
 */
export function normalizeSkinAnalysisResponse(
  rawPayload: unknown,
  options: NormalizationOptions
): SkinState {
  const parseResult = RawSkinAnalysisPollResponseSchema.safeParse(rawPayload);

  if (!parseResult.success) {
    throw new YouCamError({
      code: "PROVIDER_SCHEMA_ERROR",
      message: `Invalid raw Skin Analysis provider response structure: ${parseResult.error.message}`,
      providerTaskId: options.taskId,
      isRetryable: false,
    });
  }

  const data: RawSkinAnalysisPollResponse = parseResult.data;
  const status = (data.result?.task_status ?? data.task_status ?? "pending").toLowerCase();

  if (status === "error" || status === "failed") {
    const errorDetails = data.result?.error;
    throw new YouCamError({
      code: "PROVIDER_TASK_FAILED",
      message: errorDetails?.message ?? "YouCam Skin Analysis task reported failure status.",
      providerErrorCode: errorDetails?.code,
      providerTaskId: options.taskId,
      isRetryable: false,
    });
  }

  const output = data.result?.output ?? data.output;
  const rawSignals: Record<string, RawSkinMetricItem | undefined> = output?.skin_analysis ?? {};

  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const analysisId = options.analysisId ?? `an_${options.taskId.replace(/^tsk_/, "")}`;

  const defaultProvenance: Provenance = {
    sourceType: "youcam",
    retrievedAt: capturedAt,
    confidence: 1,
    rawLabel: "Perfect Corp AI Skin Analysis S2S v2.0",
  };

  const signalsRecord: Partial<Record<SkinSignalName, SkinSignalMeasurement>> = {};

  for (const signalName of ALL_CANONICAL_SIGNALS) {
    let rawMetric = rawSignals[signalName];
    if (!rawMetric) {
      if (signalName === "moisture") {
        rawMetric = rawSignals["hydration"];
      } else if (signalName === "wrinkles") {
        rawMetric = rawSignals["wrinkle"];
      } else if (signalName === "pores") {
        rawMetric = rawSignals["pore"];
      } else if (signalName === "spots") {
        rawMetric = rawSignals["age_spot"] ?? rawSignals["spot"];
      } else if (signalName === "dark_circles") {
        rawMetric = rawSignals["dark_circle_v2"] ?? rawSignals["dark_circle"];
      }
    }

    if (rawMetric && typeof rawMetric === "object") {
      const score = rawMetric.score ?? rawMetric.raw_value;
      if (typeof score === "number" && !isNaN(score)) {
        // Normalize score (0-100 scale down to 0-1)
        const normalizedValue = Math.max(0, Math.min(1, score > 1 ? score / 100 : score));
        signalsRecord[signalName] = {
          state: "KNOWN",
          value: normalizedValue,
          evidenceClass: "E1_PROVIDER_MEASURED",
          provenance: defaultProvenance,
          rawScore: score,
          rawLevel: rawMetric.level,
          rawCategory: rawMetric.category,
        };
        continue;
      }
    }

    // MISSING OR UNPARSEABLE -> UNKNOWN with value = null
    signalsRecord[signalName] = {
      state: "UNKNOWN",
      value: null,
      evidenceClass: "E1_PROVIDER_MEASURED",
      provenance: defaultProvenance,
    };
  }

  // Quality score
  let overallQuality: EvidenceField<number> | undefined;
  if (typeof output?.quality_score === "number" && !isNaN(output.quality_score)) {
    const rawQ = output.quality_score;
    overallQuality = {
      state: "KNOWN",
      value: Math.max(0, Math.min(1, rawQ > 1 ? rawQ / 100 : rawQ)),
      evidenceClass: "E1_PROVIDER_MEASURED",
      provenance: defaultProvenance,
    };
  }

  // Face info
  const faceInfo = output?.face_info
    ? {
        box: output.face_info.box,
        confidence: output.face_info.confidence,
      }
    : undefined;

  const skinStatePayload = {
    version: SKIN_STATE_SCHEMA_VERSION,
    analysisId,
    capturedAt,
    signals: signalsRecord,
    overallQuality,
    faceInfo,
    providerMetadata: {
      provider: "youcam" as const,
      providerTaskId: options.taskId,
      engineMode: options.engineMode ?? "standard",
    },
    provenance: defaultProvenance,
  };

  // Validate against canonical contract
  return SkinStateSchema.parse(skinStatePayload);
}
