/**
 * @file tests/provider/trace.test.ts
 * @description Tests for provider trace generation and sanitization.
 */

import { describe, it, expect } from "vitest";
import { TraceBuilder } from "../../packages/youcam/trace";

describe("Provider Trace Builder & Sanitization", () => {
  it("creates a well-formed trace object with unique ID and timestamps", () => {
    const builder = new TraceBuilder("skin_analysis_create", "live");
    builder.setHttpStatus(200);
    builder.setTaskId("tsk_skin_99182");
    builder.setTaskStatus("pending");

    const trace = builder.finish();

    expect(trace.traceId).toMatch(/^tr_[a-f0-9]{16}$/);
    expect(trace.provider).toBe("youcam");
    expect(trace.operation).toBe("skin_analysis_create");
    expect(trace.mode).toBe("live");
    expect(trace.taskId).toBe("tsk_skin_99182");
    expect(trace.httpStatus).toBe(200);
    expect(trace.taskStatus).toBe("pending");
    expect(trace.durationMs).toBeGreaterThanOrEqual(0);
    expect(new Date(trace.startedAt).getTime()).toBeLessThanOrEqual(new Date(trace.completedAt).getTime());
  });

  it("never includes API keys, auth headers, or raw biometric payloads", () => {
    const builder = new TraceBuilder("upload", "test");
    builder.setHttpStatus(200);
    builder.setTaskId("fl_test_upload");

    const trace = builder.finish();
    const serialized = JSON.stringify(trace);
    const traceRecord = trace as unknown as Record<string, unknown>;

    expect(traceRecord.apiKey).toBeUndefined();
    expect(traceRecord.authorization).toBeUndefined();
    expect(traceRecord.buffer).toBeUndefined();
    expect(traceRecord.base64).toBeUndefined();
    expect(serialized).not.toContain("Bearer");
  });
});
