import * as RadixToolbar from "@radix-ui/react-toolbar";
// import type {
//   ToolbarCommand,
//   ToolbarInstance,
//   ToolbarStyle,
// } from "app/client/src/managers/toolbar/types"; // Adjust path as needed

// Local type definitions to avoid cross-package dependencies
type ToolbarCommand = {
  id: string;
  name: string;
  icon: string;
  tooltip?: string;
  action: any;
  isDisabled?: boolean;
};

type ToolbarStyle = {
  size: "xs" | "sm" | "md" | "lg" | "xl";
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  textSize?: string;
  iconSize?: string;
  borderRadius?: string;
  buttonPadding?: string;
  hoverColor?: string;
  activeColor?: string;
  disabledColor?: string;
};

type ToolbarInstance = {
  config: {
    id: string;
    name: string;
    commands: string[];
    style: ToolbarStyle;
  };
  commands: ToolbarCommand[];
  status: "active" | "inactive" | "error";
};
import { icons } from "lucide-react"; // Assuming you use lucide-react
import React, { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"; // Assuming you have a Tooltip component
import { getStyleForSize } from "./styles";

interface ToolbarProps {
  instance: ToolbarInstance;
  onCommand: (commandId: string) => void;
}

export function ToolbarContainer({ instance, onCommand }: ToolbarProps) {
  const { config, commands } = instance;

  const sizeStyles = useMemo(
    () => getStyleForSize(config.style.size),
    [config.style.size],
  );

  const rootStyle = {
    "--toolbar-bg": config.style.backgroundColor || "transparent",
    "--toolbar-text": config.style.textColor || "inherit",
    "--toolbar-border-radius": config.style.borderRadius || "0.5rem",
    "--toolbar-primary": config.style.primaryColor || "#000",
    "--toolbar-hover": config.style.hoverColor || "rgba(0,0,0,0.05)",
    "--toolbar-active": config.style.activeColor || "rgba(0,0,0,0.1)",
    "--toolbar-disabled": config.style.disabledColor || "rgba(0,0,0,0.5)",
    ...sizeStyles,
  } as React.CSSProperties;

  const Icon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = icons[name as keyof typeof icons];
    if (!LucideIcon) {
      return <span>?</span>; // Fallback for unknown icons
    }
    return <LucideIcon {...props} />;
  };

  return (
    <RadixToolbar.Root
      className="flex items-center p-1 space-x-1 bg-[var(--toolbar-bg)] rounded-[var(--toolbar-border-radius)]"
      style={rootStyle}
      aria-label={config.name}
    >
      <TooltipProvider>
        {commands.map((command) => (
          <Tooltip key={command.id}>
            <TooltipTrigger asChild>
              <RadixToolbar.Button
                className="flex items-center justify-center text-[var(--toolbar-text)] hover:bg-[var(--toolbar-hover)] active:bg-[var(--toolbar-active)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  padding: "var(--button-padding)",
                  borderRadius: "var(--button-border-radius)",
                }}
                onClick={() => onCommand(command.id)}
                disabled={command.isDisabled}
                aria-label={command.name}
              >
                <Icon
                  name={command.icon}
                  style={{
                    width: "var(--icon-size)",
                    height: "var(--icon-size)",
                    color: "var(--toolbar-primary)",
                  }}
                />
              </RadixToolbar.Button>
            </TooltipTrigger>
            {command.tooltip && (
              <TooltipContent>
                <p>{command.tooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </TooltipProvider>
    </RadixToolbar.Root>
  );
}
