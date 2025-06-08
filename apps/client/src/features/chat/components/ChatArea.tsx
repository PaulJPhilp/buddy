"use client";

import type { ChatInstanceHookState } from "@/features/chat/types";
import { ChatBubble } from "@ui/components/chat/ChatBubble";
import { Button } from "@ui/components/ui/button";
import { Skeleton } from "@ui/components/ui/skeleton";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import { cn } from "@ui/lib/utils";

import { Icon } from "@ui/components/Icon";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface ChatAreaProps {
  messages: ChatInstanceHookState["messages"];
  isTyping?: boolean;
  isLoadingHistory?: boolean;
  className?: string;
  onLoadMoreMessages?: () => void;
  onMessageFeedback?: (
    messageId: string,
    type: "thumbsUp" | "thumbsDown",
  ) => void;
  onMessageCopy?: (messageId: string) => void;
  onMessageRead?: (messageId: string) => void;
  assistantMessageToolbarConfig?: (
    message: ChatInstanceHookState["messages"][0],
  ) => ToolBarItem[];
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isTyping,
  isLoadingHistory,
  className,
  onLoadMoreMessages,
  onMessageFeedback,
  onMessageCopy,
  onMessageRead,
  assistantMessageToolbarConfig,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollableAreaRef.current) {
      scrollableAreaRef.current.scrollTo({
        top: scrollableAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollableAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollableAreaRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(scrolledToBottom);
    setShowScrollButton(!scrolledToBottom);
    if (scrollTop < 100 && onLoadMoreMessages && !isLoadingHistory) {
      onLoadMoreMessages();
    }
  }, [onLoadMoreMessages, isLoadingHistory]);

  useEffect(() => {
    if (scrollableAreaRef.current && isNearBottom) {
      scrollToBottom();
    }
  }, [isNearBottom, scrollToBottom]);

  useEffect(() => {
    const scrollArea = scrollableAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const showScrollToBottomButton = !isNearBottom && messages.length > 0;

  return (
    <div className="relative flex flex-col h-full">
      <div
        ref={scrollableAreaRef}
        className={cn(
          "flex-1 overflow-y-auto p-4 space-y-4",
          isLoadingHistory && "opacity-80",
          className,
        )}
        style={{
          backgroundColor: "var(--color-chat-background)",
          color: "var(--color-chat-foreground)",
        }}
        role="log"
        aria-live="polite"
      >
        {isLoadingHistory && (
          <div className="flex flex-col space-y-2 mb-4">
            <Skeleton className="h-12 w-3/4 bg-chat-secondary" />
            <Skeleton className="h-12 w-2/3 ml-auto bg-chat-secondary" />
            <Skeleton className="h-12 w-3/4 bg-chat-secondary" />
          </div>
        )}

        {messages.map((msg) => {
          const toolbarItems =
            msg.role === "assistant"
              ? assistantMessageToolbarConfig?.(msg) || [
                  {
                    id: `thumbs-up-${msg.id}`,
                    icon: <Icon name="ThumbsUp" size={6} />,
                    action: () => onMessageFeedback?.(msg.id, "thumbsUp"),
                    tooltip: "Helpful",
                    intent: "primary",
                  },
                  {
                    id: `thumbs-down-${msg.id}`,
                    icon: <Icon name="ThumbsDown" size={6} />,
                    action: () => onMessageFeedback?.(msg.id, "thumbsDown"),
                    tooltip: "Not Helpful",
                    intent: "secondary",
                  },
                  { id: `spacer-${msg.id}`, type: "spacer-expand" },
                  {
                    id: `copy-${msg.id}`,
                    icon: <Icon name="Copy" size={6} />,
                    action: () => onMessageCopy?.(msg.id),
                    tooltip: "Copy",
                  },
                  {
                    id: `read-${msg.id}`,
                    icon: <Icon name="Volume2" size={6} />,
                    action: () => onMessageRead?.(msg.id),
                    tooltip: "Read",
                  },
                ]
              : [];

          return (
            <div
              key={msg.id}
              className={cn(
                "group relative w-full flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div className="relative max-w-[95%] flex items-center">
                <div className="relative flex-1">
                  <ChatBubble
                    message={msg as any}
                    isCurrentUser={msg.role === "user"}
                    role={msg.role}
                    enableMdxProcessing={true}
                    showDebugInfo={false} // Set to true to re-enable debug output
                  />
                  {msg.role === "assistant" && toolbarItems.length > 0 && (
                    <div className="absolute left-0 bottom-0 translate-y-full pt-1.5 w-full">
                      <ToolBar
                        commands={toolbarItems}
                        variant="tiny"
                        className="w-full h-3 justify-start backdrop-blur supports-[backdrop-filter]:bg-opacity-75"
                      />
                    </div>
                  )}
                </div>
                {msg.timestamp && (
                  <div
                    className={cn(
                      "flex items-center",
                      msg.role === "user"
                        ? "order-first pr-2"
                        : "order-last pl-2",
                    )}
                  >
                    <span className="text-[0.4rem] text-muted-foreground whitespace-nowrap opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="text-sm px-3 py-2 rounded-xl"
              style={{
                backgroundColor: "var(--color-chat-bubble-agent)",
                color: "var(--color-chat-foreground)",
              }}
            >
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {showScrollButton && (
        <Button
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-90 hover:opacity-100"
          style={{
            backgroundColor: "var(--color-chat-secondary)",
            color: "var(--color-chat-foreground)",
          }}
          onClick={scrollToBottom}
        >
          <Icon name="ArrowDown" size={16} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default ChatArea;
