import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import {
  AgentEndpointNotFoundError,
  AgentEndpointResolverService,
} from "../AgentEndpointResolverService";

// --- Test Suite ---
describe("AgentEndpointResolverService", () => {
  describe("Service Structure", () => {
    it("should have a valid .Default layer", () => {
      expect(AgentEndpointResolverService.Default).toBeDefined();
      expect(typeof AgentEndpointResolverService.Default).toBe("object");
      // Check that it's a proper Layer by verifying it has layer properties
      expect(AgentEndpointResolverService.Default).toHaveProperty("pipe");
    });

    it("should be able to provide the service layer", () => {
      const testEffect = Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        return "success";
      });

      expect(() =>
        testEffect.pipe(Effect.provide(AgentEndpointResolverService.Default)),
      ).not.toThrow();
    });
  });
  describe("resolveEndpoint", () => {
    it("should resolve endpoint for default agent", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "default-agent",
          "test-chat-123",
        );

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=test-chat-123&agentId=default-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should resolve endpoint for business agent", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "business-agent",
          "business-chat-456",
        );

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=business-chat-456&agentId=business-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should resolve endpoint for social agent", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "social-agent",
          "social-chat-789",
        );

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=social-chat-789&agentId=social-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should use default endpoint for unknown agent", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "unknown-agent",
          "unknown-chat-999",
        );

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=unknown-chat-999&agentId=unknown-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle empty agent ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint("", "empty-agent-chat");

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=empty-agent-chat&agentId=",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle empty chat ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint("default-agent", "");

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=&agentId=default-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle special characters in chat ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "default-agent",
          "chat-with-special-chars!@#$%",
        );

        // URL encoding should be handled by URL constructor
        expect(endpoint.includes("chatId=chat-with-special-chars").toBe(true));
        expect(endpoint.includes("agentId=default-agent").toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle special characters in agent ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "agent-with-special-chars!@#",
          "test-chat",
        );

        expect(endpoint.includes("chatId=test-chat").toBe(true));
        expect(
          endpoint.includes("agentId=agent-with-special-chars").toBe(true),
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should preserve existing path if it contains /chat", () =>
      Effect.gen(function* () {
        // This test verifies the URL construction logic
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "default-agent",
          "test-chat",
        );

        // Should contain /chat path
        expect(endpoint.includes("/chat").toBe(true));
        expect(endpoint.startsWith("ws://localhost:8080/chat").toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle very long chat ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const longChatId = "a".repeat(1000);
        const endpoint = yield* service.resolveEndpoint(
          "default-agent",
          longChatId,
        );

        expect(endpoint.includes(`chatId=${longChatId}`).toBe(true));
        expect(endpoint.includes("agentId=default-agent").toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle very long agent ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const longAgentId = `agent-${"b".repeat(1000)}`;
        const endpoint = yield* service.resolveEndpoint(
          longAgentId,
          "test-chat",
        );

        expect(endpoint.includes("chatId=test-chat").toBe(true));
        expect(endpoint.includes(`agentId=${longAgentId}`).toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle numeric chat ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "default-agent",
          "12345",
        );

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=12345&agentId=default-agent",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle numeric agent ID", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint("67890", "test-chat");

        expect(endpoint).toBe(
          "ws://localhost:8080/chat?chatId=test-chat&agentId=67890",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle UUID-like IDs", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const uuidChatId = "550e8400-e29b-41d4-a716-446655440000";
        const uuidAgentId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
        const endpoint = yield* service.resolveEndpoint(
          uuidAgentId,
          uuidChatId,
        );

        expect(endpoint.includes(`chatId=${uuidChatId}`).toBe(true));
        expect(endpoint.includes(`agentId=${uuidAgentId}`).toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle multiple consecutive calls", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;

        const endpoint1 = yield* service.resolveEndpoint("agent1", "chat1");
        const endpoint2 = yield* service.resolveEndpoint("agent2", "chat2");
        const endpoint3 = yield* service.resolveEndpoint("agent1", "chat3");

        expect(endpoint1).toBe(
          "ws://localhost:8080/chat?chatId=chat1&agentId=agent1",
        );
        expect(endpoint2).toBe(
          "ws://localhost:8080/chat?chatId=chat2&agentId=agent2",
        );
        expect(endpoint3).toBe(
          "ws://localhost:8080/chat?chatId=chat3&agentId=agent1",
        );
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should be deterministic for same inputs", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;

        const endpoint1 = yield* service.resolveEndpoint(
          "test-agent",
          "test-chat",
        );
        const endpoint2 = yield* service.resolveEndpoint(
          "test-agent",
          "test-chat",
        );

        expect(endpoint1).toBe(endpoint2);
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));
  });

  describe("URL construction edge cases", () => {
    it("should handle whitespace in IDs", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint(
          "agent with spaces",
          "chat with spaces",
        );

        // URL constructor should handle encoding
        expect(endpoint.includes("ws://localhost:8080/chat").toBe(true));
        expect(endpoint.includes("chatId=").toBe(true));
        expect(endpoint.includes("agentId=").toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));

    it("should handle URL-unsafe characters", () =>
      Effect.gen(function* () {
        const service = yield* AgentEndpointResolverService;
        const endpoint = yield* service.resolveEndpoint("agent&id", "chat?id");

        // Should still construct a valid URL
        expect(endpoint.startsWith("ws://localhost:8080/chat").toBe(true));
        expect(endpoint.includes("chatId=").toBe(true));
        expect(endpoint.includes("agentId=").toBe(true));
      }).pipe(Effect.provide(AgentEndpointResolverService.Default)));
  });
});
