/**
 * @file Simple Chat Hook - Now with real WebSocket connectivity
 * @module hooks/useSimpleChat
 */

import { ChatService } from "@/services/chat";
import { createUserMessage } from "@/services/chat/utils";
import type { Message } from "@/types/chat";
import type { ChatAgentConfig } from "@/types/config";
import { Effect, Fiber, Stream } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatState {
  readonly chatId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly status:
    | "initializing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";
  readonly agentName: string;
  readonly isTyping: boolean;
  readonly isRendering: boolean;
  readonly error?: string;
}

export interface ChatAction {
  readonly _tag: "sendMessage";
  readonly text: string;
  readonly attachments?: Array<{ name: string }>;
}

export function useSimpleChat(
  chatId: string,
  agentConfig: ChatAgentConfig,
): {
  chatState: ChatState;
  dispatchAction: (action: ChatAction) => void;
} {
  const [chatState, setChatState] = useState<ChatState>({
    chatId,
    messages: [],
    status: "initializing",
    agentName: agentConfig.initialAgentName || "Assistant",
    isTyping: false,
    isRendering: false,
  });

  const chatServiceRef = useRef<any>(null);
  const streamFiberRef = useRef<Fiber.Fiber<unknown, unknown> | null>(null);

  // Initialize ChatService and WebSocket connection
  useEffect(() => {
    let isMounted = true;

    const initializeChat = Effect.gen(function* () {
      console.log("[useSimpleChat] Initializing chat service for:", chatId);

      // Get ChatService instance
      const chatService = yield* ChatService;
      chatServiceRef.current = chatService;

      // Initialize the chat connection
      yield* chatService.initialize(chatId);

      if (isMounted) {
        setChatState((prev) => ({ ...prev, status: "connected" }));
      }

      // Subscribe to incoming messages
      const messageStream = chatService.messageStream;

      yield* Stream.runForEach(messageStream, (apiMessage) =>
        Effect.sync(() => {
          if (isMounted) {
            console.log(
              "[useSimpleChat] Received message from stream:",
              apiMessage,
            );

            // Convert API message to UI message
            const message: Message = {
              id: apiMessage.id,
              text: apiMessage.text,
              role: apiMessage.sender === "user" ? "user" : "assistant",
              timestamp: apiMessage.timestamp,
              attachments: apiMessage.attachments,
              metadata: apiMessage.metadata,
            };

            console.log(
              "[useSimpleChat] Converted message with metadata:",
              message,
            );

            setChatState((prev) => ({
              ...prev,
              messages: [...prev.messages, message],
              isTyping: false,
            }));
          }
        }),
      );
    }).pipe(
      Effect.provide(ChatService.Default),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          if (isMounted) {
            console.error("[useSimpleChat] Initialization error:", error);
            setChatState((prev) => ({
              ...prev,
              status: "error",
              error: error instanceof Error ? error.message : String(error),
            }));
          }
        }),
      ),
    );

    // Run the initialization effect
    streamFiberRef.current = Effect.runFork(initializeChat);

    return () => {
      isMounted = false;
      if (streamFiberRef.current) {
        Fiber.interrupt(streamFiberRef.current);
        streamFiberRef.current = null;
      }
    };
  }, [chatId]);

  const dispatchAction = useCallback((action: ChatAction) => {
    console.log("[useSimpleChat] Processing action:", action);

    switch (action._tag) {
      case "sendMessage": {
        if (!chatServiceRef.current) {
          console.error("[useSimpleChat] ChatService not initialized");
          return;
        }

        // Create and add user message immediately (optimistic update)
        const userMessage = createUserMessage(action.text, action.attachments);

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, userMessage],
          isTyping: true,
        }));

        // Send message via ChatService
        const sendEffect = Effect.gen(function* () {
          const chatService = chatServiceRef.current;
          yield* chatService.sendMessage(
            action.text,
            action.attachments?.map((att) => new File([], att.name)),
          );
        }).pipe(
          Effect.provide(ChatService.Default),
          Effect.catchAll((error) =>
            Effect.sync(() => {
              console.error("[useSimpleChat] Send message error:", error);
              setChatState((prev) => ({
                ...prev,
                isTyping: false,
                error: error instanceof Error ? error.message : String(error),
              }));
            }),
          ),
        );

        Effect.runPromise(sendEffect);
        break;
      }
    }
  }, []);

  return {
    chatState,
    dispatchAction,
  };
}
