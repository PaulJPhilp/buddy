"use client";

import { Effect, Layer, Runtime } from "effect";
import React, { createContext, useContext, useEffect, useState } from "react";

import { ChatAppComponent } from "@/components/chatapp/service";
import { WorkspaceComponent } from "@/components/workspace/service";
import { ApplicationManager } from "@/features/application/managers/application/service"; // Updated path
import { CoreManager } from "@/features/application/managers/core/service"; // Updated path
import { HeaderManager } from "@/features/application/managers/header/service"; // Updated path
import { ChatManager } from "@/features/chatapps/chatapp/managers/chat/service"; // Updated path
import { UserAreaManager } from "@/features/chatapps/chatapp/managers/userarea/service"; // Updated path
import { ChatAppsManager } from "@/features/chatapps/managers/chatapps/service"; // Updated path
import { ContextEngineeringManager } from "@/features/context-engineering/managers/context-engineering/service"; // Updated path
import { WorkspaceManagerLive } from "@/features/workspace/managers/workspace-manager"; // Updated path
import { WorkspaceManager } from "@/features/workspace/managers/workspace-manager"; // Updated path
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chatbridge";
import { ConfigService } from "@/services/config/service";

interface EffectContextValue {
  readonly runWithServices: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ) => Promise<A>;
  readonly services: Layer.Layer<never, never, any>;
}

const EffectContext = createContext<EffectContextValue | null>(null);

export function useEffectContext() {
  const context = useContext(EffectContext);
  if (!context) {
    throw new Error("useEffectContext must be used within an EffectProvider");
  }
  return context;
}

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<EffectContextValue | null>(null);

  useEffect(() => {
    const serviceLayer = Layer.mergeAll(
      ConfigService.Default,
      CoreManager.Default,
      ChatManager.Default,
      ChatAppsManager.Default,
      ContextEngineeringManager.Default,
      HeaderManager.Default,
      UserAreaManager.Default,
      WorkspaceManager.Default,
      WorkspaceManagerLive,
      ApplicationManager.Default,
      ChatAppComponent.Default,
      WorkspaceComponent.Default,
    );

    // Use manual memoization to ensure services maintain state
    const initializeServices = Effect.scoped(
      Layer.memoize(serviceLayer).pipe(
        Effect.map((memoizedLayer) => ({
          runWithServices: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
            Effect.provide(effect, memoizedLayer).pipe(Effect.runPromise),
          services: memoizedLayer,
        })),
      ),
    );

    Effect.runPromise(initializeServices).then(setServices);
  }, []);

  if (!services) {
    return null;
  }

  return (
    <EffectContext.Provider value={services}>{children}</EffectContext.Provider>
  );
}
