"use client";

import { BasicChatContainer } from "@/app/BasicChatContainer";
import React, { useMemo } from "react";
import type { ChatAppProps } from "./types/chat.types";

/**
 * Minimal ChatApp component that uses BasicChatContainer to help track down infinite recursion issues.
 * This is a simplified version that removes complex state and side effects.
 */
export function ChatApp({
  chatId,
  displayName = "Chat",
  className = "",
}: ChatAppProps) {
  // Simple debug message to track renders
  const debugMessage = useMemo(
    () => ({
      chatId,
      displayName,
      timestamp: new Date().toISOString(),
    }),
    [chatId, displayName],
  );

  return (
    <div className={className}>
      <BasicChatContainer
        id={chatId}
        title={`Chat: ${displayName || chatId || "Untitled"}`}
        messages={[
          `Chat ID: ${chatId || "none"}`,
          `Display Name: ${displayName || "none"}`,
          `Last render: ${debugMessage.timestamp}`,
        ]}
      />
    </div>
  );
}
