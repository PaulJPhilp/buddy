import * as React from "react";
import { getToolbarStyles } from "../../styles/toolbar.styles";

export interface ToolBarCommand {
  id: string;
  icon: React.ReactNode;
  label?: string;
  action: () => void;
  tooltip?: string;
  disabled?: boolean;
  intent?: "primary" | "secondary" | "danger";
}

export interface ToolBarSpacer {
  id: string;
  type: "spacer-expand";
}

export type ToolBarItem = ToolBarCommand | ToolBarSpacer | null;

export interface ToolBarProps {
  commands: ToolBarItem[];
  variant?: "default" | "compact" | "tiny";
  className?: string;
  ariaLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
}

const ToolBar = React.forwardRef<HTMLDivElement, ToolBarProps>(
  (
    {
      commands,
      variant = "default",
      className,
      ariaLabel = "Toolbar",
      primaryColor,
      secondaryColor,
      activePrimaryColor,
      activeSecondaryColor,
    },
    ref,
  ) => {
    const styles = getToolbarStyles(variant, className);

    const getItemStyle = (item: ToolBarCommand) => {
      const baseStyle = styles.item;
      if (item.disabled) return `${baseStyle} ${styles.disabled}`;

      switch (item.intent) {
        case "primary":
          return `${baseStyle} ${primaryColor ? `text-[${primaryColor}] hover:text-[${activePrimaryColor || primaryColor}]` : ""}`;
        case "secondary":
          return `${baseStyle} ${secondaryColor ? `text-[${secondaryColor}] hover:text-[${activeSecondaryColor || secondaryColor}]` : ""}`;
        case "danger":
          return `${baseStyle} text-destructive hover:text-destructive/90`;
        default:
          return baseStyle;
      }
    };

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label={ariaLabel}
        className={styles.container}
        style={
          {
            "--primary-color": primaryColor,
            "--secondary-color": secondaryColor,
            "--active-primary-color": activePrimaryColor || primaryColor,
            "--active-secondary-color": activeSecondaryColor || secondaryColor,
          } as React.CSSProperties
        }
      >
        {commands.map((item) => {
          if (!item) return null;

          if ("type" in item && item.type === "spacer-expand") {
            return <div key={item.id} className={styles.spacer} />;
          }

          const command = item as ToolBarCommand;
          return (
            <button
              key={command.id}
              type="button"
              className={getItemStyle(command)}
              onClick={command.action}
              disabled={command.disabled}
              title={command.tooltip}
              aria-label={command.label || command.tooltip}
            >
              <span className={styles.icon}>{command.icon}</span>
              {command.label && (
                <span className={styles.label}>{command.label}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  },
);

ToolBar.displayName = "ToolBar";

export { ToolBar };
