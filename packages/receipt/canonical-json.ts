/**
 * @file packages/receipt/canonical-json.ts
 * @description Project-specific Deterministic JSON Canonicalization Scheme (incorporating RFC 8785 principles) for cryptographic receipt integrity.
 *
 * SPECIFICATION:
 * 1. Object keys sorted in strict lexicographical UTF-16 code-unit / binary ASCII order (a < b ? -1 : a > b ? 1 : 0).
 * 2. Compact formatting: no whitespace between structural delimiters (':' and ',').
 * 3. Numbers: finite IEEE 754 numbers; -0 normalized to "0"; non-finite (NaN, Infinity) throw TypeError.
 * 4. Booleans / Null: literal "true", "false", "null".
 * 5. Strings: standard JSON UTF-8 escaping.
 * 6. Arrays: serialized element-by-element with null for missing items.
 * 7. Undefined values: omitted in objects.
 *
 * SECURITY NOTE:
 * Canonicalization ensures that semantically identical payloads produce identical byte sequences across runtimes.
 * SHA-256 provides cryptographic collision resistance over the resulting canonical byte stream.
 */

/**
 * Serializes any JS value into a deterministic canonical JSON string.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }

  const type = typeof value;

  if (type === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Cannot canonicalize non-finite numbers (NaN, Infinity).");
    }
    // Object.is(-0, value) handles negative zero
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }

  if (type === "boolean") {
    return value ? "true" : "false";
  }

  if (type === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJsonStringify(item ?? null));
    return `[${items.join(",")}]`;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const entries = keys.map((key) => {
      const serializedKey = JSON.stringify(key);
      const serializedVal = canonicalJsonStringify(obj[key]);
      return `${serializedKey}:${serializedVal}`;
    });

    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`Unsupported type for canonical JSON serialization: ${type}`);
}
