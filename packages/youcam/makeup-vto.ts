/**
 * @file packages/youcam/makeup-vto.ts
 * @description Perfect Corp Makeup Virtual Try-On (VTO) API client for task initiation and status polling.
 */

import { YouCamConfig } from "./config";
import { YouCamError } from "./errors";
import { executeBoundedPoll, TaskPollResult } from "./polling";
import { TraceBuilder, ProviderTrace } from "./trace";
import {
  MakeupVtoPollResult,
  MakeupVtoTaskInitiation,
  MakeupVtoTaskParams,
  PollingOptions,
  YouCamTaskStatus,
} from "./types";

/**
 * Initiates an asynchronous Makeup Virtual Try-On (VTO) task with Perfect Corp.
 */
export async function createMakeupVtoTask(
  config: YouCamConfig,
  params: MakeupVtoTaskParams
): Promise<{ initiation: MakeupVtoTaskInitiation; trace: ProviderTrace }> {
  const traceBuilder = new TraceBuilder("makeup_vto_create");

  try {
    const url = `${config.baseUrl.replace(/\/+$/, "")}/s2s/v2.0/task/makeup-vto`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        src_file_id: params.fileId,
        effects: params.looks.map((look) => {
          const intensity = Math.round((look.intensity ?? 0.85) * 100);
          const colorHex = look.colorHex ?? (look.shadeCode?.startsWith("#") ? look.shadeCode : "#D8B38A");
          const isDewy = look.finish === "dewy";
          return {
            category: "foundation",
            palettes: [
              {
                color: colorHex,
              },
            ],
            colorIntensity: intensity,
            coverageIntensity: 70,
            glowIntensity: isDewy ? 40 : 0,
          };
        }),
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
      data?: { task_id?: string; task_status?: string; output?: { artifact_url?: string; image_url?: string; width?: number; height?: number }; error?: { code?: string; message?: string } };
      result?: { task_id?: string; task_status?: string; output?: { artifact_url?: string; image_url?: string; width?: number; height?: number }; error?: { code?: string; message?: string } };
      task_id?: string;
    };

    const taskId = data.data?.task_id ?? data.result?.task_id ?? data.task_id;
    if (!taskId) {
      throw new YouCamError({
        code: "PROVIDER_SCHEMA_ERROR",
        message: "Makeup VTO task initiation missing task_id in response.",
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
        message: "Makeup VTO task creation was aborted.",
        cause: err,
      });
      traceBuilder.setError(abortErr.code);
      throw abortErr;
    }
    const networkErr = new YouCamError({
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error during Makeup VTO task creation.",
      cause: err,
    });
    traceBuilder.setError(networkErr.code);
    throw networkErr;
  }
}

/**
 * Checks current status of a Makeup VTO task.
 */
export async function checkMakeupVtoTaskStatus(
  config: YouCamConfig,
  taskId: string,
  signal?: AbortSignal
): Promise<TaskPollResult<MakeupVtoPollResult>> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/s2s/v2.0/task/makeup-vto/${encodeURIComponent(taskId)}`;

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
      output?: {
        artifact_url?: string;
        image_url?: string;
        width?: number;
        height?: number;
        [key: string]: unknown;
      };
      results?: {
        url?: string;
        image_url?: string;
      };
      error?: { code?: string; message?: string };
    };
    result?: {
      task_status?: string;
      output?: {
        artifact_url?: string;
        image_url?: string;
        width?: number;
        height?: number;
        [key: string]: unknown;
      };
      results?: {
        url?: string;
        image_url?: string;
      };
      error?: { code?: string; message?: string };
    };
    task_status?: string;
    output?: {
      artifact_url?: string;
      image_url?: string;
      width?: number;
      height?: number;
      [key: string]: unknown;
    };
    results?: {
      url?: string;
      image_url?: string;
    };
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
  const output = data.data?.output ?? data.result?.output ?? data.output;
  const resultsObj = data.data?.results ?? data.result?.results ?? data.results;
  const artifactUrl = output?.artifact_url ?? output?.image_url ?? resultsObj?.url ?? resultsObj?.image_url;
  const errorObj = data.data?.error ?? data.result?.error;

  return {
    status: normalizedStatus,
    isComplete,
    data:
      normalizedStatus === "success"
        ? {
            taskId,
            status: "success",
            artifactUrl,
            width: output?.width,
            height: output?.height,
            rawOutput: output,
          }
        : undefined,
    error: errorObj,
  };
}

/**
 * Executes full Makeup VTO workflow: task creation followed by bounded status polling.
 */
export async function runMakeupVto(
  config: YouCamConfig,
  params: MakeupVtoTaskParams,
  options?: PollingOptions
): Promise<{ result: MakeupVtoPollResult; traces: ProviderTrace[] }> {
  const traces: ProviderTrace[] = [];

  const { initiation, trace: initTrace } = await createMakeupVtoTask(config, params);
  traces.push(initTrace);

  const pollTraceBuilder = new TraceBuilder("makeup_vto_poll");
  pollTraceBuilder.setTaskId(initiation.taskId);

  try {
    const result = await executeBoundedPoll<MakeupVtoPollResult>(
      initiation.taskId,
      () => checkMakeupVtoTaskStatus(config, initiation.taskId, options?.signal),
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
      message: err instanceof Error ? err.message : "Unexpected error during Makeup VTO polling.",
      cause: err,
      providerTaskId: initiation.taskId,
    });
    pollTraceBuilder.setError(unknownErr.code);
    traces.push(pollTraceBuilder.finish());
    throw unknownErr;
  }
}
