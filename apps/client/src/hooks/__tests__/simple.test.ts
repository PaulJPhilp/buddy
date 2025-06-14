/**
 * @file Simple test to verify test framework
 */

import { describe, expect, test } from "vitest";

describe("Simple Test", () => {
  test("should work without DOM", () => {
    expect(1 + 1).toBe(2);
  });

  test("should handle object creation", () => {
    const obj = { name: "test", value: 42 };
    expect(obj.name).toBe("test");
    expect(obj.value).toBe(42);
  });

  test("should handle array operations", () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr[0]).toBe(1);
  });
});
