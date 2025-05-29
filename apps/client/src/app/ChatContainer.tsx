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
  const userId = session?.user?.id ?? "default_user_id";
  const sessionId = session?.id ?? "default_session_id";

  const [runtimeInstance, setRuntimeInstance] =
    useState<Runtime.Runtime<any> | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(true);

  const effectToBuildAppRuntime = useMemo(() => {
    console.log(`[ChatContainer] Building runtime for ${chatType} chat`);

    // Create a simple runtime with all required services
    const appLayer = Layer.mergeAll(
      WebSocketService.Default,
      AgentRuntimeService.Default,
      ChatService.Default
    );

    return Effect.scoped(Layer.toRuntime(appLayer));
  }, [chatType]);

  useEffect(() => {
    let mounted = true;
    setIsLoadingRuntime(true);
    setRuntimeError(null);
    setRuntimeInstance(null);

    console.log(`ChatContainer (${chatType}): Attempting to build runtime. Dependencies:`, {
      chatType,
      userId,
      sessionId,
    });

    const fiber = Effect.runFork(
      effectToBuildAppRuntime
        .pipe(
          Effect.tap((runtime) =>
            Effect.sync(() => {
              if (!mounted) return;
              setIsLoadingRuntime(false);
              Effect.runSync(Effect.log(`ChatContainer (${chatType}): Runtime successfully created.`));
              setRuntimeInstance(runtime as Runtime.Runtime<any>);
            })
          ),
          Effect.catchAll((error: unknown) =>
            Effect.sync(() => {
              if (!mounted) return;
              setIsLoadingRuntime(false);
              const prettyErrorString = String(
                error instanceof Error ? error.message : JSON.stringify(error)
              );
              Effect.runSync(
                Effect.logError(
                  `ChatContainer (${chatType}): Failed to create runtime. Cause: ${prettyErrorString}`
                )
              );
              setRuntimeError(prettyErrorString);
            })
          ),
          Effect.map(() => void 0)
        ) as Effect.Effect<void, never, never>
    );

    return () => {
      mounted = false;
      console.log(`ChatContainer (${chatType}): Cleanup - interrupting runtime build fiber.`);
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [effectToBuildAppRuntime, chatType, userId, sessionId]);

  if (isLoadingRuntime) {
    const themeColor = chatType === "business" ? "blue" : "green";
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

  return (
    <RuntimeContext.Provider value={runtimeInstance}>
      <div className="h-full w-full">
        {chatType === "business" ? (
          <BusinessChat
            isActive={true}
            onActivate={() => { }}
            theme={theme}
          />
        ) : (
          <SocialChat
            isActive={true}
            onActivate={() => { }}
            theme={theme}
          />
        )}
      </div>
    </RuntimeContext.Provider>
  );
}
