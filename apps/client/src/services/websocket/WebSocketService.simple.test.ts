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
}

const originalWebSocket = global.WebSocket;

describe("WebSocketService Global Singleton Test", () => {
    let runtime: Runtime.Runtime<never>;

    beforeEach(() => {
        runtime = Runtime.defaultRuntime;
        global.WebSocket = MockWebSocket as any;
    });

    afterEach(() => {
        global.WebSocket = originalWebSocket;
    });

    it("should share connection state across different Effect chains", async () => {
        // This simulates the ChatApp scenario where we have separate Effect chains
        // for connecting and sending messages

        // First Effect chain: Connect to WebSocket
        const connectEffect = Effect.gen(function* () {
            const ws = yield* WebSocketService;
            yield* ws.connect("ws://localhost:8080");
            return "connected";
        }).pipe(Effect.provide(WebSocketService.Default));

        // Second Effect chain: Send a message (should use the same connection)
        const sendEffect = Effect.gen(function* () {
            const ws = yield* WebSocketService;
            const message = createUserMessage("Test message");
            yield* ws.send(message);
            return "sent";
        }).pipe(Effect.provide(WebSocketService.Default));

        // Execute connect first
        const connectResult = await Runtime.runPromise(runtime)(connectEffect);
        expect(connectResult).toBe("connected");

        // Then execute send - this should work if our global singleton is working
        const sendResult = await Runtime.runPromise(runtime)(sendEffect);
        expect(sendResult).toBe("sent");
    });

    it("should maintain connection across multiple send operations", async () => {
        // Connect once
        const connectEffect = Effect.gen(function* () {
            const ws = yield* WebSocketService;
            yield* ws.connect("ws://localhost:8080");
            return "connected";
        }).pipe(Effect.provide(WebSocketService.Default));

        // Send multiple messages in separate Effect chains
        const sendEffect1 = Effect.gen(function* () {
            const ws = yield* WebSocketService;
            const message = createUserMessage("Message 1");
            yield* ws.send(message);
            return "sent1";
        }).pipe(Effect.provide(WebSocketService.Default));

        const sendEffect2 = Effect.gen(function* () {
            const ws = yield* WebSocketService;
            const message = createUserMessage("Message 2");
            yield* ws.send(message);
            return "sent2";
        }).pipe(Effect.provide(WebSocketService.Default));

        // Execute all operations
        const connectResult = await Runtime.runPromise(runtime)(connectEffect);
        expect(connectResult).toBe("connected");

        const sendResult1 = await Runtime.runPromise(runtime)(sendEffect1);
        expect(sendResult1).toBe("sent1");

        const sendResult2 = await Runtime.runPromise(runtime)(sendEffect2);
        expect(sendResult2).toBe("sent2");
    });
}); 