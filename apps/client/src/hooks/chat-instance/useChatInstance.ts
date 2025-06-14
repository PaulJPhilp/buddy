/**
 * @file useChatInstance - React hook using xState/store + Effect.js architecture
 * @module hooks/chat-instance/useChatInstance
 */

import { useStore } from "@xstate/store/react";
import { Effect, Fiber, Layer, Logger } from "effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  agentSelectors,
  agentStore,
  chatInstanceSelectors,
  chatInstanceStore,
  connectionSelectors,
  connectionStore,
} from "@/hooks/chat-instance/stores";

// Import bridge
import { ChatInstanceBridge } from "./bridges";

// Import services
import {
  AgentCommunicationService,
  ChatInstanceService,
  ConnectionManagementService,
} from "@/services/chat-instance";

import { AgentEndpointResolverService } from "@/services/chat-runtime/AgentEndpointResolverService";
// Import existing services for compatibility
import { ChatRuntimeService } from "@/services/chat-runtime/ChatRuntimeService";
import { MdxService } from "@/services/mdx";
import { WebSocketService } from "@/services/websocket/WebSocketService";

import type { AgentRuntimeError } from "@/services/chat-runtime/ChatRuntimeService";
// Import types
import type { ChatAgentConfig, ChatInstanceAction } from "@/types/chat";

// Hook state interface (compatible with existing interface)
export interface ChatInstanceHookState {
  readonly chatId: string;
  readonly messages: ReadonlyArray<any>; // Using any for now to match existing interface
  readonly status:
    | "initializing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "reconnecting"
    | "error";
  readonly agentName: string;
  readonly isTyping: boolean;
  readonly isRendering: boolean;
  readonly error?: string;
}

/**
 * useChatInstance - React hook using xState/store + Effect.js architecture
 *
 * This hook provides the same interface as the original useChatInstance but uses
 * the new event-driven architecture with proper separation of concerns.
 */
export function useChatInstance(
  chatId: string,
  agentConfigData: ChatAgentConfig,
  injectedLayer?: Layer.Layer<any, any, any>,
): {
  chatState: ChatInstanceHookState;
  runtimeError: AgentRuntimeError | null;
  dispatchAction: (action: ChatInstanceAction) => void;
} {
  // Extract agent configuration
  const agentId = useMemo(
    () => agentConfigData.agentId,
    [agentConfigData.agentId],
  );
  const initialAgentName = useMemo(
    () => agentConfigData.initialAgentName,
    [agentConfigData.initialAgentName],
  );
  const prompt = useMemo(
    () => agentConfigData.prompt,
    [agentConfigData.prompt],
  );

  // Handle loading state - don't initialize if we're still loading config
  const isLoading = chatId === "loading" || agentId === "loading";

  // Manual subscription to chatInstanceStore
  const [chatInstanceContext, setChatInstanceContext] = useState(
    chatInstanceStore.getSnapshot().context,
  );
  useEffect(() => {
    const sub = chatInstanceStore.subscribe(() => {
      setChatInstanceContext(chatInstanceStore.getSnapshot().context);
    });
    return () => sub.unsubscribe();
  }, []);

  // Manual subscription to agentStore
  const [agentContext, setAgentContext] = useState(
    agentStore.getSnapshot().context,
  );
  useEffect(() => {
    const sub = agentStore.subscribe(() => {
      setAgentContext(agentStore.getSnapshot().context);
    });
    return () => sub.unsubscribe();
  }, []);

  // Manual subscription to connectionStore
  const [connectionContext, setConnectionContext] = useState(
    connectionStore.getSnapshot().context,
  );
  useEffect(() => {
    const sub = connectionStore.subscribe(() => {
      setConnectionContext(connectionStore.getSnapshot().context);
    });
    return () => sub.unsubscribe();
  }, []);

  // Local state for runtime error and bridge
  const [runtimeError, setRuntimeError] = useState<AgentRuntimeError | null>(
    null,
  );
  const [bridge, setBridge] = useState<any>(null);
  const bridgeRef = useRef<any>(null);

  // Add after imports and before the hook definition or inside the hook
  const pendingActionsRef = useRef<ChatInstanceAction[]>([]);

  // Create service layer - provide bridge dependencies explicitly
  const serviceLayer = useMemo(() => {
    if (injectedLayer) {
      return injectedLayer;
    }

    // Create the dependencies layer that the bridge needs
    console.log("[useChatInstance] Checking service defaults:");
    console.log("ChatInstanceService.Default:", ChatInstanceService.Default);
    console.log(
      "AgentCommunicationService.Default:",
      AgentCommunicationService.Default,
    );
    console.log(
      "ConnectionManagementService.Default:",
      ConnectionManagementService.Default,
    );
    console.log("ChatRuntimeService.Default:", ChatRuntimeService.Default);
    console.log(
      "AgentEndpointResolverService.Default:",
      AgentEndpointResolverService.Default,
    );
    console.log("WebSocketService.Default:", WebSocketService.Default);
    console.log("MdxService.Default:", MdxService.Default);

    // Test each service individually to find the undefined one
    const services = [
      { name: "ChatInstanceService", service: ChatInstanceService.Default },
      {
        name: "AgentCommunicationService",
        service: AgentCommunicationService.Default,
      },
      {
        name: "ConnectionManagementService",
        service: ConnectionManagementService.Default,
      },
      { name: "ChatRuntimeService", service: ChatRuntimeService.Default },
      {
        name: "AgentEndpointResolverService",
        service: AgentEndpointResolverService.Default,
      },
      { name: "WebSocketService", service: WebSocketService.Default },
      { name: "MdxService", service: MdxService.Default },
    ];

    for (const { name, service } of services) {
      console.log(`[useChatInstance] Testing ${name}:`, service);
      if (service === undefined) {
        console.error(`[useChatInstance] ❌ ${name}.Default is undefined!`);
      } else {
        console.log(`[useChatInstance] ✅ ${name}.Default is valid`);
      }
    }

    // Create layers with better error handling
    const dependenciesLayer = Layer.mergeAll(
      ChatInstanceService.Default,
      AgentCommunicationService.Default,
      ConnectionManagementService.Default,
      ChatRuntimeService.Default,
      AgentEndpointResolverService.Default,
      WebSocketService.Default,
      MdxService.Default,
      Logger.pretty, // Add logger service to handle Effect.logInfo and other logging
    );
    console.log("[useChatInstance] Dependencies layer created successfully");

    // Then provide the bridge on top of its dependencies
    let layer: Layer.Layer<any, any, any>;
    try {
      layer = Layer.provide(ChatInstanceBridge.Default, dependenciesLayer);
      console.log("[useChatInstance] Service layer created successfully");
    } catch (error) {
      console.error("[useChatInstance] Failed to create service layer:", error);
      throw error;
    }

    console.log("[useChatInstance] Service layer created:", layer);
    return layer;
  }, [injectedLayer]);

  // Initialize bridge and services
  useEffect(() => {
    // Don't initialize if we're still loading config
    if (isLoading) {
      return;
    }

    const program = Effect.gen(function* () {
      console.log("[useChatInstance] Program Effect.gen started");

      console.log(
        `[useChatInstance] Initializing for chatId: ${chatId}, agentId: ${agentId}, prompt: ${prompt ? "provided" : "none"}`,
      );

      console.log("[useChatInstance] About to get ChatInstanceBridge service");

      // Get bridge service
      const bridgeService = yield* ChatInstanceBridge;
      console.log(
        "[useChatInstance] ChatInstanceBridge yielded successfully:",
        bridgeService,
      );

      setBridge(bridgeService);
      bridgeRef.current = bridgeService;

      console.log("[useChatInstance] About to initialize bridge");

      // Initialize the bridge
      yield* bridgeService.initialize(
        chatId,
        agentId,
        initialAgentName,
        prompt,
      );

      console.log("[useChatInstance] Bridge initialized successfully");

      return bridgeService;
    });

    console.log("[useChatInstance] About to create fiber with service layer");
    console.log("[useChatInstance] Service layer:", serviceLayer);
    console.log("[useChatInstance] Service layer type:", typeof serviceLayer);
    console.log(
      "[useChatInstance] Service layer keys:",
      Object.keys(serviceLayer),
    );

    // Test individual services to identify the problematic one
    const testIndividualServices = async () => {
      const individualServices = [
        { name: "ChatInstanceService", layer: ChatInstanceService.Default },
        {
          name: "AgentCommunicationService",
          layer: AgentCommunicationService.Default,
        },
        {
          name: "ConnectionManagementService",
          layer: ConnectionManagementService.Default,
        },
        { name: "ChatRuntimeService", layer: ChatRuntimeService.Default },
        {
          name: "AgentEndpointResolverService",
          layer: AgentEndpointResolverService.Default,
        },
        { name: "WebSocketService", layer: WebSocketService.Default },
        { name: "MdxService", layer: MdxService.Default },
        { name: "Logger", layer: Logger.pretty },
      ];

      for (const { name, layer } of individualServices) {
        console.log(`[useChatInstance] Testing ${name}...`);
        try {
          // Just test if we can run a simple effect with the layer
          const testEffect = Effect.succeed("test").pipe(Effect.provide(layer));
          const result = await Effect.runPromise(testEffect);
          console.log(`[useChatInstance] ✅ ${name} works:`, result);
        } catch (error) {
          console.log(`[useChatInstance] ❌ ${name} failed:`, error);
        }
      }
    };

    testIndividualServices();

    // Skip the full layer test for now
    // Effect.runPromise(testEffect.pipe(Effect.provide(serviceLayer)))
    //   .then((result) =>
    //     console.log("[useChatInstance] Test effect result:", result),
    //   )
    //   .catch((error) =>
    //     console.error("[useChatInstance] Test effect error:", error),
    //   );

    // Add debugging to see if the fiber execution starts
    console.log("[useChatInstance] About to run fiber with service layer");

    const fiberProgram = Effect.gen(function* () {
      console.log("[useChatInstance] Fiber program starting");

      try {
        const result = yield* program;
        console.log("[useChatInstance] Program completed successfully");
        return result;
      } catch (error) {
        console.error("[useChatInstance] Program failed with error:", error);
        setRuntimeError(error as AgentRuntimeError);
        throw error;
      }
    });

    console.log(
      "[useChatInstance] Fiber program created, now providing service layer",
    );
    const providedProgram = fiberProgram.pipe(Effect.provide(serviceLayer));
    console.log("[useChatInstance] Service layer provided, creating fiber");

    const fiber = Effect.runFork(providedProgram);

    console.log("[useChatInstance] Fiber created:", fiber.id().id);

    // Add fiber result monitoring with detailed error inspection
    Effect.runFork(
      Effect.gen(function* () {
        const exit = yield* Fiber.await(fiber);
        console.log("[useChatInstance] Fiber completed with exit:", exit);

        // Check if it's a failure and extract error details
        if (exit._tag === "Failure") {
          console.error(
            "[useChatInstance] Fiber failed with cause:",
            exit.cause,
          );
          console.error("[useChatInstance] Fiber failure details:", {
            op: exit.cause._op,
            tag: exit.cause._tag,
            message: exit.cause.message,
            stack: exit.cause.stack,
            error: exit.cause,
          });
        }
      }).pipe(
        Effect.catchAll((error) => {
          console.error("[useChatInstance] Error monitoring fiber:", error);
          setRuntimeError(error as AgentRuntimeError);
          return Effect.succeed(undefined);
        }),
      ),
    );

    // Cleanup function
    return () => {
      Effect.runFork(
        Effect.gen(function* () {
          console.log(
            `[useChatInstance] Cleaning up for ${chatId}, interrupting fiber ${fiber.id().id}`,
          );

          if (bridgeRef.current) {
            yield* bridgeRef.current.cleanup();
          }

          yield* Fiber.interrupt(fiber);
        }).pipe(
          Effect.catchAll((error) => {
            console.error("[useChatInstance] Error during cleanup", error);
            return Effect.succeed(undefined);
          }),
        ),
      );

      setBridge(null);
      bridgeRef.current = null;
      setRuntimeError(null);
    };
  }, [chatId, agentId, initialAgentName, prompt, serviceLayer, isLoading]);

  // Modify dispatchAction implementation
  const dispatchAction = useCallback(
    (action: ChatInstanceAction) => {
      console.log("[useChatInstance] dispatchAction called with:", action);

      if (!bridge) {
        console.warn(
          "[useChatInstance] Bridge not initialized yet – queuing action:",
          action,
        );
        pendingActionsRef.current.push(action);
        return;
      }

      console.log("[useChatInstance] Processing action through bridge");

      Effect.runFork(
        bridge.processAction(action).pipe(
          Effect.catchAll((error) => {
            console.error("[useChatInstance] Error processing action", error);
            return Effect.succeed(undefined);
          }),
        ),
      );
    },
    [bridge],
  );

  // Add effect to flush queued actions when bridge becomes available
  useEffect(() => {
    if (bridge && pendingActionsRef.current.length > 0) {
      console.log(
        `[useChatInstance] Flushing ${pendingActionsRef.current.length} queued actions`,
      );
      for (const queued of pendingActionsRef.current) {
        Effect.runFork(
          bridge.processAction(queued).pipe(
            Effect.catchAll((error) => {
              console.error(
                "[useChatInstance] Error processing queued action",
                error,
              );
              return Effect.succeed(undefined);
            }),
          ),
        );
      }
      pendingActionsRef.current = [];
    }
  }, [bridge]);

  // Combine store states into hook state (compatible interface)
  const chatState: ChatInstanceHookState = useMemo(() => {
    console.log("[useChatInstance] Computing chatState");
    console.log("[useChatInstance] isLoading:", isLoading);
    console.log("[useChatInstance] chatInstanceContext:", chatInstanceContext);
    console.log(
      "[useChatInstance] chatInstanceContext.messages:",
      chatInstanceContext?.messages,
    );
    console.log("[useChatInstance] agentContext:", agentContext);

    if (isLoading) {
      return {
        chatId: "loading",
        messages: [],
        status: "initializing" as const,
        agentName: "Loading...",
        isTyping: false,
        isRendering: false,
      };
    }

    // Combine messages from chat instance store and pending messages from agent store
    const chatMessages = chatInstanceContext?.messages || [];
    const pendingMessages = agentContext?.pendingMessages || [];
    const allMessages = [...chatMessages, ...pendingMessages];

    console.log("[useChatInstance] chatMessages count:", chatMessages.length);
    console.log(
      "[useChatInstance] pendingMessages count:",
      pendingMessages.length,
    );
    console.log("[useChatInstance] chatMessages:", chatMessages);
    console.log("[useChatInstance] pendingMessages:", pendingMessages);
    console.log("[useChatInstance] allMessages count:", allMessages.length);
    console.log("[useChatInstance] allMessages:", allMessages);

    const finalState = {
      chatId: chatInstanceContext?.chatId || chatId,
      messages: allMessages,
      status: chatInstanceContext?.status || "initializing",
      agentName: chatInstanceContext?.agentName || initialAgentName,
      isTyping: chatInstanceContext?.isTyping || false,
      isRendering: chatInstanceContext?.isRendering || false,
      error: chatInstanceContext?.error,
    };

    console.log("[useChatInstance] Final computed chatState:", finalState);

    return finalState;
  }, [chatInstanceContext, agentContext, chatId, initialAgentName, isLoading]);

  return {
    chatState,
    runtimeError,
    dispatchAction,
  };
}
