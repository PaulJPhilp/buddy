"use client";

import { Effect, Layer, Runtime } from "effect";
import React, { createContext, useContext, useEffect, useState } from "react";

import { AppComponent } from "@/components/app/service";
import { ChatAppComponent } from "@/components/chatapp/service";
import { WorkspaceComponent } from "@/components/workspace/service";
import { ChatManager } from "@/managers/chat/service";
import { ChatAppsManager } from "@/managers/chatapps/service";
import { CoreManager } from "@/managers/core/service";
import { WorkspaceManagerLive } from "@/managers/workspace";
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
      WorkspaceManagerLive,
      AppComponent.Default,
      ChatAppComponent.Default,
      WorkspaceComponent.Default,
    );

    setServices({
      runWithServices: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.provide(effect, serviceLayer).pipe(Effect.runPromise),
      services: serviceLayer,
    });
  }, []);

  if (!services) {
    return null;
  }

  return (
    <EffectContext.Provider value={services}>{children}</EffectContext.Provider>
  );
}
