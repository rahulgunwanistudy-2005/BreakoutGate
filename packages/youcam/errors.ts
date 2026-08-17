/**
 * @file packages/youcam/errors.ts
 * @description Normalized provider error domain for Perfect Corp / YouCam integrations.
 */

export type YouCamErrorCode =
  | "CONFIGURATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "INVALID_REQUEST"
  | "INVALID_IMAGE"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_TASK_FAILED"
  | "PROVIDER_SCHEMA_ERROR"
  | "NETWORK_ERROR"
  | "ABORTED"
  | "UNKNOWN_PROVIDER_ERROR";

export interface YouCamErrorOptions {
  code: YouCamErrorCode;
  message: string;
  statusCode?: number;
  providerErrorCode?: string;
  providerTaskId?: string;
  isRetryable?: boolean;
  cause?: unknown;
}

export class YouCamError extends Error {
  public readonly code: YouCamErrorCode;
  public readonly statusCode?: number;
  public readonly providerErrorCode?: string;
  public readonly providerTaskId?: string;
  public readonly isRetryable: boolean;

  constructor(options: YouCamErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "YouCamError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.providerErrorCode = options.providerErrorCode;
    this.providerTaskId = options.providerTaskId;
    this.isRetryable = options.isRetryable ?? YouCamError.classifyRetryable(options.code, options.statusCode);
  }

  /**
   * Deterministic retry classification.
   * Authentication and invalid input errors are strictly non-retryable.
   * Transient network, 429 rate limit, or 5xx provider errors may be retryable.
   */
  public static classifyRetryable(code: YouCamErrorCode, statusCode?: number): boolean {
    switch (code) {
      case "AUTHENTICATION_ERROR":
      case "AUTHORIZATION_ERROR":
      case "INVALID_REQUEST":
      case "INVALID_IMAGE":
      case "CONFIGURATION_ERROR":
      case "ABORTED":
      case "PROVIDER_TASK_FAILED":
      case "PROVIDER_SCHEMA_ERROR":
        return false;

      case "RATE_LIMITED":
      case "PROVIDER_UNAVAILABLE":
      case "NETWORK_ERROR":
        return true;

      case "PROVIDER_TIMEOUT":
        return false; // Polling timeouts should not be blindly restarted

      case "UNKNOWN_PROVIDER_ERROR":
        return statusCode !== undefined && statusCode >= 500 && statusCode < 600;

      default:
        return false;
    }
  }

  /**
   * Translates HTTP response status and body to a normalized YouCamError.
   */
  public static fromHttpResponse(
    statusCode: number,
    responseBody?: unknown,
    taskId?: string
  ): YouCamError {
    let message = `YouCam API request failed with HTTP ${statusCode}`;
    let providerErrorCode: string | undefined;

    if (responseBody && typeof responseBody === "object") {
      const body = responseBody as Record<string, unknown>;
      if (typeof body.error === "string") {
        message = body.error;
      } else if (typeof body.message === "string") {
        message = body.message;
      } else if (body.error && typeof body.error === "object") {
        const nestedErr = body.error as Record<string, unknown>;
        if (typeof nestedErr.message === "string") message = nestedErr.message;
        if (typeof nestedErr.code === "string") providerErrorCode = nestedErr.code;
      }
      if (typeof body.error_code === "string") {
        providerErrorCode = body.error_code;
      }
    }

    let code: YouCamErrorCode = "UNKNOWN_PROVIDER_ERROR";

    if (statusCode === 401) {
      code = "AUTHENTICATION_ERROR";
      message = "Invalid or missing YouCam API key.";
    } else if (statusCode === 403) {
      code = "AUTHORIZATION_ERROR";
      message = "YouCam API access forbidden or API quota exhausted.";
    } else if (statusCode === 400) {
      if (providerErrorCode === "INVALID_IMAGE" || message.toLowerCase().includes("image")) {
        code = "INVALID_IMAGE";
      } else {
        code = "INVALID_REQUEST";
      }
    } else if (statusCode === 429) {
      code = "RATE_LIMITED";
      message = "YouCam API rate limit exceeded. Retry with backoff.";
    } else if (statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504) {
      code = "PROVIDER_UNAVAILABLE";
      message = `YouCam provider unavailable (HTTP ${statusCode}).`;
    }

    return new YouCamError({
      code,
      message,
      statusCode,
      providerErrorCode,
      providerTaskId: taskId,
    });
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      providerErrorCode: this.providerErrorCode,
      providerTaskId: this.providerTaskId,
      isRetryable: this.isRetryable,
    };
  }
}

/**
 * Normalizes an arbitrary error into a standard provider error payload.
 */
export function normalizeProviderError(err: unknown): { code: string; message: string; retryable: boolean } {
  if (err instanceof YouCamError) {
    return {
      code: err.code,
      message: err.message,
      retryable: err.isRetryable,
    };
  }
  if (err instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: err.message,
      retryable: false,
    };
  }
  return {
    code: "UNKNOWN_ERROR",
    message: String(err),
    retryable: false,
  };
}

