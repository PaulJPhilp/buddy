import type { Message } from "@/types/chat";
import { debugLog } from "@/utils/debugLogger";
import { Effect, Fiber, Stream } from "effect";
import { useEffect, useState } from "react";

/** Helper to convert MessageApi to UI Message */
function mapMessageApi(messageApi: any): Message {
  return {
    id: messageApi.id,
    text: messageApi.text,
    role: messageApi.sender,
    timestamp: messageApi.timestamp,
    attachments: messageApi.attachments,
    metadata: messageApi.metadata,
  };
}

interface ChatStateUI {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly isRendering: boolean;
  readonly status: "idle" | "connecting" | "connected" | "error";
}

/**
 * Subscribe to the ChatService's `stateStream` and keep a React state object
 * in sync. Assumes the service already called `initialize`.
 */
export function useChatState(chatService: any | null): ChatStateUI {
  const subscriptionId = Math.random().toString(36).substring(7);
  console.log(
    `[useChatState:${subscriptionId}] Hook called with chatService:`,
    chatService ? "provided" : "null",
  );
  console.log(
    `[useChatState:${subscriptionId}] ChatService instanceId:`,
    chatService?.instanceId || "unknown",
  );

  const [state, setState] = useState<ChatStateUI>(() => ({
    messages: [],
    isTyping: false,
    isRendering: false,
    status: "idle",
  }));

  useEffect(() => {
    console.log(
      `[useChatState:${subscriptionId}] useEffect triggered, chatService:`,
      chatService ? "provided" : "null",
    );
    console.log(
      `[useChatState:${subscriptionId}] ChatService instanceId in effect:`,
      chatService?.instanceId || "unknown",
    );

    if (!chatService) {
      console.log(
        `[useChatState:${subscriptionId}] No chatService, returning early`,
      );
      return;
    }

    let fiber: Fiber.RuntimeFiber<unknown, never> | null = null;

    console.log(
      `[useChatState:${subscriptionId}] Getting initial state from chatService...`,
    );
    // Pull initial snapshot
    Effect.runPromise(chatService.getState())
      .then((s: any) => {
        console.log(
          `[useChatState:${subscriptionId}] Initial state received:`,
          {
            messageCount: s.messages?.length || 0,
            isTyping: s.isTyping,
          },
        );
        setState((prev) => ({
          ...prev,
          messages: s.messages.map(mapMessageApi),
          isTyping: s.isTyping,
          status: "connected",
        }));
      })
      .catch((err) => {
        console.error(
          `[useChatState:${subscriptionId}] Failed to get initial state:`,
          err,
        );
      });

    console.log(
      `[useChatState:${subscriptionId}] About to subscribe to stateStream...`,
    );
    debugLog("useChatState:subscribe", chatService.stateStream);

    // Subscribe using direct subscription mechanism (more reliable than Stream.fromQueue)
    let unsubscribe: (() => void) | null = null;

    if (chatService.subscribeToState) {
      console.log(
        `[useChatState:${subscriptionId}] Using direct subscription mechanism`,
      );
      unsubscribe = chatService.subscribeToState((s: any) => {
        console.log(
          `[useChatState:${subscriptionId}] 🌊 Direct state update received:`,
          {
            messageCount: s.messages?.length || 0,
            isTyping: s.isTyping,
          },
        );
        const uiState = {
          messages: s.messages.map(mapMessageApi),
          isTyping: s.isTyping,
          isRendering: false,
          status: "connected",
        } as const;
        debugLog("useChatState:update", {
          len: uiState.messages.length,
          typing: uiState.isTyping,
        });
        setState(uiState);
      });
      console.log(
        `[useChatState:${subscriptionId}] Direct subscription established`,
      );
    } else {
      console.log(
        `[useChatState:${subscriptionId}] Falling back to stream subscription`,
      );
      // Fallback to stream subscription
      Effect.runPromise(
        Stream.runForEach(chatService.stateStream, (s: any) =>
          Effect.sync(() => {
            console.log(
              `[useChatState:${subscriptionId}] 🌊 State stream update received:`,
              {
                messageCount: s.messages?.length || 0,
                isTyping: s.isTyping,
              },
            );
            const uiState = {
              messages: s.messages.map(mapMessageApi),
              isTyping: s.isTyping,
              isRendering: false,
              status: "connected",
            } as const;
            debugLog("useChatState:update", {
              len: uiState.messages.length,
              typing: uiState.isTyping,
            });
            setState(uiState);
          }),
        ).pipe(Effect.fork),
      )
        .then((f) => {
          console.log(
            `[useChatState:${subscriptionId}] Stream subscription fiber started successfully`,
          );
          debugLog("useChatState:fiberStarted");
          fiber = f as any;
        })
        .catch((err) => {
          console.error(
            `[useChatState:${subscriptionId}] Stream subscription error:`,
            err,
          );
          console.error(
            `[useChatState:${subscriptionId}] Stream subscription error stack:`,
            err?.stack,
          );
        });
    }

    return () => {
      console.log(
        `[useChatState:${subscriptionId}] Cleanup - interrupting fiber...`,
      );

      // Clean up direct subscription
      if (unsubscribe) {
        console.log(
          `[useChatState:${subscriptionId}] Cleaning up direct subscription`,
        );
        unsubscribe();
      }

      // Clean up stream subscription fiber
      if (fiber) {
        Effect.runFork(Fiber.interrupt(fiber));
        console.log(`[useChatState:${subscriptionId}] Fiber interrupted`);
      }
    };
  }, [chatService]);

  console.log(`[useChatState:${subscriptionId}] Returning state:`, {
    messageCount: state.messages.length,
    isTyping: state.isTyping,
    status: state.status,
  });
  return state;
}
