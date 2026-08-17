/**
 * @file scripts/youcam/smoke-skin-analysis.ts
 * @description Real end-to-end Skin Analysis provider verification script with canonical normalization.
 *
 * Sequence:
 * Real Image -> Real Upload -> Real Task Creation -> Real Polling -> Real Zip Extraction -> Real Normalization -> Canonical SkinState
 */

import fs from "fs";
import path from "path";
import { normalizeSkinAnalysisResponse, YouCamClient, YouCamError } from "../../packages/youcam";
import { SkinStateSchema } from "../../packages/contracts";

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

  if (!process.env.YOUCAM_API_KEY) {
    console.error("[FAIL] YOUCAM_API_KEY missing. Status: BLOCKED - credentials unavailable");
    process.exit(1);
  }

  const assetPath = path.join(process.cwd(), "scripts/assets/demo-face.jpg");
  if (!fs.existsSync(assetPath)) {
    console.error(`[FAIL] Test image not found at ${assetPath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(assetPath);
  console.log("==================================================");
  console.log("BreakoutGate — Real Skin Analysis Live Gate Test");
  console.log("==================================================");

  const client = new YouCamClient();

  // 1. Upload
  console.log("\n[1/4] Uploading real demo face image to Perfect Corp...");
  const uploadRes = await client.uploadImage({
    buffer: imageBuffer,
    mimeType: "image/jpeg",
    fileName: "demo_face.jpg",
  });
  console.log(`[OK] Image uploaded successfully. File ID: ${uploadRes.result.fileId} (${uploadRes.result.sizeBytes} bytes)`);

  // 2. Initiate Skin Analysis Task & Poll
  console.log("\n[2/4] Initiating real Skin Analysis task & bounded polling...");
  const skinRes = await client.runSkinAnalysis(
    {
      fileId: uploadRes.result.fileId,
      actions: ["wrinkles", "acne", "pores", "texture", "firmness", "moisture", "oiliness", "radiance", "redness", "dark_circles", "spots"],
    },
    {
      onProgress: (status, attempt, elapsedMs) => {
        console.log(`[POLL] Status: ${status} (Attempt ${attempt}, ${elapsedMs}ms)`);
      },
    }
  );

  console.log(`[OK] Task completed successfully. Task ID: ${skinRes.result.taskId}`);
  console.log(`[INFO] Polling completed in ${skinRes.result.durationMs ?? 0}ms.`);

  // 3. Normalization
  console.log("\n[3/4] Passing raw provider output to normalization boundary...");
  const rawPayload = {
    status: 200,
    result: {
      task_status: "success",
      task_id: skinRes.result.taskId,
      output: skinRes.result.rawOutput,
    },
  };

  const canonicalSkinState = normalizeSkinAnalysisResponse(rawPayload, {
    taskId: skinRes.result.taskId,
    capturedAt: new Date().toISOString(),
  });

  console.log("[OK] Normalization complete.");

  // 4. Validate against Canonical Contract
  console.log("\n[4/4] Validating normalized object against Canonical SkinStateSchema...");
  const validatedSkinState = SkinStateSchema.parse(canonicalSkinState);
  console.log("[OK] Canonical validation passed 100%.");

  console.log("\n==================================================");
  console.log("CANONICAL SKINSTATE SIGNALS (REAL PROVIDER MEASUREMENTS)");
  console.log("==================================================");
  for (const [name, signal] of Object.entries(validatedSkinState.signals)) {
    console.log(
      `  - ${name.padEnd(14)}: state=${signal.state.padEnd(8)} normalizedValue=${String(signal.value).padEnd(6)} (rawScore=${signal.rawScore ?? "N/A"})`
    );
  }
  console.log(`  - overallQuality: ${validatedSkinState.overallQuality?.value ?? "N/A"}`);
  console.log(`  - provenance    : ${validatedSkinState.provenance.sourceType} (${validatedSkinState.provenance.retrievedAt})`);
  console.log("==================================================");
  console.log("LIVE PROVIDER STATUS: LIVE VERIFIED");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("[FAIL]", err instanceof YouCamError ? err.toJSON() : err);
  process.exit(1);
});
