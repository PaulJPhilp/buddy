"use client";

import { useEffectContext } from "@/components/EffectProvider";
// TODO: HeaderManager integration - using stubs for now
// import { HeaderManager } from "@/features/application/features/header/header/service";
// import type { HeaderManagerState } from "@/features/application/features/header/header/types";
import { Effect } from "effect";

// Temporary stub types
type HeaderManagerState = any;
const HeaderManager = null as any;
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
import { JSX } from "react/jsx-runtime";

export interface HeaderBarProps {
  chatAppId: string;
  title: string;
  onExpand?: () => Promise<void>;
  onCompact?: () => Promise<void>;
  onStash?: () => Promise<void>;
  onClose?: () => Promise<void>;
  onSettings?: () => void;
  onClear?: () => void;
  onArchive?: () => Promise<void>;
  onRestore?: () => Promise<void>;
  status: string;
  className?: string;
  children?: React.ReactNode;
}

export function HeaderBar({
  chatAppId,
  title,
  onExpand,
  onCompact,
  onStash,
  onClose,
  onSettings,
  onClear,
  onArchive,
  onRestore,
  status,
  className = "",
  children,
}: HeaderBarProps): JSX.Element {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<HeaderManagerState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
        return undefined;
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
      onExpand?.();
    } catch (err) {
      console.error("[HeaderBar] Header click error:", err);
    }
  }, [isInitialized, runWithServices, onExpand]);

  const handleExpandClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onExpandClick();
        }),
      );
      onExpand?.();
    } catch (err) {
      console.error("[HeaderBar] Expand click error:", err);
    }
  }, [isInitialized, runWithServices, onExpand]);

  const handleCompactClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onCompactClick();
        }),
      );
      onCompact?.();
    } catch (err) {
      console.error("[HeaderBar] Compact click error:", err);
    }
  }, [isInitialized, runWithServices, onCompact]);

  const handleStashClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onStashClick();
        }),
      );
      onStash?.();
    } catch (err) {
      console.error("[HeaderBar] Stash click error:", err);
    }
  }, [isInitialized, runWithServices, onStash]);

  const handleArchiveClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.recordInteraction("archive");
        }),
      );
      onArchive?.();
    } catch (err) {
      console.error("[HeaderBar] Archive click error:", err);
    }
  }, [isInitialized, runWithServices, onArchive]);

  const handleRestoreClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.recordInteraction("restore");
        }),
      );
      onRestore?.();
    } catch (err) {
      console.error("[HeaderBar] Restore click error:", err);
    }
  }, [isInitialized, runWithServices, onRestore]);

  const handleClearClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onClearClick();
        }),
      );
      onClear?.();
    } catch (err) {
      console.error("[HeaderBar] Clear click error:", err);
    }
  }, [isInitialized, runWithServices, onClear]);

  const handleSettingsClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onSettingsClick();
        }),
      );
      onSettings?.();
    } catch (err) {
      console.error("[HeaderBar] Settings click error:", err);
    }
  }, [isInitialized, runWithServices, onSettings]);

  const handleCloseClick = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const headerManager = yield* HeaderManager;
          yield* headerManager.onCloseClick();
        }),
      );
      onClose?.();
    } catch (err) {
      console.error("[HeaderBar] Close click error:", err);
    }
  }, [isInitialized, runWithServices, onClose]);

  return (
    <div
      className={`flex items-center justify-between bg-chat-header-bg border-b border-chat-border rounded-t-lg min-h-0 h-4 ${className}`}
      style={{
        height: "16px",
        padding: "var(--chat-header-padding, 0 4px)",
        backgroundColor: "var(--color-chat-header-bg, #1e40af)",
        color: "var(--color-chat-header-text, #ffffff)",
        borderBottomColor: "var(--color-chat-border, #e2e8f0)",
      }}
    >
      {/* Left side - Title */}
      <div className="flex items-center min-h-0">
        <h2
          className="font-medium truncate leading-none"
          style={{
            fontSize: "var(--chat-header-font-size, 9px)",
            color: "var(--color-chat-header-text, #ffffff)",
            fontFamily: "var(--chat-font-family, inherit)",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-0.5 min-h-0">
        {/* Status-based buttons */}
        {status === "expanded" ? (
          <button
            type="button"
            onClick={handleCompactClick}
            className="p-0 rounded transition-colors"
            style={{
              color: "var(--color-chat-header-text, #ffffff)",
              opacity: "0.8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor =
                "var(--color-chat-primary, rgba(255,255,255,0.1))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Compact"
          >
            <svg
              className="w-2.5 h-2.5"
              style={{ color: "inherit" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>
        ) : status === "compact" ? (
          <button
            type="button"
            onClick={handleExpandClick}
            className="p-0 rounded transition-colors"
            style={{
              color: "var(--color-chat-header-text, #ffffff)",
              opacity: "0.8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor =
                "var(--color-chat-primary, rgba(255,255,255,0.1))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Expand"
          >
            <svg
              className="w-2.5 h-2.5"
              style={{ color: "inherit" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16M4 12h16"
              />
            </svg>
          </button>
        ) : null}

        {/* More options dropdown */}
        <div className="relative header-dropdown">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-0 rounded transition-colors"
            style={{
              color: "var(--color-chat-header-text, #ffffff)",
              opacity: "0.8",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor =
                "var(--color-chat-primary, rgba(255,255,255,0.1))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.8";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="More options"
          >
            <svg
              className="w-2.5 h-2.5"
              style={{ color: "inherit" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10"
              style={{
                backgroundColor: "var(--color-chat-background, #ffffff)",
                border: "1px solid var(--color-chat-border, #e2e8f0)",
              }}
            >
              <div className="py-1">
                {/* Status-based actions */}
                {status === "expanded" || status === "compact" ? (
                  <button
                    type="button"
                    onClick={handleStashClick}
                    className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                    style={{
                      color: "var(--color-chat-foreground, #000000)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-chat-secondary, #f1f5f9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span>Stash</span>
                  </button>
                ) : status === "stashed" ? (
                  <button
                    type="button"
                    onClick={handleArchiveClick}
                    className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                    style={{
                      color: "var(--color-chat-foreground, #000000)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-chat-secondary, #f1f5f9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    <span>Archive</span>
                  </button>
                ) : status === "archived" ? (
                  <button
                    type="button"
                    onClick={handleRestoreClick}
                    className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                    style={{
                      color: "var(--color-chat-foreground, #000000)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-chat-secondary, #f1f5f9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Restore</span>
                  </button>
                ) : null}

                {/* Settings */}
                <button
                  type="button"
                  onClick={handleSettingsClick}
                  className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                  style={{
                    color: "var(--color-chat-foreground, #000000)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-chat-secondary, #f1f5f9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Settings</span>
                </button>

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClearClick}
                  className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                  style={{
                    color: "var(--color-chat-foreground, #000000)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-chat-secondary, #f1f5f9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Clear</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={handleCloseClick}
                  className="w-full px-3 py-1.5 text-xs text-left flex items-center space-x-1.5 transition-colors"
                  style={{
                    color: "var(--color-chat-error, #dc2626)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-chat-error-bg, #fef2f2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
