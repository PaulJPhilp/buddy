"use client";

import { useEffectContext } from "@/components/EffectProvider";
import { UserAreaManager } from "@/managers/userarea";
import type {
  AgentInfo,
  UserAreaManagerState,
} from "@/managers/userarea/types";
import { Effect } from "effect";
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

  // Initialize UserAreaManager
  useEffect(() => {
    const initializeUserArea = async () => {
      try {
        await runWithServices(
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
            const unsubscribe = yield* userAreaManager.subscribe((newState) => {
              setState(newState);
              // Only update local text if it's different from what user is typing
              if (newState.inputText !== localInputText) {
                setLocalInputText(newState.inputText);
              }
            });

            return unsubscribe;
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
  }, [chatAppId, runWithServices]);

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
        const canSend = (hasText || hasAttachments) && isNotDisabled && isNotLoading;

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
    [isInitialized, runWithServices, localInputText, state?.attachments, state?.isInputDisabled, state?.isLoading, handleSendMessage],
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
      <div className={`border-t border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`border-t border-red-200 p-4 bg-red-50 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="text-sm text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <div className={`border-t border-gray-200 p-4 ${className}`}>
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Row 1: Attachments (when present) */}
        {state.showAttachments && state.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.attachments.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-xs"
              >
                {getFileIcon(file)}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <span className="text-gray-500">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleFileRemove(file)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Row 2: Main Input */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={localInputText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={state.inputPlaceholder}
              disabled={state.isInputDisabled || state.isLoading}
              rows={state.inputRows}
              maxLength={state.maxInputLength}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "42px" }}
            />
            {localInputText.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {localInputText.length}/{state.maxInputLength}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {/* File attachment button */}
            <button
              type="button"
              onClick={handleFileInputClick}
              disabled={state.isInputDisabled || state.isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
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
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              {state.isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Agent Toolbar (when agents available) */}
        {state.showAgentToolbar && state.availableAgents.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3 h-3 text-gray-500" />
            <span className="text-gray-500">Agent:</span>
            <select
              value={state.selectedAgentId || ""}
              onChange={(e) => handleAgentSelect(e.target.value)}
              disabled={state.isInputDisabled || state.isLoading}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
          <div className="text-xs text-red-600">
            {state.validationErrors.map((error, index) => (
              <div key={index}>{error.message}</div>
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
