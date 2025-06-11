import { Effect, Layer, Queue, Stream } from "effect";
import { WebSocketService } from "../../websocket/WebSocketService";
import { AgentEndpointResolverService } from "../AgentEndpointResolverService";

// Real test WebSocket service implementation
export class TestWebSocketService extends Effect.Service<WebSocketService>()(
  "WebSocketService",
  {
    effect: Effect.gen(function* () {
      const messageQueue = yield* Queue.unbounded<any>();
      const isConnected = yield* Effect.succeed(true);

      return {
        connect: (url: string) => Effect.succeed(undefined),
        disconnect: () => Effect.succeed(undefined),
        send: (message: any) => Effect.succeed(undefined),
        receive: () => Stream.fromQueue(messageQueue),
        isConnected: Effect.succeed(true),
      };
    }),
    dependencies: [],
  }
) {}

// Real test endpoint resolver implementation
export class TestEndpointResolverService extends Effect.Service<AgentEndpointResolverService>()(
  "AgentEndpointResolverService",
  {
    effect: Effect.gen(function* () {
      return {
        resolveEndpoint: (agentId: string, chatId: string) =>
          Effect.succeed(`ws://test-endpoint/${agentId}/${chatId}`),
      };
    }),
    dependencies: [],
  }
) {}

// Layer combining both test services
export const TestServicesLive = Layer.merge(
  Layer.succeed(WebSocketService, TestWebSocketService),
  Layer.succeed(AgentEndpointResolverService, TestEndpointResolverService)
); 