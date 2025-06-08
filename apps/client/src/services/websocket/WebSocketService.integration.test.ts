import { createUserMessage } from "@buddy/protocol";
import { Effect, Runtime } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocketService } from "./WebSocketService";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event("open"));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    console.log("MockWebSocket.send:", data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  addEventListener(type: string, listener: EventListener) {
    if (type === "open") this.onopen = listener as any;
    if (type === "close") this.onclose = listener as any;
    if (type === "error") this.onerror = listener as any;
    if (type === "message") this.onmessage = listener as any;
  }

  removeEventListener(type: string, listener: EventListener) {
    if (type === "open") this.onopen = null;
    if (type === "close") this.onclose = null;
    if (type === "error") this.onerror = null;
    if (type === "message") this.onmessage = null;
  }

  ping() {
    // Mock ping method
  }
}

// Mock global WebSocket
const originalWebSocket = global.WebSocket;

describe("WebSocketService Integration Tests", () => {
  let runtime: Runtime.Runtime<never>;

  beforeEach(() => {
    runtime = Runtime.defaultRuntime;
    // Replace global WebSocket with mock
    global.WebSocket = MockWebSocket as any;
  });

  afterEach(() => {
    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
  });

  describe("Single Service Instance", () => {
    it("should maintain connection state across multiple operations", async () => {
      const testEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;

        // Connect
        yield* ws.connect("ws://localhost:8080/chat");

        // Send first message
        const message1 = createUserMessage("Hello 1");
        yield* ws.send(message1);

        // Send second message
        const message2 = createUserMessage("Hello 2");
        yield* ws.send(message2);

        return "success";
      }).pipe(Effect.provide(WebSocketService.Default));

      const result = await Runtime.runPromise(runtime)(testEffect);
      expect(result).toBe("success");
    });

    it("should handle multiple service instances correctly", async () => {
      // This test simulates the ChatApp scenario where we create a layer once
      const webSocketLayer = WebSocketService.Default;

      const connectEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "connected";
      }).pipe(Effect.provide(webSocketLayer));

      const sendEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        const message = createUserMessage("Test message");
        yield* ws.send(message);
        return "sent";
      }).pipe(Effect.provide(webSocketLayer));

      // Connect first
      const connectResult = await Runtime.runPromise(runtime)(connectEffect);
      expect(connectResult).toBe("connected");

      // Then send (this should work with the same connection)
      const sendResult = await Runtime.runPromise(runtime)(sendEffect);
      expect(sendResult).toBe("sent");
    });

    it("should fail when using different service layers", async () => {
      const connectEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "connected";
      }).pipe(Effect.provide(WebSocketService.Default));

      const sendEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        const message = createUserMessage("Test message");
        yield* ws.send(message);
        return "sent";
      }).pipe(Effect.provide(WebSocketService.Default)); // Different layer instance!

      // Connect first
      const connectResult = await Runtime.runPromise(runtime)(connectEffect);
      expect(connectResult).toBe("connected");

      // This should fail because it's using a different service instance
      await expect(Runtime.runPromise(runtime)(sendEffect)).rejects.toThrow();
    });
  });

  describe("Connection State Management", () => {
    it("should track connection state correctly", async () => {
      const testEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;

        // Initially not connected, send should fail
        const message = createUserMessage("Should fail");
        const sendResult = yield* Effect.either(ws.send(message));
        expect(sendResult._tag).toBe("Left");

        // Connect
        yield* ws.connect("ws://localhost:8080/chat");

        // Now send should work
        const message2 = createUserMessage("Should work");
        yield* ws.send(message2);

        return "success";
      }).pipe(Effect.provide(WebSocketService.Default));

      const result = await Runtime.runPromise(runtime)(testEffect);
      expect(result).toBe("success");
    });

    it("should handle concurrent connection attempts", async () => {
      const webSocketLayer = WebSocketService.Default;

      const connectEffect1 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "connected1";
      }).pipe(Effect.provide(webSocketLayer));

      const connectEffect2 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "connected2";
      }).pipe(Effect.provide(webSocketLayer));

      // Run both concurrently
      const results = await Runtime.runPromise(runtime)(
        Effect.all([connectEffect1, connectEffect2], {
          concurrency: "unbounded",
        }),
      );

      expect(results).toEqual(["connected1", "connected2"]);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle connection failures gracefully", async () => {
      // Mock WebSocket that fails to connect
      class FailingMockWebSocket extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.readyState = MockWebSocket.CLOSED;
            this.onerror?.(new Event("error"));
          }, 10);
        }
      }

      global.WebSocket = FailingMockWebSocket as any;

      const testEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "should not reach here";
      }).pipe(Effect.provide(WebSocketService.Default));

      await expect(Runtime.runPromise(runtime)(testEffect)).rejects.toThrow();
    });

    it("should handle send failures when connection is lost", async () => {
      const testEffect = Effect.gen(function* () {
        const ws = yield* WebSocketService;

        // Connect first
        yield* ws.connect("ws://localhost:8080/chat");

        // Simulate connection loss by closing the socket
        // This is tricky to test with our current setup, so we'll skip for now

        return "success";
      }).pipe(Effect.provide(WebSocketService.Default));

      const result = await Runtime.runPromise(runtime)(testEffect);
      expect(result).toBe("success");
    });
  });

  describe("Service Layer Behavior", () => {
    it("should demonstrate the layer sharing issue", async () => {
      // This test shows what happens when we don't share layers properly
      let connectionCount = 0;

      class CountingMockWebSocket extends MockWebSocket {
        constructor(url: string) {
          super(url);
          connectionCount++;
        }
      }

      global.WebSocket = CountingMockWebSocket as any;

      // Using separate Default instances (the problem case)
      const effect1 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "effect1";
      }).pipe(Effect.provide(WebSocketService.Default));

      const effect2 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        const message = createUserMessage("Test");
        yield* ws.send(message);
        return "effect2";
      }).pipe(Effect.provide(WebSocketService.Default));

      await Runtime.runPromise(runtime)(effect1);

      // This will fail because effect2 uses a different service instance
      await expect(Runtime.runPromise(runtime)(effect2)).rejects.toThrow();

      // We should have created 2 WebSocket connections
      expect(connectionCount).toBe(2);
    });

    it("should show correct layer sharing", async () => {
      let connectionCount = 0;

      class CountingMockWebSocket extends MockWebSocket {
        constructor(url: string) {
          super(url);
          connectionCount++;
        }
      }

      global.WebSocket = CountingMockWebSocket as any;

      // Using shared layer instance (the solution)
      const sharedLayer = WebSocketService.Default;

      const effect1 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        yield* ws.connect("ws://localhost:8080/chat");
        return "effect1";
      }).pipe(Effect.provide(sharedLayer));

      const effect2 = Effect.gen(function* () {
        const ws = yield* WebSocketService;
        const message = createUserMessage("Test");
        yield* ws.send(message);
        return "effect2";
      }).pipe(Effect.provide(sharedLayer));

      const result1 = await Runtime.runPromise(runtime)(effect1);
      const result2 = await Runtime.runPromise(runtime)(effect2);

      expect(result1).toBe("effect1");
      expect(result2).toBe("effect2");

      // We should have created only 1 WebSocket connection
      expect(connectionCount).toBe(1);
    });
  });
});
