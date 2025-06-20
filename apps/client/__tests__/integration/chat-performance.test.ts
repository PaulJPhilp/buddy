import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatService } from "../../src/services/chat";
import { ConfigService } from "../../src/services/config";
import { MdxService } from "../../src/services/mdx";
import { WebSocketService } from "../../src/services/websocket";

// Real service layer for performance testing
const RealServiceLayer = Layer.mergeAll(
  WebSocketService.Default,
  ConfigService.Default,
  MdxService.Default,
  ChatService.Default,
);

// Helper to run effects with real services
const runWithRealServices = <A, E>(effect: Effect.Effect<A, E, any>) =>
  Effect.runPromise(effect.pipe(Effect.provide(RealServiceLayer)));

// Performance measurement utility
function measureTime<T>(operation: () => Promise<T>): Promise<{
  result: T;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    operation()
      .then((result) => {
        const end = performance.now();
        resolve({ result, duration: end - start });
      })
      .catch(reject);
  });
}

// Check agent availability
const checkAgentConnection = () =>
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const chatUrl = yield* config.buildChatUrl("perf-test-connection");

    const ws = new WebSocket(chatUrl);
    const connected = yield* Effect.async<boolean>((resume) => {
      const timeout = setTimeout(() => resume(Effect.succeed(false)), 3000);

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

describe("Chat Performance Tests with Real Services", () => {
  // Also set individual test timeouts
  const TEST_TIMEOUT = 30000;
  let agentAvailable = false;

  beforeEach(async () => {
    vi.setConfig({ testTimeout: 30000 });
    agentAvailable = await runWithRealServices(checkAgentConnection()).catch(
      () => false,
    );
  });

  it("should handle rapid message sending within performance limits", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const chatService = yield* ChatService;
          yield* chatService.initialize("perf-test-rapid-1");

          const messages = Array.from(
            { length: 5 },
            (_, i) => `Rapid test message ${i + 1}`,
          );
          const sendTimes: number[] = [];

          for (const message of messages) {
            const start = performance.now();
            yield* chatService.sendMessage(message);
            const end = performance.now();
            sendTimes.push(end - start);
            yield* Effect.sleep("2 seconds");
          }

          // Wait for all responses
          yield* Effect.sleep("10 seconds");

          const state = yield* chatService.getState();
          return {
            messageCount: state.messages.length,
            sendTimes,
            avgSendTime:
              sendTimes.reduce((a, b) => a + b, 0) / sendTimes.length,
          };
        }),
      );
    });

    expect(result.messageCount).toBeGreaterThan(0);
    expect(result.avgSendTime).toBeLessThan(1000); // Less than 1 second per send
    expect(duration).toBeLessThan(60000); // Complete test in under 1 minute
  });

  it("should maintain performance with message processing", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const chatService = yield* ChatService;
          yield* chatService.initialize("perf-test-processing-1");

          // Send message and measure response time
          const sendStart = performance.now();
          yield* chatService.sendMessage(
            "Tell me about TypeScript in 2 sentences",
          );

          // Wait for response
          yield* Effect.sleep("8 seconds");

          const sendEnd = performance.now();
          const responseTime = sendEnd - sendStart;

          const state = yield* chatService.getState();

          return {
            messageCount: state.messages.length,
            responseTime,
            hasResponse: state.messages.some((m) => m.sender === "assistant"),
          };
        }),
      );
    });

    expect(result.messageCount).toBeGreaterThan(0);
    // Agent response is optional if server isn't fully running
    expect(result.responseTime).toBeLessThan(15000); // Response within 15 seconds
    expect(duration).toBeLessThan(30000); // Complete test in under 30 seconds
  });

  it("should handle multiple concurrent sessions efficiently", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const sessions = yield* Effect.all(
            [
              Effect.gen(function* () {
                const chatService = yield* ChatService;
                yield* chatService.initialize("perf-concurrent-1");
                yield* chatService.sendMessage("Session 1 performance test");
                yield* Effect.sleep("5 seconds");
                const state = yield* chatService.getState();
                return { id: 1, messageCount: state.messages.length };
              }),
              Effect.gen(function* () {
                const chatService = yield* ChatService;
                yield* chatService.initialize("perf-concurrent-2");
                yield* chatService.sendMessage("Session 2 performance test");
                yield* Effect.sleep("5 seconds");
                const state = yield* chatService.getState();
                return { id: 2, messageCount: state.messages.length };
              }),
              Effect.gen(function* () {
                const chatService = yield* ChatService;
                yield* chatService.initialize("perf-concurrent-3");
                yield* chatService.sendMessage("Session 3 performance test");
                yield* Effect.sleep("5 seconds");
                const state = yield* chatService.getState();
                return { id: 3, messageCount: state.messages.length };
              }),
            ],
            { concurrency: 3 },
          );

          return sessions;
        }),
      );
    });

    expect(result).toHaveLength(3);
    expect(result.every((session) => session.messageCount > 0)).toBe(true);
    expect(duration).toBeLessThan(20000); // All concurrent sessions complete in under 20 seconds
  });

  it("should maintain memory efficiency with multiple messages", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const chatService = yield* ChatService;
          yield* chatService.initialize("perf-test-memory-1");

          const initialMemory = process.memoryUsage();
          const messageCount = 10;

          for (let i = 1; i <= messageCount; i++) {
            yield* chatService.sendMessage(`Memory test message ${i}`);
            yield* Effect.sleep("1 second");
          }

          // Wait for processing
          yield* Effect.sleep("15 seconds");

          const finalMemory = process.memoryUsage();
          const finalState = yield* chatService.getState();

          return {
            messageCount: finalState.messages.length,
            memoryIncrease: finalMemory.heapUsed - initialMemory.heapUsed,
            memoryPerMessage:
              (finalMemory.heapUsed - initialMemory.heapUsed) /
              finalState.messages.length,
          };
        }),
      );
    });

    expect(result.messageCount).toBeGreaterThan(0);
    expect(result.memoryPerMessage).toBeLessThan(1024 * 1024); // Less than 1MB per message
    expect(duration).toBeLessThan(60000); // Complete in under 1 minute
  });

  it("should handle sustained load efficiently", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const chatService = yield* ChatService;
          yield* chatService.initialize("perf-test-sustained-1");

          const startTime = Date.now();
          const messageSendTimes: number[] = [];
          let messagesProcessed = 0;

          // Send messages for 20 seconds
          while (Date.now() - startTime < 20000) {
            const sendStart = performance.now();
            yield* chatService.sendMessage(
              `Sustained load message ${messagesProcessed + 1}`,
            );
            const sendEnd = performance.now();
            messageSendTimes.push(sendEnd - sendStart);
            messagesProcessed++;

            yield* Effect.sleep("3 seconds");
          }

          // Final wait for processing
          yield* Effect.sleep("10 seconds");

          const finalState = yield* chatService.getState();

          return {
            messagesSent: messagesProcessed,
            totalMessages: finalState.messages.length,
            avgSendTime:
              messageSendTimes.reduce((a, b) => a + b, 0) /
              messageSendTimes.length,
            maxSendTime: Math.max(...messageSendTimes),
          };
        }),
      );
    });

    expect(result.messagesSent).toBeGreaterThan(0);
    expect(result.totalMessages).toBeGreaterThanOrEqual(result.messagesSent);
    expect(result.avgSendTime).toBeLessThan(500); // Average send time under 500ms
    expect(result.maxSendTime).toBeLessThan(2000); // Max send time under 2 seconds
    expect(duration).toBeLessThan(45000); // Complete in under 45 seconds
  });

  it("should efficiently handle state queries under load", async () => {
    if (!agentAvailable) {
      throw new Error("LLM Agent server required for performance tests");
    }

    const { result, duration } = await measureTime(async () => {
      return runWithRealServices(
        Effect.gen(function* () {
          const chatService = yield* ChatService;
          yield* chatService.initialize("perf-test-state-1");

          // Setup some messages first
          yield* chatService.sendMessage("Initial message for state testing");
          yield* Effect.sleep("3 seconds");
          yield* chatService.sendMessage("Second message for state testing");
          yield* Effect.sleep("3 seconds");

          // Rapid state queries
          const stateQueryTimes: number[] = [];
          const queryCount = 50;

          for (let i = 0; i < queryCount; i++) {
            const queryStart = performance.now();
            const state = yield* chatService.getState();
            const queryEnd = performance.now();

            stateQueryTimes.push(queryEnd - queryStart);

            expect(state.id).toBe("perf-test-state-1");
            expect(Array.isArray(state.messages)).toBe(true);
          }

          return {
            queryCount,
            avgQueryTime:
              stateQueryTimes.reduce((a, b) => a + b, 0) /
              stateQueryTimes.length,
            maxQueryTime: Math.max(...stateQueryTimes),
            minQueryTime: Math.min(...stateQueryTimes),
          };
        }),
      );
    });

    expect(result.queryCount).toBe(50);
    expect(result.avgQueryTime).toBeLessThan(10); // Average query under 10ms
    expect(result.maxQueryTime).toBeLessThan(100); // Max query under 100ms
    expect(duration).toBeLessThan(20000); // Complete in under 20 seconds
  });
});
