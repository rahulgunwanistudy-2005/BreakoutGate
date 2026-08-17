/**
 * @file packages/youcam/upload.ts
 * @description Secure server-side image upload and validation handler for YouCam API.
 */

import { YouCamConfig } from "./config";
import { YouCamError } from "./errors";
import { TraceBuilder, ProviderTrace } from "./trace";
import { ImageInput, FileUploadResult } from "./types";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
export const MIN_IMAGE_SIZE_BYTES = 1024; // 1 KB min sanity check

/**
 * Validates image buffer integrity, size limits, and magic byte signatures.
 */
export function validateImageBuffer(
  buffer: Uint8Array | Buffer,
  mimeType: string
): { isValid: boolean; normalizedMime: "image/jpeg" | "image/png" | "image/webp" } {
  if (!buffer || buffer.length === 0) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: "Uploaded image buffer is empty.",
      isRetryable: false,
    });
  }

  if (buffer.length < MIN_IMAGE_SIZE_BYTES) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: `Image is too small (${buffer.length} bytes). Minimum size is ${MIN_IMAGE_SIZE_BYTES} bytes.`,
      isRetryable: false,
    });
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: `Image exceeds maximum allowed size of 10MB (${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
      isRetryable: false,
    });
  }

  const normalized = mimeType.toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(normalized as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: `Unsupported MIME type: "${mimeType}". Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}.`,
      isRetryable: false,
    });
  }

  // Magic byte verification
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    isRiff &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (normalized === "image/jpeg" && !isJpeg) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: "Declared image/jpeg payload does not have valid JPEG header signatures.",
      isRetryable: false,
    });
  }

  if (normalized === "image/png" && !isPng) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: "Declared image/png payload does not have valid PNG header signatures.",
      isRetryable: false,
    });
  }

  if (normalized === "image/webp" && !isWebp) {
    throw new YouCamError({
      code: "INVALID_IMAGE",
      message: "Declared image/webp payload does not have valid WebP header signatures.",
      isRetryable: false,
    });
  }

  return {
    isValid: true,
    normalizedMime: normalized as "image/jpeg" | "image/png" | "image/webp",
  };
}

/**
 * Uploads an image to Perfect Corp File API and returns the file_id.
 */
export async function uploadImageToYouCam(
  config: YouCamConfig,
  input: ImageInput,
  signal?: AbortSignal
): Promise<{ result: FileUploadResult; trace: ProviderTrace }> {
  const traceBuilder = new TraceBuilder("upload");

  try {
    if ("imageUrl" in input) {
      // URL based input
      if (!input.imageUrl || !input.imageUrl.startsWith("http")) {
        throw new YouCamError({
          code: "INVALID_REQUEST",
          message: "Invalid image URL provided.",
        });
      }

      // Return synthetic reference or pass-through for provider that accepts image URL
      const fileId = `url_${Buffer.from(input.imageUrl).toString("base64url").slice(0, 32)}`;
      traceBuilder.setTaskId(fileId);
      traceBuilder.setTaskStatus("success");
      traceBuilder.setHttpStatus(200);

      return {
        result: {
          fileId,
          uploadUrl: input.imageUrl,
          mimeType: "image/jpeg",
          sizeBytes: 0,
        },
        trace: traceBuilder.finish(),
      };
    }

    // Buffer based upload
    const { normalizedMime } = validateImageBuffer(input.buffer, input.mimeType);

    const fileName = input.fileName ?? `selfie_${Date.now()}.${normalizedMime.split("/")[1]}`;

    const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/s2s/v2.0/file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [
          {
            content_type: normalizedMime,
            file_name: fileName,
            file_size: input.buffer.length,
          },
        ],
      }),
      signal,
    });

    traceBuilder.setHttpStatus(response.status);

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      const error = YouCamError.fromHttpResponse(response.status, body);
      traceBuilder.setError(error.code);
      throw error;
    }

    interface RawFileRequest {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    }

    interface RawFileResult {
      file_id?: string;
      requests?: RawFileRequest | RawFileRequest[];
    }

    const data = (await response.json()) as {
      status?: number;
      data?: {
        files?: RawFileResult[];
      };
      result?: {
        files?: RawFileResult[];
        file_id?: string;
        requests?: RawFileRequest | RawFileRequest[];
      };
      files?: RawFileResult[];
      file_id?: string;
    };

    const firstFile = data.data?.files?.[0] ?? data.result?.files?.[0] ?? data.files?.[0];
    const fileId = firstFile?.file_id ?? data.result?.file_id ?? data.file_id;
    if (!fileId) {
      throw new YouCamError({
        code: "PROVIDER_SCHEMA_ERROR",
        message: "YouCam File API response missing file_id.",
        isRetryable: false,
      });
    }

    traceBuilder.setTaskId(fileId);

    // If pre-signed PUT upload URL is returned, upload the binary buffer
    const rawReq = firstFile?.requests ?? data.result?.requests;
    const uploadRequest: RawFileRequest | undefined = Array.isArray(rawReq) ? rawReq[0] : rawReq;
    if (uploadRequest?.url) {
      const putResponse = await fetch(uploadRequest.url, {
        method: uploadRequest.method ?? "PUT",
        headers: {
          "Content-Type": normalizedMime,
          ...(uploadRequest.headers ?? {}),
        },
        body: new Blob([new Uint8Array(input.buffer)], { type: normalizedMime }),
        signal,
      });

      if (!putResponse.ok) {
        throw new YouCamError({
          code: "PROVIDER_UNAVAILABLE",
          message: `Failed to upload binary image to pre-signed target (HTTP ${putResponse.status}).`,
          statusCode: putResponse.status,
          providerTaskId: fileId,
        });
      }
    }

    traceBuilder.setTaskStatus("success");

    return {
      result: {
        fileId,
        uploadUrl: uploadRequest?.url,
        mimeType: normalizedMime,
        sizeBytes: input.buffer.length,
      },
      trace: traceBuilder.finish(),
    };
  } catch (err: unknown) {
    if (err instanceof YouCamError) {
      traceBuilder.setError(err.code);
      throw err;
    }

    if (err instanceof Error && err.name === "AbortError") {
      const abortErr = new YouCamError({
        code: "ABORTED",
        message: "Image upload operation was aborted.",
        cause: err,
      });
      traceBuilder.setError(abortErr.code);
      throw abortErr;
    }

    const unknownErr = new YouCamError({
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error during YouCam image upload.",
      cause: err,
    });
    traceBuilder.setError(unknownErr.code);
    throw unknownErr;
  }
}
