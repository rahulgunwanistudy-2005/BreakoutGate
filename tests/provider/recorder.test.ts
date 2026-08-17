/**
 * @file tests/provider/recorder.test.ts
 * @description Tests for live fixture recorder infrastructure.
 */

import { describe, it, expect, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { saveLiveFixture } from "../../packages/youcam/recorder";
import { TraceBuilder } from "../../packages/youcam/trace";

describe("Live Fixture Recorder Infrastructure", () => {
  const testOutputDir = path.resolve(__dirname, "../../tmp/test-fixtures");

  afterEach(async () => {
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it("saves a sanitized live fixture envelope with full metadata", async () => {
    const trace = new TraceBuilder("skin_analysis_poll", "live")
      .setTaskId("tsk_skin_live_test")
      .setHttpStatus(200)
      .setTaskStatus("success")
      .finish();

    const fixturePath = await saveLiveFixture(testOutputDir, {
      provider: "youcam",
      operation: "skin-analysis",
      sourceMode: "live",
      providerVersion: "v2.0",
      taskId: "tsk_skin_live_test",
      rawProviderResponse: {
        task_status: "success",
        skin_analysis: {
          acne: { score: 70 },
          redness: { score: 65 },
        },
      },
      trace,
    });

    expect(fixturePath).toContain(testOutputDir);
    const content = await fs.readFile(fixturePath, "utf-8");
    const parsed = JSON.parse(content);

    expect(parsed.fixtureId).toMatch(/^fix_skin-analysis_\d+$/);
    expect(parsed.sourceMode).toBe("live");
    expect(parsed.providerVersion).toBe("v2.0");
    expect(parsed.sanitizationStatus).toBe("sanitized");
    expect(parsed.taskId).toBe("tsk_skin_live_test");
    expect(parsed.rawProviderResponse.skin_analysis.acne.score).toBe(70);
    expect(parsed.trace.operation).toBe("skin_analysis_poll");
  });
});
