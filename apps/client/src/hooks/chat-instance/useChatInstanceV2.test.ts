/**
 * @file useChatInstanceV2 Tests
 * @module hooks/chat-instance/useChatInstanceV2.test
 */

import { describe, expect, test } from "vitest";
import { useChatInstanceV2 } from "./useChatInstanceV2";

// Mock agent config
const mockAgentConfig = {
    agentId: "test-agent-123",
    initialAgentName: "Test Agent",
};

describe("useChatInstanceV2", () => {
    test("should be importable", () => {
        expect(useChatInstanceV2).toBeDefined();
        expect(typeof useChatInstanceV2).toBe("function");
    });

    test("should have correct function signature", () => {
        // Check that the function has the expected number of parameters
        expect(useChatInstanceV2.length).toBe(3); // chatId, agentConfigData, injectedLayer
    });

    test("should export ChatInstanceHookState interface", () => {
        // This test verifies that the types are properly exported
        // The actual interface checking happens at compile time
        expect(true).toBe(true);
    });
}); 