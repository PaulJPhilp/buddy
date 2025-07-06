import { Effect, Fiber, Layer } from "effect";
import { expect } from "vitest";
import { ChatService } from "../../src/services/chat";
import type { MessageApi } from "../../src/services/chat/types";
import { ConfigService } from "../../src/services/config";
import { MdxService } from "../../src/services/mdx";
import { WebSocketService } from "../../src/services/websocket";

/**
 * Real Service Test Helpers
 *
 * These helpers provide utilities for testing with real external services.
 * NO MOCKS - all services connect to actual endpoints.
 */

// Real service layer for testing
export const RealTestServiceLayer = Layer.mergeAll(
  WebSocketService.Default,
  ConfigService.Default,
  MdxService.Default,
  ChatService.Default
);

// Helper to run effects with real services
export const runWithRealServices = <A, E>(effect: Effect.Effect<A, E, never>) =>
  Effect.runPromise(effect.pipe(Effect.provide(RealTestServiceLayer)));

/**
 * Check if external services are available
 */
export const checkExternalServices = () =>
  Effect.gen(function* () {
    const config = yield* ConfigService;
    const chatUrl = yield* config.buildChatUrl("service-check");

    // Test WebSocket connection
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

    return {
      agentAvailable: connected,
      wsUrl: chatUrl,
    };
  });

/**
 * Initialize a test chat session
 */
export const initializeTestChat = (chatId: string) =>
  Effect.gen(function* () {
    const chatService = yield* ChatService;
    yield* chatService.initialize(chatId);
    return chatService;
  });

/**
 * Send a test message and wait for response
 */
export const sendTestMessage = (chatService: any, message: string) =>
  Effect.gen(function* () {
    yield* chatService.sendMessage(message);
    yield* Effect.sleep("5 seconds"); // Wait for processing
    return yield* chatService.getState();
  });

/**
 * Wait for a condition to be met
 */
export const waitForCondition = <T>(
  effect: Effect.Effect<T, any, never>,
  predicate: (result: T) => boolean,
  maxAttempts = 10,
  delayMs = 1000
) =>
  Effect.gen(function* () {
    for (let i = 0; i < maxAttempts; i++) {
      const result = yield* effect;
      if (predicate(result)) {
        return result;
      }
      yield* Effect.sleep(`${delayMs} millis`);
    }

    throw new Error(`Condition not met after ${maxAttempts} attempts`);
  });

/**
 * Collect stream messages for testing
 */
export const collectStreamMessages = <T>(
  stream: any,
  maxCount: number,
  timeoutMs = 10000
) =>
  Effect.gen(function* () {
    const messages: T[] = [];

    const collectFiber = yield* Effect.fork(
      Effect.gen(function* () {
        // Note: This is a simplified implementation
        // In a real scenario, you'd use Stream.take from @effect/stream
        yield* Effect.sync(() => {
          // Placeholder for stream processing
          console.log("Stream processing not implemented in this test helper");
        });
      })
    );

    // Wait for timeout or completion
    yield* Effect.race(
      Effect.succeed(collectFiber),
      Effect.gen(function* () {
        yield* Effect.sleep(`${timeoutMs} millis`);
        yield* Fiber.interrupt(collectFiber);
      })
    );

    return messages;
  });

/**
 * Performance measurement helper
 */
export const measurePerformance = <T>(
  operation: Effect.Effect<T, any, never>,
  label?: string
) =>
  Effect.gen(function* () {
    const start = performance.now();
    const result = yield* operation;
    const end = performance.now();
    const duration = end - start;

    if (label) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  });

/**
 * Validate message structure
 */
export const validateMessage = (message: MessageApi) => {
  expect(message).toHaveProperty("id");
  expect(message).toHaveProperty("text");
  expect(message).toHaveProperty("sender");
  expect(message).toHaveProperty("timestamp");
  expect(["user", "assistant"]).toContain(message.sender);
  expect(typeof message.text).toBe("string");
  expect(message.text.length).toBeGreaterThan(0);
};

/**
 * Validate chat state structure
 */
export const validateChatState = (state: any) => {
  expect(state).toHaveProperty("id");
  expect(state).toHaveProperty("messages");
  expect(state).toHaveProperty("isTyping");
  expect(Array.isArray(state.messages)).toBe(true);
  expect(typeof state.isTyping).toBe("boolean");

  state.messages.forEach(validateMessage);
};
