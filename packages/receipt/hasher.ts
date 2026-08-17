/**
 * @file packages/receipt/hasher.ts
 * @description Cryptographic SHA-256 integrity hasher over canonical JSON payloads.
 */

import crypto from "crypto";
import { canonicalJsonStringify } from "./canonical-json";

/**
 * Computes a deterministic SHA-256 hash over an arbitrary payload.
 */
export function computeCanonicalHash(payload: unknown): string {
  const canonicalString = canonicalJsonStringify(payload);
  return crypto.createHash("sha256").update(canonicalString, "utf8").digest("hex");
}

/**
 * Computes an input digest string for tracking in receipts.
 */
export function computeInputDigest(input: unknown): string {
  return computeCanonicalHash(input);
}
