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
}

const ToolBar = React.forwardRef<HTMLDivElement, ToolBarProps>(
  ({ commands, variant = "default", className, ariaLabel = "Toolbar" }, ref) => {
    const styles = getToolbarStyles(variant, className);

    const getItemStyle = (item: ToolBarCommand): { baseClassName: string; intentStyle: React.CSSProperties; additionalClassName?: string } => {
      const baseClassName = styles.item;
      if (item.disabled) {
        return { baseClassName, intentStyle: {}, additionalClassName: styles.disabled };
      }

      let intentStyle: React.CSSProperties = {};
      switch (item.intent) {
        case "primary":
          intentStyle = {
            color: "var(--chat-color-primary)",
          };
          break;
        case "secondary":
          intentStyle = {
            color: "var(--chat-color-secondary)",
          };
          break;
        case "danger":
          intentStyle = { color: "var(--chat-color-danger, red)" };
          break;
        default:
          intentStyle = { color: "var(--chat-color-text)" };
          break;
      }
      return { baseClassName, intentStyle };
    };

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label={ariaLabel}
        className={styles.container}
      >
        {commands.map((item) => {
          if (!item) return null;

          if ("type" in item && item.type === "spacer-expand") {
            return <div key={item.id} className={styles.spacer} />;
          }

          const command = item as ToolBarCommand;
          const { baseClassName, intentStyle, additionalClassName } =
            getItemStyle(command);
          return (
            <button
              key={command.id}
              type="button"
              className={`${baseClassName} ${additionalClassName || ''}`.trim()}
              style={intentStyle}
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
