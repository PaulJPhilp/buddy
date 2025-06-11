// Export all UI components
export * from "./components/ui";

// Export specific components
export * from "./components/Icon";
export * from "./components/AttachmentRow";
export * from "./components/MessageArea";
export * from "./components/UIBar";
export * from "./components/EffectReactTest";
// Export ToolBar separately to avoid conflicts with toolbar
export { ToolBar } from "./components/ToolBar";

// Export chat components
export * from "./components/chat";

// Export utilities
export { cn } from "./lib/utils";

// Export styles
export { getToolbarStyles } from "./styles/toolbar.styles";

// Export types
export type {
  ToolBarCommand,
  ToolBarSpacer,
  ToolBarItem,
  ToolBarProps,
} from "./components/ui/toolbar";
