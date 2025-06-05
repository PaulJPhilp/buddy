"use client";

import { cn } from "@/lib/utils";
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
      console.log('[MinimalInput] handleSubmit called:', {
        originalText: text,
        trimmedText,
        disabled,
        textLength: text.length,
        trimmedLength: trimmedText.length
      });

      if (!trimmedText || disabled) {
        console.log('[MinimalInput] Submit blocked:', {
          emptyText: !trimmedText,
          disabled,
          reason: !trimmedText ? 'empty text' : 'input disabled'
        });
        return;
      }

      console.log('[MinimalInput] Calling onSendMessage with text:', trimmedText);
      onSendMessage(trimmedText);
      console.log('[MinimalInput] onSendMessage called successfully');

      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.focus();
        console.log('[MinimalInput] Input refocused after send');
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
        className={cn(
          "flex items-center w-full border rounded-md px-3 py-1 focus-within:ring-2 focus-within:ring-[var(--color-chat-primary)] transition-all duration-150 ease-in-out",
          className
        )}
        style={{
          backgroundColor: 'var(--color-chat-background)',
          borderColor: 'var(--color-chat-input-border)',
          color: 'var(--color-chat-foreground)'
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
          className="flex-grow resize-none text-[7px] rounded overflow-auto pl-2 leading-[18px] transition-height duration-200 ease-in-out bg-transparent focus:outline-none min-h-[24px] max-h-[24px] h-[24px] flex items-center"
          style={{
            color: 'var(--color-chat-foreground)',
            paddingTop: '3px',
            paddingBottom: '3px',
            backgroundColor: 'transparent'
          }}
          aria-label="Message input"
          ref={ref}
          minRows={1}
          maxRows={1}
        />
        <div className="flex items-center justify-center h-full">
          <ToolBar
            commands={toolbarItems}
            variant="tiny"
            className="justify-start h-6 text-[4px] pointer-events-auto [&_button]:p-0 [&_button]:mx-1 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:h-6 [&_svg.lucide]:!h-3 [&_svg.lucide]:!w-3"
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
