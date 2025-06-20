"use client";

import type { Message } from "@/types/chat";
import { ChatBubbleLlmUi } from "@ui/components/chat/ChatBubbleLlmUi";
import { Button } from "@ui/components/ui/button";
import { Skeleton } from "@ui/components/ui/skeleton";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import { cn } from "@ui/lib/utils";

import { Icon } from "@ui/components/Icon";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface ChatAreaProps {
  messages: ReadonlyArray<Message>;
  isTyping?: boolean;
  isRendering?: boolean;
  isLoadingHistory?: boolean;
  className?: string;
  onLoadMoreMessages?: () => void;
  onMessageFeedback?: (
    messageId: string,
    type: "thumbsUp" | "thumbsDown",
  ) => void;
  onMessageCopy?: (messageId: string) => void;
  onMessageRead?: (messageId: string) => void;
  assistantMessageToolbarConfig?: (message: Message) => ToolBarItem[];
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isTyping,
  isRendering,
  isLoadingHistory,
  className,
  onLoadMoreMessages,
  onMessageFeedback,
  onMessageCopy,
  onMessageRead,
  assistantMessageToolbarConfig,
}) => {
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollableAreaRef.current) {
      // Check if scrollTo method exists (for test environment compatibility)
      if (typeof scrollableAreaRef.current.scrollTo === "function") {
        scrollableAreaRef.current.scrollTo({
          top: scrollableAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        // Fallback for test environments
        scrollableAreaRef.current.scrollTop =
          scrollableAreaRef.current.scrollHeight;
      }
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
    <div className="flex-1 relative">
      <div
        ref={scrollableAreaRef}
        className={cn(
          "absolute inset-0 overflow-y-auto p-4 space-y-3.5",
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
          const normalizedMsg = { ...msg, role: msg.role ?? msg.sender };
          return (
            <div
              key={normalizedMsg.id}
              data-testid="chat-message"
              className={cn(
                "group relative w-full flex",
                normalizedMsg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div className="relative max-w-[95%] flex items-center">
                <div className="relative flex-1">
                  <ChatBubbleLlmUi
                    message={normalizedMsg}
                    isCurrentUser={normalizedMsg.role === "user"}
                    role={normalizedMsg.role}
                  />
                </div>
                {normalizedMsg.timestamp && (
                  <div
                    className={cn(
                      "flex items-center",
                      normalizedMsg.role === "user"
                        ? "order-first pr-2"
                        : "order-last pl-2",
                    )}
                  >
                    <span
                      className="text-[0.4rem] text-muted-foreground whitespace-nowrap opacity-70"
                      suppressHydrationWarning
                    >
                      {new Date(normalizedMsg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <style>
              {`
                @keyframes subtle-bounce {
                  0%, 20%, 53%, 80%, 100% {
                    transform: translateY(0);
                  }
                  40%, 43% {
                    transform: translateY(-5px);
                  }
                }
              `}
            </style>
            <div
              data-testid="typing-indicator"
              className="text-xs px-2 py-1 rounded-xl"
              style={{
                backgroundColor: "var(--color-chat-bubble-agent)",
                color: "var(--color-chat-foreground)",
              }}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-chat-primary)",
                    animation: "subtle-bounce 0.8s infinite",
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-chat-primary)",
                    animation: "subtle-bounce 0.8s infinite 0.16s",
                  }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-chat-primary)",
                    animation: "subtle-bounce 0.8s infinite 0.32s",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {isRendering && (
          <div className="flex justify-start">
            <div
              className="text-xs px-2 py-1 rounded-xl"
              style={{
                backgroundColor: "var(--color-chat-bubble-agent)",
                color: "var(--color-chat-foreground)",
              }}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  style={{ color: "var(--color-chat-primary)" }}
                />
                <span className="text-xs opacity-75">Formatting...</span>
              </div>
            </div>
          </div>
        )}
        {/* Empty-state placeholder – shown when no messages are present */}
        {messages.length === 0 && !isTyping && !isRendering && (
          <div
            data-testid="empty-chat-placeholder"
            className="flex flex-col items-center justify-center py-10 text-muted-foreground w-full"
          >
            <Icon name="Inbox" size={24} className="mb-2 opacity-50" />
            <p className="text-sm text-center max-w-xs">
              No messages yet. Start the conversation.
            </p>
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
