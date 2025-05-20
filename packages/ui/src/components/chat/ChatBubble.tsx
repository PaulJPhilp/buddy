import * as React from "react";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content: React.ReactNode;
  userBubbleColor?: string;
  userTextColor?: string;
}

export function ChatBubble({ role, content, userBubbleColor, userTextColor }: ChatBubbleProps) {
  return (
    <div
      className={`w-full flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[75%] px-4 py-2 text-sm leading-relaxed shadow-sm ${role === "user" ? `${userBubbleColor || 'bg-blue-500'} ${userTextColor || 'text-white'} rounded-full` : 'bg-muted text-muted-foreground rounded-full'}`}
      >
        {/* Content directly here */}
        {content}
      </div>
    </div>
  );
}
