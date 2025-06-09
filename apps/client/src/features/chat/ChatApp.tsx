"use client";

import type { ChatAppProps } from "./types/chat.types";

/**
 * Placeholder ChatApp component - separated from complex chat functionality for testing.
 * This is a simple placeholder that will be replaced with the full chat implementation later.
 */
export function ChatApp({
  chatId,
  displayName = "Chat",
  className = "",
}: ChatAppProps) {
  return (
    <div className={`h-full w-full p-4 ${className}`}>
      <div className="h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-lg font-semibold text-gray-700 mb-1">
            Chat App Placeholder
          </div>
          <div className="text-sm text-gray-500 mb-2">
            Chat ID: {chatId || "none"}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Display Name: {displayName || "none"}
          </div>
          <div className="text-xs text-gray-400 max-w-xs">
            This is a placeholder for the full chat application.
            The complex chat functionality has been separated for testing.
          </div>
        </div>
      </div>
    </div>
  );
}
