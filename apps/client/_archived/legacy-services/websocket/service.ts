import { Effect, Queue, Ref, Stream } from "effect";
import {
  AgentKitBridge,
  type AgentKitMessage,
  type AgentKitResponse,
} from "../agentkit-bridge/service";
import type { WebSocketServiceApi } from "./api";
import { WebSocketConnectionError, WebSocketSendError } from "./errors";
import type { ProtocolMessage, UserMessage, WebSocketEnvelope } from "./types";

// Re-export error classes for consumers
export {
  WebSocketConnectionError,
  WebSocketSendError,
  WebSocketError,
} from "./errors";

// Simplified protocol format matching the server
interface SimpleMessage {
  id: string;
  type: string;
  content: string;
  timestamp: number;
}

// Helper functions for simplified protocol
const createMessage = (type: string, content: string): SimpleMessage => ({
  id: Math.random().toString(36).substring(7),
  type,
  content,
  timestamp: Date.now(),
});

/**
 * WebSocket service class implementing the Effect.Service pattern
 * Now using AgentKitBridge instead of actual WebSocket
 */
export class WebSocketService extends Effect.Service<WebSocketServiceApi>()(
  "WebSocketService",
  {
    scoped: Effect.gen(function* () {
      const instanceId = Math.random().toString(36).substring(7);
      console.log(
        "[WebSocketService] Service construction started (AgentKit mode), instanceId:",
        instanceId
      );

      // Get the AgentKit bridge
      const agentKitBridge = yield* AgentKitBridge;

      // Create message queue and stream
      const messageQueue = yield* Queue.unbounded<ProtocolMessage>();
      const messageStream = Stream.fromQueue(messageQueue);

      console.log(
        `[WebSocketService:${instanceId}] Created messageQueue and messageStream`
      );

      // Create connection ref (simulated)
      const connectionRef = yield* Ref.make<boolean>(false);

      // Helper to convert AgentKit response to protocol message
      const convertToProtocolMessage = (
        response: AgentKitResponse
      ): ProtocolMessage => ({
        id: response.id,
        type: "RESPONSE" as any,
        agentRuntimeId: "agentkit-embedded",
        timestamp: response.timestamp,
        sequence: 0,
        payload: {
          type: "AGENT_RESPONSE",
          content: response.content,
          usage: response.usage,
          finishReason: response.finishReason,
        },
        metadata: {
          __tag: "Metadata" as const,
        },
        __tag: "WebSocketMessage" as const,
      });

      // Create service implementation
      const service = {
        _tag: "WebSocketService" as const,
        instanceId,

        connect: (url: string) =>
          Effect.gen(function* () {
            console.log(
              "[WebSocketService] Simulated connection to:",
              url,
              "(using AgentKit)"
            );

            // Simulate connection success
            yield* Ref.set(connectionRef, true);
            console.log(
              "[WebSocketService] AgentKit bridge connected successfully"
            );
          }),

        disconnect: () =>
          Effect.gen(function* () {
            const isConnected = yield* Ref.get(connectionRef);
            if (isConnected) {
              yield* Ref.set(connectionRef, false);
              console.log("[WebSocketService] AgentKit bridge disconnected");
            }
          }),

        cleanup: () =>
          Effect.gen(function* () {
            const isConnected = yield* Ref.get(connectionRef);
            if (isConnected) {
              yield* Ref.set(connectionRef, false);
              console.log("[WebSocketService] AgentKit bridge cleaned up");
            }
          }),

        send: (message: UserMessage | WebSocketEnvelope) =>
          Effect.gen(function* () {
            const isConnected = yield* Ref.get(connectionRef);
            if (!isConnected) {
              return yield* Effect.fail(
                new WebSocketConnectionError({
                  code: "NOT_CONNECTED",
                  message: "Not connected to AgentKit service",
                })
              );
            }

            // Convert message to AgentKit format
            const content =
              "text" in message ? message.text : JSON.stringify(message);
            const agentMessage: AgentKitMessage = {
              id: Math.random().toString(36).substring(7),
              type: "USER_MESSAGE",
              content,
              timestamp: Date.now(),
            };

            console.log(
              "[WebSocketService] Sending message via AgentKit:",
              content
            );

            // Use AgentKit to generate response
            const response = yield* agentKitBridge.generateMessage(
              agentMessage
            );

            // Convert response to protocol message and add to queue
            const protocolMessage = convertToProtocolMessage(response);
            yield* Queue.offer(messageQueue, protocolMessage);

            console.log(
              "[WebSocketService] AgentKit response received and queued:",
              response.content.substring(0, 100) + "..."
            );
          }),

        isConnected: Effect.gen(function* () {
          const isConnected = yield* Ref.get(connectionRef);
          return isConnected;
        }),

        messageStream,
        receive: messageStream,
      } satisfies WebSocketServiceApi;

      console.log(
        "[WebSocketService] Service construction complete (AgentKit mode), instanceId:",
        instanceId
      );
      return service;
    }),
    dependencies: [AgentKitBridge.Default],
  }
) {}
