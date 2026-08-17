/**
 * @file packages/youcam/trace.ts
 * @description Safe provider trace structure for auditable execution without leaking secrets or biometrics.
 */

import { randomUUID } from "node:crypto";
import { YouCamErrorCode } from "./errors";

export type ProviderOperationType =
  | "upload"
  | "skin_analysis_create"
  | "skin_analysis_poll"
  | "makeup_vto_create"
  | "makeup_vto_poll";

export type ExecutionMode = "live" | "replay" | "test";

export interface ProviderTrace {
  traceId: string;
  provider: "youcam";
  operation: ProviderOperationType;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  httpStatus?: number;
  taskId?: string;
  taskStatus?: string;
  errorClass?: YouCamErrorCode;
  retryCount: number;
  mode: ExecutionMode;
}

export class TraceBuilder {
  private readonly traceId: string;
  private readonly operation: ProviderOperationType;
  private readonly mode: ExecutionMode;
  private readonly startTime: number;
  private readonly startedAtIso: string;
  private httpStatus?: number;
  private taskId?: string;
  private taskStatus?: string;
  private errorClass?: YouCamErrorCode;
  private retryCount = 0;

  constructor(operation: ProviderOperationType, mode: ExecutionMode = "live") {
    this.traceId = `tr_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
    this.operation = operation;
    this.mode = mode;
    this.startTime = Date.now();
    this.startedAtIso = new Date(this.startTime).toISOString();
  }

  public setHttpStatus(status: number): this {
    this.httpStatus = status;
    return this;
  }

  public setTaskId(taskId?: string): this {
    if (taskId) this.taskId = taskId;
    return this;
  }

  public setTaskStatus(status?: string): this {
    if (status) this.taskStatus = status;
    return this;
  }

  public setError(errorClass: YouCamErrorCode): this {
    this.errorClass = errorClass;
    return this;
  }

  public setRetryCount(retries: number): this {
    this.retryCount = retries;
    return this;
  }

  public finish(): ProviderTrace {
    const endTime = Date.now();
    return {
      traceId: this.traceId,
      provider: "youcam",
      operation: this.operation,
      startedAt: this.startedAtIso,
      completedAt: new Date(endTime).toISOString(),
      durationMs: endTime - this.startTime,
      httpStatus: this.httpStatus,
      taskId: this.taskId,
      taskStatus: this.taskStatus,
      errorClass: this.errorClass,
      retryCount: this.retryCount,
      mode: this.mode,
    };
  }
}
