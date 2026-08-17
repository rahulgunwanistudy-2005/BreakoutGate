/**
 * @file packages/youcam/recorder.ts
 * @description Fixture recording infrastructure for saving sanitized live provider responses.
 *
 * CRITICAL RULE:
 * Fixtures may only be saved from actual successful Perfect Corp live executions.
 * Never fabricate or synthesize provider fixtures.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { ProviderTrace } from "./trace";

export interface LiveFixtureEnvelope<T = unknown> {
  fixtureId: string;
  recordedAt: string;
  provider: "youcam";
  operation: "skin-analysis" | "makeup-vto";
  sourceMode: "live";
  providerVersion: "v2.0";
  sanitizationStatus: "sanitized";
  taskId: string;
  rawProviderResponse: T;
  trace: ProviderTrace;
}

/**
 * Saves a live provider fixture with full provenance metadata.
 */
export async function saveLiveFixture<T>(
  targetDir: string,
  fixtureData: Omit<LiveFixtureEnvelope<T>, "fixtureId" | "recordedAt" | "sanitizationStatus">
): Promise<string> {
  await fs.mkdir(targetDir, { recursive: true });

  const fixtureId = `fix_${fixtureData.operation}_${Date.now()}`;
  const envelope: LiveFixtureEnvelope<T> = {
    fixtureId,
    recordedAt: new Date().toISOString(),
    sanitizationStatus: "sanitized",
    ...fixtureData,
  };

  const filePath = path.join(targetDir, `${fixtureId}.json`);
  await fs.writeFile(filePath, JSON.stringify(envelope, null, 2), "utf-8");

  return filePath;
}
