"use client";

import { ChatApp } from "@/components/ChatApp"
import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema"
import { useEffect, useState } from "react"

function NoChatApps() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-medium">No Active Chats</h2>
        <p className="text-sm text-muted-foreground">
          There are no chat applications configured yet.
        </p>
      </div>
    </div>
  )
}

export default function ChatContainer() {
  const [apps, setApps] = useState<readonly ChatAppConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Replace with proper React hook that bridges to Effect services
    // For now, create mock data to demonstrate the layout
    const mockApps: ChatAppConfig[] = [
      {
        id: "default-chat",
        name: "Default Chat",
        agentId: "default-agent",
        toolbarId: "default-toolbar", 
        themeId: "default-theme"
      }
    ]
    
    setTimeout(() => {
      setApps(mockApps)
      setIsLoading(false)
    }, 100)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <div className="text-lg font-semibold">Loading Chats...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-lg font-medium">Error Loading Chats</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (apps.length === 0) {
    return <NoChatApps />
  }

  // For now, we will just render the first app.
  // In the future, we might add a way to switch between apps or render multiple apps.
  const app = apps[0]

  return (
    <div className="h-full w-full">
      <ChatApp config={app} />
    </div>
  )
}
