import { X } from 'lucide-react';
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
}

export const UserArea: React.FC<UserAreaProps> = ({
    onSubmitMessage,
    uiBarElements,
    error,
    onDismissError,
    onClose,
    attachedFiles = [],
    onRemoveFile,
    className = '',
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
                console.log("Toggle emoji picker");
            },
            tooltip: "Toggle emoji picker",
            id: "emoji-toggle"
        },
        {
            type: "iconCommand" as const,
            iconName: "attach",
            onClick: () => {
                console.log("Open attachment dialog");
            },
            tooltip: "Add attachment",
            id: "attachment-button"
        }
    ];

    const handleSubmit = () => {
        if (currentText.trim() === "") {
            return;
        }
        onSubmitMessage?.(currentText);
        setCurrentText("");
    };

    return (
        <div className={`p-2 border-t border-border bg-muted/40 ${className}`}>
            <div className="grid grid-rows-[auto_auto_auto_auto] gap-2">
                {(showErrorRow || showCloseButton) && (
                    <div
                        className={`p-1 text-xs rounded-sm flex justify-between items-center ${showErrorRow ? "bg-destructive text-destructive-foreground" : ""
                            }`}
                    >
                        {showErrorRow && (
                            <span className="flex-1">{error}</span>
                        )}
                        {showErrorRow && onDismissError && (
                            <button
                                type="button"
                                onClick={onDismissError}
                                className="ml-2 p-0.5 rounded-sm hover:bg-destructive-foreground/20"
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
                                className={`p-0.5 rounded-sm ${showErrorRow ? "hover:bg-destructive-foreground/20" : "hover:bg-muted-foreground/20 text-muted-foreground"}`}
                                aria-label="Close chat"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}

                {showAttachmentRow && onRemoveFile && (
                    <div className="p-1 bg-background border border-border rounded-sm">
                        <AttachmentRow
                            attachedFiles={attachedFiles || []}
                            onRemoveFile={onRemoveFile}
                            className="py-1"
                        />
                    </div>
                )}

                <MinimalInput
                    text={currentText}
                    onTextChange={handleTextChange}
                    onSubmit={handleSubmit}
                    trailingAccessoryElements={inputTrailingElements}
                    accessoryBarProps={{
                        gap: "space-x-2",
                        className: "px-1"
                    }}
                />

                {showSubInputUIBar && uiBarElements && (
                    <div className="mt-1">
                        <UIBar elements={uiBarElements} />
                    </div>
                )}

                {showEmoji && (
                    <div className="p-2 bg-background border border-input rounded-md text-sm">
                        Emoji Picker Placeholder
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserArea;
