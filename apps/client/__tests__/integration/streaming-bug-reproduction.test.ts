import { ChatService } from "@/services/chat";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { WebSocketService } from "@/services/websocket";
import { Effect, Layer } from "effect";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Test configuration
const LLM_AGENT_URL = "ws://localhost:8080";
const TEST_TIMEOUT = 30000; // 30 seconds

// Create test service layer
const createTestLayer = () =>
  Layer.mergeAll(
    WebSocketService.Default,
    MdxService.Default,
    ConfigService.Default,
    ChatService.Default,
  );

describe("Streaming Bug Reproduction", () => {
  let chatService: any;
  let serviceLayer: any;

  beforeAll(async () => {
    // Create service layer and get ChatService instance
    serviceLayer = createTestLayer();
    const program = Effect.gen(function* () {
      const service = yield* ChatService;
      yield* service.initialize("streaming-bug-test");
      return service;
    });

    try {
      chatService = await Effect.runPromise(
        program.pipe(Effect.provide(serviceLayer)),
      );
    } catch (error) {
      throw new Error(
        `Failed to initialize chat service. Is LLM agent running at ${LLM_AGENT_URL}? Error: ${error}`,
      );
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (chatService) {
      await Effect.runPromise(
        chatService.cleanup().pipe(Effect.provide(serviceLayer)),
      );
    }
  });

  it(
    "should preserve both responses when sending two messages in sequence",
    async () => {
      if (!chatService) {
        throw new Error("Chat service not initialized");
      }

      console.log("🔍 Starting streaming bug reproduction test...");

      // Send first message
      console.log("📤 Sending first message...");
      await Effect.runPromise(chatService.sendMessage("What is TypeScript?"));

      // Wait for first response to complete
      console.log("⏳ Waiting for first response to complete...");
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Get state after first message
      const stateAfterFirst = await Effect.runPromise(chatService.getState());

      console.log("📊 State after first message:", {
        messageCount: stateAfterFirst.messages.length,
        lastMessage: stateAfterFirst.messages[
          stateAfterFirst.messages.length - 1
        ]?.text?.substring(0, 100),
      });

      // Verify we have at least user + assistant messages
      expect(stateAfterFirst.messages.length).toBeGreaterThanOrEqual(2);

      // Find the first assistant response
      const firstAssistantMessage = stateAfterFirst.messages.find(
        (msg) => msg.sender === "assistant",
      );
      expect(firstAssistantMessage).toBeDefined();
      expect(firstAssistantMessage!.text.length).toBeGreaterThan(0);

      const firstResponseText = firstAssistantMessage!.text;
      console.log(
        "✅ First response preserved:",
        firstResponseText.substring(0, 100) + "...",
      );

      // Send second message
      console.log("📤 Sending second message...");
      await Effect.runPromise(
        chatService.sendMessage("Can you give me a simple example?"),
      );

      // Wait for second response to complete
      console.log("⏳ Waiting for second response to complete...");
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // Get final state
      const finalState = await Effect.runPromise(chatService.getState());

      console.log("📊 Final state:", {
        messageCount: finalState.messages.length,
        messages: finalState.messages.map((msg) => ({
          sender: msg.sender,
          textLength: msg.text.length,
          preview: msg.text.substring(0, 50) + "...",
        })),
      });

      // Verify we have 4 messages total (2 user + 2 assistant)
      expect(finalState.messages.length).toBe(4);

      // Find all assistant messages
      const assistantMessages = finalState.messages.filter(
        (msg) => msg.sender === "assistant",
      );
      expect(assistantMessages.length).toBe(2);

      // Verify first response is still there
      const preservedFirstResponse = assistantMessages[0];
      expect(preservedFirstResponse.text).toBe(firstResponseText);
      expect(preservedFirstResponse.text.length).toBeGreaterThan(0);

      // Verify second response exists
      const secondResponse = assistantMessages[1];
      expect(secondResponse.text.length).toBeGreaterThan(0);
      expect(secondResponse.text).not.toBe(firstResponseText);

      console.log("✅ Both responses preserved successfully!");
      console.log(
        "✅ First response:",
        preservedFirstResponse.text.substring(0, 100) + "...",
      );
      console.log(
        "✅ Second response:",
        secondResponse.text.substring(0, 100) + "...",
      );
    },
    TEST_TIMEOUT,
  );
});
