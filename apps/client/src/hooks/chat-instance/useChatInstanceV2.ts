/**
 * @file useChatInstanceV2 - New React hook using xState/store + Effect.js architecture
 * @module hooks/chat-instance/useChatInstanceV2
 */

import { useStore } from "@xstate/store/react";
import { Effect, Layer } from "effect";
import { useCallback, useEffect, useMemo, useState } from "react";

// Import stores
import {
    agentSelectors,
    agentStore,
    chatInstanceSelectors,
    chatInstanceStore,
    connectionSelectors,
    connectionStore,
} from "./stores";

// Import bridge
import { ChatInstanceBridge } from "./bridges";

// Import services
import {
    AgentCommunicationService,
    ChatInstanceService,
    ConnectionManagementService,
} from "@/services/chat-instance";

// Import existing services for compatibility
import { ChatRuntimeService } from "@/services/chat-runtime/ChatRuntimeService";
import { MdxService } from "@/services/mdx";

// Import types
import type { ChatAgentConfig, ChatInstanceAction } from "@/features/chat/types";
import type { AgentRuntimeError } from "@/services/chat-runtime/ChatRuntimeService";

// Hook state interface (compatible with existing interface)
export interface ChatInstanceHookState {
    readonly chatId: string;
    readonly messages: ReadonlyArray<any>; // Using any for now to match existing interface
    readonly status: "initializing" | "connecting" | "connected" | "disconnected" | "reconnecting" | "error";
    readonly agentName: string;
    readonly isTyping: boolean;
    readonly error?: string;
}

/**
 * useChatInstanceV2 - New React hook using xState/store + Effect.js architecture
 * 
 * This hook provides the same interface as the original useChatInstance but uses
 * the new event-driven architecture with proper separation of concerns.
 */
export function useChatInstanceV2(
    chatId: string,
    agentConfigData: ChatAgentConfig,
    injectedLayer?: Layer.Layer<any, any, any>
): {
    chatState: ChatInstanceHookState;
    runtimeError: AgentRuntimeError | null;
    dispatchAction: (action: ChatInstanceAction) => void;
} {
    // Extract agent configuration
    const agentId = useMemo(() => agentConfigData.agentId, [agentConfigData.agentId]);
    const initialAgentName = useMemo(
        () => agentConfigData.initialAgentName,
        [agentConfigData.initialAgentName]
    );

    // Store subscriptions
    const chatInstanceState = useStore(chatInstanceStore, chatInstanceSelectors.getState);
    const agentState = useStore(agentStore, agentSelectors.getState);
    const connectionState = useStore(connectionStore, connectionSelectors.getState);

    // Local state for runtime error and bridge
    const [runtimeError, setRuntimeError] = useState<AgentRuntimeError | null>(null);
    const [bridge, setBridge] = useState<any>(null);

    // Create service layer
    const serviceLayer = useMemo(
        () =>
            injectedLayer ??
            Layer.merge(
                Layer.merge(
                    ChatInstanceService.Default,
                    AgentCommunicationService.Default
                ),
                Layer.merge(
                    ConnectionManagementService.Default,
                    Layer.merge(ChatRuntimeService.Default, MdxService.Default)
                )
            ),
        [injectedLayer]
    );

    // Initialize bridge and services
    useEffect(() => {
        const program = Effect.gen(function* () {
            yield* Effect.logInfo(
                `[useChatInstanceV2] Initializing for chatId: ${chatId}, agentId: ${agentId}`
            );

            // Get bridge service
            const bridgeService = yield* ChatInstanceBridge;
            setBridge(bridgeService);

            // Initialize the bridge
            yield* bridgeService.initialize(chatId, agentId, initialAgentName);

            return bridgeService;
        });

        const fiber = Effect.runFork(
            program.pipe(
                Effect.provide(
                    Layer.provide(
                        ChatInstanceBridge.Default,
                        serviceLayer
                    )
                ),
                Effect.catchAll((error) =>
                    Effect.gen(function* () {
                        yield* Effect.logError(
                            `[useChatInstanceV2] Failed to initialize bridge for ${chatId}`,
                            error
                        );
                        setRuntimeError(error as AgentRuntimeError);
                        return yield* Effect.never;
                    })
                )
            )
        );

        // Cleanup function
        return () => {
            Effect.runFork(
                Effect.gen(function* () {
                    yield* Effect.logInfo(
                        `[useChatInstanceV2] Cleaning up for ${chatId}, interrupting fiber ${fiber.id().id}`
                    );

                    if (bridge) {
                        yield* bridge.cleanup();
                    }

                    yield* Fiber.interrupt(fiber);
                }).pipe(
                    Effect.catchAll((error) =>
                        Effect.logError("[useChatInstanceV2] Error during cleanup", error)
                    )
                )
            );

            setBridge(null);
            setRuntimeError(null);
        };
    }, [chatId, agentId, initialAgentName, serviceLayer]);

    // Create dispatch function
    const dispatchAction = useCallback(
        (action: ChatInstanceAction) => {
            if (!bridge) {
                console.warn("[useChatInstanceV2] Bridge not initialized, action ignored:", action);
                return;
            }

            Effect.runFork(
                bridge.processAction(action).pipe(
                    Effect.catchAll((error) =>
                        Effect.logError("[useChatInstanceV2] Error processing action", error)
                    )
                )
            );
        },
        [bridge]
    );

    // Combine store states into hook state (compatible interface)
    const chatState: ChatInstanceHookState = useMemo(() => {
        // Combine messages from chat instance store and pending messages from agent store
        const chatMessages = chatInstanceState.messages || [];
        const pendingMessages = agentState.pendingMessages || [];
        const allMessages = [...chatMessages, ...pendingMessages];

        return {
            chatId: chatInstanceState.chatId || chatId,
            messages: allMessages,
            status: chatInstanceState.status || "initializing",
            agentName: chatInstanceState.agentName || initialAgentName,
            isTyping: chatInstanceState.isTyping || false,
            error: chatInstanceState.error,
        };
    }, [
        chatInstanceState,
        agentState.pendingMessages,
        chatId,
        initialAgentName,
    ]);

    return {
        chatState,
        runtimeError,
        dispatchAction,
    };
} 