import React from "react";

/**
 * Defines a regular interactive command for the ToolBar.
 */
export interface ToolBarCommand {
  id: string;
  icon: React.ReactNode;
  label?: string;
  action: () => void;
  tooltip?: string;
  disabled?: boolean;
  pressed?: boolean;
  ariaLabel?: string;
  className?: string;
  intent?: "primary" | "secondary" | "danger" | "success" | "warning";
}

/**
 * Defines a spacer item for the ToolBar, used for layout.
 */
export interface ToolBarSpacer {
  id: string; // Unique ID for the spacer (for React keys)
  type: "spacer-expand"; // Indicates a flexible spacer that grows
  // Potentially add: 'minWidth' or 'fixedWidth' if non-expanding spacers are needed later
}

/**
 * Represents any valid item that can be placed in a ToolBar's command list.
 * It can be a command, a spacer, or null for an empty slot.
 */
export type ToolBarItem = ToolBarCommand | ToolBarSpacer | null;

/**
 * Props for the ToolBar component.
 */
export interface ToolBarProps {
  /**
   * An array of commands, spacers, or nulls to display in order.
   */
  commands: ToolBarItem[];

  /**
   * A string key to select a predefined style configuration for the ToolBar.
   * Examples: 'default', 'compact', 'tiny'.
   */
  variant?: string;

  /**
   * Optional additional CSS class names for the ToolBar's root container.
   */
  className?: string;

  /**
   * Accessibility label for the ToolBar container.
   */
  ariaLabel?: string;

  /**
   * Primary color for the toolbar theme.
   * Used for icons, borders, and interactive elements.
   */
  primaryColor?: string;

  /**
   * Secondary color for the toolbar theme.
   * Used for text and supporting elements.
   */
  secondaryColor?: string;

  /**
   * Active state primary color.
   * Used when toolbar items are active/selected.
   */
  activePrimaryColor?: string;

  /**
   * Active state secondary color.
   * Used for text when items are active/selected.
   */
  activeSecondaryColor?: string;
}
