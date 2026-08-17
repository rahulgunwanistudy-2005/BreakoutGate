/**
 * @file tests/provider/errors.test.ts
 * @description Tests for YouCam provider error domain and retry classification.
 */

import { describe, it, expect } from "vitest";
import { YouCamError } from "../../packages/youcam/errors";

describe("YouCam Error Domain & Normalization", () => {
  it("translates 401 Unauthorized to non-retryable AUTHENTICATION_ERROR", () => {
    const err = YouCamError.fromHttpResponse(401, { error: "Invalid token" });
    expect(err.code).toBe("AUTHENTICATION_ERROR");
    expect(err.statusCode).toBe(401);
    expect(err.isRetryable).toBe(false);
  });

  it("translates 403 Forbidden/Quota to non-retryable AUTHORIZATION_ERROR", () => {
    const err = YouCamError.fromHttpResponse(403, { error: "Quota exceeded" });
    expect(err.code).toBe("AUTHORIZATION_ERROR");
    expect(err.statusCode).toBe(403);
    expect(err.isRetryable).toBe(false);
  });

  it("translates 400 with image error to non-retryable INVALID_IMAGE", () => {
    const err = YouCamError.fromHttpResponse(400, { error_code: "INVALID_IMAGE", message: "Corrupted file" });
    expect(err.code).toBe("INVALID_IMAGE");
    expect(err.providerErrorCode).toBe("INVALID_IMAGE");
    expect(err.isRetryable).toBe(false);
  });

  it("translates 400 with invalid parameter to non-retryable INVALID_REQUEST", () => {
    const err = YouCamError.fromHttpResponse(400, { error: "Missing required parameter: dst_actions" });
    expect(err.code).toBe("INVALID_REQUEST");
    expect(err.isRetryable).toBe(false);
  });

  it("translates 429 Rate Limit to retryable RATE_LIMITED", () => {
    const err = YouCamError.fromHttpResponse(429, { error: "Too Many Requests" });
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.isRetryable).toBe(true);
  });

  it("translates 500/503 Provider Server Error to retryable PROVIDER_UNAVAILABLE", () => {
    const err500 = YouCamError.fromHttpResponse(500, { error: "Internal Server Error" });
    expect(err500.code).toBe("PROVIDER_UNAVAILABLE");
    expect(err500.isRetryable).toBe(true);

    const err503 = YouCamError.fromHttpResponse(503, { error: "Service Unavailable" });
    expect(err503.code).toBe("PROVIDER_UNAVAILABLE");
    expect(err503.isRetryable).toBe(true);
  });

  it("correctly classifies timeout as non-retryable to prevent blind task restarts", () => {
    const timeoutErr = new YouCamError({
      code: "PROVIDER_TIMEOUT",
      message: "Task timed out",
      providerTaskId: "tsk_123",
    });
    expect(timeoutErr.isRetryable).toBe(false);
  });

  it("serializes safely to JSON with task details and status code", () => {
    const err = new YouCamError({
      code: "PROVIDER_TASK_FAILED",
      message: "Face could not be aligned",
      statusCode: 200,
      providerErrorCode: "FACE_NOT_FOUND",
      providerTaskId: "tsk_face_fail",
    });

    const json = err.toJSON();
    expect(json.name).toBe("YouCamError");
    expect(json.code).toBe("PROVIDER_TASK_FAILED");
    expect(json.providerErrorCode).toBe("FACE_NOT_FOUND");
    expect(json.providerTaskId).toBe("tsk_face_fail");
  });
});
