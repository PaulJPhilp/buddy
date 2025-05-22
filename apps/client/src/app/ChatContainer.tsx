"use client";

import BusinessChat from "@/features/chat/BusinessChat";
import SocialChat from "@/features/chat/SocialChat";
import {
  type AppAgentRuntimeConfig,
  AppServicesLayer,
} from "@/services/effectLayers"; // Assuming alias or correct relative path
import { useSession } from "@clerk/nextjs";
import { Cause, Context, Effect, Fiber, Layer, Runtime } from "effect";
import React, { useEffect, useMemo, useState } from "react";

// Create a context for the runtime
export const RuntimeContext = React.createContext<Runtime.Runtime<any> | null>(
  null,
);

interface ChatContainerProps {
  // Define chatType based on its expected values, e.g., 'business' | 'social' or string
  // For now, let's assume it's intended to be the same as activeChat's type
  chatType: "business" | "social";
}

export default function ChatContainer({ chatType }: ChatContainerProps) {
  const [activeChat, setActiveChat] = useState<"business" | "social">(chatType); // Initialize with prop
  const { session } = useSession();
  const userId = session?.user?.id ?? "default_user_id";
  const sessionId = session?.id ?? "default_session_id";

  // Create the runtime with the necessary layers
  // This runtime will be shared by both BusinessChat and SocialChat instances
  // if they use hooks that depend on the provided context.
  const [runtimeInstance, setRuntimeInstance] =
    useState<Runtime.Runtime<any> | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isLoadingRuntime, setIsLoadingRuntime] = useState(true);

  const effectToBuildAppRuntime = useMemo(() => {
    // Pre-flight checks for critical imports
    if (AppServicesLayer === undefined) {
      throw new Error(
        "ChatContainer Error: AppServicesLayer is undefined. Check import from '@/services/effectLayers'.",
      );
    }
    if (AppAgentRuntimeConfigTag === undefined) {
      throw new Error(
        "ChatContainer Error: AppAgentRuntimeConfigTag is undefined. Check import from '@/services/effectLayers'.",
      );
    }

    const agentConfig: AppAgentRuntimeConfig = {
      agentId: "global_chat_agent_001",
    };

    // When building the runtime, do:
    const configContext = Context.empty().pipe(
      Context.add(AppAgentRuntimeConfigTag(), agentConfig)
    )
    const effectToBuildRuntime = Effect.scoped(
      Layer.toRuntime(AppServicesLayer)
    ).pipe(
      Effect.provide(configContext)
    );

    // --- Start Diagnostics for Layers ---
    console.log("Inspecting AppServicesLayer:", {
      type: typeof AppServicesLayer,
      isLayer: Layer.isLayer(AppServicesLayer),
      value: AppServicesLayer,
      tag: (AppServicesLayer as any)?._tag,
    });
    console.log("Inspecting AppAgentRuntimeConfigTag:", {
      type: typeof AppAgentRuntimeConfigTag,
      isLayer: Layer.isLayer(AppAgentRuntimeConfigTag),
      value: AppAgentRuntimeConfigTag,
      tag: (AppAgentRuntimeConfigTag as any)?._tag,
    });
    // --- End Diagnostics for Layers ---

    // --- Diagnostics for Layers (can be removed once stable) ---
    console.log("Inspecting AppServicesLayer:", {
      type: typeof AppServicesLayer,
      isLayer: Layer.isLayer(AppServicesLayer),
      value: AppServicesLayer,
      tag: (AppServicesLayer as any)?._tag,
    });
    console.log("Inspecting AppAgentRuntimeConfigTag:", {
      type: typeof AppAgentRuntimeConfigTag,
      isLayer: Layer.isLayer(AppAgentRuntimeConfigTag),
      value: AppAgentRuntimeConfigTag,
      tag: (AppAgentRuntimeConfigTag as any)?._tag,
    });
    // --- End Diagnostics ---

    // --- Start Simple Layer Test --- // REMOVE THIS IN PRODUCTION
    const TestTag = Context.Tag<string>("TestTagSimpleService");
    const testLayerSimple = Layer.succeed(TestTag(), {
      testValue: "hello from simple test",
    });
    const effectToBuildTestRuntime = Effect.scoped(
      Layer.toRuntime(testLayerSimple),
    );

    console.log(
      "Simple Test: testLayerSimple is Layer?",
      Layer.isLayer(testLayerSimple),
    );
    console.log(
      "Simple Test: testLayerSimple _tag:",
      (testLayerSimple as any)?._tag,
    );
    console.log(
      "Simple Test: effectToBuildTestRuntime is Effect?",
      Effect.isEffect(effectToBuildTestRuntime),
    );
    console.log(
      "Simple Test: effectToBuildTestRuntime _tag:",
      (effectToBuildTestRuntime as any)?._tag,
    );
    console.log(
      "Simple Test: effectToBuildTestRuntime keys:",
      Object.keys(effectToBuildTestRuntime),
    );

    Effect.runPromiseExit(
      Effect.scoped(effectToBuildTestRuntime).pipe(
        Effect.flatMap(
          (runtime) =>
            Effect.sync(() =>
              console.log(
                "Simple Test: Successfully created testRuntime",
                runtime,
              ),
            ),
          // No catchAll here, let runPromiseExit handle it for the test log
          // Effect.catchAll((e) =>
          //   Effect.sync(() => console.error("Simple Test: Failed to create testRuntime:", e))
          // )
        ),
        Effect.catchAll((e) =>
          Effect.sync(() =>
            console.error("Simple Test: Failed to create testRuntime:", e),
          ),
        ),
      ),
    );
    // --- End Simple Layer Test ---

    const scopedEffectToBuildRuntime = Effect.scoped(effectToBuildRuntime);
    if (scopedEffectToBuildRuntime === undefined) {
      throw new Error(
        "ChatContainer Error: Effect.scoped(effectToBuildRuntime) returned undefined.",
      );
    }

    return scopedEffectToBuildRuntime; // Return the already scoped effect
  }, []); // REMOVED chatType, userId, sessionId based on lint

  useEffect(() => {
    setIsLoadingRuntime(true);
    setRuntimeError(null);
    setRuntimeInstance(null);

    console.log("ChatContainer: Attempting to build runtime. Dependencies:", {
      chatType,
      userId,
      sessionId,
    });

    // effectToBuildAppRuntime is already a scoped Effect that produces the Runtime.
    // It will manage its own scope.
    const fiber = Effect.runFork(
      Effect.match(effectToBuildAppRuntime as Effect.Effect<any, never, never>, {
        onFailure: (cause: Cause.Cause<unknown>) => {
          setIsLoadingRuntime(false);
          const prettyErrorString = Cause.pretty(cause);
          console.error(
            "ChatContainer: Failed to create runtime. Cause:",
            prettyErrorString,
            cause,
          );
          setRuntimeError(prettyErrorString);
        },
        onSuccess: (runtime) => {
          setIsLoadingRuntime(false);
          console.log("ChatContainer: Runtime successfully created.", runtime);
          setRuntimeInstance(runtime as Runtime.Runtime<any>); // Cast for now
        },
      }),
    );

    return () => {
      console.log("ChatContainer: Interrupting runtime build fiber.");
      Effect.runFork(Fiber.interrupt(fiber)); // Interrupt the fiber that's building/providing the runtime
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

  // If runtime is successfully created:
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

export const AppAgentRuntimeConfigTag = Context.Tag<string>("AppAgentRuntimeConfig")
