import * as React from "react";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content: React.ReactNode;
}

export function ChatBubble({
  role,
  content,
}: ChatBubbleProps) {
  const bubbleStyle: React.CSSProperties = {
    backgroundColor: role === "user" ? 'var(--chat-bubble-user-bg)' : 'var(--chat-bubble-agent-bg)',
    color: role === "user" ? 'var(--chat-bubble-user-text)' : 'var(--chat-bubble-agent-text)',
    borderRadius: role === "user" ? 'var(--chat-bubble-user-radius)' : 'var(--chat-bubble-agent-radius)',
  };

  return (
    <div
      className={`w-full flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className="relative max-w-[75%] px-4 py-2 text-xs leading-[1.15] shadow-sm"
        style={bubbleStyle}
      >
        {/* Content directly here */}
        {content}
      </div>
    </div>
  );
}
