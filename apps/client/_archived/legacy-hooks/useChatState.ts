import type { Message } from "@/types/chat";
import { debugLog } from "@/utils/debugLogger";
import { Effect, Fiber, Stream } from "effect";
import { useEffect, useRef, useState } from "react";

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
 * React hook for subscribing to a ChatService's state stream and keeping React state in sync.
 *
 * - Subscribes to the ChatService's state stream or direct subscription mechanism.
 * - Cleans up the subscription and any running fibers on unmount or dependency change using useRef.
 * - Exposes a UI-friendly state object with messages, typing status, and connection status.
 *
 * @param chatService The ChatService instance to subscribe to, or null to disable.
 * @returns {ChatStateUI} The current chat state for the UI (messages, isTyping, isRendering, status).
 *
 * This hook follows the EffectTalk resource management pattern:
 *   - All subscriptions and fibers are cleaned up on unmount or dependency change.
 *   - Errors are surfaced to the UI and logged.
 *   - React's rules of hooks are followed for safe resource management.
 */

/**
 * Subscribe to the ChatService's `stateStream` and keep a React state object
 * in sync. Assumes the service already called `initialize`.
 */
export function useChatState(chatService: any | null): ChatStateUI {
  const [state, setState] = useState<ChatStateUI>({
    messages: [],
    isTyping: false,
    isRendering: false,
    status: "idle",
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fiberRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup previous subscription/fiber if any
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (err) {
        console.error("Failed to cleanup chat state subscription:", err);
      }
      unsubscribeRef.current = null;
    }
    if (fiberRef.current) {
      try {
        Effect.runFork(Fiber.interrupt(fiberRef.current));
      } catch (err) {
        console.error("Failed to interrupt chat state fiber:", err);
      }
      fiberRef.current = null;
    }

    const subscriptionId = Math.random().toString(36).substring(7);
    console.log(
      `[useChatState:${subscriptionId}] Hook called with chatService:`,
      chatService ? "provided" : "null",
    );
    console.log(
      `[useChatState:${subscriptionId}] ChatService instanceId:`,
      chatService?.instanceId || "unknown",
    );
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
      `[useChatState:${subscriptionId}] About to subscribe to state...`,
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

    // Get the initial state once.
    Effect.runPromise(chatService.getState()).then((s: any) => {
      setState({
        messages: s.messages.map(mapMessageApi),
        isTyping: s.isTyping,
        isRendering: false,
        status: "connected",
      });
    });

    // If there is a stream/fiber mechanism, handle it here (if needed)
    // Example: fiberRef.current = ...

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

      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.error("Failed to cleanup chat state subscription:", err);
        }
        unsubscribeRef.current = null;
      }
      if (fiberRef.current) {
        try {
          Effect.runFork(Fiber.interrupt(fiberRef.current));
        } catch (err) {
          console.error("Failed to interrupt chat state fiber:", err);
        }
        fiberRef.current = null;
      }
    };
  }, [chatService]);

  return state;
}
