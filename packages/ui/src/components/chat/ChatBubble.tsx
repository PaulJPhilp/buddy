import * as React from "react";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  content: React.ReactNode;
  userBubbleColor?: string;
  userTextColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ChatBubble({
  role,
  content,
  userBubbleColor,
  userTextColor,
  primaryColor,
  secondaryColor,
}: ChatBubbleProps) {
  return (
    <div
      className={`w-full flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className="relative max-w-[75%] px-4 py-2 text-xs leading-[1.15] shadow-sm rounded-lg"
        style={{
          backgroundColor: role === "user" ? userBubbleColor : secondaryColor,
          color: role === "user" ? userTextColor : primaryColor
        }}
      >
        {/* Content directly here */}
        {content}
      </div>
    </div>
  );
}
