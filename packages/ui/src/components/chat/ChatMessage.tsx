import * as React from "react"

export interface ChatMessageProps {
  role: "user" | "assistant"
  content: React.ReactNode
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={`flex w-full gap-2 my-2 ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${role === "user" ? "bg-blue-500 text-white rounded-br-md" : "bg-gray-100 text-gray-900 rounded-bl-md"}`}
      >
        {content}
        {/* Bubble tail */}
        {role === "user" ? (
          <span
            className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "10px solid #3b82f6",
            }}
          />
        ) : (
          <span
            className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderRight: "10px solid #e5e7eb",
            }}
          />
        )}
      </div>
    </div>
  )
}
