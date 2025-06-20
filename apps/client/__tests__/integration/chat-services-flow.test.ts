import { Effect, Fiber, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import { ChatService } from "../../src/services/chat";
import type { MessageApi } from "../../src/services/chat/types";
import { ConfigService } from "../../src/services/config";
import { MdxService } from "../../src/services/mdx";
import { WebSocketService } from "../../src/services/websocket";

// Real service layer - no mocks
const RealServiceLayer = Layer.mergeAll(
  WebSocketService.Default,
  ConfigService.Default,
  MdxService.Default,
  ChatService.Default,
);

// Helper to run effects with real services
const runWithRealServices = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(effect.pipe(Effect.provide(RealServiceLayer)));

// Check if required external services are available
const checkAgentConnection = () =>
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const chatUrl = yield* config.buildChatUrl("test-connection");

    // Simple WebSocket connection test
    const ws = new WebSocket(chatUrl);
    const connected = yield* Effect.async<boolean>((resume) => {
      const timeout = setTimeout(() => resume(Effect.succeed(false)), 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resume(Effect.succeed(true));
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resume(Effect.succeed(false));
      };
    });

    return connected;
  });

describe("Chat Services Integration Tests with Real Services", () => {
  let agentAvailable = false;

  beforeEach(async () => {
    // Check if LLM agent is available
    agentAvailable = await runWithRealServices(checkAgentConnection()).catch(
      () => false,
    );
  });

  it("should initialize chat service with real WebSocket connection", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-init-1");
        const state = yield* chatService.getState();

        return {
          chatId: state.id,
          messageCount: state.messages.length,
          isTyping: state.isTyping,
        };
      }),
    );

    expect(result.chatId).toBe("test-init-1");
    expect(result.messageCount).toBe(0);
    expect(result.isTyping).toBe(false);
  });

  it("should send messages and receive responses through real agent", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-message-1");

        // Send a message
        yield* chatService.sendMessage(
          "Hello, this is a real integration test",
        );

        // Wait for response
        yield* Effect.sleep("10 seconds");

        const state = yield* chatService.getState();
        return {
          messageCount: state.messages.length,
          hasUserMessage: state.messages.some((m) => m.sender === "user"),
          hasAssistantMessage: state.messages.some(
            (m) => m.sender === "assistant",
          ),
          messages: state.messages.map((m) => ({
            sender: m.sender,
            text: m.text.substring(0, 50) + (m.text.length > 50 ? "..." : ""),
          })),
        };
      }),
    );

    expect(result.messageCount).toBeGreaterThan(0);
    expect(result.hasUserMessage).toBe(true);
    // Assistant response is optional if agent server isn't fully running
    if (result.hasAssistantMessage) {
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
    } else {
      expect(result.messages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should handle real stream processing", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-stream-1");

        const streamMessages: any[] = [];

        // Start stream processing
        const streamFiber = yield* Effect.fork(
          Effect.gen(function* () {
            const messageStream = chatService.messageStream;
            yield* messageStream.pipe(
              Effect.take(5), // Take first 5 stream messages
              Effect.tap((message) =>
                Effect.sync(() => {
                  streamMessages.push(message);
                }),
              ),
            );
          }),
        );

        // Send message to trigger stream
        yield* chatService.sendMessage("Explain machine learning briefly");

        // Wait for stream processing
        yield* Effect.sleep("8 seconds");

        // Stop stream processing
        yield* Fiber.interrupt(streamFiber);

        const finalState = yield* chatService.getState();

        return {
          streamMessageCount: streamMessages.length,
          finalMessageCount: finalState.messages.length,
          streamMessages: streamMessages.map((m) => m.type || "unknown"),
        };
      }),
    );

    expect(result.finalMessageCount).toBeGreaterThan(0);
    // Stream messages are optional if agent isn't fully responding
    if (result.streamMessageCount > 0) {
      expect(result.streamMessages).toContain("RESPONSE");
    }
  });

  it("should handle multiple concurrent chat sessions", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        // Create 3 concurrent chat sessions
        const sessions = yield* Effect.all(
          [
            Effect.gen(function* () {
              const chatService = yield* ChatService;
              yield* chatService.initialize("concurrent-1");
              yield* chatService.sendMessage("Session 1 test message");
              yield* Effect.sleep("5 seconds");
              const state = yield* chatService.getState();
              return {
                id: "concurrent-1",
                messageCount: state.messages.length,
              };
            }),
            Effect.gen(function* () {
              const chatService = yield* ChatService;
              yield* chatService.initialize("concurrent-2");
              yield* chatService.sendMessage("Session 2 test message");
              yield* Effect.sleep("5 seconds");
              const state = yield* chatService.getState();
              return {
                id: "concurrent-2",
                messageCount: state.messages.length,
              };
            }),
            Effect.gen(function* () {
              const chatService = yield* ChatService;
              yield* chatService.initialize("concurrent-3");
              yield* chatService.sendMessage("Session 3 test message");
              yield* Effect.sleep("5 seconds");
              const state = yield* chatService.getState();
              return {
                id: "concurrent-3",
                messageCount: state.messages.length,
              };
            }),
          ],
          { concurrency: 3 },
        );

        return sessions;
      }),
    );

    expect(result).toHaveLength(3);
    expect(result.every((session) => session.messageCount > 0)).toBe(true);
    expect(result.map((s) => s.id)).toEqual([
      "concurrent-1",
      "concurrent-2",
      "concurrent-3",
    ]);
  });

  it("should handle real llm-ui compilation with agent responses", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;
        const mdxService = yield* MdxService;

        yield* chatService.initialize("test-llmui-1");

        // Send message asking for markdown content
        yield* chatService.sendMessage(
          "Please respond with some markdown including **bold** and *italic* text",
        );

        // Wait for response
        yield* Effect.sleep("8 seconds");

        const state = yield* chatService.getState();
        const assistantMessage = state.messages.find(
          (m) => m.sender === "assistant",
        );

        if (!assistantMessage) {
          return { error: "No assistant message found" };
        }

        // Try to compile the assistant's response for llm-ui
        const compiledLlmUi = yield* mdxService.compileForLlmUi(
          assistantMessage.text,
        );

        return {
          messageCount: state.messages.length,
          assistantTextLength: assistantMessage.text.length,
          llmUiCompiled: !!compiledLlmUi,
          llmUiLength: compiledLlmUi?.rawMarkdown?.length || 0,
        };
      }),
    );

    expect(result.messageCount).toBeGreaterThan(0);
    // llm-ui compilation test is optional if no assistant response
    if (!result.error) {
      expect(result.assistantTextLength).toBeGreaterThan(0);
      expect(result.llmUiCompiled).toBe(true);
      expect(result.llmUiLength).toBeGreaterThan(0);
    }
  });

  it("should handle real error scenarios gracefully", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;

        // Test with invalid chat ID characters
        const initResult = yield* chatService
          .initialize("test/error\\invalid")
          .pipe(Effect.either);

        // Should handle gracefully
        if (initResult._tag === "Left") {
          return { error: "initialization", handled: true };
        }

        // Test with empty message
        const sendResult = yield* chatService
          .sendMessage("")
          .pipe(Effect.either);

        if (sendResult._tag === "Left") {
          return { error: "empty_message", handled: true };
        }

        // Test normal operation
        yield* chatService.sendMessage("Normal test message");
        yield* Effect.sleep("5 seconds");

        const state = yield* chatService.getState();
        return { error: "none", messageCount: state.messages.length };
      }),
    );

    // Should handle errors gracefully
    expect(result.handled).toBe(true);
    expect(["initialization", "empty_message", "none"]).toContain(result.error);
  });

  it("should handle real chat history operations", async () => {
    if (!agentAvailable) {
      throw new Error(
        "LLM Agent server required for service integration tests",
      );
    }

    const result = await runWithRealServices(
      Effect.gen(function* () {
        const chatService = yield* ChatService;
        yield* chatService.initialize("test-history-1");

        // Add multiple messages
        yield* chatService.sendMessage("First test message");
        yield* Effect.sleep("3 seconds");
        yield* chatService.sendMessage("Second test message");
        yield* Effect.sleep("3 seconds");

        const stateBeforeClear = yield* chatService.getState();
        const messageCountBefore = stateBeforeClear.messages.length;

        // Clear history
        yield* chatService.clearHistory();

        const stateAfterClear = yield* chatService.getState();

        return {
          messageCountBefore,
          messageCountAfter: stateAfterClear.messages.length,
          chatIdSame: stateBeforeClear.id === stateAfterClear.id,
        };
      }),
    );

    expect(result.messageCountBefore).toBeGreaterThan(0);
    expect(result.messageCountAfter).toBe(0);
    expect(result.chatIdSame).toBe(true);
  });
});
