"use client";

import BusinessChat from "@/features/chat/BusinessChat";
import SocialChat from "@/features/chat/SocialChat";
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
}

export default function ChatContainer({ chatType }: ChatContainerProps) {
  const [activeChat, setActiveChat] = useState<"business" | "social">(chatType);
  const { session } = useSession();
  const userId = session?.user?.id ?? "default_user_id";
  const sessionId = session?.id ?? "default_session_id";

  const [runtimeInstance, setRuntimeInstance] =
    useState<Runtime.Runtime<any> | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(true);

  const effectToBuildAppRuntime = useMemo(() => {
    // Compose the default layers for all required services
    const appLayer = Layer.mergeAll(
      WebSocketService.Default,
      AgentRuntimeService.Default,
      ChatService.Default,
    );
    return Effect.scoped(Layer.toRuntime(appLayer)).pipe(
      Effect.provide(appLayer)
    );
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoadingRuntime(true);
    setRuntimeError(null);
    setRuntimeInstance(null);

    console.log("ChatContainer: Attempting to build runtime. Dependencies:", {
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
              Effect.runSync(Effect.log("ChatContainer: Runtime successfully created."));
              setRuntimeInstance(runtime as Runtime.Runtime<any>);
            })
          ),
          Effect.catchAll((error) =>
            Effect.sync(() => {
              if (!mounted) return;
              setIsLoadingRuntime(false);
              const prettyErrorString = String(
                error instanceof Error ? error.message : JSON.stringify(error)
              );
              Effect.runSync(
                Effect.logError(
                  `ChatContainer: Failed to create runtime. Cause: ${prettyErrorString}`
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
      console.log("ChatContainer: Cleanup - interrupting runtime build fiber.");
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [effectToBuildAppRuntime, chatType, userId, sessionId]);

  if (isLoadingRuntime) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        Initializing Chat Runtime...
      </div>
    );
  }

  if (runtimeError || !runtimeInstance) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-red-600 p-4">
        <h2 className="text-xl font-semibold mb-2">
          Error Initializing Chat Runtime
        </h2>
        <p className="mb-1">
          We encountered a problem setting up the chat services.
        </p>
        {runtimeError && (
          <pre className="text-xs whitespace-pre-wrap bg-red-100 p-2 rounded border border-red-300 w-full max-w-2xl overflow-auto">
            {typeof runtimeError === "string"
              ? runtimeError
              : JSON.stringify(runtimeError, null, 2)}
          </pre>
        )}
        {!runtimeInstance && !runtimeError && (
          <p>Runtime instance is unexpectedly null.</p>
        )}
      </div>
    );
  }

  return (
    <RuntimeContext.Provider value={runtimeInstance}>
      <div className="flex h-full w-full p-4 gap-4">
        <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
          <BusinessChat
            isActive={activeChat === "business"}
            onActivate={() => setActiveChat("business")}
          />
        </div>
        <div className="flex-1 h-full rounded-lg shadow-lg overflow-hidden">
          <SocialChat
            isActive={activeChat === "social"}
            onActivate={() => setActiveChat("social")}
          />
        </div>
      </div>
    </RuntimeContext.Provider>
  );
}
