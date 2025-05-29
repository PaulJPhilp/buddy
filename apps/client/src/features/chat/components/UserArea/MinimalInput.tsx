"use client";

import { Icon } from "@ui/components/Icon";
import { ToolBar, type ToolBarItem } from "@ui/components/ui/toolbar";
import React, { forwardRef, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";

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
  minRows?: number;
  maxRows?: number;
}

const MinimalInput = forwardRef<HTMLTextAreaElement, MinimalInputProps>(
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
      minRows = 1,
      maxRows = 5,
    },
    ref,
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
      const trimmedText = text.trim();
      if (!trimmedText || disabled) return;

      onSendMessage(trimmedText);
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.focus();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            icon: <Icon name="Paperclip" size={20} />,
            action: handleTriggerFileInput,
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
      <div 
        className="flex items-center w-full border rounded-md p-1 focus-within:ring-2 focus-within:ring-[hsl(var(--chat-ring-actual-hsl-components))] transition-all duration-150 ease-in-out"
        style={{
          borderColor: 'var(--chat-border-color)',
          borderWidth: 'var(--chat-border-thickness)',
        }}
      >
        <TextareaAutosize
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedAgentId
              ? `Speak with ${agents.find((a) => a.id === selectedAgentId)?.name}`
              : placeholder
          }
          disabled={disabled}
          className="flex-grow resize-none text-sm rounded overflow-auto pl-2 leading-[22px] transition-height duration-200 ease-in-out bg-transparent focus:outline-none"
          style={{
            color: 'var(--chat-color-text)',
            // backgroundColor: 'var(--chat-color-background)', // Let parent div background show through
          }}
          aria-label="Message input"
          ref={ref}
          minRows={3}
          maxRows={maxRows}
        />
        <div className="flex items-center">
          <ToolBar
            commands={toolbarItems}
            variant="tiny"
            className="justify-end h-8 text-[0.5rem] -space-x-2 pointer-events-auto [&_button]:p-0 [&_button]:mx-1 [&_svg.lucide]:!h-4 [&_svg.lucide]:!w-4"
            ariaLabel="Message input toolbar"
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
