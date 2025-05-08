import { ChatService } from "@/app-chat/ChatService";
import { AgentRuntimeService } from "@/services/AgentRuntimeService";
import { MockWebSocketServer } from "@/services/MockWebSocketServer";
import { WebSocketService } from "@/services/WebSocketService";
import { Effect, Layer } from "effect";

// Supervisor Effect that manages all child Effects
export const appSupervisorEffect = Effect.gen(function* () {
  // Start chat apps
  yield* Effect.logDebug("Starting chat apps");

  // Create the base layer with all required services
  const baseLayer = Layer.mergeAll(
    MockWebSocketServer.Default,
    WebSocketService.Default,
    AgentRuntimeService.Default
  );

  // Create independent chat service layers with dependencies
  const chat1Layer = Layer.provide(
    ChatService.Default,
    baseLayer
  );

  const chat2Layer = Layer.provide(
    ChatService.Default,
    baseLayer
  );

  // Start mock server
  yield* Effect.provide(
    Effect.gen(function* () {
      const server = yield* MockWebSocketServer;
      yield* server.start(3000);
    }),
    baseLayer
  );

  // Fork chat apps with their respective layers
  yield* Effect.forkDaemon(
    Effect.provide(
      Effect.never,
      chat1Layer
    )
  );

  yield* Effect.forkDaemon(
    Effect.provide(
      Effect.never,
      chat2Layer
    )
  );

  // Keep supervisor alive
  yield* Effect.never;
}).pipe(
  Effect.interruptible,
  Effect.annotateLogs({ supervisor: "AppSupervisor" })
);
