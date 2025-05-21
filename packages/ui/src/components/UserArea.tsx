import { X } from "lucide-react";
import React, { useState } from "react";

import { AttachmentRow } from "./AttachmentRow";
import { MinimalInput } from "./MinimalInput";
import { UIBar, UIBarElementConfig } from "./UIBar";

export interface UserAreaProps {
  onSubmitMessage?: (text: string) => void;
  uiBarElements?: UIBarElementConfig[];
  error?: string | null;
  onDismissError?: () => void;
  onClose?: () => void;
  attachedFiles?: Array<File>;
  onRemoveFile?: (file: File) => void;
  className?: string;
  isTyping?: boolean;
}

export const UserArea: React.FC<UserAreaProps> = ({
  onSubmitMessage,
  uiBarElements,
  error,
  onDismissError,
  onClose,
  attachedFiles = [],
  onRemoveFile,
  className = "",
  isTyping = false,
}) => {
  const [currentText, setCurrentText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const showErrorRow = !!error;
  const showCloseButton = !!onClose;
  const showAttachmentRow = attachedFiles.length > 0;
  const showSubInputUIBar = !!uiBarElements && uiBarElements.length > 0;

  const handleTextChange = (newText: string) => {
    setCurrentText(newText);
  };

  const inputTrailingElements: UIBarElementConfig[] = [
    {
      type: "iconCommand" as const,
      iconName: "emoji",
      onClick: () => {
        setShowEmoji(!showEmoji);
      },
      id: "emoji-toggle",
    },
    {
      type: "iconCommand" as const,
      iconName: "attach",
      onClick: () => {
        // Placeholder for attachment action
      },
      id: "attachment-button",
    },
  ];

  const handleSubmit = () => {
    if (currentText.trim() === "") {
      return;
    }
    onSubmitMessage?.(currentText);
    setCurrentText("");
  };

  return (
    <div
      className={`px-sm py-xs border-t border-border bg-muted/40 ${className}`}
    >
      <div className="grid grid-rows-[auto_auto_auto_auto] gap-xs">
        {(showErrorRow || showCloseButton) && (
          <div
            className={`px-xs py-xxs text-xxs rounded-xs flex justify-between items-center ${showErrorRow ? "bg-destructive text-destructive-foreground" : ""}`}
          >
            {showErrorRow && <span className="flex-1">{error}</span>}
            {showErrorRow && onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className="ml-xs p-xxs rounded-xs hover:bg-destructive-foreground/20"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            )}
            {showCloseButton && !showErrorRow && <div className="flex-1" />}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={`p-xxs rounded-xs ${showErrorRow ? "hover:bg-destructive-foreground/20" : "hover:bg-muted-foreground/20 text-muted-foreground"}`}
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {showAttachmentRow && onRemoveFile && (
          <div className="px-xs py-xxs bg-background border border-border rounded-xs">
            <AttachmentRow
              attachedFiles={attachedFiles || []}
              onRemoveFile={onRemoveFile}
              className="py-xxs"
            />
          </div>
        )}

        {isTyping && (
          <div className="px-xs py-xxs text-xs text-muted-foreground">
            Typing...
          </div>
        )}
        <MinimalInput
          text={currentText}
          onTextChange={handleTextChange}
          onSubmit={handleSubmit}
          trailingAccessoryElements={inputTrailingElements}
          accessoryBarProps={{
            gap: "space-x-xs",
            className: "px-xs",
          }}
        />

        {showSubInputUIBar && uiBarElements && (
          <div className="mt-xxs">
            <UIBar elements={uiBarElements} />
          </div>
        )}

        {showEmoji && (
          <div className="px-xs py-xxs bg-background border border-input rounded-xs text-xs">
            Emoji Picker Placeholder
          </div>
        )}
      </div>
    </div>
  );
};

export default UserArea;
