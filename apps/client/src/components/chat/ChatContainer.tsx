"use client";

import { ChatApp } from "@/components/ChatApp";
import { useApplyChatContainerStyle } from "@/hooks/chat-style/useApplyChatContainerStyle";
import { ChatAppConfig } from "@/schemas/ChatAppConfigSchema";

function NoChatApps() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">💬</div>
        <h2 className="text-2xl font-bold mb-4">Welcome to Buddy Chat</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          No chat applications are configured yet. Run the setup to create your
          first chat app.
        </p>
        <div className="space-y-3">
          <a
            href="/setup"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            🚀 Run Setup
          </a>
          <div className="text-sm text-muted-foreground">
            This will create a default chat app configuration
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChatContainerProps {
  config: ChatAppConfig;
}

export default function ChatContainer({ config }: ChatContainerProps) {
  console.log("[ChatContainer] Mounted with config:", config);

  // Apply this config's style to this container only
  const containerRef = useApplyChatContainerStyle(config.theme);

  return (
    <div
      ref={containerRef}
      className={`h-full my-2 mx-6 border rounded-lg overflow-hidden border-[var(--color-chat-border)] flex flex-col min-h-0 bg-[var(--color-chat-background)]`}
    >
      <ChatApp config={config} />
    </div>
  );
}
