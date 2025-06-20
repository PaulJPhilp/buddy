"use client";

import { cn } from "@/utils";
import { Icon } from "@ui/components/Icon";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import React, { forwardRef, useRef } from "react";

export interface MinimalInputProps {
  text: string;
  onTextChange: (newText: string) => void;
  onSendMessage: (text: string) => void;
  onFilesSelected?: (files: File[]) => void;
  disabled?: boolean;
  selectedAgentId?: string;
  agents?: any[];
  placeholder?: string;
  className?: string;
  toolbarConfig?: ToolBarItem[];
}

const MinimalInput = forwardRef<HTMLInputElement, MinimalInputProps>(
  (
    {
      text,
      onTextChange,
      onSendMessage,
      onFilesSelected,
      disabled,
      selectedAgentId,
      agents = [],
      placeholder = "Select an agent...",
      className,
      toolbarConfig,
    },
    ref,
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
      const trimmedText = text.trim();
      console.log("[MinimalInput] handleSubmit called:", {
        originalText: text,
        trimmedText,
        disabled,
        textLength: text.length,
        trimmedLength: trimmedText.length,
      });

      if (!trimmedText || disabled) {
        console.log("[MinimalInput] Submit blocked:", {
          emptyText: !trimmedText,
          disabled,
          reason: !trimmedText ? "empty text" : "input disabled",
        });
        return;
      }

      console.log(
        "[MinimalInput] Calling onSendMessage with text:",
        trimmedText,
      );
      onSendMessage(trimmedText);
      console.log("[MinimalInput] onSendMessage called successfully");

      if (ref && typeof ref !== "function" && ref.current) {
        ref.current.focus();
        console.log("[MinimalInput] Input refocused after send");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleTriggerFileInput = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && onFilesSelected) {
        onFilesSelected(Array.from(event.target.files));
      }
      if (event.target) {
        event.target.value = "";
      }
    };

    // Default toolbar items
    const defaultToolbarItems: ToolBarItem[] = [
      ...(onFilesSelected
        ? [
            {
              id: "attach",
              icon: <Icon name="Paperclip" size={16} />,
              action: handleTriggerFileInput,
              tooltip: "Attach files",
              disabled: disabled,
            } as ToolBarItem,
          ]
        : []),
      { id: "spacer", type: "spacer-expand" } as ToolBarItem,
      {
        id: "send",
        icon: <Icon name="Send" size={16} />,
        action: handleSubmit,
        tooltip: "Send message",
        disabled: disabled || !text.trim(),
        intent: "primary",
        testId: "send-message-button",
      } as ToolBarItem,
    ];

    const toolbarItems = Array.isArray(toolbarConfig)
      ? toolbarConfig
      : defaultToolbarItems;

    return (
      <div
        className={cn(
          "flex items-center w-full border rounded-md px-2 py-0.5 transition-all duration-150 ease-in-out focus-within:border-2",
          className,
        )}
        style={{
          backgroundColor: "var(--color-chat-background)",
          borderColor: "var(--color-chat-border)",
          color: "var(--color-chat-foreground)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedAgentId
              ? `Speak with ${agents.find((a) => a.id === selectedAgentId)?.name}`
              : placeholder
          }
          disabled={disabled}
          className="block w-full text-sm rounded pl-2 leading-normal bg-transparent h-8 focus:outline-none"
          style={{
            color: "var(--color-chat-foreground)",
            paddingTop: "8px",
            paddingBottom: "8px",
            backgroundColor: "transparent",
          }}
          aria-label="Message input"
          ref={ref as any}
        />
        <div className="flex items-center justify-center h-full">
          <ToolBar
            commands={toolbarItems}
            variant="tiny"
            className="justify-start h-8 text-sm pointer-events-auto [&_button]:p-1 [&_button]:mx-1 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:h-6 [&_svg.lucide]:!h-4 [&_svg.lucide]:!w-4"
            ariaLabel="Input actions toolbar"
          />
        </div>
        {onFilesSelected && (
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-label="File attachment input"
          />
        )}
      </div>
    );
  },
);

export default MinimalInput;

MinimalInput.displayName = "MinimalInput";
