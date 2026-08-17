/**
 * @file scripts/youcam/smoke-makeup-vto.ts
 * @description Standalone smoke script for YouCam Makeup VTO task creation and polling.
 */

import { YouCamClient, YouCamError } from "../../packages/youcam";

async function main() {
  if (!process.env.YOUCAM_API_KEY) {
    console.error("[FAIL] YOUCAM_API_KEY missing. Status: BLOCKED - credentials unavailable");
    process.exit(1);
  }

  const fileId = process.argv[2];
  if (!fileId) {
    console.error("[USAGE] npx tsx scripts/youcam/smoke-makeup-vto.ts <FILE_ID>");
    process.exit(1);
  }

  const client = new YouCamClient();
  const res = await client.runMakeupVto(
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
        console.log(`[POLL] Status: ${status} (Attempt ${attempt}, ${elapsedMs}ms)`);
      },
    }
  );

  console.log(`[SUCCESS] VTO Task ID: ${res.result.taskId}`);
  console.log(`[ARTIFACT URL] ${res.result.artifactUrl}`);
}

main().catch((err) => {
  console.error("[FAIL]", err instanceof YouCamError ? err.toJSON() : err);
  process.exit(1);
});
