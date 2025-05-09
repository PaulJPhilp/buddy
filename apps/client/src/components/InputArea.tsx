"use client";

import { BarChart2Icon, PaperclipIcon, SendIcon } from "lucide-react";
import { useState } from "react";
import { Textarea } from "../../../../src/components/components/ui/textarea";
import { cn } from "../utils/cn";

interface InputAreaProps {
  onSubmitMessage: (content: string) => void;
  onPaperclipClick?: () => void;
  onDashboardClick?: () => void;
  theme?: "blue" | "rose";
}

export function InputArea({ onSubmitMessage, onPaperclipClick, onDashboardClick, theme = "blue" }: InputAreaProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmitMessage(text);
    setText("");
  };

  return (
    <div className="relative flex-1 flex flex-col px-[5px]">
      <div className="relative flex items-center justify-center w-full mx-auto" style={{ height: '10px' }}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Send a message..."
          className={cn(
            "min-h-[10px] max-h-[10px] pl-2 pr-12 py-0 w-full text-[8px] overflow-hidden resize-none border rounded-sm",
            theme === "blue"
              ? "bg-teal-50 border-teal-200"
              : "bg-orange-50 border-orange-200"
          )}
          style={{ height: '10px', lineHeight: '1', paddingTop: '0', paddingBottom: '0' }}
        />        <div className="absolute right-1 flex items-center gap-1" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          {onDashboardClick && (
            <button
              type="button"
              onClick={onDashboardClick}
              className={cn(
                "transition-colors",
                theme === "blue"
                  ? "text-teal-400 hover:text-teal-600"
                  : "text-orange-400 hover:text-orange-600"
              )}
              aria-label="Show dashboard"
            >
              <BarChart2Icon className="h-1.5 w-1.5" aria-hidden={true} />
            </button>
          )}

          {onPaperclipClick && (
            <button
              type="button"
              onClick={onPaperclipClick}
              className={cn(
                "transition-colors",
                theme === "blue"
                  ? "text-teal-400 hover:text-teal-600"
                  : "text-orange-400 hover:text-orange-600"
              )}
              aria-label="Attach file"
            >
              <PaperclipIcon className="h-1.5 w-1.5" aria-hidden={true} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center justify-center focus:outline-none"
            disabled={!text.trim()}
            aria-label="Send message"
          >
            <SendIcon
              className={cn(
                "h-1.5 w-1.5 cursor-pointer transition-colors",
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
