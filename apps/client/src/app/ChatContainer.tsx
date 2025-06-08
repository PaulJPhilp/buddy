"use client";

import type { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { useSession } from "@clerk/nextjs";
import { useTheme } from "next-themes";
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

  const { theme: rawTheme } = useTheme();
  const { session } = useSession();

  const sessionData = useMemo(
    () => ({
      userId: session?.user?.id ?? "default_user_id",
      userName: session?.user?.fullName ?? "Unknown User",
    }),
    [session?.user?.id, session?.user?.fullName],
  );

  // Theme handling - simplified
  const appliedTheme = useMemo(() => {
    try {
      if (theme && typeof theme === "object") return theme;
      if (theme && typeof theme === "string") {
        try {
          return JSON.parse(theme);
        } catch (e) {
          console.error("Error parsing theme:", e);
        }
      }
      if (rawTheme && typeof rawTheme === "object") return rawTheme;
      if (
        rawTheme &&
        typeof rawTheme === "string" &&
        !["system", "dark", "light"].includes(rawTheme)
      ) {
        try {
          return JSON.parse(rawTheme);
        } catch (e) {
          console.error("Error parsing rawTheme:", e);
        }
      }
    } catch (error) {
      console.error("Theme processing error:", error);
    }
    return {};
  }, [theme, rawTheme]);

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
