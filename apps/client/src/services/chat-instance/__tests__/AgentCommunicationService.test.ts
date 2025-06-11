import { createMessage } from "@buddy/protocol";
import { Effect, Layer, Stream } from "effect";
import { describe, expect, it } from "vitest";
import { AgentEndpointResolverService } from "../../chat-runtime/AgentEndpointResolverService";
import { ChatRuntimeService } from "../../chat-runtime/ChatRuntimeService";
import { WebSocketService } from "../../websocket/WebSocketService";
import {
  AgentCommunicationService,
  MessageSendError,
  SessionEstablishmentError,
} from "../AgentCommunicationService";

// --- Test Suite ---
describe("AgentCommunicationService", () => {
  // Test data
  const testAgentId = "test-agent";
  const testChatId = "test-chat";
  const testMessage = "Hello, world!";

  describe("establishSession", () => {
    it("should establish session successfully", () =>
      Effect.gen(function* () {
        const service = yield* AgentCommunicationService;
        const session = yield* service.establishSession(testAgentId, testChatId);
        
        expect(typeof session.id).toBe("string");
        expect(typeof session.url).toBe("string");
        expect(typeof session.send).toBe("function");
        expect(session.incomingMessages$).toBeDefined();
        expect(session.status$).toBeDefined();
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            WebSocketService.Default,
            AgentEndpointResolverService.Default,
            ChatRuntimeService.Default,
            AgentCommunicationService.Default
          )
        )
      ));

    it("should handle empty agent ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentCommunicationService;
        const session = yield* service.establishSession("", testChatId);
        
        expect(typeof session.id).toBe("string");
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            WebSocketService.Default,
            AgentEndpointResolverService.Default,
            ChatRuntimeService.Default,
            AgentCommunicationService.Default
          )
        )
      ));
  });

  describe("sendMessage", () => {
    it("should send message successfully", () =>
      Effect.gen(function* () {
        const service = yield* AgentCommunicationService;
        const session = yield* service.establishSession(testAgentId, testChatId);
        
        yield* service.sendMessage(session, testMessage, testChatId);
        
        // If we reach here, the message was sent successfully
        expect(true).toBe(true);
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            WebSocketService.Default,
            AgentEndpointResolverService.Default,
            ChatRuntimeService.Default,
            AgentCommunicationService.Default
          )
        )
      ));
  });

  describe("createIncomingMessageStream", () => {
    it("should create incoming message stream", () =>
      Effect.gen(function* () {
        const service = yield* AgentCommunicationService;
        const session = yield* service.establishSession(testAgentId, testChatId);
        
        const stream = service.createIncomingMessageStream(session);
        
        // Verify stream is created (it should be the same as session.incomingMessages$)
        expect(stream).toBe(session.incomingMessages$);
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            WebSocketService.Default,
            AgentEndpointResolverService.Default,
            ChatRuntimeService.Default,
            AgentCommunicationService.Default
          )
        )
      ));
  });

  describe("createStatusStream", () => {
    it("should create status stream", () =>
      Effect.gen(function* () {
        const service = yield* AgentCommunicationService;
        const session = yield* service.establishSession(testAgentId, testChatId);
        
        const stream = service.createStatusStream(session);
        
        // Verify stream is created (it should be the same as session.status$)
        expect(stream).toBe(session.status$);
      }).pipe(
        Effect.provide(
          Layer.mergeAll(
            WebSocketService.Default,
            AgentEndpointResolverService.Default,
            ChatRuntimeService.Default,
            AgentCommunicationService.Default
          )
        )
      ));
  });
}); 