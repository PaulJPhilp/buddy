import React, { useEffect, useState } from "react";
import { UIBar, UIBarElementConfig, UIBarProps } from "./UIBar";

export interface MinimalInputProps {
    text: string;
    onTextChange: (newText: string) => void;
    onSubmit: () => void;
    placeholder?: string;
    isDisabled?: boolean;
    trailingAccessoryElements?: UIBarElementConfig[];
    accessoryBarProps?: Partial<Pick<UIBarProps, 'orientation' | 'className' | 'gap'>>;
}

export const MinimalInput: React.FC<MinimalInputProps> = ({
    text: initialText,
    onTextChange,
    onSubmit,
    placeholder = "Type a message...",
    isDisabled = false,
    trailingAccessoryElements = [],
    accessoryBarProps,
}) => {
    const [reactText, setReactText] = useState(initialText);

    useEffect(() => {
        setReactText(initialText);
    }, [initialText]);

    const showSubmitButton = reactText.trim().length > 0;

    const handleSubmit = () => {
        if (!reactText.trim()) return;
        onSubmit();
    };

    const handleTextChange = (newText: string) => {
        setReactText(newText);
        onTextChange(newText);
    };

    // Combine any provided trailing accessories with our submit button
    const allTrailingElements: UIBarElementConfig[] = [
        ...trailingAccessoryElements,
        ...(showSubmitButton ? [{
            type: "iconCommand" as const,
            iconName: "send",
            onClick: handleSubmit,
            tooltip: "Send message",
            isDisabled: isDisabled || !reactText.trim(),
            id: "submit-button"
        }] : [])
    ];

    return (
        <div
            className={`
                flex items-center p-1 bg-background border border-input rounded-md
                transition-colors duration-200
                ${isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-ring focus-within:ring-1 focus-within:ring-ring focus-within:border-ring"
                }
            `}
        >
            <textarea
                value={reactText}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (reactText.trim()) {
                            handleSubmit();
                        }
                    }
                }}
                placeholder={placeholder}
                className="flex-1 p-1 text-sm bg-transparent focus:outline-none placeholder-muted-foreground transition-colors duration-200 resize-none min-h-[24px] max-h-[120px] overflow-y-auto"
                disabled={isDisabled}
                rows={1}
                style={{
                    height: 'auto',
                    minHeight: '24px',
                    overflowY: 'hidden'
                }}
                onInput={(e) => {
                    // Auto-resize the textarea
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
            />

            {allTrailingElements.length > 0 && (
                <div className="ml-2 flex items-center">
                    <UIBar
                        elements={allTrailingElements}
                        orientation={accessoryBarProps?.orientation || "horizontal"}
                        className={`transition-opacity duration-200 ${accessoryBarProps?.className || ''}`}
                        gap={accessoryBarProps?.gap || "space-x-1"}
                    />
                </div>
            )}
        </div>
    );
};

export default MinimalInput;
