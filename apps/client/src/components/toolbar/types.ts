import {
  ToolbarCommand,
  ToolbarConfig,
  ToolbarCustom,
  ToolbarItem,
  ToolbarSpacer,
  isCommand,
  isCustom,
  isSpacer,
} from "@/types/global";

// Toolbar component props
export interface ToolbarProps {
  readonly config: ToolbarConfig;
  readonly className?: string;
}

// Re-export for convenience
export type {
  ToolbarCommand,
  ToolbarCustom,
  ToolbarSpacer,
  ToolbarItem,
  ToolbarConfig,
  isCommand,
  isSpacer,
  isCustom,
};
