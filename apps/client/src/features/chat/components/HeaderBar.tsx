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
  secondaryColor?: string;
  /** Primary color for active state and progress bars */
  primaryColor?: string;
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
      primaryColor,
      secondaryColor,
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

    return (
      <Collapsible
        ref={ref}
        open={isStatusOpen}
        onOpenChange={handleStatusToggle}
        className={cn("w-full border-b transition-colors", className)}
        style={{
          borderColor: isSelected ? primaryColor : undefined,
          backgroundColor: isSelected ? `${secondaryColor}33` : undefined,
        }}
      >
        <div className="flex items-center justify-between px-1 py-0.5 text-[0.5rem] h-4">
          <div className="flex items-center gap-1">
            <h2
              className="text-[0.5rem] font-medium"
              style={{ color: isSelected ? primaryColor : undefined }}
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
                    ? "text-warning"
                    : "text-destructive",
                )}
                title={errorInfo.message}
              >
                <AlertCircle className="h-1.5 w-1.5" aria-hidden="true" />
              </Button>
            )}
          </div>

          {statusInfo && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-2 w-2 p-0.5">
                {isStatusOpen ? (
                  <ChevronUp className="h-1.5 w-1.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-1.5 w-1.5" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent className="px-1.5 py-0.5 space-y-0.5 bg-muted/50 text-[10px]">
          {statusInfo?.tokens && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span>Tokens Used</span>
                <span>{statusInfo.tokens.used.toLocaleString()}</span>
              </div>
              <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${tokenPercentage}%`,
                    backgroundColor: primaryColor,
                  }}
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
              <div className="h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${costPercentage}%`,
                    backgroundColor: primaryColor,
                  }}
                />
              </div>
            </div>
          )}

          {statusInfo?.agentStatus && (
            <div className="flex items-center justify-between text-[10px]">
              <span>Agent Status</span>
              <span
                className={cn(
                  "px-1 py-0.5 rounded-full text-[10px] font-medium",
                  {
                    "bg-primary/10 text-primary":
                      statusInfo.agentStatus.state === "idle",
                    "bg-warning/10 text-warning":
                      statusInfo.agentStatus.state === "thinking",
                    "bg-muted text-muted-foreground":
                      statusInfo.agentStatus.state === "paused",
                    "bg-destructive/10 text-destructive":
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
