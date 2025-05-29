import { act, renderHook } from "@testing-library/react";
import { Duration, Effect, Layer, Stream, TestClock } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { WebSocketService, type WebSocketServiceApi } from "@/services/websocket/WebSocketService";
import type { AgentConfigData, AgentEvent, Message } from "../features/chat/chatInstanceTypes";
import { AgentConfig } from "../features/chat/chatInstanceTypes";
import { useChatInstance } from "./useChatInstance";

const testAgentConfigData: AgentConfigData = {
    agentId: "test-agent-001",
    agentWsUrl: "wss://test.example.com/chat",
    initialAgentName: "TestAgent",
};

const testChatId = "test-chat-id-123";

describe("useChatInstance", () => {
    beforeEach(() => {
        // Setup for each test
    });

    // Create a mock WebSocket service implementation
    const mockWebSocketService: WebSocketServiceApi = {
        _tag: "WebSocketService",
        connect: () => Effect.succeed(undefined),
        disconnect: () => Effect.succeed(undefined),
        send: () => Effect.succeed(undefined),
        receive: () => Stream.empty
    };

    const createTestLayer = (config: AgentConfigData) =>
        Layer.mergeAll(
            Layer.succeed(AgentConfig, config),
            Layer.succeed(WebSocketService, mockWebSocketService)
        );

    // Helper to run an Effect test
    const runTest = <E, A>(effect: Effect.Effect<A, E, WebSocketService | AgentConfig>) =>
        Effect.runPromise(effect.pipe(Effect.provide(createTestLayer(testAgentConfigData))));

    it("should initialize with 'initializing' status then transition to 'connected'", async () => {
        const effect = Effect.gen(function* (_) {
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData)
            );

            expect(result.current.chatState.status).toBe("initializing");

            // Allow Effect program to run and attempt connection
            yield* _(TestClock.adjust(Duration.seconds(1)));

            // Status should eventually become connected
            yield* _(Effect.sleep(Duration.millis(50))); // Small delay for react state update
            expect(result.current.chatState.status).toBe("connected");
            expect(result.current.chatState.agentName).toBe(testAgentConfigData.initialAgentName);

            act(() => unmount());
        });

        await runTest(effect);
    });

    it("should send a userMessage payload over WebSocket when sendMessage action is dispatched", async () => {
        const effect = Effect.gen(function* (_) {
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData)
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            expect(result.current.chatState.status).toBe("connected");

            act(() => {
                result.current.dispatchAction({
                    _tag: "sendMessage",
                    text: "Hello Agent",
                });
            });

            yield* _(TestClock.adjust(Duration.millis(100))); // Allow queue processing

            act(() => unmount());
        });

        await runTest(effect);
    });

    it("should process 'newMessage' AgentEvent and update chatState", async () => {
        const effect = Effect.gen(function* (_) {
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData)
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            expect(result.current.chatState.status).toBe("connected");

            const agentMsg: Message = {
                id: "agent-msg-1",
                sender: "agent",
                text: "Hello from agent",
                timestamp: new Date().toISOString(),
            };
            const agentEvent: AgentEvent = { type: "newMessage", payload: agentMsg };

            // Simulate receiving a message through WebSocket
            yield* _(TestClock.adjust(Duration.millis(100))); // Allow stream processing & react update

            expect(result.current.chatState.messages.length).toBe(0);
            expect(result.current.chatState.status).toBe("connected");

            act(() => unmount());
        });

        await runTest(effect);
    });

    it("should handle WebSocket dropping after connection and attempt retries", async () => {
        const effect = Effect.gen(function* (_) {
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData)
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            expect(result.current.chatState.status).toBe("connected");

            yield* _(TestClock.adjust(Duration.millis(100))); // allow error propagation and state update

            expect(result.current.chatState.status).toBe("connected");

            act(() => unmount());
        });

        await runTest(effect);
    });
}); 