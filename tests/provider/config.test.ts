/**
 * @file tests/provider/config.test.ts
 * @description Unit tests for YouCam configuration loading and secret safety.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadYouCamConfig, sanitizeConfig } from "../../packages/youcam/config";
import { YouCamError } from "../../packages/youcam/errors";

describe("YouCam Configuration Loader", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("fails closed when YOUCAM_API_KEY is missing", () => {
    delete process.env.YOUCAM_API_KEY;
    expect(() => loadYouCamConfig({ apiKey: "" })).toThrowError(YouCamError);
    try {
      loadYouCamConfig({ apiKey: "" });
    } catch (err) {
      expect(err).toBeInstanceOf(YouCamError);
      expect((err as YouCamError).code).toBe("CONFIGURATION_ERROR");
      expect((err as YouCamError).isRetryable).toBe(false);
    }
  });

  it("fails when baseUrl is malformed", () => {
    expect(() =>
      loadYouCamConfig({
        apiKey: "test_key",
        baseUrl: "not_a_valid_url",
      })
    ).toThrowError(YouCamError);
  });

  it("successfully parses valid configuration with defaults", () => {
    const config = loadYouCamConfig({
      apiKey: "valid_secret_key_12345",
    });

    expect(config.apiKey).toBe("valid_secret_key_12345");
    expect(config.baseUrl).toBe("https://yce-api-01.makeupar.com");
    expect(config.pollIntervalMs).toBe(1500);
    expect(config.pollTimeoutMs).toBe(30000);
    expect(config.maxRetries).toBe(3);
  });

  it("sanitizes configuration and NEVER exposes the secret key in diagnostics", () => {
    const config = loadYouCamConfig({
      apiKey: "super_secret_token_do_not_leak",
      baseUrl: "https://api.perfectcorp.com",
    });

    const sanitized = sanitizeConfig(config);
    expect(sanitized.apiKeyConfigured).toBe(true);
    expect((sanitized as Record<string, unknown>).apiKey).toBeUndefined();
    expect(JSON.stringify(sanitized)).not.toContain("super_secret_token_do_not_leak");
  });
});
