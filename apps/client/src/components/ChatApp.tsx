"use client";

import { useChatInstance } from "@/hooks/chat-instance"
import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema"
import { useEffect, useState } from "react"

export interface ChatAppProps {
  config: ChatAppConfig
}

export function ChatApp({ config }: ChatAppProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // This is the proper way - use the chat instance hook that bridges Effect and React
  const chatInstance = useChatInstance({
    chatId: config.id,
    agentId: config.agentId,
    // TODO: Add other config properties as needed by useChatInstance
  })

  useEffect(() => {
    // Simulate loading time for now
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <div className="text-lg font-semibold">Loading App: {config.name}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-lg font-medium">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // TODO: Use chatInstance state to render the actual chat interface
  // The chatInstance hook provides all the chat functionality through xState stores
  return (
    <div className="h-full w-full p-4">
      <h1 className="text-2xl font-bold mb-4">{config.name}</h1>
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Chat Interface</h2>
        <p className="text-sm text-muted-foreground">
          This ChatApp is now properly using useChatInstance hook.
          The hook bridges Effect services through xState stores to React.
        </p>
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p><strong>Config:</strong> {JSON.stringify(config, null, 2)}</p>
          <p className="mt-2"><strong>Chat Instance:</strong> {chatInstance ? 'Connected' : 'Initializing...'}</p>
        </div>
      </div>
    </div>
  )
}
