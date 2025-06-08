"use client";

import type { ChatAppTheme } from "@/features/chat/themes/themeTypes";
import type { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";
import { ChatRuntimeService } from "@/services/chat-runtime/ChatRuntimeService";
import { WebSocketService } from "@/services/websocket/WebSocketService";
import { useSession } from "@clerk/nextjs";
import { Effect, Fiber, Layer, Runtime } from "effect";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";

// Create a context for the runtime - simplified version
const RuntimeContext = React.createContext<Runtime.Runtime<any> | null>(null);

/**
 * A minimal chat container for testing purposes.
 * Now includes theme, session, config, and runtime support.
 */
interface BasicChatContainerProps {
  title?: string;
  messages?: string[];
  theme?: Partial<ChatAppTheme> | string;
  id: string;
}

export const BasicChatContainer = React.memo<BasicChatContainerProps>(
  ({ title, messages, theme: propTheme, id }) => {
    const { theme: rawTheme } = useTheme();
    const { session } = useSession();
    const sessionData = React.useMemo(() => {
      if (!session?.user) return null;
      return {
        userId: session.user.id,
        userName: session.user.fullName || "Unknown",
      };
    }, [session]);

    // Runtime state
    const [runtimeInstance, setRuntimeInstance] =
      useState<Runtime.Runtime<any> | null>(null);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);
    const [isLoadingRuntime, setIsLoadingRuntime] = useState(true);

    // Config state
    const [chatAppConfig, setChatAppConfig] = useState<ChatAppConfig | null>(
      null,
    );
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    // App layer - memoized once
    const appLayer = useMemo(
      () =>
        Layer.mergeAll(WebSocketService.Default, ChatRuntimeService.Default),
      [],
    );

    // Runtime effect - memoized once
    const effectToBuildAppRuntime = useMemo(
      () => Effect.scoped(Layer.toRuntime(appLayer)),
      [appLayer],
    );

    // Initialize runtime
    useEffect(() => {
      if (runtimeInstance || isLoadingRuntime) return;

      let mounted = true;
      let statesUpdated = false;

      const fiber = Effect.runFork(
        Effect.sync(() => {
          if (!mounted || statesUpdated) return;
          setIsLoadingRuntime(true);
          setRuntimeError(null);
        }).pipe(
          Effect.flatMap(() => effectToBuildAppRuntime),
          Effect.tap((runtime) =>
            Effect.sync(() => {
              if (!mounted || statesUpdated) return;
              statesUpdated = true;
              setIsLoadingRuntime(false);
              setRuntimeInstance(runtime as Runtime.Runtime<any>);
            }),
          ),
          Effect.catchAll((error: unknown) =>
            Effect.sync(() => {
              if (!mounted || statesUpdated) return;
              statesUpdated = true;
              setIsLoadingRuntime(false);
              setRuntimeError(
                error instanceof Error ? error.message : String(error),
              );
            }),
          ),
        ),
      );

      return () => {
        mounted = false;
        Effect.runFork(Fiber.interrupt(fiber));
      };
    }, [effectToBuildAppRuntime, runtimeInstance, isLoadingRuntime]);

    // Load chat config
    useEffect(() => {
      if (!id) return;

      setIsLoadingConfig(true);

      const timer = setTimeout(() => {
        const defaultConfig = {
          id,
          name: title || `Chat ${id}`,
          agentId: `agent-${id}`,
          toolbarId: "default-toolbar",
          themeId: "default-theme",
        } satisfies ChatAppConfig;

        setChatAppConfig(defaultConfig);
        setIsLoadingConfig(false);
      }, 0);

      return () => clearTimeout(timer);
    }, [id, title]);

    // Theme handling - simplified version from ChatContainer
    const appliedTheme = useMemo(() => {
      try {
        if (propTheme && typeof propTheme === "object") return propTheme;
        if (propTheme && typeof propTheme === "string") {
          try {
            return JSON.parse(propTheme);
          } catch (e) {
            console.error("Error parsing theme:", e);
          }
        }
        if (rawTheme && typeof rawTheme === "object") return rawTheme;
        if (
          rawTheme &&
          typeof rawTheme === "string" &&
          !["system", "dark", "light"].includes(rawTheme)
        ) {
          try {
            return JSON.parse(rawTheme);
          } catch (e) {
            console.error("Error parsing rawTheme:", e);
          }
        }
      } catch (error) {
        console.error("Theme processing error:", error);
      }
      return {
        colors: {
          primary: "blue-500",
          secondary: "gray-100",
          background: "white",
          text: "gray-900",
        },
      };
    }, [propTheme, rawTheme]);

    // Apply theme styles
    const containerStyle = {
      padding: 16,
      border: "1px solid #ccc",
      backgroundColor: appliedTheme.colors?.background || "#ffffff",
      color: appliedTheme.colors?.text || "#000000",
    };

    const titleStyle = {
      color:
        appliedTheme.header?.text || appliedTheme.colors?.primary || "#000000",
      fontSize: appliedTheme.typography?.fontSize || "1.5rem",
      marginBottom: "1rem",
      fontFamily: appliedTheme.typography?.fontFamily || "inherit",
    };

    // Message list styles
    const messageStyles = {
      fontFamily: appliedTheme.typography?.fontFamily || "monospace",
      color: appliedTheme.colors?.text || "#000000",
      padding: "4px 0",
      fontSize: appliedTheme.typography?.fontSize || "inherit",
    };

    return (
      <div style={containerStyle}>
        <div>
          {title && <h2 style={titleStyle}>{title}</h2>}
          <div>
            Basic Chat Container (with Theme, Session, Config & Runtime Support)
          </div>
          {isLoadingRuntime ? (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: appliedTheme.colors?.secondary || "#f0f0f0",
                borderRadius: 4,
                color: appliedTheme.colors?.text || "#666",
              }}
            >
              Initializing runtime...
            </div>
          ) : runtimeError ? (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: "#fee2e2",
                borderRadius: 4,
                color: "#dc2626",
              }}
            >
              Runtime Error: {runtimeError}
            </div>
          ) : isLoadingConfig ? (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: appliedTheme.colors?.secondary || "#f0f0f0",
                borderRadius: 4,
                color: appliedTheme.colors?.text || "#666",
              }}
            >
              Loading configuration...
            </div>
          ) : chatAppConfig ? (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: appliedTheme.colors?.secondary || "#f0f0f0",
                borderRadius: 4,
                color: appliedTheme.colors?.text || "#666",
              }}
            >
              <div>Config ID: {chatAppConfig?.id || "none"}</div>
              <div>Agent ID: {chatAppConfig?.agentId || "none"}</div>
              <div>Theme ID: {chatAppConfig?.themeId || "none"}</div>
            </div>
          ) : null}
          <div
            style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: appliedTheme.colors?.secondary || "#f0f0f0",
              borderRadius: 4,
              color: appliedTheme.colors?.text || "#666",
            }}
          >
            <span style={{ fontSize: "0.875rem" }}>
              {sessionData
                ? `User: ${sessionData.userName} (${sessionData.userId})`
                : "Not logged in"}
            </span>
          </div>
          {messages && messages.length > 0 && (
            <ul style={{ marginTop: 12 }}>
              {messages.map((msg, idx) => (
                <li
                  key={`${msg}-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    idx
                    }`}
                  style={messageStyles}
                >
                  <span style={{ opacity: 0.7, marginRight: 8 }}>
                    [{sessionData?.userId || "unknown"}]
                  </span>
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  },
);
