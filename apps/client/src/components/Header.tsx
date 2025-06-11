import { ToolBar } from "@ui/components/ToolBar";
import type { ToolBarItem } from "@ui/components/ToolBar/ToolBar.types";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/ui/alert";
import { cn } from "@ui/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import React from "react";

export interface HeaderStatusInfo {
  messages: string[];
  tokenCount?: number;
  cost?: number;
  timestamp?: number;
}

export interface HeaderErrorInfo {
  title: string;
  message: string;
  variant?: "default" | "destructive";
  timestamp?: number;
  onDismiss?: () => void;
}

export interface HeaderProps {
  appName: string;
  errorInfo?: HeaderErrorInfo;
  onErrorClick?: () => void;
  statusInfo?: HeaderStatusInfo;
  isStatusPanelOpen?: boolean;
  onToggleStatusPanel?: () => void;
  isActive?: boolean;
  toolbarCommands?: ToolBarItem[];
  toolbarVariant?: string; // e.g., 'tiny', 'default'
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  appName,
  errorInfo,
  onErrorClick,
  statusInfo,
  isStatusPanelOpen,
  onToggleStatusPanel,
  isActive = false,
  toolbarCommands = [],
  toolbarVariant = "tiny",
  className,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
}) => {
  const headerContainerStyles = cn(
    "flex flex-col transition-all duration-200",
    "border-b border-border",
    isActive && "shadow-sm",
    className,
  );

  const headerMainStyles = cn(
    "flex items-center justify-between min-h-[2.5rem] px-3 py-1",
    "transition-colors duration-200",
  );

  const appNameStyles = cn(
    "text-sm font-semibold truncate",
    "transition-colors duration-200",
  );

  // Status panel slide-down animation classes
  const statusPanelStyles = cn(
    "overflow-hidden transition-all duration-200 ease-in-out",
    "bg-background/50 backdrop-blur-sm",
    "border-t border-border",
    isStatusPanelOpen ? "max-h-48" : "max-h-0",
  );

  // Construct toolbar commands
  const headerCommands: ToolBarItem[] = [
    ...toolbarCommands,
    { id: "header-spacer", type: "spacer-expand" },
    // Status toggle button
    statusInfo &&
      onToggleStatusPanel && {
        id: "header-status",
        icon: isStatusPanelOpen ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        ),
        action: onToggleStatusPanel,
        tooltip: isStatusPanelOpen ? "Hide Status" : "Show Status",
        pressed: isStatusPanelOpen,
        intent: "secondary",
      },
    // Error button
    errorInfo &&
      onErrorClick && {
        id: "header-error",
        icon: (
          <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
        ),
        action: onErrorClick,
        tooltip: errorInfo.title,
        intent: "danger",
      },
  ].filter(Boolean) as ToolBarItem[];

  return (
    <header className={headerContainerStyles}>
      <div className={headerMainStyles}>
        <div className={appNameStyles}>{appName}</div>
        {headerCommands.length > 0 && (
          <ToolBar
            commands={headerCommands}
            variant={toolbarVariant}
            ariaLabel={`${appName} actions`}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            activePrimaryColor={activePrimaryColor}
            activeSecondaryColor={activeSecondaryColor}
          />
        )}
      </div>

      {/* Status Panel */}
      <div className={statusPanelStyles}>
        {isStatusPanelOpen && statusInfo && (
          <div className="p-3 space-y-2 text-sm">
            {statusInfo.messages.map((message) => (
              <div key={message} className="text-muted-foreground">
                {message}
              </div>
            ))}
            {(statusInfo.tokenCount || statusInfo.cost) && (
              <div className="flex justify-between text-xs text-muted-foreground/75">
                {statusInfo.tokenCount && (
                  <span>Tokens: {statusInfo.tokenCount.toLocaleString()}</span>
                )}
                {statusInfo.cost && (
                  <span>Cost: ${statusInfo.cost.toFixed(4)}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorInfo && (
        <Alert variant={errorInfo.variant || "destructive"} className="mt-2">
          <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          <AlertTitle>{errorInfo.title || "Error"}</AlertTitle>
          <AlertDescription>{errorInfo.message}</AlertDescription>
          {errorInfo.onDismiss && (
            <button
              type="button"
              onClick={errorInfo.onDismiss}
              className="absolute right-2 top-2 opacity-70 hover:opacity-100"
            >
              <X
                className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-hidden="true"
              />
            </button>
          )}
        </Alert>
      )}
    </header>
  );
};

export default Header;
