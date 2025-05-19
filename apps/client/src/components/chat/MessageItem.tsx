"use client";

import { FileIcon } from "lucide-react";
import { cn } from "@ui/lib/utils";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
  attachments?: FileAttachment[];
}

interface MessageItemProps {
  message: Message;
  theme?: "blue" | "rose";
}

export function MessageItem({ message, theme = "blue" }: MessageItemProps) {
  const isUser = message.sender === "user";

  const themeColors = {
    blue: {
      user: "bg-teal-500 text-white",
      assistant: "bg-teal-100 text-teal-900",
    },
    rose: {
      user: "bg-orange-300 text-white",
      assistant: "bg-orange-50 text-orange-800",
    },
  };

  return (
    <div
      className={cn(
        "flex w-full mb-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] flex flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-1.5 py-1 text-[5pt] shadow-sm",
            isUser ? themeColors[theme].user : themeColors[theme].assistant,
          )}
        >
          <p className="whitespace-pre-wrap break-words leading-none text-[5pt]">
            {message.content}
          </p>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {message.attachments.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 px-0.5 py-0.5 rounded bg-background/80 border shadow-sm text-[5pt]",
                  isUser && "flex-row-reverse",
                )}
              >
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[200px] text-foreground text-[5pt]">
                  {file.name}
                </span>
                <span className="text-[5pt] text-muted-foreground shrink-0">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
