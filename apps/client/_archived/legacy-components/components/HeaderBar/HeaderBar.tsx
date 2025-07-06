"use client";

import { Button } from "@ui/components/ui/button";
import {
  Eraser,
  ExternalLink,
  MessageCircle,
  Minimize2,
  Settings,
  X,
} from "lucide-react";
import React, { ReactNode, useState } from "react";

export interface ErrorInfo {
  message: string;
  details?: string;
  severity?: "error" | "warning";
}

export interface StatusInfo {
  tokens?: {
    used: number;
    remaining: number;
  };
  cost?: {
    current: number;
    limit: number;
    currency: string;
  };
  agentStatus?: {
    state: "idle" | "thinking" | "paused" | "error";
    details?: string;
  };
}

export interface HeaderBarProps {
  /** The name of the application to display */
  title: string;
  /** Error information to display, if any */
  errorInfo?: ErrorInfo;
  /** Whether this chat instance is currently selected/active */
  isSelected?: boolean;
  /** Status information for the slidedown panel */
  statusInfo?: StatusInfo;
  /** Optional callback when status panel is toggled */
  onToggleStatusPanel?: (isOpen: boolean) => void;
  /** Optional callback when the header is clicked */
  onHeaderClick?: () => void;
  /** Optional clear-chat callback */
  onClearChat?: () => void;
  /** Optional expand callback - shows expand icon when provided and not expanded */
  onExpand?: () => void;
  /** Optional compact callback - shows compact icon when provided and expanded */
  onCompact?: () => void;
  /** Optional close callback - shows close icon when provided */
  onClose?: () => void;
  /** Optional settings callback - shows settings functionality when provided */
  onSettings?: () => void;
  /** Whether the chat is currently expanded - controls expand/compact icon visibility */
  isExpanded?: boolean;
  /** Optional class name for styling */
  className?: string;
  /** Optional children to render in the header */
  children?: ReactNode;
}

export const HeaderBar = React.forwardRef<HTMLDivElement, HeaderBarProps>(
  (
    {
      title,
      errorInfo,
      isSelected,
      statusInfo,
      onToggleStatusPanel,
      onHeaderClick,
      onClearChat,
      onExpand,
      onCompact,
      onClose,
      onSettings,
      isExpanded = false,
      className,
      children,
    },
    ref,
  ) => {
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const handleStatusToggle = (open: boolean) => {
      setIsStatusOpen(open);
      onToggleStatusPanel?.(open);
    };

    const tokenPercentage = statusInfo?.tokens
      ? (statusInfo.tokens.used /
          (statusInfo.tokens.used + statusInfo.tokens.remaining)) *
        100
      : 0;

    const costPercentage = statusInfo?.cost
      ? (statusInfo.cost.current / statusInfo.cost.limit) * 100
      : 0;

    const iconColor = isSelected
      ? "#ffffff"
      : "var(--color-chat-header-text, #1e293b)";

    return (
      <header
        ref={ref}
        className={`flex items-center justify-between px-2 border-b transition-colors ${className || ""}`}
        style={{
          backgroundColor: "var(--color-chat-header-bg)",
          color: "var(--color-chat-header-text)",
          borderColor: "var(--color-chat-border)",
          height: "20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {onHeaderClick ? (
          <button
            type="button"
            className="flex items-center space-x-2 flex-1 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer"
            style={{ height: "100%" }}
            onClick={onHeaderClick}
          >
            <MessageCircle
              className="h-3 w-3 flex-shrink-0"
              style={{ color: iconColor }}
              aria-hidden="true"
            />
            <h2
              className="font-medium text-xs truncate"
              style={{ color: "var(--color-chat-header-text, #1e293b)" }}
            >
              {title}
            </h2>
            {errorInfo && (
              <span
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 ml-2"
                title={errorInfo.message}
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
              className="h-3 w-3 flex-shrink-0"
              style={{ color: iconColor }}
              aria-hidden="true"
            />
            <h2
              className="font-medium text-xs truncate"
              style={{ color: "var(--color-chat-header-text, #1e293b)" }}
            >
              {title}
            </h2>
            {errorInfo && (
              <span
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 ml-2"
                title={errorInfo.message}
              >
                Error
              </span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-1" style={{ height: "100%" }}>
          {children}

          {/* Expand icon - only visible when onExpand is provided and not expanded */}
          {onExpand && !isExpanded && (
            <button
              type="button"
              data-testid="expand-chat-button"
              title="Expand chat"
              aria-label="Expand chat"
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100"
              style={{ color: iconColor }}
            >
              <ExternalLink
                className="h-3 w-3"
                style={{ color: iconColor }}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Compact icon - only visible when onCompact is provided and expanded */}
          {onCompact && isExpanded && (
            <button
              type="button"
              data-testid="compact-chat-button"
              title="Restore chat"
              aria-label="Restore chat"
              onClick={(e) => {
                e.stopPropagation();
                onCompact();
              }}
              className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100"
              style={{ color: iconColor }}
            >
              <Minimize2
                className="h-3 w-3"
                style={{ color: iconColor }}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Settings icon - visible when onSettings provided, or as status toggle fallback */}
          <button
            type="button"
            data-testid="settings-button"
            title="Settings"
            aria-label="Settings"
            onClick={(e) => {
              e.stopPropagation();
              if (onSettings) {
                onSettings();
              } else if (statusInfo) {
                handleStatusToggle(!isStatusOpen);
              }
            }}
            className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-gray-100"
            style={{ color: iconColor }}
          >
            <Settings
              className="h-3 w-3"
              style={{ color: iconColor }}
              aria-hidden="true"
            />
          </button>

          {/* Clear icon - only visible when onClearChat is provided */}
          {onClearChat && (
            <button
              type="button"
              data-testid="clear-chat-button"
              title="Clear chat"
              aria-label="Clear chat"
              onClick={(e) => {
                e.stopPropagation();
                onClearChat();
              }}
              className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-yellow-100"
              style={{ color: iconColor }}
            >
              <Eraser
                className="h-3 w-3"
                style={{ color: iconColor }}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Close icon - only visible when onClose is provided */}
          {onClose && (
            <button
              type="button"
              data-testid="close-chat-button"
              title="Close chat"
              aria-label="Close chat"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="ml-1 px-1 py-0 rounded bg-transparent hover:bg-red-100"
              style={{ color: iconColor }}
            >
              <X
                className="h-3 w-3"
                style={{ color: iconColor }}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* Status Panel */}
        {statusInfo && isStatusOpen && (
          <div
            className="absolute top-full left-0 right-0 border-t p-3 shadow-lg z-10"
            style={{
              backgroundColor: "var(--color-chat-header-background, #f8fafc)",
              borderColor: "var(--color-chat-border, #e2e8f0)",
            }}
          >
            <div className="space-y-2 text-xs">
              {statusInfo.agentStatus && (
                <div className="flex justify-between">
                  <span
                    style={{ color: "var(--color-chat-header-text, #1e293b)" }}
                  >
                    Agent:
                  </span>
                  <span
                    style={{ color: "var(--color-chat-header-text, #1e293b)" }}
                  >
                    {statusInfo.agentStatus.state} -{" "}
                    {statusInfo.agentStatus.details}
                  </span>
                </div>
              )}

              {statusInfo.tokens && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span
                      style={{
                        color: "var(--color-chat-header-text, #1e293b)",
                      }}
                    >
                      Tokens:
                    </span>
                    <span
                      style={{
                        color: "var(--color-chat-header-text, #1e293b)",
                      }}
                    >
                      {statusInfo.tokens.used} /{" "}
                      {statusInfo.tokens.used + statusInfo.tokens.remaining}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${tokenPercentage}%`,
                        backgroundColor: "var(--color-chat-primary, #3b82f6)",
                      }}
                    />
                  </div>
                </div>
              )}

              {statusInfo.cost && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span
                      style={{
                        color: "var(--color-chat-header-text, #1e293b)",
                      }}
                    >
                      Cost:
                    </span>
                    <span
                      style={{
                        color: "var(--color-chat-header-text, #1e293b)",
                      }}
                    >
                      ${statusInfo.cost.current.toFixed(4)} / $
                      {statusInfo.cost.limit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: `${costPercentage}%`,
                        backgroundColor:
                          costPercentage > 80
                            ? "#ef4444"
                            : "var(--color-chat-primary, #3b82f6)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    );
  },
);

HeaderBar.displayName = "HeaderBar";
