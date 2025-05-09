import { ChatService } from "@/app-chat/ChatService";
import { MockChatService } from "../app-chat/MockChatService";
import { AgentRuntimeService } from "@/services/AgentRuntimeService";
import { MockWebSocketServer } from "@/services/MockWebSocketServer";
import { WebSocketService } from "@/services/WebSocketService";
import { Config, Effect, Layer } from "effect";

// Supervisor Effect that manages all child Effects
export const appSupervisorEffect = Effect.gen(function* () {
  // Configuration for using mock chat service
  const useMockChat = yield* Config.boolean("USE_MOCK_CHAT").pipe(Config.withDefault(false));

  yield* Effect.logInfo(
    useMockChat ? "Using MockChatService" : "Using ChatService"
  );

  // Start chat apps
  yield* Effect.logDebug("Starting chat apps");

  // Create the base layer with all required services
  const baseLayer = Layer.mergeAll(
    MockWebSocketServer.Default,
    WebSocketService.Default,
    AgentRuntimeService.Default
  );

  // Determine which chat service layer to use
  const chatServiceImpl = useMockChat
    ? MockChatService.Default // Use MockChatService.Default if the flag is true
    : ChatService.Default;    // Otherwise, use the real ChatService.Default

  // Create independent chat service layers with dependencies
  const chat1Layer = Layer.provide(
    chatServiceImpl, // Use the selected implementation
    baseLayer
  );

  const chat2Layer = Layer.provide(
    chatServiceImpl, // Use the selected implementation
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
