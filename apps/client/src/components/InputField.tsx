"use client";

import { BarChart2Icon, PaperclipIcon, SendIcon } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { cn } from "../utils/cn";

interface InputFieldProps {
    onSubmitMessageAction: (content: string) => void;
    onPaperclipClickAction?: () => void;
    onDashboardClickAction?: () => void;
    theme?: "blue" | "rose";
    agentName?: string;
}

export function InputField({ onSubmitMessageAction, onPaperclipClickAction, onDashboardClickAction, theme = "blue", agentName }: InputFieldProps) {
    const [text, setText] = useState("");

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmitMessageAction(text);
        setText("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={agentName ? `Speak to ${agentName}` : "Send a message..."}
                className={cn(
                    "w-full text-[10px] leading-[16px] pr-12 px-1.5 border rounded-[3px] focus-visible:outline-none",
                    theme === "blue"
                        ? "bg-teal-50 border-teal-200 focus-visible:border-teal-300"
                        : "bg-orange-50 border-orange-200 focus-visible:border-orange-300"
                )}
            />
            <div className="absolute right-1 top-0 flex items-center gap-1 h-full">
                {onDashboardClickAction && (
                    <button
                        type="button"
                        onClick={onDashboardClickAction}
                        className={cn(
                            "transition-colors rounded-[2px] p-[1px] hover:bg-gray-100",
                            theme === "blue"
                                ? "text-teal-400 hover:text-teal-600"
                                : "text-orange-400 hover:text-orange-600"
                        )}
                        aria-label="Show dashboard"
                    >
                        <BarChart2Icon className="h-[9px] w-[9px]" aria-hidden={true} />
                    </button>
                )}

                {onPaperclipClickAction && (
                    <button
                        type="button"
                        onClick={onPaperclipClickAction}
                        className={cn(
                            "transition-colors rounded-[2px] p-[1px] hover:bg-gray-100",
                            theme === "blue"
                                ? "text-teal-400 hover:text-teal-600"
                                : "text-orange-400 hover:text-orange-600"
                        )}
                        aria-label="Attach file"
                    >
                        <PaperclipIcon className="h-[9px] w-[9px]" aria-hidden={true} />
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center rounded-[2px] p-[1px] hover:bg-gray-100 focus:outline-none"
                    disabled={!text.trim()}
                    aria-label="Send message"
                >
                    <SendIcon
                        className={cn(
                            "h-[9px] w-[9px] cursor-pointer transition-colors",
                            theme === "blue"
                                ? "text-teal-500 hover:text-teal-700"
                                : "text-orange-500 hover:text-orange-700"
                        )}
                        style={{ opacity: text.trim() ? 1 : 0.5 }}
                        aria-hidden={true}
                    />
                </button>
            </div>
        </div>
    );
}
