/**
 * @file packages/youcam/polling.ts
 * @description Bounded asynchronous task polling engine with backoff, timeouts, and cancellation.
 */

import { YouCamError } from "./errors";
import { YouCamTaskStatus } from "./types";

export interface TaskPollResult<T> {
  status: YouCamTaskStatus;
  isComplete: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface BoundedPollingConfig {
  intervalMs: number;
  timeoutMs: number;
  maxAttempts?: number;
  backoffMultiplier?: number;
  maxIntervalMs?: number;
  signal?: AbortSignal;
  onProgress?: (status: YouCamTaskStatus, attempt: number, elapsedMs: number) => void;
}

/**
 * Executes bounded polling with backoff, timeout enforcement, and abort signal support.
 */
export async function executeBoundedPoll<T>(
  taskId: string,
  pollFn: () => Promise<TaskPollResult<T>>,
  config: BoundedPollingConfig
): Promise<T> {
  const startTime = Date.now();
  let attempt = 0;
  let currentInterval = Math.max(100, config.intervalMs);
  const maxAttempts = config.maxAttempts ?? Math.ceil(config.timeoutMs / config.intervalMs) + 5;
  const backoffMultiplier = config.backoffMultiplier ?? 1.2;
  const maxInterval = config.maxIntervalMs ?? 5000;

  while (true) {
    attempt++;

    // Check cancellation
    if (config.signal?.aborted) {
      throw new YouCamError({
        code: "ABORTED",
        message: `Task polling for task ${taskId} was aborted.`,
        providerTaskId: taskId,
      });
    }

    // Check timeout
    const elapsedMs = Date.now() - startTime;
    if (elapsedMs >= config.timeoutMs) {
      throw new YouCamError({
        code: "PROVIDER_TIMEOUT",
        message: `Task ${taskId} timed out after ${elapsedMs}ms (${attempt} attempts). Max timeout: ${config.timeoutMs}ms.`,
        providerTaskId: taskId,
        isRetryable: false,
      });
    }

    if (attempt > maxAttempts) {
      throw new YouCamError({
        code: "PROVIDER_TIMEOUT",
        message: `Task ${taskId} exceeded maximum polling attempts (${maxAttempts}).`,
        providerTaskId: taskId,
        isRetryable: false,
      });
    }

    // Execute poll attempt
    const pollResult = await pollFn();

    if (config.onProgress) {
      config.onProgress(pollResult.status, attempt, Date.now() - startTime);
    }

    if (pollResult.isComplete) {
      if (pollResult.status === "success" && pollResult.data !== undefined) {
        return pollResult.data;
      }

      if (pollResult.status === "error") {
        throw new YouCamError({
          code: "PROVIDER_TASK_FAILED",
          message: pollResult.error?.message ?? `Task ${taskId} reported processing error.`,
          providerErrorCode: pollResult.error?.code,
          providerTaskId: taskId,
          isRetryable: false,
        });
      }

      if (pollResult.status === "cancelled") {
        throw new YouCamError({
          code: "ABORTED",
          message: `Task ${taskId} was cancelled by provider.`,
          providerTaskId: taskId,
        });
      }
    }

    // Delay before next attempt
    await delay(currentInterval, config.signal);

    // Apply backoff bounded by maxInterval
    currentInterval = Math.min(maxInterval, Math.round(currentInterval * backoffMultiplier));
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(
        new YouCamError({
          code: "ABORTED",
          message: "Polling delay aborted.",
        })
      );
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(
          new YouCamError({
            code: "ABORTED",
            message: "Polling delay aborted.",
          })
        );
      },
      { once: true }
    );
  });
}
