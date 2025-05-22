import * as WSP from "@effect/platform";
import { act, renderHook } from "@testing-library/react";
import { Duration, Effect, Layer, TestClock } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebSocketServiceMock } from "@/services/websocket/MockWebSocketService";
import type { AgentConfigData, AgentEvent, Message } from "./chatInstanceTypes";
import { AgentConfig } from "./chatInstanceTypes";
import { useChatInstance } from "./useChatInstance";

const testAgentConfigData: AgentConfigData = {
    agentId: "test-agent-001",
    agentWsUrl: "wss://test.example.com/chat",
    initialAgentName: "TestAgent",
};

const testChatId = "test-chat-id-123";

const MAX_RECONNECT_ATTEMPTS = 3; // Define the constant

// Helper to create a full test layer
const createTestLayer = (config: AgentConfigData) => {
    return Layer.empty.pipe(
        Layer.provide(WebSocketServiceMock),
        Layer.provide(Layer.succeed(AgentConfig, config)),
    );
};

// Helper to run an Effect test
const runTest = <E, A>(
    effect: Effect.Effect<A, E, any>,
) => {
    return Effect.runPromise(Effect.provide(effect, TestClock.TestLayer));
};

describe("useChatInstance", () => {
    beforeEach(() => {
        vi.useFakeTimers(); // Vitest's fake timers for TestClock integration
        WebSocketServiceMock
            .clear(); // Clear any previous WebSocket state
    });

    it("should initialize with 'initializing' status then transition to 'connected'", async () => {
        const testLayer = createTestLayer(testAgentConfigData)
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WebSocketServiceMock
            )
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            )

            expect(result.current.chatState.status).toBe("initializing");

            // Allow Effect program to run and attempt connection
            yield* _(TestClock.adjust(Duration.seconds(1)));

            const opens = yield* _(platform.getOpens);
            expect(opens.length).toBe(1);
            const [url, connection] = opens[0];
            expect(url).toBe(
                `${testAgentConfigData.agentWsUrl}?chatId=${testChatId}&agentId=${testAgentConfigData.agentId}`,
            );
            expect(yield* _(platform.isStarted(connection))).toBe(true);

            // Status should eventually become connected
            // Wait for the state update propagation
            yield* _(Effect.sleep(Duration.millis(50))); // Small delay for react state update
            expect(result.current.chatState.status).toBe("connected");
            expect(result.current.chatState.agentName).toBe(
                testAgentConfigData.initialAgentName,
            );

            act(() => unmount());
            yield* _(TestClock.adjust(Duration.seconds(1)));
            expect(yield* _(platform.isClosed(connection))).toBe(true);
        });
        await runTest(Effect.provide(effect, testLayer));
    });

    it("should send a userMessage payload over WebSocket when sendMessage action is dispatched", async () => {
        const testLayer = createTestLayer(testAgentConfigData);
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WSP.WebSocketPlatform);
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            const [, connection] = (yield* _(platform.getOpens))[0];
            expect(result.current.chatState.status).toBe("connected");

            act(() => {
                result.current.dispatchAction({
                    _tag: "sendMessage",
                    text: "Hello Agent",
                });
            });

            yield* _(TestClock.adjust(Duration.millis(100))); // Allow queue processing

            const output = yield* _(platform.getOutput(connection));
            expect(output.length).toBe(1);
            const sentPayload = JSON.parse(output[0] as string);
            expect(sentPayload).toEqual({
                type: "userMessage",
                message: { text: "Hello Agent" },
            });
            act(() => unmount());
        });
        await runTest(Effect.provide(effect, testLayer));
    });

    it("should process 'newMessage' AgentEvent and update chatState", async () => {
        const testLayer = createTestLayer(testAgentConfigData);
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WSP.WebSocketPlatform);
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            const [, connection] = (yield* _(platform.getOpens))[0];
            expect(result.current.chatState.status).toBe("connected");

            const agentMsg: Message = {
                id: "agent-msg-1",
                sender: "agent",
                text: "Hello from agent",
                timestamp: new Date().toISOString(),
            };
            const agentEvent: AgentEvent = { type: "newMessage", payload: agentMsg };

            yield* _(platform.input(connection, [JSON.stringify(agentEvent)]));
            yield* _(TestClock.adjust(Duration.millis(100))); // Allow stream processing & react update

            expect(result.current.chatState.messages.length).toBe(1);
            expect(result.current.chatState.messages[0]).toEqual(agentMsg);
            expect(result.current.chatState.status).toBe("connected");

            act(() => unmount());
        });
        await runTest(Effect.provide(effect, testLayer));
    });

    it("should attempt retries on WebSocket connection failure and then go to 'error' state", async () => {
        const testLayer = createTestLayer(testAgentConfigData);
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WSP.WebSocketPlatform);
            yield* _(platform.setFailOnConnect(true)); // Make initial connection fail

            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            );
            expect(result.current.chatState.status).toBe("initializing");

            // Initial connection attempt
            yield* _(TestClock.adjust(Duration.millis(10))); // Small time for first attempt
            expect(result.current.chatState.status).toBe("connecting"); // Should quickly try

            // Loop through retry attempts
            for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
                yield* _(TestClock.adjust(Duration.millis(10))); // to see connecting before reconnecting
                expect(result.current.chatState.status).toBe("reconnecting");
                expect(result.current.chatState.error).toContain(
                    `Connection attempt ${i + 1} failed`,
                );
                // Advance clock for the exponential backoff + jitter (approximate)
                const delay = Duration.toMillis(Duration.seconds(2 ** i)) + 500; // Base + jitter allowance
                yield* _(TestClock.adjust(Duration.millis(delay)));
            }

            yield* _(TestClock.adjust(Duration.seconds(1))); // Ensure all retries are done
            expect(result.current.chatState.status).toBe("error");
            expect(result.current.chatState.error).toContain(
                "Failed to connect after multiple attempts",
            );
            expect((yield* _(platform.getOpens)).length).toBe(
                MAX_RECONNECT_ATTEMPTS + 1,
            ); // initial + all retries

            act(() => unmount());
        });
        await runTest(Effect.provide(effect, testLayer));
    });

    it("should transition to 'connected' if a retry succeeds", async () => {
        const testLayer = createTestLayer(testAgentConfigData);
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WSP.WebSocketPlatform);

            // Fail the first 2 attempts, then succeed
            let connectAttempt = 0;
            yield* _(
                platform.setConnectHook(() => {
                    connectAttempt++;
                    return connectAttempt <= 2
                        ? Effect.fail(new WSP.WebSocketError({ reason: "Connect failed" }))
                        : Effect.succeed(undefined);
                }),
            );

            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            );
            expect(result.current.chatState.status).toBe("initializing");

            // Attempt 1 (fail)
            yield* _(TestClock.adjust(Duration.millis(10)));
            expect(result.current.chatState.status).toBe("reconnecting");
            yield* _(TestClock.adjust(Duration.seconds(1.5))); // Past 1st delay

            // Attempt 2 (fail)
            yield* _(TestClock.adjust(Duration.millis(10)));
            expect(result.current.chatState.status).toBe("reconnecting");
            yield* _(TestClock.adjust(Duration.seconds(2.5))); // Past 2nd delay (2s base)

            // Attempt 3 (succeed)
            yield* _(TestClock.adjust(Duration.millis(10)));
            // Status might briefly be 'connecting' or 'reconnecting' then 'connected'
            yield* _(TestClock.adjust(Duration.millis(100))); // allow connection and state update

            expect(result.current.chatState.status).toBe("connected");
            expect(result.current.chatState.error).toBeUndefined();
            expect((yield* _(platform.getOpens)).length).toBe(3);

            act(() => unmount());
        });
        await runTest(Effect.provide(effect, testLayer));
    });

    it("should handle WebSocket dropping after connection and attempt retries", async () => {
        const testLayer = createTestLayer(testAgentConfigData);
        const effect = Effect.gen(function* (_) {
            const platform = yield* _(WSP.WebSocketPlatform);
            const { result, unmount } = renderHook(() =>
                useChatInstance(testChatId, testAgentConfigData),
            );

            yield* _(TestClock.adjust(Duration.seconds(1))); // Connect
            const [, connection] = (yield* _(platform.getOpens))[0];
            expect(result.current.chatState.status).toBe("connected");

            // Simulate WebSocket dropping
            yield* _(
                platform.close(connection, { code: 1006, reason: "Simulated drop" }),
            );
            yield* _(TestClock.adjust(Duration.millis(100))); // allow error propagation and state update

            expect(result.current.chatState.status).toBe("reconnecting");
            expect(result.current.chatState.error).toContain(
                "Connection attempt 1 failed",
            );

            // Allow one retry to succeed
            yield* _(platform.setFailOnConnect(false)); // Ensure next connect attempt can succeed
            yield* _(platform.setConnectHook(() => Effect.succeed(undefined))); // Reset any specific fail hook

            yield* _(TestClock.adjust(Duration.seconds(1.5))); // Past 1st retry delay
            yield* _(TestClock.adjust(Duration.millis(100))); // allow connection and state update

            expect(result.current.chatState.status).toBe("connected");
            expect((yield* _(platform.getOpens)).length).toBe(2); // Initial + 1 retry connect

            act(() => unmount());
        });
        await runTest(Effect.provide(effect, testLayer));
    });
});
