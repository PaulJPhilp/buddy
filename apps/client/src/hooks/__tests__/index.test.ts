/**
 * @file Hooks Index Tests - Comprehensive Export and Integration Validation
 * @module hooks/__tests__/index.test
 */

import { describe, expect, test } from "vitest";
import {
  useAgentSession,
  useChatAppRuntime,
  useDynamicToolbar,
} from "../index";

describe("Hooks Index", () => {
  test("should export all hooks", () => {
    expect(useAgentSession).toBeDefined();
    expect(useChatAppRuntime).toBeDefined();
    expect(useDynamicToolbar).toBeDefined();
  });

  test("all hooks should be functions", () => {
    expect(typeof useAgentSession).toBe("function");
    expect(typeof useChatAppRuntime).toBe("function");
    expect(typeof useDynamicToolbar).toBe("function");
  });
});
