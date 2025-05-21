import { HelpCircle, Paperclip, Send, Settings, Smile } from "lucide-react";
import React from "react";

export interface IconElementConfig {
  type: "iconCommand";
  iconName: string;
  label?: string;
  onClick?: () => void;
  tooltip?: string;
  isDisabled?: boolean;
  id?: string;
}

export interface SelectorElementConfig {
  type: "selector";
  items: Array<{ value: string; label: string; disabled?: boolean }>;
  currentValue: string;
  onValueChange?: (selectedValue: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  id?: string;
}

export type UIBarElementConfig = IconElementConfig | SelectorElementConfig;

export interface UIBarProps {
  elements: UIBarElementConfig[];
  orientation?: "horizontal" | "vertical";
  className?: string;
  gap?: string;
}

export const UIBar: React.FC<UIBarProps> = ({
  elements,
  orientation = "horizontal",
  className,
  gap = "space-x-1",
}) => {
  const layoutClasses =
    orientation === "horizontal"
      ? `flex-row ${gap}`
      : `flex-col ${gap.replace("space-x-", "space-y-")}`;

  return (
    <div
      className={`flex ${layoutClasses} items-center p-1 bg-muted/20 rounded-md border border-input ${className || ""}`}
    >
      {elements.map((element, index) => {
        const key =
          element.id ||
          (element.type === "iconCommand"
            ? `icon-${element.iconName}-${index}`
            : `selector-${(element as SelectorElementConfig).placeholder || "sel"}-${index}`);
        if (element.type === "iconCommand") {
          return (
            <button
              type="button"
              key={key}
              onClick={() => !element.isDisabled && element.onClick?.()}
              disabled={element.isDisabled}
              title={element.tooltip}
              className={`p-1 rounded-md text-sm flex items-center space-x-1 ${element.isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground"}`}
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center">
                {element.iconName === "send" && <Send size={14} />}
                {element.iconName === "emoji" && <Smile size={14} />}
                {element.iconName === "attach" && <Paperclip size={14} />}
                {element.iconName === "settings" && <Settings size={14} />}
                {element.iconName === "help" && <HelpCircle size={14} />}
                {!["send", "emoji", "attach", "settings", "help"].includes(
                  element.iconName,
                ) && (
                  <span className="text-xs font-mono">
                    {element.iconName.substring(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              {element.label && (
                <span className="align-middle">{element.label}</span>
              )}
              {!element.label && (
                <span className="sr-only">{element.iconName}</span>
              )}
            </button>
          );
        }
        if (element.type === "selector") {
          return (
            <select
              key={key}
              value={element.currentValue}
              onChange={(e) => {
                if (!element.isDisabled && element.onValueChange) {
                  element.onValueChange(e.target.value);
                }
              }}
              disabled={element.isDisabled}
              className={`p-0.5 text-xs rounded-md bg-background border border-input ${element.isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-ring focus:border-ring focus:ring-1 focus:ring-ring"}`}
            >
              {element.placeholder && (
                <option value="">{element.placeholder}</option>
              )}
              {element.items.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                >
                  {item.label}
                </option>
              ))}
            </select>
          );
        }
        const unknownElement = element as UIBarElementConfig;
        return (
          <div
            key={
              unknownElement.id || `unknown-${JSON.stringify(unknownElement)}`
            }
            className="text-xs text-muted-foreground"
          >
            Unknown UIBar element type
          </div>
        );
      })}
      {elements.length === 0 && (
        <div className="text-xs text-muted-foreground p-1">UIBar (empty)</div>
      )}
    </div>
  );
};

export default UIBar;
