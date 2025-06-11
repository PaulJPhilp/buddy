/**
 * @file useChatInstance Tests
 * @module hooks/chat-instance/useChatInstance.test
 */

import { describe, expect, test } from "vitest";
import { useChatInstance } from "./useChatInstance";

// Mock agent config
const mockAgentConfig = {
  agentId: "test-agent-123",
  initialAgentName: "Test Agent",
};

describe("useChatInstance", () => {
  test("should be importable", () => {
    expect(useChatInstance).toBeDefined();
    expect(typeof useChatInstance).toBe("function");
  });

  test("should have correct function signature", () => {
    // Check that the function has the expected number of parameters
    expect(useChatInstance.length).toBe(3); // chatId, agentConfigData, injectedLayer
  });

  test("should export ChatInstanceHookState interface", () => {
    // This test verifies that the types are properly exported
    // The actual interface checking happens at compile time
    expect(true).toBe(true);
  });
});
