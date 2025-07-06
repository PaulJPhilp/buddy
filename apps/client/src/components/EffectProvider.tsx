"use client";

import { Effect, Layer } from "effect";
import { createContext, useContext, useEffect, useState } from "react";

import { AppComponent } from "@/components/app";
import { ChatAppComponent } from "@/components/chatapp";
import { CoreComponent } from "@/components/core";
import { WorkspaceComponent } from "@/components/workspace";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chatbridge";
import { ConfigService } from "@/services/config";

interface EffectContextValue {
  readonly runWithServices: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ) => Promise<A>;
}

const EffectContext = createContext<EffectContextValue | null>(null);

export function useEffectContext(): EffectContextValue {
  const context = useContext(EffectContext);
  if (!context) {
    throw new Error("useEffectContext must be used within an EffectProvider");
  }
  return context;
}

export function EffectProvider({ children }: { children: React.ReactNode }) {
  const [contextValue, setContextValue] = useState<EffectContextValue | null>(
    null,
  );

  useEffect(() => {
    console.log("[EffectProvider] Initializing v2 services only");

    // Create service layer with v2 services only
    const serviceLayer = Layer.mergeAll(
      ConfigService.Default,
      CoreComponent.Default,
      AppComponent.Default,
      WorkspaceComponent.Default,
      ChatAppComponent.Default,
      ChatService.Default,
      ChatBridge.Default,
    );

    const runWithServices = <A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ): Promise<A> => {
      return Effect.runPromise(
        Effect.provide(effect, serviceLayer) as Effect.Effect<A, E, never>,
      );
    };

    setContextValue({ runWithServices });
    console.log("[EffectProvider] v2 services initialized");
  }, []);

  if (!contextValue) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Initializing v2 services...</p>
        </div>
      </div>
    );
  }

  return (
    <EffectContext.Provider value={contextValue}>
      {children}
    </EffectContext.Provider>
  );
}
