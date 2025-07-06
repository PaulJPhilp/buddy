"use client";

import { FetchHttpClient } from "@effect/platform";
import { Effect, Layer } from "effect";
import { type ReactNode, createContext, useContext, useRef } from "react";

// Service imports
import { AgentManager } from "@/managers/agent-manager";
import { AppManager } from "@/managers/app-manager";
import { ChatAppsManager } from "@/managers/chat-apps-manager";
import { ChatManager } from "@/managers/chat-manager";
import { WorkspaceManager } from "@/managers/workspace-component";
import { AgentRegistryService } from "@/services/agent-registry";
import { AgentKitBridge } from "@/services/agentkit-bridge/service";
import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { LayoutService } from "@/services/layout";
import { MdxService } from "@/services/mdx";
import { ToolbarService } from "@/services/toolbar";
import { UrlService } from "@/services/url";

import { AppComponent } from "@/components-v2/app";
import { ChatAppComponent } from "@/components-v2/chatapp";
import { CoreComponent } from "@/components-v2/core";
import { WorkspaceComponent } from "@/components-v2/workspace";
// V2 Service imports
import { ConfigService } from "@/services-v2/config";

// Create the shared service layer with proper dependency ordering
const sharedServiceLayer = Layer.mergeAll(
  // Foundation layers first
  FetchHttpClient.layer, // Provides HttpClient for browser
  UrlService.Default, // Base config service (no dependencies)

  // V2 Services (no dependencies)
  ConfigService.Default,
  CoreComponent.Default,

  // Services that depend on config/http
  AppService.Default,
  WorkspaceManager.Default,

  // Other services
  AgentRegistryService.Default,
  ToolbarService.Default,
  ChatService.Default,
  ChatBridge.Default,
  AgentKitBridge.Default,
  LayoutService.Default,
  MdxService.Default,

  // V2 Components (depend on core services)
  WorkspaceComponent.Default,
  ChatAppComponent.Default,
  AppComponent.Default,

  // Manager services that depend on other services
  AgentManager.Default,
  ChatAppsManager.Default,
  ChatManager.Default,
  AppManager.Default,
);

// Context type
interface EffectContextValue {
  runWithServices: <A, E = never>(
    effect: Effect.Effect<A, E, any>,
  ) => Promise<A>;
}

// Create context
const EffectContext = createContext<EffectContextValue | null>(null);

// Provider component
export function EffectProvider({ children }: { children: ReactNode }) {
  // Use ref to ensure we only create the layer once
  const layerRef = useRef<Layer.Layer<any, never, never>>(sharedServiceLayer);

  const runWithServices = <A, E = never>(
    effect: Effect.Effect<A, E, any>,
  ): Promise<A> => {
    console.log("[EffectProvider] Running effect with shared service layer");
    return Effect.runPromise(
      (effect as any).pipe(Effect.provide(layerRef.current)),
    );
  };

  const contextValue: EffectContextValue = {
    runWithServices,
  };

  return (
    <EffectContext.Provider value={contextValue}>
      {children}
    </EffectContext.Provider>
  );
}

// Hook to use the Effect context
export function useEffectContext(): EffectContextValue {
  const context = useContext(EffectContext);
  if (!context) {
    throw new Error("useEffectContext must be used within an EffectProvider");
  }
  return context;
}
