import React from "react";
import { cn } from "../../lib/utils";
import {
  DEFAULT_TOOLBAR_VARIANT,
  type ToolBarVariantStyleConfig,
  toolbarVariantStyles,
} from "./ToolBar.styles";
import {
  ToolBarCommand,
  ToolBarItem,
  ToolBarProps,
  ToolBarSpacer,
} from "./ToolBar.types";

const ToolBar: React.FC<ToolBarProps> = ({
  commands,
  variant = DEFAULT_TOOLBAR_VARIANT,
  className,
  ariaLabel,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
}) => {
  const styles: ToolBarVariantStyleConfig =
    toolbarVariantStyles[variant] ||
    toolbarVariantStyles[DEFAULT_TOOLBAR_VARIANT];

  // Create CSS variables for theme colors
  const themeStyle = {
    "--toolbar-primary": primaryColor || "currentColor",
    "--toolbar-secondary": secondaryColor || "currentColor",
    "--toolbar-active-primary":
      activePrimaryColor || primaryColor || "currentColor",
    "--toolbar-active-secondary":
      activeSecondaryColor || secondaryColor || "currentColor",
  } as React.CSSProperties;

  const renderItem = (item: ToolBarItem, index: number) => {
    if (!item) {
      // Handle null item (empty slot)
      return (
        <div
          key={`toolbar-item-null-${index}`}
          className="w-4"
          aria-hidden="true"
        />
      );
    }

    // Type guard to differentiate ToolBarCommand from ToolBarSpacer
    if ("action" in item) {
      // This is a ToolBarCommand
      const command = item as ToolBarCommand;
      return (
        <button
          key={command.id}
          type="button"
          onClick={command.action}
          disabled={command.disabled}
          className={cn(
            styles.itemClasses,
            command.disabled && styles.disabledItemClasses,
            "transition-all duration-200 ease-in-out",
          )}
          aria-label={command.label || command.tooltip}
          aria-disabled={command.disabled}
          aria-pressed={command.pressed}
          data-state={command.disabled ? "disabled" : "enabled"}
          title={command.tooltip}
        >
          <span className={styles.iconClasses}>{command.icon}</span>
          {command.label && (
            <span className={styles.labelClasses}>{command.label}</span>
          )}
        </button>
      );
    }
    if (item.type === "spacer-expand") {
      // This is a ToolBarSpacer
      const spacer = item as ToolBarSpacer;
      return (
        <div
          key={spacer.id}
          className={`toolbar-spacer ${styles.spacerClasses}`}
          aria-hidden="true" // Spacers are presentational
        />
      );
    }
    return null; // Should not happen with proper types
  };

  return (
    <div
      className={cn(
        "toolbar-container",
        styles.containerClasses,
        "transition-all duration-200 ease-in-out",
        className,
      )}
      role="toolbar"
      aria-label={ariaLabel || "Toolbar"}
      style={themeStyle}
    >
      {commands.map(renderItem)}
    </div>
  );
};

export default ToolBar;
