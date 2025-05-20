import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { Button } from '@ui/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@ui/components/ui/collapsible';

export interface ErrorInfo {
  message: string;
  details?: string;
  severity?: 'error' | 'warning';
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
    state: 'idle' | 'thinking' | 'paused' | 'error';
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
  /** Primary color for active state and progress bars */
  primaryColor?: string;
}

export const HeaderBar = React.forwardRef<HTMLDivElement, HeaderBarProps>(({ 
  title,
  errorInfo,
  isSelected,
  statusInfo,
  onToggleStatusPanel,
  className,
  primaryColor,
}, ref) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const handleStatusToggle = (open: boolean) => {
    setIsStatusOpen(open);
    onToggleStatusPanel?.(open);
  };

  const tokenPercentage = statusInfo?.tokens 
    ? (statusInfo.tokens.used / (statusInfo.tokens.used + statusInfo.tokens.remaining)) * 100
    : 0;

  const costPercentage = statusInfo?.cost
    ? (statusInfo.cost.current / statusInfo.cost.limit) * 100
    : 0;

  return (
    <Collapsible
      ref={ref}
      open={isStatusOpen}
      onOpenChange={handleStatusToggle}
      className={cn(
        'w-full border-b transition-colors',
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border bg-background',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 
            className={cn(
              "text-lg font-semibold",
              isSelected ? "text-primary" : "text-foreground"
            )}
            style={isSelected ? { color: primaryColor } : undefined}
          >
            {title}
          </h2>
          {errorInfo && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6",
                errorInfo.severity === 'warning' ? "text-warning" : "text-destructive"
              )}
              title={errorInfo.message}
            >
              <AlertCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {statusInfo && (
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
            >
              {isStatusOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        )}
      </div>

      <CollapsibleContent className="px-4 py-2 space-y-2 bg-muted/50">
        {statusInfo?.tokens && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Tokens Used</span>
              <span>{statusInfo.tokens.used.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
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
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Cost ({statusInfo.cost.currency})</span>
              <span>
                {statusInfo.cost.current.toLocaleString()} / {statusInfo.cost.limit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
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
          <div className="flex items-center justify-between text-sm">
            <span>Agent Status</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              {
                'bg-primary/10 text-primary': statusInfo.agentStatus.state === 'idle',
                'bg-warning/10 text-warning': statusInfo.agentStatus.state === 'thinking',
                'bg-muted text-muted-foreground': statusInfo.agentStatus.state === 'paused',
                'bg-destructive/10 text-destructive': statusInfo.agentStatus.state === 'error',
              }
            )}>
              {statusInfo.agentStatus.state}
              {statusInfo.agentStatus.details && ` - ${statusInfo.agentStatus.details}`}
            </span>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});

HeaderBar.displayName = 'HeaderBar';
