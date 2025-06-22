"use client";

import { StashedChatAppsBar } from "@/components/Stashed";
import { ChatContainer } from "@/components/chat";
import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { ToolbarService } from "@/services/toolbar";
import { WebSocketService } from "@/services/websocket";
import type { ChatAppConfig } from "@/types/global";
import {
  useChatAppsInCurrentWorkspace,
  useCurrentWorkspace,
  useWorkspaceActions,
} from "@/workspace/useWorkspace";
import { Effect, Layer } from "effect";
import { useEffect, useState } from "react";

const serviceLayer = Layer.mergeAll(
  AppService.Default,
  ConfigService.Default,
  MdxService.Default,
  ToolbarService.Default,
  WebSocketService.Default,
  ChatService.Default,
  ChatBridge.Default,
);

export function Workspace() {
  const currentWorkspace = useCurrentWorkspace();
  const chatAppsInCurrentWorkspace = useChatAppsInCurrentWorkspace();
  const { addChatApps } = useWorkspaceActions();
  const [chatConfigs, setChatConfigs] = useState<ChatAppConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfigs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const configs = await Effect.runPromise(
          Effect.gen(function* () {
            const appService = yield* AppService;
            return yield* appService.getAll();
          }).pipe(Effect.provide(serviceLayer)),
        );
        if (!cancelled) {
          const validConfigs = configs || [];
          setChatConfigs(validConfigs);
          if (validConfigs.length > 0) {
            addChatApps(validConfigs);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load ChatApp configs:", err);
          setError("Failed to load chat applications");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // loadConfigs();

    return () => {
      cancelled = true;
    };
  }, [addChatApps]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading Chat Apps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Chat Apps</h2>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const safeChatApps = chatAppsInCurrentWorkspace || [];
  const activeApp = safeChatApps.find(
    (app) => app.status === "expanded" || app.status === "compact",
  );

  return (
    <div className="flex flex-col h-full w-full">
      <StashedChatAppsBar />
      <div className="flex-1 flex flex-row">
        {(() => {
          if (safeChatApps.length === 0) {
            return (
              <div className="h-full flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">💬</div>
                  <h2 className="text-2xl font-bold mb-4">No Chat Apps</h2>
                  <p className="text-muted-foreground mb-6">
                    No chat applications in the current workspace "
                    {currentWorkspace?.name || "Unknown"}".
                  </p>
                </div>
              </div>
            );
          }

          if (!activeApp) {
            return (
              <div className="h-full flex-1 flex items-center justify-center">
                <p>
                  No active chat app in current workspace. Select one from the
                  stashed apps above.
                </p>
              </div>
            );
          }

          const config = chatConfigs.find((c) => c.id === activeApp.id);
          if (!config) {
            return (
              <div className="h-full flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-destructive mb-4">
                    Chat app configuration not found: {activeApp.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available configs: {chatConfigs.map((c) => c.id).join(", ")}
                  </p>
                </div>
              </div>
            );
          }

          return <ChatContainer config={config} />;
        })()}
      </div>
    </div>
  );
}
