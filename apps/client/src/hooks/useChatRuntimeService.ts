import { Effect, Exit, Fiber } from "effect";
import { useEffect, useState } from "react";
import {
    ChatRuntimeService,
    type ChatRuntimeServiceApi,
} from "../services/chat-runtime/ChatRuntimeService";

export interface ChatRuntimeServiceState {
    readonly status: "initializing" | "ready" | "error";
    readonly chatRuntime: ChatRuntimeServiceApi | null;
    readonly error: unknown | null;
}

export function useChatRuntimeService(): ChatRuntimeServiceState {
    const [state, setState] = useState<ChatRuntimeServiceState>({
        status: "initializing",
        chatRuntime: null,
        error: null,
    });

    useEffect(() => {
        console.log("[useChatRuntimeService] Initializing chat runtime service...");

        // Create the chat runtime service effect
        const runtimeEffect = Effect.provide(
            ChatRuntimeService,
            ChatRuntimeService.Default,
        );

        // Run the effect
        const fiber = Effect.runFork(runtimeEffect);

        // Handle the result
        fiber.addObserver((exit: Exit.Exit<ChatRuntimeServiceApi, never>) => {
            if (Exit.isSuccess(exit)) {
                console.log(
                    "[useChatRuntimeService] Chat runtime service initialized successfully",
                );
                setState({
                    status: "ready",
                    chatRuntime: exit.value,
                    error: null,
                });
            } else {
                console.error(
                    "[useChatRuntimeService] Failed to initialize chat runtime service:",
                    exit.cause,
                );
                setState({
                    status: "error",
                    chatRuntime: null,
                    error: exit.cause,
                });
            }
        });

        // Cleanup on unmount
        return () => {
            console.log("[useChatRuntimeService] Cleaning up chat runtime service...");
            Fiber.interrupt(fiber);
        };
    }, []);

    return state;
} 