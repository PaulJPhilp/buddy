"use client";

import { useEffectContext } from "@/components/EffectProvider";
// TODO: UserAreaManager integration - using stubs for now
// import { UserAreaManager } from "@/features/chatapps/chatapp/managers/userarea";
// import type { AgentInfo, UserAreaManagerState } from "@/features/chatapps/chatapp/managers/userarea/types";
import { Effect } from "effect";

// Temporary stub types
type UserAreaManagerState = any;
type AgentInfo = any;
const UserAreaManager = null as any;
import { File, FileText, Image, Paperclip, Send, User, X } from "lucide-react";
import React, { useCallback, useEffect, useState, useRef } from "react";

export interface UserAreaProps {
  chatAppId: string;
  className?: string;
  onSendMessage?: (text: string, attachments?: readonly File[]) => void;
  onAgentChange?: (agentId: string) => void;
  onFileAttach?: (files: readonly File[]) => void;
  onFileRemove?: (file: File) => void;
  children?: React.ReactNode;
}

export function UserArea({
  chatAppId,
  className,
  onSendMessage,
  onAgentChange,
  onFileAttach,
  onFileRemove,
  children,
}: UserAreaProps) {
  const { runWithServices } = useEffectContext();
  const [state, setState] = useState<UserAreaManagerState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localInputText, setLocalInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Store unsubscribe function in ref
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  // Initialize UserAreaManager
  useEffect(() => {
    const initializeUserArea = async () => {
      try {
        unsubscribeRef.current = await runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;

            // Initialize with config
            yield* userAreaManager.initialize({
              chatAppId,
              showAttachments: true,
              showAgentToolbar: true,
              enableFileUpload: true,
              enableAgentSelection: true,
              maxInputLength: 4000,
              inputRows: 1,
            });

            // Get initial state
            const initialState = yield* userAreaManager.getState();
            setState(initialState);
            setLocalInputText(initialState.inputText);
            setIsInitialized(true);

            // Set up state subscription
            return yield* userAreaManager.subscribe((newState) => {
              setState(newState);
              // Only update local text if it's different from what user is typing
              if (newState.inputText !== localInputText) {
                setLocalInputText(newState.inputText);
              }
            });
          }),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize user area";
        setError(errorMessage);
        console.error("[UserArea] Initialization error:", err);
      }
    };

    initializeUserArea();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      runWithServices(
        Effect.gen(function* () {
          const userAreaManager = yield* UserAreaManager;
          yield* userAreaManager.cleanup();
        }),
      ).catch(console.error);
    };
  }, [chatAppId, runWithServices, localInputText]);

  // Event handlers
  const handleTextChange = useCallback(
    (text: string) => {
      // Update local state immediately for responsiveness
      setLocalInputText(text);

      // Sync with UserAreaManager asynchronously
      if (isInitialized) {
        runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;
            yield* userAreaManager.onTextChange(text);
          }),
        ).catch((err) => {
          console.error("[UserArea] Text change error:", err);
        });
      }
    },
    [isInitialized, runWithServices],
  );

  const handleSendMessage = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await runWithServices(
        Effect.gen(function* () {
          const userAreaManager = yield* UserAreaManager;
          yield* userAreaManager.onSendMessage();
        }),
      );
      onSendMessage?.(localInputText, state?.attachments);
      setLocalInputText(""); // Clear local input after sending
    } catch (err) {
      console.error("[UserArea] Send message error:", err);
    }
  }, [
    isInitialized,
    runWithServices,
    onSendMessage,
    localInputText,
    state?.attachments,
  ]);

  const handleKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isInitialized) return;

      // Handle Enter key for sending messages
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const hasText = localInputText.trim().length > 0;
        const hasAttachments = state?.attachments.length > 0;
        const isNotDisabled = !state?.isInputDisabled;
        const isNotLoading = !state?.isLoading;
        const canSend =
          (hasText || hasAttachments) && isNotDisabled && isNotLoading;

        if (canSend) {
          await handleSendMessage();
        }
        return;
      }

      try {
        await runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;
            yield* userAreaManager.onInputKeyDown(
              event.nativeEvent as KeyboardEvent,
            );
          }),
        );
      } catch (err) {
        console.error("[UserArea] Key down error:", err);
      }
    },
    [
      isInitialized,
      runWithServices,
      localInputText,
      state?.attachments,
      state?.isInputDisabled,
      state?.isLoading,
      handleSendMessage,
    ],
  );

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (!isInitialized) return;

      try {
        await runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;
            yield* userAreaManager.onFileAttach(files);
          }),
        );
        onFileAttach?.(files);
      } catch (err) {
        console.error("[UserArea] File attach error:", err);
      }
    },
    [isInitialized, runWithServices, onFileAttach],
  );

  const handleFileRemove = useCallback(
    async (file: File) => {
      if (!isInitialized) return;

      try {
        await runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;
            yield* userAreaManager.onFileRemove(file);
          }),
        );
        onFileRemove?.(file);
      } catch (err) {
        console.error("[UserArea] File remove error:", err);
      }
    },
    [isInitialized, runWithServices, onFileRemove],
  );

  const handleAgentSelect = useCallback(
    async (agentId: string) => {
      if (!isInitialized) return;

      try {
        await runWithServices(
          Effect.gen(function* () {
            const userAreaManager = yield* UserAreaManager;
            yield* userAreaManager.onAgentChange(agentId);
          }),
        );
        onAgentChange?.(agentId);
      } catch (err) {
        console.error("[UserArea] Agent change error:", err);
      }
    },
    [isInitialized, runWithServices, onAgentChange],
  );

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        handleFileSelect(files);
      }
      // Clear the input so the same file can be selected again
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleFileSelect],
  );

  const handleFileInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Image className="w-3 h-3" />;
    }
    if (file.type === "text/plain" || file.type === "text/markdown") {
      return <FileText className="w-3 h-3" />;
    }
    return <File className="w-3 h-3" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  // Loading state
  if (!isInitialized) {
    return (
      <div
        className={className}
        style={{
          borderTop: `var(--user-area-border-width, 1px) solid var(--color-user-area-border, #e2e8f0)`,
          padding: `var(--user-area-padding, 16px)`,
          backgroundColor: `var(--color-chat-user-area, #f8fafc)`,
          color: `var(--color-chat-user-area-foreground, #0f172a)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: `var(--user-input-font-size, 14px)`,
              color: `var(--color-user-attachment-secondary, #6b7280)`,
            }}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={className}
        style={{
          borderTop: `var(--user-area-border-width, 1px) solid var(--color-user-error, #ef4444)`,
          padding: `var(--user-area-padding, 16px)`,
          backgroundColor: `var(--color-user-error-bg, #fef2f2)`,
          color: `var(--color-user-error, #ef4444)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: `var(--user-input-font-size, 14px)`,
              color: `var(--color-user-error, #ef4444)`,
            }}
          >
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        borderTop: `var(--user-area-border-width, 1px) solid var(--color-user-area-border, #e2e8f0)`,
        padding: `var(--user-area-padding, 16px)`,
        backgroundColor: `var(--color-chat-user-area, #f8fafc)`,
        color: `var(--color-chat-user-area-foreground, #0f172a)`,
      }}
    >
      <div
        style={{
          maxWidth: `var(--user-area-max-width, 1024px)`,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: `var(--user-area-spacing, 8px)`,
        }}
      >
        {/* Row 1: Attachments (when present) */}
        {state.showAttachments && state.attachments.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: `var(--user-attachment-spacing, 8px)`,
            }}
          >
            {state.attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: `var(--user-attachment-padding, 4px 8px)`,
                  backgroundColor: `var(--color-user-attachment-bg, #f1f5f9)`,
                  border: `1px solid var(--color-user-attachment-border, #e2e8f0)`,
                  borderRadius: `var(--user-attachment-border-radius, 6px)`,
                  fontSize: `var(--user-attachment-font-size, 12px)`,
                  color: `var(--color-user-attachment-text, #374151)`,
                }}
              >
                <div
                  style={{
                    width: `var(--user-attachment-icon-size, 12px)`,
                    height: `var(--user-attachment-icon-size, 12px)`,
                  }}
                >
                  {getFileIcon(file)}
                </div>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: `var(--user-attachment-max-width, 100px)`,
                  }}
                >
                  {file.name}
                </span>
                <span
                  style={{
                    color: `var(--color-user-attachment-secondary, #6b7280)`,
                  }}
                >
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleFileRemove(file)}
                  style={{
                    color: `var(--color-user-attachment-secondary, #6b7280)`,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px",
                    borderRadius: "2px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--color-user-attachment-hover, #e5e7eb)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X
                    style={{
                      width: `var(--user-attachment-icon-size, 12px)`,
                      height: `var(--user-attachment-icon-size, 12px)`,
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Row 2: Main Input */}
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: `var(--user-area-inner-spacing, 8px)`,
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              ref={textareaRef}
              value={localInputText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={state.inputPlaceholder}
              disabled={state.isInputDisabled || state.isLoading}
              rows={state.inputRows}
              maxLength={state.maxInputLength}
              style={{
                width: "100%",
                border: `var(--user-input-border-width, 1px) solid var(--color-user-input-border, #d1d5db)`,
                borderRadius: `var(--user-input-border-radius, 8px)`,
                padding: `var(--user-input-padding, 8px 12px)`,
                fontSize: `var(--user-input-font-size, 14px)`,
                minHeight: `var(--user-input-min-height, 42px)`,
                resize: "none",
                outline: "none",
                backgroundColor:
                  state.isInputDisabled || state.isLoading
                    ? `var(--color-user-input-disabled, #f3f4f6)`
                    : `var(--color-chat-user-area, #f8fafc)`,
                color: `var(--color-chat-user-area-foreground, #0f172a)`,
                cursor:
                  state.isInputDisabled || state.isLoading
                    ? "not-allowed"
                    : "text",
                opacity: state.isInputDisabled || state.isLoading ? 0.5 : 1,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `var(--color-user-input-border-focus, #3b82f6)`;
                e.currentTarget.style.boxShadow = `0 0 0 var(--user-input-focus-ring-width, 2px) var(--color-user-input-ring, #3b82f6)33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `var(--color-user-input-border, #d1d5db)`;
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {localInputText.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: `var(--user-counter-bottom, 8px)`,
                  right: `var(--user-counter-right, 8px)`,
                  fontSize: `var(--user-counter-font-size, 12px)`,
                  color: `var(--color-user-counter-text, #9ca3af)`,
                }}
              >
                {localInputText.length}/{state.maxInputLength}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "4px" }}>
            {/* File attachment button */}
            <button
              type="button"
              onClick={handleFileInputClick}
              disabled={state.isInputDisabled || state.isLoading}
              title="Attach file"
              style={{
                padding: `var(--user-button-padding, 8px)`,
                border: `var(--user-button-border-width, 1px) solid var(--color-user-button-border, #d1d5db)`,
                borderRadius: `var(--user-button-border-radius, 8px)`,
                backgroundColor:
                  state.isInputDisabled || state.isLoading
                    ? `var(--color-user-button-disabled, #f9fafb)`
                    : `var(--color-user-button-bg, #f3f4f6)`,
                color: `var(--color-chat-user-area-foreground, #0f172a)`,
                cursor:
                  state.isInputDisabled || state.isLoading
                    ? "not-allowed"
                    : "pointer",
                opacity: state.isInputDisabled || state.isLoading ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!state.isInputDisabled && !state.isLoading) {
                  e.currentTarget.style.backgroundColor = `var(--color-user-button-hover, #e5e7eb)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!state.isInputDisabled && !state.isLoading) {
                  e.currentTarget.style.backgroundColor = `var(--color-user-button-bg, #f3f4f6)`;
                }
              }}
            >
              <Paperclip
                style={{
                  width: `var(--user-button-icon-size, 16px)`,
                  height: `var(--user-button-icon-size, 16px)`,
                }}
              />
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={
                state.isInputDisabled ||
                state.isLoading ||
                (!localInputText.trim() && state.attachments.length === 0)
              }
              title="Send message"
              style={{
                padding: `var(--user-send-button-padding, 8px)`,
                border: "none",
                borderRadius: `var(--user-button-border-radius, 8px)`,
                backgroundColor:
                  state.isInputDisabled ||
                  state.isLoading ||
                  (!localInputText.trim() && state.attachments.length === 0)
                    ? `var(--color-user-send-button-disabled, #9ca3af)`
                    : `var(--color-user-send-button, #3b82f6)`,
                color: `var(--color-user-spinner, #ffffff)`,
                cursor:
                  state.isInputDisabled ||
                  state.isLoading ||
                  (!localInputText.trim() && state.attachments.length === 0)
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  state.isInputDisabled ||
                  state.isLoading ||
                  (!localInputText.trim() && state.attachments.length === 0)
                    ? 0.5
                    : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (
                  !state.isInputDisabled &&
                  !state.isLoading &&
                  (localInputText.trim() || state.attachments.length > 0)
                ) {
                  e.currentTarget.style.backgroundColor = `var(--color-user-send-button-hover, #2563eb)`;
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !state.isInputDisabled &&
                  !state.isLoading &&
                  (localInputText.trim() || state.attachments.length > 0)
                ) {
                  e.currentTarget.style.backgroundColor = `var(--color-user-send-button, #3b82f6)`;
                }
              }}
            >
              {state.isLoading ? (
                <div
                  style={{
                    width: `var(--user-spinner-size, 16px)`,
                    height: `var(--user-spinner-size, 16px)`,
                    border: `var(--user-spinner-border-width, 2px) solid var(--color-user-spinner-track, rgba(255, 255, 255, 0.3))`,
                    borderTop: `var(--user-spinner-border-width, 2px) solid var(--color-user-spinner, #ffffff)`,
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <Send
                  style={{
                    width: `var(--user-send-button-icon-size, 16px)`,
                    height: `var(--user-send-button-icon-size, 16px)`,
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Agent Toolbar (when agents available) */}
        {state.showAgentToolbar && state.availableAgents.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `var(--user-area-inner-spacing, 8px)`,
              fontSize: `var(--user-agent-selector-font-size, 12px)`,
            }}
          >
            <User
              style={{
                width: `var(--user-agent-icon-size, 12px)`,
                height: `var(--user-agent-icon-size, 12px)`,
                color: `var(--color-user-attachment-secondary, #6b7280)`,
              }}
            />
            <span
              style={{
                color: `var(--color-user-attachment-secondary, #6b7280)`,
              }}
            >
              Agent:
            </span>
            <select
              value={state.selectedAgentId || ""}
              onChange={(e) => handleAgentSelect(e.target.value)}
              disabled={state.isInputDisabled || state.isLoading}
              style={{
                border: `var(--user-agent-selector-border-width, 1px) solid var(--color-user-agent-selector-border, #d1d5db)`,
                borderRadius: `var(--user-agent-selector-border-radius, 4px)`,
                padding: `var(--user-agent-selector-padding, 4px 8px)`,
                fontSize: `var(--user-agent-selector-font-size, 12px)`,
                backgroundColor:
                  state.isInputDisabled || state.isLoading
                    ? `var(--color-user-input-disabled, #f3f4f6)`
                    : `var(--color-user-agent-selector-bg, #ffffff)`,
                color: `var(--color-user-agent-selector-text, #374151)`,
                cursor:
                  state.isInputDisabled || state.isLoading
                    ? "not-allowed"
                    : "pointer",
                opacity: state.isInputDisabled || state.isLoading ? 0.5 : 1,
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `var(--color-user-agent-selector-focus, #3b82f6)`;
                e.currentTarget.style.boxShadow = `0 0 0 1px var(--color-user-agent-selector-focus, #3b82f6)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `var(--color-user-agent-selector-border, #d1d5db)`;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">Select agent...</option>
              {state.availableAgents.map((agent) => (
                <option
                  key={agent.id}
                  value={agent.id}
                  disabled={!agent.isAvailable}
                >
                  {agent.name} {agent.isActive ? "(active)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Validation errors */}
        {state.validationErrors.length > 0 && (
          <div
            style={{
              fontSize: `var(--user-agent-selector-font-size, 12px)`,
              color: `var(--color-user-error, #ef4444)`,
              backgroundColor: `var(--color-user-error-bg, #fef2f2)`,
              padding: `var(--user-area-inner-spacing, 8px)`,
              borderRadius: `var(--user-attachment-border-radius, 6px)`,
              border: `1px solid var(--color-user-error, #ef4444)`,
            }}
          >
            {state.validationErrors.map((error) => (
              <div key={error.message}>{error.message}</div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept={state.showAttachments ? undefined : ""}
        />

        {children}
      </div>
    </div>
  );
}
