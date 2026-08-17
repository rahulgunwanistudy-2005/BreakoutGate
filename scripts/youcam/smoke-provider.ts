/**
 * @file scripts/youcam/smoke-provider.ts
 * @description Comprehensive live provider smoke script for Perfect Corp / YouCam API.
 *
 * CRITICAL RULE:
 * Requires real credentials. Never mocks success.
 * Exits with non-zero code if credentials are missing or provider call fails.
 */

import fs from "fs";
import path from "path";
import { YouCamClient, YouCamError } from "../../packages/youcam";

// 1x1 valid sample JPEG header buffer for probe test fallback
const PROBE_SAMPLE_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9,
]);

const PADDED_PROBE_JPEG = Buffer.concat([
  PROBE_SAMPLE_JPEG.subarray(0, PROBE_SAMPLE_JPEG.length - 2),
  Buffer.alloc(1100, 0x00),
  PROBE_SAMPLE_JPEG.subarray(PROBE_SAMPLE_JPEG.length - 2),
]);

function getTestImageBuffer(): Buffer {
  const assetPath = path.join(process.cwd(), "scripts/assets/demo-face.jpg");
  if (fs.existsSync(assetPath)) {
    return fs.readFileSync(assetPath);
  }
  return PADDED_PROBE_JPEG;
}

async function main() {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      try {
        process.loadEnvFile(".env");
      } catch {
        // Ignore
      }
    }
  }

  console.log("==================================================");
  console.log("BreakoutGate — Live YouCam Provider Smoke Test");
  console.log("==================================================");

  const apiKey = process.env.YOUCAM_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.error("\n[FAIL] YOUCAM_API_KEY is not set in environment or .env.local.");
    console.error("Live provider smoke tests cannot proceed without valid credentials.");
    console.error("Status: BLOCKED - credentials unavailable\n");
    process.exit(1);
  }

  let client: YouCamClient;
  try {
    client = new YouCamClient();
    console.log("[INFO] Provider client initialized successfully.");
    console.log("[INFO] Config:", JSON.stringify(client.getConfigSanitized(), null, 2));
  } catch (err) {
    console.error("[FAIL] Failed to initialize YouCam client:", err);
    process.exit(1);
  }

  // Step 1: Upload Probe
  console.log("\n--- Step 1: Image Upload ---");
  let fileId: string;
  try {
    const testImage = getTestImageBuffer();
    const uploadRes = await client.uploadImage({
      buffer: testImage,
      mimeType: "image/jpeg",
      fileName: "demo_face.jpg",
    });
    fileId = uploadRes.result.fileId;
    console.log(`[SUCCESS] Image uploaded. File ID: ${fileId} (${uploadRes.result.sizeBytes} bytes)`);
    console.log("[TRACE]", JSON.stringify(uploadRes.trace, null, 2));
  } catch (err) {
    console.error("[FAIL] Image upload failed:", err instanceof YouCamError ? err.toJSON() : err);
    process.exit(1);
  }

  // Step 2: Skin Analysis Task
  console.log("\n--- Step 2: Skin Analysis Task Initiation & Polling ---");
  try {
    const skinRes = await client.runSkinAnalysis(
      {
        fileId,
        actions: ["redness", "oiliness", "texture", "acne"],
      },
      {
        onProgress: (status, attempt, elapsedMs) => {
          console.log(`[POLL] Skin Analysis Status: ${status} (Attempt ${attempt}, ${elapsedMs}ms)`);
        },
      }
    );
    console.log(`[SUCCESS] Skin Analysis Complete for Task ID: ${skinRes.result.taskId}`);
    console.log("[OUTPUT KEYS]", Object.keys(skinRes.result.rawOutput ?? {}));
    console.log("[TRACES]", JSON.stringify(skinRes.traces, null, 2));
  } catch (err) {
    console.error("[FAIL] Skin Analysis failed:", err instanceof YouCamError ? err.toJSON() : err);
    process.exit(1);
  }

  // Step 3: Makeup VTO Task
  console.log("\n--- Step 3: Makeup VTO Task Initiation & Polling ---");
  try {
    const vtoRes = await client.runMakeupVto(
      {
        fileId,
        looks: [
          {
            category: "foundation",
            shadeCode: "SAMPLE_01",
            finish: "natural",
            intensity: 0.8,
          },
        ],
      },
      {
        onProgress: (status, attempt, elapsedMs) => {
          console.log(`[POLL] Makeup VTO Status: ${status} (Attempt ${attempt}, ${elapsedMs}ms)`);
        },
      }
    );
    console.log(`[SUCCESS] Makeup VTO Complete for Task ID: ${vtoRes.result.taskId}`);
    console.log(`[ARTIFACT URL] ${vtoRes.result.artifactUrl}`);
    console.log("[TRACES]", JSON.stringify(vtoRes.traces, null, 2));
  } catch (err) {
    console.error("[FAIL] Makeup VTO failed:", err instanceof YouCamError ? err.toJSON() : err);
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("[COMPLETE] Live YouCam provider smoke test passed 100%.");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
