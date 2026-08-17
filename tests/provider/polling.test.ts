/**
 * @file tests/provider/polling.test.ts
 * @description Tests for bounded polling engine, timeout enforcement, backoff, and cancellation.
 */

import { describe, it, expect } from "vitest";
import { YouCamError } from "../../packages/youcam/errors";
import { executeBoundedPoll, TaskPollResult } from "../../packages/youcam/polling";

describe("YouCam Bounded Polling Engine", () => {
  it("resolves immediately if task succeeds on first attempt", async () => {
    let callCount = 0;
    const mockPoll = async (): Promise<TaskPollResult<{ score: number }>> => {
      callCount++;
      return {
        status: "success",
        isComplete: true,
        data: { score: 95 },
      };
    };

    const result = await executeBoundedPoll("tsk_01", mockPoll, {
      intervalMs: 10,
      timeoutMs: 1000,
    });

    expect(result).toEqual({ score: 95 });
    expect(callCount).toBe(1);
  });

  it("polls until success with progress updates", async () => {
    let callCount = 0;
    const progressLog: string[] = [];

    const mockPoll = async (): Promise<TaskPollResult<{ statusOk: boolean }>> => {
      callCount++;
      if (callCount < 3) {
        return {
          status: "processing",
          isComplete: false,
        };
      }
      return {
        status: "success",
        isComplete: true,
        data: { statusOk: true },
      };
    };

    const result = await executeBoundedPoll("tsk_02", mockPoll, {
      intervalMs: 10,
      timeoutMs: 1000,
      onProgress: (status) => {
        progressLog.push(status);
      },
    });

    expect(result).toEqual({ statusOk: true });
    expect(callCount).toBe(3);
    expect(progressLog).toEqual(["processing", "processing", "success"]);
  });

  it("throws PROVIDER_TASK_FAILED when provider returns error status", async () => {
    const mockPoll = async (): Promise<TaskPollResult<unknown>> => {
      return {
        status: "error",
        isComplete: true,
        error: {
          code: "FACE_NOT_DETECTED",
          message: "No human face found in image.",
        },
      };
    };

    await expect(
      executeBoundedPoll("tsk_03", mockPoll, {
        intervalMs: 10,
        timeoutMs: 1000,
      })
    ).rejects.toThrowError(YouCamError);

    try {
      await executeBoundedPoll("tsk_03", mockPoll, {
        intervalMs: 10,
        timeoutMs: 1000,
      });
    } catch (err) {
      expect((err as YouCamError).code).toBe("PROVIDER_TASK_FAILED");
      expect((err as YouCamError).providerErrorCode).toBe("FACE_NOT_DETECTED");
      expect((err as YouCamError).isRetryable).toBe(false);
    }
  });

  it("throws PROVIDER_TIMEOUT when polling exceeds timeout duration", async () => {
    const mockPoll = async (): Promise<TaskPollResult<unknown>> => {
      return {
        status: "processing",
        isComplete: false,
      };
    };

    await expect(
      executeBoundedPoll("tsk_04", mockPoll, {
        intervalMs: 20,
        timeoutMs: 50,
      })
    ).rejects.toThrowError(YouCamError);

    try {
      await executeBoundedPoll("tsk_04", mockPoll, {
        intervalMs: 20,
        timeoutMs: 50,
      });
    } catch (err) {
      expect((err as YouCamError).code).toBe("PROVIDER_TIMEOUT");
      expect((err as YouCamError).isRetryable).toBe(false);
    }
  });

  it("aborts cleanly when AbortSignal is triggered", async () => {
    const controller = new AbortController();

    const mockPoll = async (): Promise<TaskPollResult<unknown>> => {
      controller.abort();
      return {
        status: "processing",
        isComplete: false,
      };
    };

    await expect(
      executeBoundedPoll("tsk_05", mockPoll, {
        intervalMs: 10,
        timeoutMs: 1000,
        signal: controller.signal,
      })
    ).rejects.toThrowError(YouCamError);

    try {
      await executeBoundedPoll("tsk_05", mockPoll, {
        intervalMs: 10,
        timeoutMs: 1000,
        signal: controller.signal,
      });
    } catch (err) {
      expect((err as YouCamError).code).toBe("ABORTED");
    }
  });
});
