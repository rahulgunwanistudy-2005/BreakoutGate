/**
 * @file packages/youcam/skin-analysis.ts
 * @description Perfect Corp Skin Analysis API client for task initiation and status polling.
 */

import { unzipSync } from "fflate";
import { YouCamConfig } from "./config";
import { YouCamError } from "./errors";
import { executeBoundedPoll, TaskPollResult } from "./polling";
import { TraceBuilder, ProviderTrace } from "./trace";
import {
  SkinActionType,
  SkinAnalysisPollResult,
  SkinAnalysisTaskInitiation,
  SkinAnalysisTaskParams,
  PollingOptions,
  YouCamTaskStatus,
} from "./types";

export const DEFAULT_SKIN_ACTIONS: SkinActionType[] = [
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
];

const ACTION_TO_PROVIDER_MAP: Record<SkinActionType, string> = {
  spots: "age_spot",
  wrinkles: "wrinkle",
  texture: "texture",
  dark_circles: "dark_circle_v2",
  redness: "redness",
  oiliness: "oiliness",
  moisture: "moisture",
  pores: "pore",
  radiance: "radiance",
  firmness: "firmness",
  acne: "acne",
};

/**
 * Initiates an asynchronous Skin Analysis task with Perfect Corp.
 */
export async function createSkinAnalysisTask(
  config: YouCamConfig,
  params: SkinAnalysisTaskParams
): Promise<{ initiation: SkinAnalysisTaskInitiation; trace: ProviderTrace }> {
  const traceBuilder = new TraceBuilder("skin_analysis_create");

  const requestedActions = params.actions ?? DEFAULT_SKIN_ACTIONS;
  const dstActions = requestedActions.map((action) => ACTION_TO_PROVIDER_MAP[action] ?? action);

  try {
    const url = `${config.baseUrl.replace(/\/+$/, "")}/s2s/v2.0/task/skin-analysis`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: params.fileId,
        dst_actions: dstActions,
        mode: params.mode ?? "standard",
      }),
      signal: params.signal,
    });

    traceBuilder.setHttpStatus(response.status);

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      const error = YouCamError.fromHttpResponse(response.status, body);
      traceBuilder.setError(error.code);
      throw error;
    }

    const data = (await response.json()) as {
      status?: number;
      data?: { task_id?: string; task_status?: string; output?: Record<string, unknown>; error?: { code?: string; message?: string } };
      result?: { task_id?: string; task_status?: string; output?: Record<string, unknown>; error?: { code?: string; message?: string } };
      task_id?: string;
    };

    const taskId = data.data?.task_id ?? data.result?.task_id ?? data.task_id;
    if (!taskId) {
      throw new YouCamError({
        code: "PROVIDER_SCHEMA_ERROR",
        message: "Skin Analysis task initiation missing task_id in response.",
        isRetryable: false,
      });
    }

    traceBuilder.setTaskId(taskId);
    traceBuilder.setTaskStatus("pending");

    return {
      initiation: {
        taskId,
        status: "pending",
      },
      trace: traceBuilder.finish(),
    };
  } catch (err: unknown) {
    if (err instanceof YouCamError) {
      traceBuilder.setError(err.code);
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      const abortErr = new YouCamError({
        code: "ABORTED",
        message: "Skin analysis task creation was aborted.",
        cause: err,
      });
      traceBuilder.setError(abortErr.code);
      throw abortErr;
    }
    const networkErr = new YouCamError({
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error during Skin Analysis task creation.",
      cause: err,
    });
    traceBuilder.setError(networkErr.code);
    throw networkErr;
  }
}

/**
 * Checks current status of a Skin Analysis task.
 */
export async function checkSkinAnalysisTaskStatus(
  config: YouCamConfig,
  taskId: string,
  signal?: AbortSignal
): Promise<TaskPollResult<SkinAnalysisPollResult>> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/s2s/v2.0/task/skin-analysis/${encodeURIComponent(taskId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    signal,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    throw YouCamError.fromHttpResponse(response.status, body, taskId);
  }

  const data = (await response.json()) as {
    status?: number;
    data?: {
      task_status?: string;
      output?: Record<string, unknown>;
      error?: { code?: string; message?: string };
    };
    result?: {
      task_status?: string;
      output?: Record<string, unknown>;
      error?: { code?: string; message?: string };
    };
    task_status?: string;
    output?: Record<string, unknown>;
  };

  const rawStatus = (
    data.data?.task_status ??
    data.result?.task_status ??
    data.task_status ??
    "pending"
  ).toLowerCase();

  let normalizedStatus: YouCamTaskStatus = "pending";
  if (rawStatus === "success" || rawStatus === "completed" || rawStatus === "done") {
    normalizedStatus = "success";
  } else if (rawStatus === "error" || rawStatus === "failed") {
    normalizedStatus = "error";
  } else if (rawStatus === "processing" || rawStatus === "in_progress" || rawStatus === "running") {
    normalizedStatus = "processing";
  } else if (rawStatus === "cancelled" || rawStatus === "canceled") {
    normalizedStatus = "cancelled";
  }

  const isComplete = normalizedStatus === "success" || normalizedStatus === "error" || normalizedStatus === "cancelled";
  let output = data.data?.output ?? data.result?.output ?? data.output;
  const errorObj = data.data?.error ?? data.result?.error;

  // If results contains a download URL for score archive (e.g. S3 zip)
  const resultsObj = (data.data as Record<string, unknown> | undefined)?.results as { url?: string } | undefined
    ?? (data.result as Record<string, unknown> | undefined)?.results as { url?: string } | undefined
    ?? (data as Record<string, unknown>).results as { url?: string } | undefined;

  if (normalizedStatus === "success" && resultsObj?.url && !output?.skin_analysis) {
    try {
      const unpacked = await unpackSkinAnalysisZip(resultsObj.url, signal);
      output = {
        ...(output ?? {}),
        ...unpacked,
        artifactUrl: resultsObj.url,
      };
    } catch {
      // Fallback: keep existing output
    }
  }

  return {
    status: normalizedStatus,
    isComplete,
    data:
      normalizedStatus === "success"
        ? {
            taskId,
            status: "success",
            rawOutput: output,
          }
        : undefined,
    error: errorObj,
  };
}

async function unpackSkinAnalysisZip(zipUrl: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const res = await fetch(zipUrl, { signal });
  if (!res.ok) {
    return { zipUrl };
  }
  const arrayBuffer = await res.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(arrayBuffer));

  const scoreKey = Object.keys(unzipped).find((k) => k.endsWith("score_info.json") || k.includes("score_info"));
  if (scoreKey) {
    const jsonStr = new TextDecoder().decode(unzipped[scoreKey]);
    const scoreData = JSON.parse(jsonStr) as Record<string, unknown>;

    const skinAnalysis: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(scoreData)) {
      if (val && typeof val === "object" && !Array.isArray(val) && (("raw_score" in val) || ("ui_score" in val) || ("score" in val))) {
        const item = val as Record<string, unknown>;
        skinAnalysis[key] = {
          score: (item.ui_score as number) ?? (item.score as number) ?? (item.raw_score as number),
          raw_score: item.raw_score as number,
          ui_score: item.ui_score as number,
          raw_value: item.raw_score as number,
          category: item.category as string,
          level: item.level as number,
        };
      }
    }

    const allObj = scoreData.all as { score?: number } | undefined;
    const qualityScore = allObj?.score ?? (scoreData.quality_score as number);

    return {
      skin_analysis: skinAnalysis,
      quality_score: qualityScore,
      skin_age: scoreData.skin_age,
      raw_scores: scoreData,
    };
  }

  return { zipUrl };
}

/**
 * Executes full Skin Analysis workflow: task creation followed by bounded status polling.
 */
export async function runSkinAnalysis(
  config: YouCamConfig,
  params: SkinAnalysisTaskParams,
  options?: PollingOptions
): Promise<{ result: SkinAnalysisPollResult; traces: ProviderTrace[] }> {
  const traces: ProviderTrace[] = [];

  const { initiation, trace: initTrace } = await createSkinAnalysisTask(config, params);
  traces.push(initTrace);

  const pollTraceBuilder = new TraceBuilder("skin_analysis_poll");
  pollTraceBuilder.setTaskId(initiation.taskId);

  try {
    const result = await executeBoundedPoll<SkinAnalysisPollResult>(
      initiation.taskId,
      () => checkSkinAnalysisTaskStatus(config, initiation.taskId, options?.signal),
      {
        intervalMs: options?.intervalMs ?? config.pollIntervalMs,
        timeoutMs: options?.timeoutMs ?? config.pollTimeoutMs,
        signal: options?.signal ?? params.signal,
        onProgress: options?.onProgress,
      }
    );

    pollTraceBuilder.setTaskStatus("success");
    traces.push(pollTraceBuilder.finish());

    return {
      result,
      traces,
    };
  } catch (err: unknown) {
    if (err instanceof YouCamError) {
      pollTraceBuilder.setError(err.code);
      traces.push(pollTraceBuilder.finish());
      throw err;
    }
    const unknownErr = new YouCamError({
      code: "UNKNOWN_PROVIDER_ERROR",
      message: err instanceof Error ? err.message : "Unexpected error during skin analysis polling.",
      cause: err,
      providerTaskId: initiation.taskId,
    });
    pollTraceBuilder.setError(unknownErr.code);
    traces.push(pollTraceBuilder.finish());
    throw unknownErr;
  }
}
