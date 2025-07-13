"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { HeaderManager } from "@/managers/header";
import type { HeaderManagerState } from "@/managers/header/types";
import { Effect } from "effect";
import {
  Eraser,
  ExternalLink,
  MessageCircle,
  Minimize2,
  Minus,
  Settings,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export interface HeaderBarProps {
  chatAppId: string;
  title: string;
  className?: string;
  onHeaderClick?: () => void;
  onExpandClick?: () => void;
  onCompactClick?: () => void;
  onStashClick?: () => void;
  onCloseClick?: () => void;
  onSettingsClick?: () => void;
  onClearClick?: () => void;
  children?: React.ReactNode;
  isExpanded?: boolean;
}

export function HeaderBar({
  chatAppId,
  title,
  className,
  onHeaderClick,
  onExpandClick,
  onCompactClick,
  onStashClick,
  onCloseClick,
  onSettingsClick,
  onClearClick,
  children,
  isExpanded,
}: HeaderBarProps) {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<HeaderManagerState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize HeaderManager
  useEffect(() => {
    const initializeHeader = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const headerManager = yield* HeaderManager;

            // Initialize with config
            yield* headerManager.initialize({
              chatAppId,
              initialTitle: title,
              showStatusPanel: true,
              showControls: true,
              enableErrorDisplay: true,
            });

            // Get initial state
            const initialState = yield* headerManager.getState();
            setState(initialState);
            setIsInitialized(true);

            // Set up state subscription
            const unsubscribe = yield* headerManager.subscribe((newState) => {
              setState(newState);
            });

            return unsubscribe;
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize header";
        setError(errorMessage);
        console.error("[HeaderBar] Initialization error:", err);
      }
    };

    initializeHeader();
  }, [chatAppId, title, runWithServices]);

  // Update title when prop changes
  useEffect(() => {
    if (!isInitialized) return;

    const updateTitle = async () => {
      try {
        await runWithServices(
          Effect.gen(function* () {
            const headerManager = yield* HeaderManager;
            yield* headerManager.setTitle(title);
          }),
        );
      } catch (err) {
        console.error("[HeaderBar] Failed to update title:", err);
      }
    };

    updateTitle();
  }, [title, isInitialized, runWithServices]);

  // Event handlers
  const handleHeaderClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onHeaderClick();
        }),
      );
      onHeaderClick?.();
    } catch (err) {
      console.error("[HeaderBar] Header click error:", err);
    }
  }, [isInitialized, runWithServices, onHeaderClick]);

  const handleExpandClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onExpandClick();
        }),
      );
      onExpandClick?.();
    } catch (err) {
      console.error("[HeaderBar] Expand click error:", err);
    }
  }, [isInitialized, runWithServices, onExpandClick]);

  const handleCompactClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onCompactClick();
        }),
      );
      onCompactClick?.();
    } catch (err) {
      console.error("[HeaderBar] Compact click error:", err);
    }
  }, [isInitialized, runWithServices, onCompactClick]);

  const handleStashClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onStashClick();
        }),
      );
      onStashClick?.();
    } catch (err) {
      console.error("[HeaderBar] Stash click error:", err);
    }
  }, [isInitialized, runWithServices, onStashClick]);

  const handleCloseClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onCloseClick();
        }),
      );
      onCloseClick?.();
    } catch (err) {
      console.error("[HeaderBar] Close click error:", err);
    }
  }, [isInitialized, runWithServices, onCloseClick]);

  const handleSettingsClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onSettingsClick();
        }),
      );
      onSettingsClick?.();
    } catch (err) {
      console.error("[HeaderBar] Settings click error:", err);
    }
  }, [isInitialized, runWithServices, onSettingsClick]);

  const handleClearClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onClearClick();
        }),
      );
      onClearClick?.();
    } catch (err) {
      console.error("[HeaderBar] Clear click error:", err);
    }
  }, [isInitialized, runWithServices, onClearClick]);

  // Show loading state
  if (!isInitialized || !state) {
    return (
      <header
        className={`flex items-center justify-between px-2 border-b h-5 rounded-t-md ${className || ""}`}
        style={{
          backgroundColor: "var(--color-chat-header-bg)",
          borderColor: "var(--color-chat-border)",
        }}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      </header>
    );
  }

  // Show error state
  if (error) {
    return (
      <header
        className={`flex items-center justify-between px-2 border-b h-5 rounded-t-md ${className || ""}`}
        style={{
          backgroundColor: "var(--color-chat-header-bg)",
          borderColor: "var(--color-chat-border)",
        }}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-500">Error: {error}</span>
        </div>
      </header>
    );
  }

  const iconColor = state.isSelected
    ? "#ffffff"
    : "var(--color-chat-header-text, #1e293b)";

  // Conditional sizing based on expanded state
  const titleTextSize = isExpanded ? "text-xs" : "text-[10px]";
  const iconSize = isExpanded ? "h-3 w-3" : "h-2.5 w-2.5";
  const headerHeight = isExpanded ? "20px" : "18px";

  return (
    <header
      className={`flex items-center justify-between px-2 border-b transition-colors rounded-t-md ${className || ""}`}
      style={{
        backgroundColor: "var(--color-chat-header-bg)",
        color: "var(--color-chat-header-text)",
        borderColor: "var(--color-chat-border)",
        height: headerHeight,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Header title section */}
      {onHeaderClick ? (
        <button
          type="button"
          className="flex items-center space-x-2 flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
          style={{ height: "100%" }}
          onClick={handleHeaderClick}
        >
          <MessageCircle
            className={`${iconSize} flex-shrink-0`}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
          <h2
            className={`font-medium ${titleTextSize} truncate`}
            style={{ color: "var(--color-chat-header-text, #1e293b)" }}
          >
            {state.title} {isExpanded ? "[Expanded]" : "[Compact]"}
          </h2>
          {state.errorInfo && (
            <span
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 ml-2"
              title={state.errorInfo.message}
            >
              Error
            </span>
          )}
        </button>
      ) : (
        <div
          className="flex items-center space-x-2 flex-1 min-w-0"
          style={{ height: "100%" }}
        >
          <MessageCircle
            className={`${iconSize} flex-shrink-0`}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
          <h2
            className={`font-medium ${titleTextSize} truncate`}
            style={{ color: "var(--color-chat-header-text, #1e293b)" }}
          >
            {state.title} {isExpanded ? "[Expanded]" : "[Compact]"}
          </h2>
          {state.errorInfo && (
            <span
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 ml-2"
              title={state.errorInfo.message}
            >
              Error
            </span>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center space-x-1" style={{ height: "100%" }}>
        {children}

        {/* Expand button - only visible when not expanded */}
        {!isExpanded && (
          <button
            type="button"
            data-testid="expand-chat-button"
            title="Expand chat"
            aria-label="Expand chat"
            onClick={handleExpandClick}
            className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
            style={{ color: iconColor }}
          >
            <ExternalLink
              className={iconSize}
              style={{ color: iconColor }}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Compact button - only visible when expanded */}
        {isExpanded && (
          <button
            type="button"
            data-testid="compact-chat-button"
            title="Compact chat"
            aria-label="Compact chat"
            onClick={handleCompactClick}
            className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
            style={{ color: iconColor }}
          >
            <Minimize2
              className={iconSize}
              style={{ color: iconColor }}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Stash button */}
        <button
          type="button"
          data-testid="stash-button"
          title="Stash chat"
          aria-label="Stash chat"
          onClick={handleStashClick}
          className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
          style={{ color: iconColor }}
        >
          <Minus
            className={iconSize}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
        </button>

        {/* Settings button */}
        <button
          type="button"
          data-testid="settings-button"
          title="Settings"
          aria-label="Settings"
          onClick={handleSettingsClick}
          className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
          style={{ color: iconColor }}
        >
          <Settings
            className={iconSize}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
        </button>

        {/* Clear button */}
        <button
          type="button"
          data-testid="clear-button"
          title="Clear chat"
          aria-label="Clear chat"
          onClick={handleClearClick}
          className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
          style={{ color: iconColor }}
        >
          <Eraser
            className={iconSize}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
        </button>

        {/* Close button */}
        <button
          type="button"
          data-testid="close-button"
          title="Close chat"
          aria-label="Close chat"
          onClick={handleCloseClick}
          className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100 relative"
          style={{ color: iconColor }}
        >
          <X
            className={iconSize}
            style={{ color: iconColor }}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
