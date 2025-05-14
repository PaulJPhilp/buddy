"use client";

import { BarChart2Icon, PaperclipIcon, SendIcon } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

interface MinimalInputProps {
    onSubmitMessageAction: (content: string) => void;
    onPaperclipClickAction?: () => void;
    onDashboardClickAction?: () => void;
    theme?: "blue" | "rose";
    agentName?: string;
}

export function MinimalInput({ onSubmitMessageAction, onPaperclipClickAction, onDashboardClickAction, theme = "blue", agentName }: MinimalInputProps) {
    const [text, setText] = useState("");
    const divRef = useRef<HTMLDivElement>(null);

    const handleSubmit = () => {
        const content = text.trim();
        if (!content) return;
        onSubmitMessageAction(content);
        setText("");
        if (divRef.current) {
            divRef.current.textContent = "";
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    useEffect(() => {
        if (divRef.current) {
            const placeholder = agentName ? `Speak to ${agentName}` : "Send a message...";
            divRef.current.setAttribute('data-placeholder', placeholder);
        }
    }, [agentName]);

    return (
        <div className="relative w-full min-h-0">
            <div
                ref={divRef}
                role="textbox"
                contentEditable
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onInput={(e) => setText(e.currentTarget.textContent || "")}
                className={cn(
                    "w-full outline-none min-h-0 pr-10 pl-1 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 whitespace-nowrap overflow-hidden text-[10px] leading-[14px] border rounded-[2px]",
                    theme === "blue"
                        ? "bg-teal-50 border-teal-200 focus:border-teal-300"
                        : "bg-orange-50 border-orange-200 focus:border-orange-300"
                )}
            />
            <div className="absolute right-0.5 top-0 flex items-center gap-0.5 h-full">
                {onDashboardClickAction && (
                    <button
                        type="button"
                        onClick={onDashboardClickAction}
                        className={cn(
                            "flex items-center justify-center transition-colors rounded-[2px] p-0.5 hover:bg-gray-100",
                            theme === "blue"
                                ? "text-teal-400 hover:text-teal-600"
                                : "text-orange-400 hover:text-orange-600"
                        )}
                        aria-label="Show dashboard"
                    >
                        <BarChart2Icon className="h-[8px] w-[8px]" aria-hidden={true} />
                    </button>
                )}

                {onPaperclipClickAction && (
                    <button
                        type="button"
                        onClick={onPaperclipClickAction}
                        className={cn(
                            "flex items-center justify-center transition-colors rounded-[2px] p-0.5 hover:bg-gray-100",
                            theme === "blue"
                                ? "text-teal-400 hover:text-teal-600"
                                : "text-orange-400 hover:text-orange-600"
                        )}
                        aria-label="Attach file"
                    >
                        <PaperclipIcon className="h-[8px] w-[8px]" aria-hidden={true} />
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex items-center justify-center rounded-[2px] p-0.5 hover:bg-gray-100 focus:outline-none"
                    disabled={!text.trim()}
                    aria-label="Send message"
                >
                    <SendIcon
                        className={cn(
                            "h-[8px] w-[8px] cursor-pointer transition-colors",
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
