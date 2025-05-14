"use client";

import { BarChart2Icon, PaperclipIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Textarea } from "../../../../src/components/components/ui/textarea";
import { cn } from "../utils/cn";

interface InputAreaProps {
  onSubmitMessageAction: (content: string) => void;
  onPaperclipClickAction?: () => void;
  onDashboardClickAction?: () => void;
  theme?: "blue" | "rose";
  agentName?: string;
}

export function InputArea({ onSubmitMessageAction, onPaperclipClickAction, onDashboardClickAction, theme = "blue", agentName }: InputAreaProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmitMessageAction(text);
    setText("");
  };

  return (
    <div className="relative h-full flex items-center">
      <div className="relative flex w-full items-center">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={agentName ? `Speak to ${agentName}` : "Send a message..."}
          className={cn(
            "h-[22px] min-h-[22px] pr-14 py-0 w-full text-xs resize-none border border-gray-200 rounded-[4px]",
            theme === "blue"
              ? "bg-teal-50 border-teal-200 focus-visible:border-teal-300"
              : "bg-orange-50 border-orange-200 focus-visible:border-orange-300"
          )}
          style={{ lineHeight: '18px' }}
        />
        <div className="absolute right-1.5 flex items-center gap-1.5">
          {onDashboardClickAction && (
            <button
              type="button"
              onClick={onDashboardClickAction}
              className={cn(
                "transition-colors rounded-sm p-0.5 hover:bg-gray-100",
                theme === "blue"
                  ? "text-teal-400 hover:text-teal-600"
                  : "text-orange-400 hover:text-orange-600"
              )}
              aria-label="Show dashboard"
            >
              <BarChart2Icon className="h-2.5 w-2.5" aria-hidden={true} />
            </button>
          )}

          {onPaperclipClickAction && (
            <button
              type="button"
              onClick={onPaperclipClickAction}
              className={cn(
                "transition-colors rounded-sm p-0.5 hover:bg-gray-100",
                theme === "blue"
                  ? "text-teal-400 hover:text-teal-600"
                  : "text-orange-400 hover:text-orange-600"
              )}
              aria-label="Attach file"
            >
              <PaperclipIcon className="h-2.5 w-2.5" aria-hidden={true} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center rounded-sm p-0.5 hover:bg-gray-100 focus:outline-none"
            disabled={!text.trim()}
            aria-label="Send message"
          >
            <SendIcon
              className={cn(
                "h-2.5 w-2.5 cursor-pointer transition-colors",
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
    </div>
  );
}
