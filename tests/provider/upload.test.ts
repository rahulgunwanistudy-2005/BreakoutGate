/**
 * @file tests/provider/upload.test.ts
 * @description Tests for image validation and upload constraints.
 */

import { describe, it, expect } from "vitest";
import { YouCamError } from "../../packages/youcam/errors";
import { validateImageBuffer } from "../../packages/youcam/upload";

describe("YouCam Image Validation & Security Controls", () => {
  it("rejects empty image buffer", () => {
    expect(() => validateImageBuffer(Buffer.alloc(0), "image/jpeg")).toThrowError(YouCamError);
  });

  it("rejects image buffer smaller than minimum sanity size (1KB)", () => {
    const tinyBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(() => validateImageBuffer(tinyBuffer, "image/jpeg")).toThrowError(YouCamError);
  });

  it("rejects image buffer exceeding 10MB limit", () => {
    // 10MB + 1KB buffer
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1024);
    expect(() => validateImageBuffer(oversizedBuffer, "image/jpeg")).toThrowError(YouCamError);
  });

  it("rejects unsupported MIME types like image/gif, image/bmp, text/plain", () => {
    const validSizeDummy = Buffer.alloc(2048, 0x01);
    expect(() => validateImageBuffer(validSizeDummy, "image/gif")).toThrowError(YouCamError);
    expect(() => validateImageBuffer(validSizeDummy, "text/plain")).toThrowError(YouCamError);
    expect(() => validateImageBuffer(validSizeDummy, "application/pdf")).toThrowError(YouCamError);
  });

  it("rejects fake JPEG where declared MIME is image/jpeg but magic bytes are invalid", () => {
    const fakeJpeg = Buffer.alloc(2048, 0x00);
    expect(() => validateImageBuffer(fakeJpeg, "image/jpeg")).toThrowError(YouCamError);
  });

  it("accepts valid JPEG buffer with correct magic bytes and size", () => {
    const validJpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(2048, 0x55),
    ]);

    const result = validateImageBuffer(validJpeg, "image/jpeg");
    expect(result.isValid).toBe(true);
    expect(result.normalizedMime).toBe("image/jpeg");
  });

  it("accepts valid PNG buffer with correct magic bytes and size", () => {
    const validPng = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(2048, 0x55),
    ]);

    const result = validateImageBuffer(validPng, "image/png");
    expect(result.isValid).toBe(true);
    expect(result.normalizedMime).toBe("image/png");
  });
});
