"use client";

import type {
  ChatAppInstance,
  ChatMessage,
} from "@/features/chatapps/manager/types";
import { ChatBubble } from "@buddy/ui/components/ChatBubble";
import React, { useEffect, useRef } from "react";
import { ContextEngineeringPanel } from "../features/context-engineering/components/ContextEngineeringPanel";
import { ContextEngineeringTrigger } from "../features/context-engineering/components/ContextEngineeringTrigger";
import { HeaderBar } from "../features/header/components/HeaderBar";
import { UserArea } from "../features/userarea/components/UserArea";
import { Effect } from "effect";

// Utility function to apply ChatApp-specific styling
function applyChatAppStyling(style: any) {
  if (!style) return;

  const root = document.documentElement;

  // Apply primary colors
  if (style.primaryColor) {
    root.style.setProperty("--color-chat-primary", style.primaryColor);
    root.style.setProperty("--color-chat-header-bg", style.primaryColor);
    root.style.setProperty("--color-user-send-button", style.primaryColor);
    root.style.setProperty(
      "--color-user-input-border-focus",
      style.primaryColor,
    );
    root.style.setProperty("--color-user-input-ring", style.primaryColor);
    root.style.setProperty(
      "--color-user-agent-selector-focus",
      style.primaryColor,
    );
    root.style.setProperty("--color-chat-bubble-user", style.primaryColor);
  }

  // Apply primary contrast color
  if (style.primaryContrastColor) {
    root.style.setProperty(
      "--color-chat-header-text",
      style.primaryContrastColor,
    );
    root.style.setProperty("--color-user-spinner", style.primaryContrastColor);
    root.style.setProperty(
      "--color-chat-bubble-user-foreground",
      style.primaryContrastColor,
    );
  }

  // Apply background colors
  if (style.backgroundColor) {
    root.style.setProperty("--color-chat-background", style.backgroundColor);
    root.style.setProperty(
      "--color-user-agent-selector-bg",
      style.backgroundColor,
    );
  }

  if (style.backgroundSecondaryColor) {
    root.style.setProperty(
      "--color-chat-secondary",
      style.backgroundSecondaryColor,
    );
    root.style.setProperty(
      "--color-chat-user-area",
      style.backgroundSecondaryColor,
    );
  }

  // Apply border styling
  if (style.borderColor) {
    root.style.setProperty("--color-chat-border", style.borderColor);
    root.style.setProperty("--color-user-area-border", style.borderColor);
    root.style.setProperty("--color-user-input-border", style.borderColor);
    root.style.setProperty("--color-user-button-border", style.borderColor);
    root.style.setProperty(
      "--color-user-agent-selector-border",
      style.borderColor,
    );
  }

  if (style.borderRadius) {
    root.style.setProperty("--user-input-border-radius", style.borderRadius);
    root.style.setProperty("--user-button-border-radius", style.borderRadius);
    root.style.setProperty(
      "--user-attachment-border-radius",
      style.borderRadius,
    );
  }

  // Apply typography
  if (style.fontFamily) {
    root.style.setProperty("--chat-font-family", style.fontFamily);
  }

  if (style.fontSize) {
    root.style.setProperty("--user-input-font-size", style.fontSize);
  }

  // Apply message colors
  if (style.userMessageColor) {
    root.style.setProperty("--color-chat-bubble-user", style.userMessageColor);
  }

  if (style.assistantMessageColor) {
    root.style.setProperty(
      "--color-chat-bubble-agent",
      style.assistantMessageColor,
    );
  }

  // Apply input styling
  if (style.inputBackgroundColor) {
    root.style.setProperty(
      "--color-chat-user-area",
      style.inputBackgroundColor,
    );
  }

  if (style.inputBorderColor) {
    root.style.setProperty("--color-user-input-border", style.inputBorderColor);
  }

  // Apply icon styling
  if (style.iconColor) {
    root.style.setProperty(
      "--color-user-attachment-secondary",
      style.iconColor,
    );
  }

  if (style.iconSize) {
    root.style.setProperty("--user-button-icon-size", style.iconSize);
    root.style.setProperty("--user-attachment-icon-size", style.iconSize);
  }
}

// Utility function to reset styling to defaults
function resetChatAppStyling() {
  const root = document.documentElement;

  // Reset all custom properties to their defaults
  const defaultStyles = {
    "--color-chat-primary": "#1e40af",
    "--color-chat-header-bg": "#1e40af",
    "--color-user-send-button": "#3b82f6",
    "--color-user-input-border-focus": "#3b82f6",
    "--color-user-input-ring": "#3b82f6",
    "--color-user-agent-selector-focus": "#3b82f6",
    "--color-chat-bubble-user": "#1e40af",
    "--color-chat-header-text": "#ffffff",
    "--color-user-spinner": "#ffffff",
    "--color-chat-bubble-user-foreground": "#ffffff",
    "--color-chat-background": "#ffffff",
    "--color-user-agent-selector-bg": "#ffffff",
    "--color-chat-secondary": "#f1f5f9",
    "--color-chat-user-area": "#f8fafc",
    "--color-chat-border": "#e2e8f0",
    "--color-user-area-border": "#e2e8f0",
    "--color-user-input-border": "#d1d5db",
    "--color-user-button-border": "#d1d5db",
    "--color-user-agent-selector-border": "#d1d5db",
    "--user-input-border-radius": "8px",
    "--user-button-border-radius": "8px",
    "--user-attachment-border-radius": "6px",
    "--chat-font-family": '"Geist", system-ui, sans-serif',
    "--user-input-font-size": "14px",
    "--color-chat-bubble-agent": "#f1f5f9",
    "--color-user-attachment-secondary": "#6b7280",
    "--user-button-icon-size": "16px",
    "--user-attachment-icon-size": "12px",
  };

  for (const [property, value] of Object.entries(defaultStyles)) {
    root.style.setProperty(property, value);
  }
}

interface ChatAppUIProps {
  instance: ChatAppInstance;
  messages: ChatMessage[];
  isLoading: boolean;
  showTimestamps: boolean;
  isContextEngineeringOpen: boolean;
  scrollableAreaRef: React.RefObject<HTMLDivElement>;
  isNearBottom: boolean;
  scrollThumbPosition: number;
  scrollThumbHeight: number;
  isDragging: boolean;
  isUserScrolling: boolean;
  setUserScrollingWithTimeout: () => void;
  onSendMessage: (message: string) => Promise<void>;
  onToggleTimestamps: () => void;
  onToggleContextEngineering: () => void;
  onSetScrollThumbPosition: React.Dispatch<React.SetStateAction<number>>;
  onSetIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  onExpand: () => Promise<void>;
  onCompact: () => Promise<void>;
  onStash: () => Promise<void>;
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onClose: () => Promise<void>;
  onClear: () => Promise<void>;
  className?: string;
  contextEngineering: {
    initialize: () => any;
    isInitialized: boolean;
    stats: any;
    getFinalContext: (question: string) => any;
  };
}

// @ts-ignore - Client-side event handlers, not Server Actions
export function ChatAppUI({
  instance,
  messages,
  isLoading,
  showTimestamps,
  isContextEngineeringOpen,
  scrollableAreaRef,
  isNearBottom,
  scrollThumbPosition,
  scrollThumbHeight,
  isDragging,
  isUserScrolling,
  setUserScrollingWithTimeout,
  onSendMessage,
  onToggleTimestamps,
  onToggleContextEngineering,
  onSetScrollThumbPosition,
  onSetIsDragging,
  onExpand,
  onCompact,
  onStash,
  onArchive,
  onRestore,
  onClose,
  onClear,
  className = "",
  contextEngineering,
}: ChatAppUIProps) {
  // Ref for user scrolling timeout
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (instance.config?.style) {
      applyChatAppStyling(instance.config.style);
    }

    return () => {
      resetChatAppStyling();
    };
  }, [instance.config?.style]);

  // Utility to format time (keep as it's a presentation concern)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Utility functions for scrollbar that still need refactoring (temporarily empty)
  const updateScrollbarPosition = () => {};
  const scrollToBottom = () => {};
  const smartScrollToBottom = () => {};
  const handleScroll = React.useCallback(() => {}, []);
  const handleScrollbarClick = () => {};
  const handleThumbMouseDown = () => {};

  useEffect(() => {
    const scrollArea = scrollableAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll);
      return () => scrollArea.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, scrollableAreaRef]);

  // Cleanup user scrolling timeout on unmount
  useEffect(() => {
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
  }, []);

  // Consolidated auto-scroll effect (moved here from container, simplified)
  useEffect(() => {
    if (scrollableAreaRef.current && messages.length > 0) {
      const hasStreamingMessage = messages.some((msg) => msg.isStreaming);

      if (hasStreamingMessage || isLoading) {
        requestAnimationFrame(() => {
          if (scrollableAreaRef.current) {
            scrollableAreaRef.current.scrollTop =
              scrollableAreaRef.current.scrollHeight;
          }
        });
      } else if (isNearBottom) {
        requestAnimationFrame(() => {
          if (scrollableAreaRef.current) {
            scrollableAreaRef.current.scrollTop =
              scrollableAreaRef.current.scrollHeight;
          }
        });
      }
    }
  }, [messages, messages.length, isLoading, isNearBottom, scrollableAreaRef]);

  return (
    <div
      className={`flex h-full max-h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <HeaderBar
        chatAppId={instance.id}
        title={instance.config?.name || instance.id}
        onExpand={onExpand}
        onCompact={onCompact}
        onStash={onStash}
        onClose={onClose}
        onSettings={() => {}}
        onClear={onClear}
        onArchive={onArchive}
        onRestore={onRestore}
        status={instance.status === "expanded" ? "expanded" : "compact"}
        className="border-b border-gray-200"
      />

      <div
        className="relative flex flex-1 overflow-hidden"
        style={{
          // Ensure the chat area takes full available height in flex container
          minHeight: 0,
        }}
      >
        {/* Main chat messages area */}
        <div
          ref={scrollableAreaRef}
          className="flex-1 overflow-y-auto p-4 focus:outline-none"
          style={{ scrollBehavior: isDragging ? "auto" : "smooth" }}
          role="log"
          aria-live="polite"
          onScroll={handleScroll} // Re-add this and implement properly later if needed
          onWheel={(e) => {
            // Ensure wheel events are handled properly
          }}
        >
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              showTimestamp={showTimestamps}
            />
          ))}

          {messages.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center text-center text-gray-500">
              Start a conversation...
            </div>
          )}
          {isLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
            </div>
          )}
        </div>

        {/* Custom Scrollbar */}
        {scrollableAreaRef.current &&
          scrollableAreaRef.current.scrollHeight >
            scrollableAreaRef.current.clientHeight && (
            <div
              className="absolute right-0 top-0 h-full w-2 cursor-pointer rounded-full bg-gray-200 opacity-0 transition-opacity duration-300 hover:opacity-100 group-hover:opacity-100"
              style={{
                // Custom scrollbar track
                right: 0,
                width: "8px",
                borderRadius: "4px",
                background: "var(--color-chat-scrollbar-track, #e2e8f0)",
                borderLeft: "1px solid var(--color-chat-border, #e2e8f0)",
              }}
              onClick={handleScrollbarClick} // Re-add this and implement properly later if needed
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleScrollbarClick();
                }
              }}
            >
              <div
                className="absolute w-full rounded-full bg-gray-400"
                style={{
                  height: `${scrollThumbHeight}%`,
                  top: `${scrollThumbPosition}%`,
                  background: isDragging
                    ? "var(--color-chat-scrollbar-thumb-active, #475569)"
                    : "var(--color-chat-scrollbar-thumb, #94a3b8)",
                }}
                onMouseDown={handleThumbMouseDown} // Re-add this and implement properly later if needed
                onMouseEnter={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-chat-scrollbar-thumb-hover, #64748b)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-chat-scrollbar-thumb, #94a3b8)";
                  }
                }}
              />
            </div>
          )}
      </div>

      {/* Scroll to bottom button */}
      {!isNearBottom && (
        <button
          type="button"
          onClick={() => {
            if (scrollableAreaRef.current) {
              scrollableAreaRef.current.scrollTop =
                scrollableAreaRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-24 right-4 flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-600 shadow-md transition-all duration-200 hover:bg-gray-200"
          title="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"
            />
          </svg>
          New messages
        </button>
      )}

      {/* User input area */}
      <UserArea
        chatAppId={instance.id}
        onSendMessage={async (text) => {
          await onSendMessage(text);
        }}
      />

      {/* Context Engineering Trigger - Thin line at bottom */}
      <ContextEngineeringTrigger
        onToggle={onToggleContextEngineering}
        isOpen={isContextEngineeringOpen}
        elementCount={contextEngineering.stats?.totalElements || 0}
      />

      {/* Context Engineering Panel */}
      <ContextEngineeringPanel
        chatAppId={instance.id}
        isOpen={isContextEngineeringOpen}
        onClose={onToggleContextEngineering}
      />
    </div>
  );
}
