"use client";

import BusinessChat from "@/features/chat/BusinessChat";
import SocialChat from "@/features/chat/SocialChat";
import type { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import { AgentRuntimeService } from "@/services/agent-runtime/AgentRuntimeService";
import { ChatService } from "@/services/chat/ChatService";
import { WebSocketService } from "@/services/websocket/WebSocketService";

import { useSession } from "@clerk/nextjs";
import { Effect, Fiber, Layer, Runtime } from "effect";
import React, { useEffect, useMemo, useState } from "react";
import { useSelectedChat } from "@/contexts/SelectedChatContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

// Create a context for the runtime
export const RuntimeContext = React.createContext<Runtime.Runtime<any> | null>(
  null,
);

interface ChatContainerProps {
  chatType: "business" | "social";
  theme?: Partial<ChatAppTheme> | string;
  id: string;
}

export default function ChatContainer({ chatType, theme, id }: ChatContainerProps) {
  const { session } = useSession();
  const { getAppTheme, chatThemes, themeUpdateCount } = useTheme();
  const { selectedChatId } = useSelectedChat();
  
  // Check if this chat is the selected one
  const isSelected = id === selectedChatId;
  
  // Get theme from context or use provided theme
  // If this is the selected chat, we should use the theme from the selected chat
  // Otherwise, use the theme for this specific chat ID
  let appliedTheme = theme;
  if (!appliedTheme) {
    if (isSelected && chatThemes[selectedChatId]) {
      appliedTheme = selectedChatId;
    } else if (id && chatThemes[id]) {
      appliedTheme = id;
    }
  }
  
  // Track theme updates
  useEffect(() => {
    // Effect runs when theme updates occur
  }, [themeUpdateCount, appliedTheme, id, isSelected, selectedChatId]);

  // All hooks at the top level
  const [runtimeInstance, setRuntimeInstance] =
    useState<Runtime.Runtime<any> | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(true);

  // Memoize session data to prevent unnecessary re-renders
  const sessionData = useMemo(() => ({
    userId: session?.user?.id ?? "default_user_id",
    sessionId: session?.id ?? "default_session_id"
  }), [session?.user?.id, session?.id]);

  // Memoize runtime layer to prevent unnecessary re-renders
  const appLayer = useMemo(() => Layer.mergeAll(
    WebSocketService.Default,
    AgentRuntimeService.Default,
    ChatService.Default
  ), []);

  // Create runtime effect only once
  const effectToBuildAppRuntime = useMemo(() => {
    return Effect.scoped(Layer.toRuntime(appLayer));
  }, [appLayer]);

  const contextValue = useMemo(() => runtimeInstance, [runtimeInstance]);

  const ChatComponent = useMemo(() => {
    const component = chatType === "business" ? BusinessChat : SocialChat;
    return component;
  }, [chatType]);

  // Memoize the onActivate callback to prevent unnecessary re-renders
  const onActivateCallback = useMemo(() => () => { }, []);

  const renderedChat = useMemo(() => {
    return (
      <ChatComponent
        isActive={true}
        onActivate={onActivateCallback}
        theme={appliedTheme}
        key={`chat-${id}-theme-${themeUpdateCount}`} // Add a key to force re-render on theme changes
      />
    );
  }, [ChatComponent, onActivateCallback, appliedTheme, themeUpdateCount, id]);

  // Initialize runtime only if we don't have one
  useEffect(() => {
    if (runtimeInstance) return;

    let mounted = true;
    setIsLoadingRuntime(true);
    setRuntimeError(null);

    const fiber = Effect.runFork(
      effectToBuildAppRuntime
        .pipe(
          Effect.tap((runtime) =>
            Effect.sync(() => {
              if (!mounted) return;
              setIsLoadingRuntime(false);
              setRuntimeInstance(runtime as Runtime.Runtime<any>);
            })
          ),
          Effect.catchAll((error: unknown) =>
            Effect.sync(() => {
              if (!mounted) return;
              console.error('[ChatContainer] Runtime initialization failed:', error);
              setIsLoadingRuntime(false);
              const prettyErrorString = String(
                error instanceof Error ? error.message : JSON.stringify(error)
              );
              setRuntimeError(prettyErrorString);
            })
          ),
          Effect.map(() => void 0)
        ) as Effect.Effect<void, never, never>
    );

    return () => {
      mounted = false;
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [effectToBuildAppRuntime, runtimeInstance]);

  if (isLoadingRuntime) {
    const themeColor = chatType === "business" ? "blue" : "purple";
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-${themeColor}-600 mx-auto mb-4`} />
          <div className="text-lg font-semibold mb-2">
            Initializing {chatType === "business" ? "Business" : "Social"} Chat
          </div>
          <div className={`text-sm text-${themeColor}-600`}>Setting up runtime...</div>
        </div>
      </div>
    );
  }

  if (runtimeError) {
    console.error('[ChatContainer] Runtime error occurred:', runtimeError);
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">Error</div>
          <div className="text-sm">{runtimeError}</div>
        </div>
      </div>
    );
  }

  return (
    <RuntimeContext.Provider value={contextValue}>
      <div className="h-full w-full">
        {renderedChat}
      </div>
    </RuntimeContext.Provider>
  );
}
