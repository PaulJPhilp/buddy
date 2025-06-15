import { Schema } from "effect";
import { ReactNode } from "react";

// Core command interface
export interface ToolbarCommand {
  readonly id: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly action: () => void;
  readonly tooltip?: string;
  readonly disabled?: boolean;
  readonly active?: boolean;
  readonly variant?: "default" | "primary" | "secondary" | "danger";
  readonly size?: "default" | "sm" | "lg" | "icon";
}

// Spacer command for layout
export interface ToolbarSpacer {
  readonly id: string;
  readonly type: "spacer" | "spacer-expand";
}

// Custom item type
export interface ToolbarCustom {
  readonly id: string;
  readonly type: "custom";
  readonly element: ReactNode;
}

// Union type for all toolbar items
export type ToolbarItem = ToolbarCommand | ToolbarSpacer | ToolbarCustom;

// Toolbar configuration interface
export interface ToolbarConfigData {
  readonly id: string;
  readonly position: "top" | "left" | "right" | "bottom";
  readonly items: ToolbarItem[];
  readonly className?: string;
  readonly variant?: "default" | "compact" | "minimal";
}

// Effect.Class schema for ToolbarConfig
export class ToolbarConfig extends Schema.Class<ToolbarConfig>("ToolbarConfig")(
  {
    id: Schema.String,
    position: Schema.Literal("top", "left", "right", "bottom"),
    items: Schema.Array(Schema.Unknown), // Items contain functions/ReactNodes, so using Unknown
    className: Schema.optional(Schema.String),
    variant: Schema.optional(Schema.Literal("default", "compact", "minimal")),
  },
) {}

// Helper type guards
export function isCommand(item: ToolbarItem): item is ToolbarCommand {
  return !("type" in item);
}

export function isSpacer(item: ToolbarItem): item is ToolbarSpacer {
  return (
    "type" in item && (item.type === "spacer" || item.type === "spacer-expand")
  );
}

export function isCustom(item: ToolbarItem): item is ToolbarCustom {
  return "type" in item && item.type === "custom";
}
