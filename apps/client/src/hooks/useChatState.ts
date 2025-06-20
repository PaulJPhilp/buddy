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
  console.log(
    "[useChatState] Hook called with chatService:",
    chatService ? "provided" : "null",
  );
  console.log(
    "[useChatState] ChatService instanceId:",
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
      "[useChatState] useEffect triggered, chatService:",
      chatService ? "provided" : "null",
    );
    console.log(
      "[useChatState] ChatService instanceId in effect:",
      chatService?.instanceId || "unknown",
    );

    if (!chatService) {
      console.log("[useChatState] No chatService, returning early");
      return;
    }

    let fiber: Fiber.RuntimeFiber<unknown, never> | null = null;

    console.log("[useChatState] Getting initial state from chatService...");
    // Pull initial snapshot
    Effect.runPromise(chatService.getState())
      .then((s: any) => {
        console.log("[useChatState] Initial state received:", {
          messageCount: s.messages?.length || 0,
          isTyping: s.isTyping,
        });
        setState((prev) => ({
          ...prev,
          messages: s.messages.map(mapMessageApi),
          isTyping: s.isTyping,
          status: "connected",
        }));
      })
      .catch((err) => {
        console.error("[useChatState] Failed to get initial state:", err);
      });

    console.log("[useChatState] About to subscribe to stateStream...");
    debugLog("useChatState:subscribe", chatService.stateStream);

    // Subscribe to continuous stream
    Effect.runPromise(
      Stream.runForEach(chatService.stateStream, (s: any) =>
        Effect.sync(() => {
          console.log("[useChatState] State stream update received:", {
            messageCount: s.messages?.length || 0,
            isTyping: s.isTyping,
          });
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
          "[useChatState] Stream subscription fiber started successfully",
        );
        debugLog("useChatState:fiberStarted");
        fiber = f as any;
      })
      .catch((err) => {
        console.error("[useChatState] Stream subscription error:", err);
      });

    return () => {
      console.log("[useChatState] Cleanup - interrupting fiber...");
      if (fiber) {
        Effect.runSync(Fiber.interrupt(fiber));
        console.log("[useChatState] Fiber interrupted");
      }
    };
  }, [chatService]);

  console.log("[useChatState] Returning state:", {
    messageCount: state.messages.length,
    isTyping: state.isTyping,
    status: state.status,
  });
  return state;
}
