/**
 * @file packages/youcam/config.ts
 * @description Secure server-only configuration loader for YouCam API.
 */

import { z } from "zod";
import { YouCamError } from "./errors";

export const YouCamConfigSchema = z.object({
  apiKey: z.string().min(1, "YOUCAM_API_KEY is required for live provider execution"),
  baseUrl: z.string().url("YOUCAM_BASE_URL must be a valid URL").default("https://yce-api-01.makeupar.com"),
  pollIntervalMs: z.coerce.number().int().min(100).max(10000).default(1500),
  pollTimeoutMs: z.coerce.number().int().min(1000).max(120000).default(30000),
  maxRetries: z.coerce.number().int().min(0).max(10).default(3),
});

export type YouCamConfig = z.infer<typeof YouCamConfigSchema>;

export interface OptionalYouCamConfig {
  apiKey?: string;
  baseUrl?: string;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
  maxRetries?: number;
}

export function loadYouCamConfig(overrides?: OptionalYouCamConfig): YouCamConfig {
  if (!process.env.YOUCAM_API_KEY && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      try {
        process.loadEnvFile(".env");
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }

  const rawConfig = {
    apiKey: overrides?.apiKey ?? process.env.YOUCAM_API_KEY ?? "",
    baseUrl: overrides?.baseUrl ?? process.env.YOUCAM_BASE_URL ?? "https://api.perfectcorp.com",
    pollIntervalMs: overrides?.pollIntervalMs ?? process.env.YOUCAM_POLL_INTERVAL_MS ?? 1500,
    pollTimeoutMs: overrides?.pollTimeoutMs ?? process.env.YOUCAM_POLL_TIMEOUT_MS ?? 30000,
    maxRetries: overrides?.maxRetries ?? process.env.YOUCAM_MAX_RETRIES ?? 3,
  };

  const parseResult = YouCamConfigSchema.safeParse(rawConfig);

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((issue) => issue.message).join("; ");
    throw new YouCamError({
      code: "CONFIGURATION_ERROR",
      message: `Invalid YouCam configuration: ${errorDetails}`,
      isRetryable: false,
    });
  }

  return parseResult.data;
}

/**
 * Safely inspects configuration without leaking secret credentials.
 */
export function sanitizeConfig(config: YouCamConfig): Record<string, unknown> {
  return {
    apiKeyConfigured: Boolean(config.apiKey && config.apiKey.trim().length > 0),
    baseUrl: config.baseUrl,
    pollIntervalMs: config.pollIntervalMs,
    pollTimeoutMs: config.pollTimeoutMs,
    maxRetries: config.maxRetries,
  };
}
