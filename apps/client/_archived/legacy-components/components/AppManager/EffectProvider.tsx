"use client";

import { AppManager } from "@/managers/app-manager";
import { Effect, Layer } from "effect";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

/**
 * EffectProvider for AppManager Service
 *
 * This provides the AppManager service to the Effect runtime
 * so React components can access it via Effect.runPromise.
 */

interface EffectContextValue {
  runWithServices: <A, E>(
    program: Effect.Effect<A, E, AppManager>,
  ) => Promise<A>;
}

const EffectContext = createContext<EffectContextValue | null>(null);

export interface EffectProviderProps {
  children: ReactNode;
}

export function EffectProvider({ children }: EffectProviderProps) {
  const runWithServices = <A, E>(
    program: Effect.Effect<A, E, AppManager>,
  ): Promise<A> => {
    return Effect.runPromise(Effect.provide(program, AppManager.Default));
  };

  return (
    <EffectContext.Provider value={{ runWithServices }}>
      {children}
    </EffectContext.Provider>
  );
}

export function useEffectRunner() {
  const context = useContext(EffectContext);
  if (!context) {
    throw new Error("useEffectRunner must be used within an EffectProvider");
  }
  return context;
}
