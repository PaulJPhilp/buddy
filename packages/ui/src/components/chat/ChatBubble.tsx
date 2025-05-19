import * as React from "react"

export interface ChatBubbleProps {
  role: "user" | "assistant"
  content: React.ReactNode
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  return (
    <div
      className={`w-full flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className={`relative max-w-[75%] px-6 py-0.5 text-xs scale-50 origin-left leading-relaxed shadow-sm ${role === "user" ? "bg-blue-500 text-white rounded-full" : "bg-muted text-muted-foreground rounded-full"}`}
      >
        <div className="px-2 scale-50 origin-left">
          {content}
        </div>
      </div>
    </div>
  )
}
