"use client";

import type { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { useParsedTheme } from "@/stores/themeStore";
import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import { useChatRuntime } from "../contexts/ChatRuntimeContext";

// Props interface
interface ChatContainerProps {
  theme?: ChatAppTheme;
  id: string;
  displayName?: string;
}

// Main container component
export default function ChatContainer({
  theme,
  id,
  displayName,
}: ChatContainerProps) {
  console.warn("ChatContainer mounted", { id, displayName });

  // Use the chat runtime context
  const runtime = useChatRuntime();

  // Get centralized theme (no more duplication!)
  const centralizedTheme = useParsedTheme();
  const { session } = useSession();

  const sessionData = useMemo(
    () => ({
      userId: session?.user?.id ?? "default_user_id",
      userName: session?.user?.fullName ?? "Unknown User",
    }),
    [session?.user?.id, session?.user?.fullName],
  );

  // Use prop theme if provided, otherwise use centralized theme
  const appliedTheme = theme || centralizedTheme;

  return (
    <div className="h-full w-full p-4">
      <div className="mb-4 text-lg font-semibold">Chat Container ({id})</div>

      {/* Session Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="font-medium">Session Info:</div>
        <div>
          <div>User: {sessionData.userName}</div>
          <div>ID: {sessionData.userId}</div>
        </div>
      </div>

      {/* Chat Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="font-medium">Chat Info:</div>
        <div>
          <div>Chat ID: {id}</div>
          <div>Display Name: {displayName}</div>
        </div>
      </div>

      {/* Theme Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="font-medium">Theme Info:</div>
        <pre className="text-sm mt-2 overflow-auto">
          {JSON.stringify(appliedTheme, null, 2)}
        </pre>
      </div>

      {/* Runtime Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <div className="font-medium">Runtime Status:</div>
        {runtime.status === "ready" ? (
          <div className="text-green-600">Runtime ready</div>
        ) : runtime.status === "error" ? (
          <div className="text-red-600">
            Runtime error: {String(runtime.error)}
          </div>
        ) : (
          <div className="text-blue-600">Initializing runtime...</div>
        )}
      </div>

      {/* Runtime Services Info */}
      {runtime.chatRuntime && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <div className="font-medium">Available Services:</div>
          <div>
            <div>Chat Runtime Service: Available</div>
          </div>
        </div>
      )}
    </div>
  );
}
