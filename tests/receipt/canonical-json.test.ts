/**
 * @file tests/receipt/canonical-json.test.ts
 * @description Unit tests for deterministic canonical JSON serialization.
 */

import { describe, it, expect } from "vitest";
import { canonicalJsonStringify } from "../../packages/receipt/canonical-json";

describe("Deterministic Canonical JSON Serialization", () => {
  it("sorts object keys in strict lexicographical binary ASCII order", () => {
    const objA = { z: 1, a: 2, m: 3, _id: 4 };
    const objB = { _id: 4, m: 3, a: 2, z: 1 };

    expect(canonicalJsonStringify(objA)).toBe('{"_id":4,"a":2,"m":3,"z":1}');
    expect(canonicalJsonStringify(objA)).toBe(canonicalJsonStringify(objB));
  });

  it("handles nested structures, arrays, nulls, and primitives consistently", () => {
    const complex = {
      b: [3, 2, 1, null],
      a: {
        y: "hello",
        x: true,
        z: null,
      },
    };

    const expected = '{"a":{"x":true,"y":"hello","z":null},"b":[3,2,1,null]}';
    expect(canonicalJsonStringify(complex)).toBe(expected);
  });

  it("omits undefined object properties deterministically", () => {
    const obj = { a: 1, b: undefined, c: "test" };
    expect(canonicalJsonStringify(obj)).toBe('{"a":1,"c":"test"}');
  });

  it("rejects non-finite numbers", () => {
    expect(() => canonicalJsonStringify({ a: NaN })).toThrow(TypeError);
    expect(() => canonicalJsonStringify({ a: Infinity })).toThrow(TypeError);
  });
});
