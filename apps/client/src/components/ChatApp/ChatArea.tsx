import { useEffectContext } from "@/components/EffectProvider";
import { Effect } from "effect";
import React, { useEffect, useRef, useState } from "react";
import { ChatBubble } from "./ChatBubble";
import type { Message } from "./ChatBubble";
import { ChatAppManager } from "./manager-service";

export interface ChatAreaProps {
  chatAppId: string;
  className?: string;
  onLoadMoreMessages?: () => void;
  onMessageFeedback?: (
    messageId: string,
    type: "thumbsUp" | "thumbsDown",
  ) => void;
  onMessageCopy?: (messageId: string) => void;
  onMessageRead?: (messageId: string) => void;
}

export function ChatArea({
  chatAppId,
  className,
  onLoadMoreMessages,
  onMessageFeedback,
  onMessageCopy,
  onMessageRead,
}: ChatAreaProps) {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<any>(null);
  const [bubbleData, setBubbleData] = useState<
    Record<string, { bubbleState: any; formattedContent: string }>
  >({});
  const scrollableAreaRef = useRef<HTMLDivElement>(null);

  // Helper: always scroll to bottom
  function scrollToBottom(ref: React.RefObject<HTMLDivElement>) {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }

  // Subscribe to ChatAreaManager state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    runWithServices(
      Effect.gen(function* () {
        const chatAppManager = yield* ChatAppManager;
        // Look up the ChatAppConfig for this chatAppId
        const chatAppConfig = state?.availableChatApps?.find(
          (c) => c.id === chatAppId,
        );
        if (!chatAppConfig) {
          console.warn(
            "ChatArea: No ChatAppConfig found for chatAppId",
            chatAppId,
          );
          return;
        }
        // Initialize if needed
        yield* chatAppManager.initialize(chatAppConfig);
        // Subscribe to state updates
        unsubscribe = yield* chatAppManager.subscribe(setState);
        // Load initial state
        const initialState = yield* chatAppManager.getState();
        setState(initialState);
      }),
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatAppId, runWithServices, state?.availableChatApps]);

  // Fetch bubble state/content for all messages
  useEffect(() => {
    if (!state?.messages) return;
    let cancelled = false;
    (async () => {
      const chatAppManager = await runWithServices(ChatAppManager);
      const entries = await Promise.all(
        state.messages.map(async (msg: Message) => {
          const bubbleState = await runWithServices(
            chatAppManager.getBubbleState(msg.id),
          );
          const formattedContent = await runWithServices(
            chatAppManager.formatBubbleMessage(msg),
          );
          return [msg.id, { bubbleState, formattedContent }];
        }),
      );
      if (!cancelled) {
        setBubbleData(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state?.messages, runWithServices]);

  // Always scroll to bottom when messages change, with debug logging
  useEffect(() => {
    if (!scrollableAreaRef.current) return;
    requestAnimationFrame(() => {
      if (scrollableAreaRef.current) {
        console.log(
          "ScrollTop before:",
          scrollableAreaRef.current.scrollTop,
          "ScrollHeight:",
          scrollableAreaRef.current.scrollHeight,
        );
        scrollableAreaRef.current.scrollTop =
          scrollableAreaRef.current.scrollHeight;
        console.log("ScrollTop after:", scrollableAreaRef.current.scrollTop);
      }
    });
  }, [state?.messages?.length]);

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollableAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollableAreaRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
    // Optionally, update isNearBottom in manager if needed
    // (not shown here for brevity)
    if (scrollTop < 100 && onLoadMoreMessages && !state?.isLoadingHistory) {
      onLoadMoreMessages();
    }
  };

  return (
    <div
      ref={scrollableAreaRef}
      className="absolute inset-0 overflow-y-auto p-4 space-y-3.5"
      style={{
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
        minHeight: "300px",
        maxHeight: "100%",
      }}
      role="log"
      aria-live="polite"
      onScroll={handleScroll}
    >
      {/* Render chat bubbles for each message */}
      {state?.messages?.map((msg: Message) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          bubbleState={bubbleData[msg.id]?.bubbleState}
          formattedContent={bubbleData[msg.id]?.formattedContent}
          onAction={(action) => {
            runWithServices(ChatAppManager).then((chatAppManager) => {
              chatAppManager.performBubbleAction(msg.id, action);
            });
          }}
        />
      ))}
    </div>
  );
}
