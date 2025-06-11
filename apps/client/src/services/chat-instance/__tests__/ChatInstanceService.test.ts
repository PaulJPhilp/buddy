/**
 * @file ChatInstanceService Tests
 * @module services/chat-instance/ChatInstanceService.test
 */

import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { ChatInstanceService } from "../ChatInstanceService"

describe("ChatInstanceService", () => {
  const TestLayer = ChatInstanceService.Default

  it("should create user messages", () =>
    Effect.gen(function* () {
      const service = yield* ChatInstanceService
      const message = yield* service.createUserMessage("test")

      expect(message.text).toBe("test")
      expect(message.role).toBe("user")
      expect(message.id).toBeDefined()
      expect(message.timestamp).toBeDefined()
    }).pipe(Effect.provide(TestLayer)))

  it("should create streaming messages", () =>
    Effect.gen(function* () {
      const service = yield* ChatInstanceService
      const message = yield* service.createStreamingMessage("test-id", "test")

      expect(message.text).toBe("test")
      expect(message.role).toBe("assistant")
      expect(message.id).toBe("test-id")
      expect(message.metadata?.streaming).toBe(true)
    }).pipe(Effect.provide(TestLayer)))

  it("should finalize streaming messages", () =>
    Effect.gen(function* () {
      const service = yield* ChatInstanceService
      const message = yield* service.finalizeStreamingMessage("test-id", "test")

      expect(message.text).toBe("test")
      expect(message.role).toBe("assistant")
      expect(message.id).toBe("test-id")
      expect(message.metadata?.streaming).toBe(false)
      expect(message.metadata?.mdx).toBeDefined()
    }).pipe(Effect.provide(TestLayer)))

  it("should convert protocol messages", () =>
    Effect.gen(function* () {
      const service = yield* ChatInstanceService
      const message = yield* service.convertProtocolMessageToUIMessage({
        type: "LLM_RESPONSE",
        id: "test-id",
        content: "test",
        timestamp: new Date().toISOString(),
      })

      expect(message?.text).toBe("test")
      expect(message?.role).toBe("assistant")
      expect(message?.id).toBe("test-id")
      expect(message?.metadata?.mdx).toBeDefined()
    }).pipe(Effect.provide(TestLayer)))
}) 