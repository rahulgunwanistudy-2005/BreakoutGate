/**
 * @file packages/youcam/types.ts
 * @description Provider-level data types and contract definitions for Perfect Corp / YouCam API.
 */

export type YouCamTaskStatus = "pending" | "processing" | "success" | "error" | "cancelled";

export type SkinActionType =
  | "spots"
  | "wrinkles"
  | "texture"
  | "dark_circles"
  | "redness"
  | "oiliness"
  | "moisture"
  | "pores"
  | "radiance"
  | "firmness"
  | "acne";

export interface ImageBufferInput {
  buffer: Uint8Array | Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileName?: string;
}

export interface ImageUrlInput {
  imageUrl: string;
}

export type ImageInput = ImageBufferInput | ImageUrlInput;

export interface FileUploadResult {
  fileId: string;
  uploadUrl?: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SkinAnalysisTaskParams {
  fileId: string;
  actions?: SkinActionType[];
  mode?: "standard" | "hdskincare";
  signal?: AbortSignal;
}

export interface SkinAnalysisTaskInitiation {
  taskId: string;
  status: "pending" | "processing";
}

export interface SkinAnalysisPollResult {
  taskId: string;
  status: YouCamTaskStatus;
  rawOutput?: Record<string, unknown>;
  error?: {
    code?: string;
    message?: string;
  };
  durationMs?: number;
}

export interface MakeupLookConfig {
  category: string;
  shadeCode?: string;
  colorHex?: string;
  intensity?: number;
  finish?: "matte" | "dewy" | "natural" | "satin";
}

export interface MakeupVtoTaskParams {
  fileId: string;
  looks: MakeupLookConfig[];
  signal?: AbortSignal;
}

export interface MakeupVtoTaskInitiation {
  taskId: string;
  status: "pending" | "processing";
}

export interface MakeupVtoPollResult {
  taskId: string;
  status: YouCamTaskStatus;
  artifactUrl?: string;
  width?: number;
  height?: number;
  rawOutput?: Record<string, unknown>;
  error?: {
    code?: string;
    message?: string;
  };
  durationMs?: number;
}

export interface PollingOptions {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  onProgress?: (status: YouCamTaskStatus, attempt: number, elapsedMs: number) => void;
}
