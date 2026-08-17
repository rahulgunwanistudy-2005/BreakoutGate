/**
 * @file packages/orchestration/pipeline.ts
 * @description End-to-end Backend Orchestration Pipeline connecting provider analysis, evidence resolution, pure decision engine, supplemental VTO, and cryptographic receipts.
 *
 * CRITICAL INVARIANTS:
 * 1. ZERO LLM authority in decision or ranking.
 * 2. VTO has ZERO decision authority (supplemental visualization only; failure never changes winner).
 * 3. LIVE mode strictly rejects synthetic/test catalog fixtures.
 */

import { Candidate, ReceiptVtoArtifactReference, SkinState } from "@contracts";
import { decide } from "@engine";
import { ProductEvidenceCatalog } from "@evidence";
import { buildDecisionReceipt } from "@receipt";
import { ProductSource } from "../evidence/types";
import { YouCamClient } from "../youcam/client";
import { normalizeSkinAnalysisResponse } from "../youcam/normalize/skin-analysis-normalizer";
import { normalizeProviderError } from "../youcam/errors";
import { DecisionRequest, DecisionRequestSchema, DecisionResponse } from "./types";

export interface PipelineOptions {
  providerClient?: YouCamClient;
  fixtureAdapter?: ProductSource;
}

/**
 * Executes the complete BreakoutGate decision orchestration pipeline.
 */
export async function executeDecisionPipeline(
  rawRequest: DecisionRequest,
  options: PipelineOptions = {}
): Promise<DecisionResponse> {
  const startTime = Date.now();

  try {
    // 1. Runtime Request Validation
    const request = DecisionRequestSchema.parse(rawRequest);

    let skinState: SkinState;
    const providerTraceReferences = [];
    let uploadedFileId: string | undefined;

    // 2. Resolve SkinState
    if (request.mode === "live") {
      // Must use live provider
      const client = options.providerClient ?? new YouCamClient();
      let imageBytes: Uint8Array;

      if (request.imageBuffer) {
        imageBytes = request.imageBuffer;
      } else if (request.imageBase64) {
        imageBytes = Buffer.from(request.imageBase64, "base64");
      } else {
        return {
          success: false,
          mode: request.mode,
          error: {
            code: "MISSING_IMAGE",
            message: "LIVE mode requires an image payload for skin analysis.",
          },
        };
      }

      // Step 2a: Upload image
      const uploadRes = await client.uploadImage({
        buffer: imageBytes,
        mimeType: "image/jpeg",
      });
      uploadedFileId = uploadRes.result.fileId;
      providerTraceReferences.push({
        traceId: uploadRes.trace.traceId,
        operation: "upload_image",
        durationMs: uploadRes.trace.durationMs,
      });

      // Step 2b & 2c: Run skin analysis with polling
      const runRes = await client.runSkinAnalysis({
        fileId: uploadedFileId,
      });

      for (const t of runRes.traces) {
        providerTraceReferences.push({
          traceId: t.traceId,
          operation: t.operation,
          durationMs: t.durationMs,
          taskId: t.taskId,
        });
      }

      // Step 2d: Normalize provider output to canonical SkinState
      skinState = normalizeSkinAnalysisResponse(runRes.result.rawOutput, {
        taskId: runRes.result.taskId,
      });
    } else {
      // TEST / DEMO mode
      if (request.testSkinState) {
        skinState = request.testSkinState;
      } else {
        return {
          success: false,
          mode: request.mode,
          error: {
            code: "MISSING_TEST_SKIN_STATE",
            message: "TEST/DEMO mode requires testSkinState or valid test fixture injection.",
          },
        };
      }
    }

    // 3. Resolve Product Evidence & Build Candidates
    let candidates: Candidate[];
    if (request.catalogOverride && request.mode !== "live") {
      candidates = request.catalogOverride;
    } else {
      const catalogService = new ProductEvidenceCatalog();
      const evidences = await catalogService.resolveCatalog({
        mode: request.mode,
        adapter: options.fixtureAdapter,
      });
      candidates = catalogService.buildCandidates(evidences);
    }

    // 4. Pure Deterministic Decision Execution (ZERO LLM AUTHORITY)
    const decisionExecution = decide({
      skinState,
      userConstraints: request.userConstraints,
      candidates,
      options: {
        minEvidenceCompleteness: request.options?.minEvidenceCompleteness,
      },
    });

    const decision = decisionExecution.result;

    // 5. Supplemental Makeup VTO for Winner (VTO NEVER INFLUENCES DECISION)
    let vtoArtifact: ReceiptVtoArtifactReference | undefined;
    const shouldRunVto = request.options?.enableVto !== false && decision.winningCandidateId !== null;

    if (shouldRunVto && decision.winningCandidateId) {
      const winnerCand = candidates.find((c) => c.candidateId === decision.winningCandidateId);
      if (winnerCand) {
        if (request.mode === "live" && uploadedFileId) {
          const client = options.providerClient ?? new YouCamClient();
          try {
            const shadeCode = winnerCand.productEvidence.shade?.code ?? "DEFAULT_SHADE";
            const colorHex = winnerCand.productEvidence.shade?.hex ?? "#D8B38A";
            const rawFinish = winnerCand.productEvidence.finish.value;
            const finish: "matte" | "dewy" | "natural" | "satin" =
              rawFinish === "matte" || rawFinish === "dewy" || rawFinish === "natural" || rawFinish === "satin"
                ? rawFinish
                : "natural";

            const vtoRun = await client.runMakeupVto({
              fileId: uploadedFileId,
              looks: [
                {
                  category: "foundation",
                  shadeCode,
                  colorHex,
                  finish,
                  intensity: 0.85,
                },
              ],
            });

            for (const t of vtoRun.traces) {
              providerTraceReferences.push({
                traceId: t.traceId,
                operation: t.operation,
                durationMs: t.durationMs,
                taskId: t.taskId,
              });
            }

            if (vtoRun.result.artifactUrl) {
              vtoArtifact = {
                taskId: vtoRun.result.taskId,
                artifactUrl: vtoRun.result.artifactUrl,
                generatedAt: new Date().toISOString(),
              };
            }
          } catch {
            // INVARIANT: VTO failure NEVER alters or invalidates the recommendation!
            vtoArtifact = undefined;
          }
        } else if ((request.mode === "test" || request.mode === "demo") && request.options?.mockVto) {
          vtoArtifact = {
            taskId: "tsk_mock_vto_01",
            artifactUrl: "https://vto.youcam.com/artifacts/mock_look_01.jpg",
            generatedAt: new Date().toISOString(),
          };
        }
      }
    }

    // 6. Construct and Hash Cryptographic Decision Receipt
    const receipt = buildDecisionReceipt({
      skinState,
      userConstraints: request.userConstraints,
      candidates,
      result: decision,
      mode: request.mode === "live" ? "live" : "test",
      providerTraceReferences,
      vtoArtifact,
    });

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      mode: request.mode,
      decision,
      receipt,
      traceSummary: {
        decisionId: decision.decisionId,
        durationMs,
        candidateCount: candidates.length,
        eligibleCount: decision.candidateDecisions.filter((d) => d.eligibility === "eligible").length,
        winnerId: decision.winningCandidateId,
      },
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const normalized = normalizeProviderError(err);

    return {
      success: false,
      mode: rawRequest.mode ?? "live",
      traceSummary: {
        decisionId: "dec_failed",
        durationMs,
        candidateCount: 0,
        eligibleCount: 0,
        winnerId: null,
      },
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.retryable ? { retryable: true } : undefined,
      },
    };
  }
}
