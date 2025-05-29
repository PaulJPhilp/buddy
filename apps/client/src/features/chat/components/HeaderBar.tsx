"use client";

import { Button } from "@ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import { cn } from "@ui/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

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
  /** Optional class name for styling */
  className?: string;
}

export const HeaderBar = React.forwardRef<HTMLDivElement, HeaderBarProps>(
  (
    {
      title,
      errorInfo,
      isSelected,
      statusInfo,
      onToggleStatusPanel,
      className,
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

    // Dynamic styles based on CSS Variables and isSelected state
    const headerStyle: React.CSSProperties = {
      borderColor: isSelected ? 'var(--chat-color-accent)' : 'var(--chat-border-color)', // Use accent for selected border
      backgroundColor: isSelected ? 'var(--chat-color-secondary)' : 'var(--chat-header-bg)', // Lighter bg when selected
      color: 'var(--chat-header-text)', // Base text color from theme
    };

    const titleStyle: React.CSSProperties = {
      color: isSelected ? 'var(--chat-color-accent)' : 'var(--chat-header-text)', // Accent color for title when selected
    };
    
    const progressBarFillStyle: React.CSSProperties = {
        backgroundColor: 'var(--chat-color-primary)', // Progress bars use primary color
    };

    return (
      <Collapsible
        ref={ref}
        open={isStatusOpen}
        onOpenChange={handleStatusToggle}
        className={cn("w-full border-b transition-colors", className)}
        style={headerStyle} // Apply dynamic styles
      >
        <div className="flex items-center justify-between px-1 py-0.5 text-[0.5rem] h-4">
          <div className="flex items-center gap-1">
            <h2
              className="text-lg font-medium"
              style={titleStyle} // Apply dynamic title style
            >
              {title}
            </h2>
            {errorInfo && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-2 w-2",
                  errorInfo.severity === "warning"
                    ? "text-yellow-500" // Standard Tailwind class for warning
                    : "text-red-500"    // Standard Tailwind class for error/destructive
                )}
                title={errorInfo.message}
              >
                <AlertCircle className="h-1.5 w-1.5" aria-hidden="true" />
              </Button>
            )}
          </div>

          {statusInfo && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-2 w-2 p-0.5" style={{ color: 'var(--chat-header-text)'}}>
                {isStatusOpen ? (
                  <ChevronUp className="h-1.5 w-1.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-1.5 w-1.5" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="px-1.5 py-0.5 space-y-0.5 text-[10px]" style={{ backgroundColor: 'var(--chat-color-background)', color: 'var(--chat-color-text)'}}>
          {statusInfo?.tokens && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span>Tokens Used</span>
                <span>{statusInfo.tokens.used.toLocaleString()}</span>
              </div>
              {/* Progress bar bg-muted can be replaced by a CSS var if needed */}
              <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"> 
                <div
                  className="h-full transition-all"
                  style={{ width: `${tokenPercentage}%`, ...progressBarFillStyle }}
                />
              </div>
            </div>
          )}

          {statusInfo?.cost && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span>Cost ({statusInfo.cost.currency})</span>
                <span>
                  {statusInfo.cost.current.toLocaleString()} /{" "}
                  {statusInfo.cost.limit.toLocaleString()}
                </span>
              </div>
              <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${costPercentage}%`, ...progressBarFillStyle }}
                />
              </div>
            </div>
          )}

          {statusInfo?.agentStatus && (
            <div className="flex items-center justify-between text-[10px]">
              <span>Agent Status</span>
              {/* Agent status pills might need specific CSS vars if defaults are not enough */}
              <span
                className={cn(
                  "px-1 py-0.5 rounded-full text-[10px] font-medium",
                  {
                    "bg-[var(--chat-color-primary)]/10 text-[var(--chat-color-primary)]":
                      statusInfo.agentStatus.state === "idle",
                    "bg-yellow-500/10 text-yellow-600": // Keep standard for warning state
                      statusInfo.agentStatus.state === "thinking",
                     "bg-gray-500/20 text-gray-700 dark:text-gray-300": // Muted state
                      statusInfo.agentStatus.state === "paused",
                    "bg-red-500/10 text-red-600": // Keep standard for error state
                      statusInfo.agentStatus.state === "error",
                  },
                )}
              >
                {statusInfo.agentStatus.state}
                {statusInfo.agentStatus.details &&
                  ` - ${statusInfo.agentStatus.details}`}
              </span>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

HeaderBar.displayName = "HeaderBar";
