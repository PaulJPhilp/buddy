"use client";

import { ChatManager } from "@/managers/chat-manager";
import type {
  ChatManagerState,
  ChatManagerError,
} from "@/managers/chat-manager";
import type { ChatInstanceMetadata } from "@/managers/chat-manager/types";
import type { MessageApi } from "@/services/chat/types";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * React hook for managing multiple chat instances using ChatManager.
 * Provides centralized management of chat lifecycle and routing.
 */
export interface UseChatManagerOptions {
  readonly autoInitialize?: boolean;
}

export interface ChatManagerActions {
  // Lifecycle
  readonly initialize: () => Promise<void>;
  readonly cleanup: () => Promise<void>;

  // Chat Instance Management
  readonly createChatInstance: (
    chatId: string,
    agentId?: string
  ) => Promise<void>;
  readonly getChatInstance: (chatId: string) => Promise<any>; // ChatService
  readonly closeChatInstance: (chatId: string) => Promise<void>;
  readonly getAllChatInstances: () => Promise<string[]>;

  // Active Chat Management
  readonly setActiveChat: (chatId: string) => Promise<void>;
  readonly getActiveChat: () => Promise<string | null>;
  readonly clearActiveChat: () => Promise<void>;

  // Message Operations
  readonly sendMessage: (
    chatId: string,
    content: string,
    attachments?: File[]
  ) => Promise<MessageApi>;
  readonly sendMessageToActiveChat: (
    content: string,
    attachments?: File[]
  ) => Promise<MessageApi>;

  // Chat Metadata
  readonly getChatMetadata: (
    chatId: string
  ) => Promise<ChatInstanceMetadata | null>;
  readonly updateChatMetadata: (
    chatId: string,
    metadata: Partial<ChatInstanceMetadata>
  ) => Promise<void>;

  // Bulk Operations
  readonly closeAllChats: () => Promise<void>;
  readonly getChatsCount: () => Promise<number>;

  // Debug
  readonly debugGetAllInstances: () => Promise<Record<string, any>>;
  readonly debugResetState: () => Promise<void>;
}

export interface UseChatManagerReturn {
  readonly state: ChatManagerState | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly actions: ChatManagerActions;
}

export function useChatManager({
  autoInitialize = true,
}: UseChatManagerOptions = {}): UseChatManagerReturn {
  const [state, setState] = useState<ChatManagerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to track subscriptions and prevent memory leaks
  const unsubscribeRef = useRef<(() => Effect.Effect<void>) | null>(null);
  const managerRef = useRef<ChatManager | null>(null);

  // Helper to run Effect programs with error handling
  const runEffect = useCallback(
    <T>(effect: Effect.Effect<T, ChatManagerError>) => {
      return Effect.runPromise(
        effect.pipe(
          Effect.provide(ChatManager.Default),
          Effect.mapError((error) => {
            const message =
              error instanceof Error ? error.message : String(error);
            setError(message);
            throw new Error(message);
          })
        )
      );
    },
    []
  );

  // Initialize the ChatManager service
  useEffect(() => {
    const initializeManager = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const program = Effect.gen(function* () {
          const manager = yield* ChatManager;
          managerRef.current = manager;

          // Initialize the manager
          if (autoInitialize) {
            yield* manager.initialize();
          }

          // Subscribe to state changes
          const unsubscribe = yield* manager.subscribe((newState) => {
            setState(newState);
          });

          // Get initial state
          const initialState = yield* manager.getState();
          setState(initialState);

          return unsubscribe;
        });

        const unsubscribe = await Effect.runPromise(
          program.pipe(Effect.provide(ChatManager.Default))
        );

        unsubscribeRef.current = unsubscribe;
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize ChatManager:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };

    initializeManager();

    return () => {
      // Cleanup subscription
      if (unsubscribeRef.current) {
        Effect.runPromise(unsubscribeRef.current()).catch((err) => {
          console.error("Failed to cleanup subscription:", err);
        });
        unsubscribeRef.current = null;
      }

      // Cleanup manager if it was auto-initialized
      if (managerRef.current && autoInitialize) {
        Effect.runPromise(
          managerRef.current.cleanup().pipe(
            Effect.provide(ChatManager.Default),
            Effect.catchAll((error) =>
              Effect.logWarning(`Failed to cleanup ChatManager: ${error}`)
            )
          )
        ).catch(() => {
          // Silent cleanup
        });
      }

      managerRef.current = null;
    };
  }, [autoInitialize, runEffect]);

  // Action creators
  const actions: ChatManagerActions = {
    initialize: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.initialize();
          })
        ),
      [runEffect]
    ),

    cleanup: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.cleanup();
          })
        ),
      [runEffect]
    ),

    createChatInstance: useCallback(
      (chatId: string, agentId?: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.createChatInstance(chatId, agentId);
          })
        ),
      [runEffect]
    ),

    getChatInstance: useCallback(
      (chatId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.getChatInstance(chatId);
          })
        ),
      [runEffect]
    ),

    closeChatInstance: useCallback(
      (chatId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.closeChatInstance(chatId);
          })
        ),
      [runEffect]
    ),

    getAllChatInstances: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.getAllChatInstances();
          })
        ),
      [runEffect]
    ),

    setActiveChat: useCallback(
      (chatId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.setActiveChat(chatId);
          })
        ),
      [runEffect]
    ),

    getActiveChat: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.getActiveChat();
          })
        ),
      [runEffect]
    ),

    clearActiveChat: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.clearActiveChat();
          })
        ),
      [runEffect]
    ),

    sendMessage: useCallback(
      (chatId: string, content: string, attachments?: File[]) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.sendMessage(chatId, content, attachments);
          })
        ),
      [runEffect]
    ),

    sendMessageToActiveChat: useCallback(
      (content: string, attachments?: File[]) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.sendMessageToActiveChat(content, attachments);
          })
        ),
      [runEffect]
    ),

    getChatMetadata: useCallback(
      (chatId: string) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.getChatMetadata(chatId);
          })
        ),
      [runEffect]
    ),

    updateChatMetadata: useCallback(
      (chatId: string, metadata: Partial<ChatInstanceMetadata>) =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.updateChatMetadata(chatId, metadata);
          })
        ),
      [runEffect]
    ),

    closeAllChats: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.closeAllChats();
          })
        ),
      [runEffect]
    ),

    getChatsCount: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.getChatsCount();
          })
        ),
      [runEffect]
    ),

    debugGetAllInstances: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            return yield* manager.debugGetAllInstances();
          })
        ),
      [runEffect]
    ),

    debugResetState: useCallback(
      () =>
        runEffect(
          Effect.gen(function* () {
            const manager = yield* ChatManager;
            yield* manager.debugResetState();
          })
        ),
      [runEffect]
    ),
  };

  return {
    state,
    isLoading,
    error,
    actions,
  };
}
