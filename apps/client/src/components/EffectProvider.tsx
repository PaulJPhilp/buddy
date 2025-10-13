"use client";

import { Effect, Layer, Runtime } from "effect";
import React, { createContext, useContext, useEffect, useState } from "react";

import { ApplicationManager } from "@/features/application/manager/service";
import { CoreManager } from "@/features/application/manager/core/core/service";
import { HeaderManager } from "@/features/application/features/header/header/service";
import { ChatAppsManager } from "@/features/chatapps/manager/service";
import { ChatManager } from "@/features/chatapps/features/chatapp/managers/service";
import { ContextEngineeringManager } from "@/features/chatapps/features/chatapp/features/context-engineering/managers/service";
import { UserAreaManager } from "@/features/chatapps/features/chatapp/features/userarea/managers/service";
import { WorkspaceComponent } from "@/features/workspace/managers";
import { WorkspaceManager } from "@/features/workspace/managers/workspace-manager/service";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chatbridge";
import { ConfigService } from "@/services/config/service";

type MemoizedLayer = Layer.Layer<any, unknown, unknown>;

interface EffectContextValue {
  readonly runWithServices: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ) => Promise<A>;
  readonly services: MemoizedLayer;
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
      ApplicationManager.Default,
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
