import { Icon } from "@ui/components/Icon";
import { Textarea } from "@ui/components/ui/textarea";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import React, { forwardRef } from "react";

export interface MinimalInputProps {
  text: string;
  onTextChange: (newText: string) => void;
  onSendMessage: (text: string) => void;
  onAttachFiles?: () => void;
  disabled?: boolean;
  selectedAgentId?: string;
  agents?: any[];
  placeholder?: string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
  toolbarConfig?: ToolBarItem[];
}

const MinimalInput = forwardRef<HTMLTextAreaElement, MinimalInputProps>(
  (
    {
      text,
      onTextChange,
      onSendMessage,
      onAttachFiles,
      disabled,
      selectedAgentId,
      agents = [],
      placeholder = "Select an agent...",
      className,
      primaryColor,
      secondaryColor,
      activePrimaryColor,
      activeSecondaryColor,
      toolbarConfig,
    },
    ref,
  ) => {
    const handleSubmit = () => {
      const trimmedText = text.trim();
      if (!trimmedText || disabled) return;

      onSendMessage(trimmedText);
      if (ref && "current" in ref && ref.current) {
        ref.current.focus();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    // Default toolbar items
    const defaultToolbarItems: ToolBarItem[] = [
      ...(onAttachFiles
        ? [
          {
            id: "attach",
            icon: <Icon name="Paperclip" size={20} />,
            action: onAttachFiles,
            tooltip: "Attach files",
            disabled: disabled,
          } as ToolBarItem,
        ]
        : []),
      { id: "spacer", type: "spacer-expand" } as ToolBarItem,
      {
        id: "send",
        icon: <Icon name="Send" size={20} />,
        action: handleSubmit,
        tooltip: "Send message",
        disabled: disabled || !text.trim(),
        intent: "primary",
      } as ToolBarItem,
    ];

    const toolbarItems = Array.isArray(toolbarConfig)
      ? toolbarConfig
      : defaultToolbarItems;

    return (
      <div className="relative w-full h-full">
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedAgentId
              ? `Speak with ${agents.find((a) => a.id === selectedAgentId)?.name}`
              : placeholder
          }
          disabled={disabled}
          className="w-full h-full resize-none bg-white text-sm rounded overflow-hidden pr-16 pl-2 leading-[22px] focus-visible:ring-[2px]"
          style={
            {
              ["--tw-ring-color" as string]: primaryColor,
            } as React.CSSProperties
          }
          primaryColor={primaryColor}
          aria-label="Message input"
          ref={ref}
        />
        <div className="absolute right-2 top-0 h-full flex items-center pointer-events-none">
          <ToolBar
            commands={toolbarItems}
            variant="tiny"
            className="justify-end h-14 text-[0.5rem] -space-x-2 pointer-events-auto [&_button]:p-0 [&_button]:mx-1 [&_svg.lucide]:!h-4 [&_svg.lucide]:!w-4"
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            activePrimaryColor={activePrimaryColor}
            activeSecondaryColor={activeSecondaryColor}
            ariaLabel="Message input toolbar"
          />
        </div>
      </div>
    );
  },
);

export default MinimalInput;

MinimalInput.displayName = "MinimalInput";
