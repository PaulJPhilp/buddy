import { Context, Effect, Layer } from "effect";
import {
  type AgentRuntimeConfig,
  AgentRuntimeService, // This is the Tag
  type AgentRuntimeServiceApi,
} from "./agent-runtime/AgentRuntimeService";
import { ChatService } from "./chat/ChatService"; // This is the Tag and also the Layer constructor
import {
  WebSocketService, // This is the Tag and also the Layer constructor
  type WebSocketServiceApi,
} from "./websocket/WebSocketService";

// --- WebSocket Layer ---
// WebSocketService from WebSocketService.ts also functions as its own Live Layer module.
export const WebSocketServiceLive = WebSocketService;

// --- AgentRuntimeConfig Layer ---
// Define a Tag for AgentRuntimeConfig to be provided in the context.
// We extend the base AgentRuntimeConfig in case we need app-specific additions later.
export interface AppAgentRuntimeConfig extends AgentRuntimeConfig {}
export const AppAgentRuntimeConfigTag = Context.Tag<AppAgentRuntimeConfig>(
  "AppAgentRuntimeConfig",
);

// --- AgentRuntimeService Layer ---
// This layer constructs the AgentRuntimeServiceApi using a provided config and WebSocketService.
export const AgentRuntimeServiceLive = Layer.effect(
  AgentRuntimeService, // The Tag we are providing an implementation for
  Effect.gen(function* (_) {
    const config = yield* _(AppAgentRuntimeConfigTag); // Get config from context
    const wsService = yield* _(WebSocketService); // Get WebSocketService from context
    // The 'succeed' method of AgentRuntimeService (the class/namespace) is the factory for the API.
    // Note: AgentRuntimeService.succeed is the factory method within the service definition.
    const agentRuntimeServiceEffect = AgentRuntimeService.succeed(
      config,
      wsService,
    );
    if (agentRuntimeServiceEffect === undefined) {
      console.error(
        "AgentRuntimeServiceLive Error: AgentRuntimeService.succeed(config, wsService) returned undefined directly.",
        { config, wsService },
      );
      throw new Error(
        "AgentRuntimeServiceLive Error: AgentRuntimeService.succeed(config, wsService) returned undefined directly.",
      );
    }
    return yield* _(agentRuntimeServiceEffect);
  }),
).pipe(Layer.provide(WebSocketServiceLive)); // Provide WebSocketService to this layer

// --- ChatService Layer ---
// ChatService from ChatService.ts also functions as its own Live Layer module.
// It internally depends on the AgentRuntimeService Tag.
export const ChatServiceLive = ChatService;

// --- Combined App Layer ---
// This layer combines all necessary services for the chat application.
// It requires AppAgentRuntimeConfigTag to be provided from outside to configure AgentRuntimeService.
export const AppServicesLayer = Layer.empty.pipe(
  Layer.provide(ChatServiceLive),
  Layer.provide(AgentRuntimeServiceLive), // ChatServiceLive depends on AgentRuntimeService
  // WebSocketServiceLive is transitively provided to AgentRuntimeServiceLive
);

/*
Usage Example (e.g., in ChatContainer.tsx or main app setup):

import { makeRuntime } from "@effect/react";
import { defaultRuntime } from "@effect/react/KalRuntime"; // Or your own base runtime

const myAgentConfig: AppAgentRuntimeConfig = { agentId: "specific_agent_for_instance_001" };

const fullAppLayer = Layer.provide(
  AppServicesLayer,
  Layer.succeed(AppAgentRuntimeConfigTag, myAgentConfig)
);

const appSpecificRuntime = makeRuntime(fullAppLayer, defaultRuntime);
const runtime = Effect.runSync(appSpecificRuntime);

// Then use this runtime in <RuntimeProvider runtime={runtime}>
*/
