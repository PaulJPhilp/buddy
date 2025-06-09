/**
 * @file ChatInstanceService Tests
 * @module services/chat-instance/ChatInstanceService.test
 */

import { MdxService } from "@/services/mdx";
import type { ProtocolMessage } from "@buddy/protocol";
import { Effect, Layer } from "effect";
import { describe, expect, test } from "vitest";
import { ChatInstanceService } from "./ChatInstanceService";

// Mock MdxService for testing
const MockMdxService = Layer.succeed(MdxService, {
    compile: (content: string) =>
        Effect.succeed({
            compiledSource: `<p>${content}</p>`,
            frontmatter: {},
            metadata: {},
        }),
});

const TestLayer = Layer.provide(ChatInstanceService.Default, MockMdxService);

describe("ChatInstanceService", () => {
    test("should create user message", async () => {
        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.createUserMessage("Hello world", [{ name: "file.txt" }]);

            expect(message.text).toBe("Hello world");
            expect(message.role).toBe("user");
            expect(message.attachments).toEqual([{ name: "file.txt" }]);
            expect(message.id).toBeDefined();
            expect(message.timestamp).toBeGreaterThan(0);

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeDefined();
    });

    test("should create streaming message", async () => {
        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.createStreamingMessage("stream-123", "Partial text");

            expect(message.id).toBe("stream-123");
            expect(message.text).toBe("Partial text");
            expect(message.role).toBe("assistant");
            expect(message.metadata?.streaming).toBe(true);

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeDefined();
    });

    test("should finalize streaming message", async () => {
        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.finalizeStreamingMessage("stream-123", "Complete text");

            expect(message.id).toBe("stream-123");
            expect(message.text).toBe("Complete text");
            expect(message.role).toBe("assistant");
            expect(message.metadata?.streaming).toBe(false);
            expect(message.metadata?.mdx).toBeDefined();

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeDefined();
    });

    test("should convert LLM_RESPONSE protocol message", async () => {
        const protocolMessage: ProtocolMessage = {
            type: "LLM_RESPONSE",
            id: "msg-123",
            content: "Hello from LLM",
            timestamp: "2024-01-01T00:00:00Z",
            metadata: { test: true },
        };

        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.convertProtocolMessageToUIMessage(protocolMessage);

            expect(message).toBeDefined();
            expect(message?.id).toBe("msg-123");
            expect(message?.text).toBe("Hello from LLM");
            expect(message?.role).toBe("assistant");
            expect(message?.metadata?.test).toBe(true);
            expect(message?.metadata?.mdx).toBeDefined();

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeDefined();
    });

    test("should convert ERROR protocol message", async () => {
        const protocolMessage: ProtocolMessage = {
            type: "ERROR",
            id: "error-123",
            message: "Something went wrong",
            code: "ERR_001",
            timestamp: "2024-01-01T00:00:00Z",
        };

        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.convertProtocolMessageToUIMessage(protocolMessage);

            expect(message).toBeDefined();
            expect(message?.id).toBe("error-123");
            expect(message?.text).toBe("Error: Something went wrong");
            expect(message?.role).toBe("assistant");
            expect(message?.metadata?.error).toBe(true);
            expect(message?.metadata?.code).toBe("ERR_001");

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeDefined();
    });

    test("should return null for completed LLM_STREAM", async () => {
        const protocolMessage: ProtocolMessage = {
            type: "LLM_STREAM",
            id: "stream-123",
            content: "Final content",
            timestamp: "2024-01-01T00:00:00Z",
            isComplete: true,
        };

        const program = Effect.gen(function* () {
            const service = yield* ChatInstanceService;
            const message = yield* service.convertProtocolMessageToUIMessage(protocolMessage);

            expect(message).toBeNull();

            return message;
        });

        const result = await Effect.runPromise(
            Effect.provide(program, TestLayer)
        );

        expect(result).toBeNull();
    });
}); 