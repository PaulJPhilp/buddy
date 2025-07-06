"use client";

import React, { useEffect, useRef } from "react";
// import { Message } from "ai/react"; // Keep this commented or removed as per user's local change

export interface ChatMessage {
  id: string;
  text: string;
  isUser?: boolean;
  timestamp: Date | number | string;
}

export interface MessageAreaProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  messages = [],
  isLoading = false,
  error = null,
  className = "",
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: only need to scroll when message count changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className={`overflow-auto px-sm py-xs space-y-xs ${className}`}>
      {isLoading ? (
        <div className="p-xs bg-muted rounded-sm text-xs text-muted-foreground">
          Loading messages...
        </div>
      ) : error && messages.length === 0 ? (
        <div className="p-xs bg-destructive/10 rounded-sm text-xs text-destructive border border-destructive/30">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="p-xs bg-muted rounded-sm text-xs text-muted-foreground">
          No messages yet. Start a conversation.
        </div>
      ) : (
        // TODO: Attempt to re-integrate Vercel AI SDK's Message component later.
        // The import 'import { Message } from "ai/react";' was causing build issues:
        // "Cannot find name 'Message'. Did you mean 'messages'?"
        // despite 'ai' being a dependency of @buddy/ui and root, and transpilePackages being set.
        messages.map((message) => (
          <div
            key={message.id}
            className={`p-xs rounded-sm max-w-[85%] ${
              message.isUser
                ? "bg-primary/10 ml-auto border border-primary/20" // Original user style
                : "bg-background border border-border" // Original agent style
            }`}
          >
            <p className="text-xs whitespace-pre-wrap break-words">
              {message.text}
            </p>
            <p className="text-xxs text-muted-foreground mt-xxs">
              {message.timestamp instanceof Date
                ? message.timestamp.toLocaleTimeString()
                : typeof message.timestamp === "number"
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : typeof message.timestamp === "string" &&
                      !Number.isNaN(Date.parse(message.timestamp))
                    ? new Date(message.timestamp).toLocaleTimeString()
                    : "Just now"}
            </p>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageArea;
