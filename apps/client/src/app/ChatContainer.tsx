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

// Create a context for the runtime
export const RuntimeContext = React.createContext<Runtime.Runtime<any> | null>(
  null,
);

interface ChatContainerProps {
  chatType: "business" | "social";
  theme?: Partial<ChatAppTheme> | string;
}

export default function ChatContainer({ chatType, theme }: ChatContainerProps) {
  const { session } = useSession();

  console.log('[ChatContainer] Rendering with:', { chatType, theme, sessionExists: !!session });

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
    console.log('[ChatContainer] Selected ChatComponent:', { chatType, componentName: component.name });
    return component;
  }, [chatType]);

  // Memoize the onActivate callback to prevent unnecessary re-renders
  const onActivateCallback = useMemo(() => () => { }, []);

  const renderedChat = useMemo(() => {
    console.log('[ChatContainer] Creating renderedChat with theme:', theme);
    return (
      <ChatComponent
        isActive={true}
        onActivate={onActivateCallback}
        theme={theme}
      />
    );
  }, [ChatComponent, onActivateCallback, theme]);

  // Initialize runtime only if we don't have one
  useEffect(() => {
    if (runtimeInstance) return;

    console.log('[ChatContainer] Initializing runtime...');
    let mounted = true;
    setIsLoadingRuntime(true);
    setRuntimeError(null);

    const fiber = Effect.runFork(
      effectToBuildAppRuntime
        .pipe(
          Effect.tap((runtime) =>
            Effect.sync(() => {
              if (!mounted) return;
              console.log('[ChatContainer] Runtime initialized successfully');
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
    const themeColor = chatType === "business" ? "blue" : "green";
    console.log('[ChatContainer] Showing loading state with theme color:', themeColor);
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

  console.log('[ChatContainer] Rendering chat component');
  return (
    <RuntimeContext.Provider value={contextValue}>
      <div className="h-full w-full">
        {renderedChat}
      </div>
    </RuntimeContext.Provider>
  );
}
