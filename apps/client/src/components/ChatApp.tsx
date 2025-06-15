"use client";

import { useSimpleChat } from "@/hooks/useSimpleChat";
import { AgentService } from "@/services/agent";
import { AppService } from "@/services/app";
import { ToolbarService } from "@/services/toolbar";
import { ChatAppConfig } from "@/types/global";
import { Effect, Layer } from "effect";
import { useEffect, useState } from "react";
import ChatArea from "./ChatArea";
import { HeaderBar } from "./HeaderBar";
import UserArea from "./UserArea";

export interface ChatAppProps {
  config: ChatAppConfig;
}

// Create service layer outside component (static)
const serviceLayer = Layer.mergeAll(
  AppService.Default,
  AgentService.Default,
  ToolbarService.Default,
);

// ---
// How ChatApp renders a single turn
// 1. User types a prompt in the bottom <input> or clicks the "Send" button.
//    Both handlers dispatch the action:
//      dispatchAction({ _tag: "sendMessage", text: messageText })
//    which is provided by the `useChatInstance` hook.
//
// 2. Inside `useChatInstance` the action immediately pushes a new message on
//    its internal store with `{ id, role: "user", text }`. Because React is
//    subscribed to that store, the component re-renders right away.
//    ➜ Result: a blue, right-aligned bubble appears in the "Messages Area".
//
// 3. The hook starts an Effect that contacts the agent. While waiting it sets
//    `chatState.isTyping = true`. When that flag is true, ChatApp shows the
//    three-dot typing indicator just below the last message.
//
// 4. Once the agent's reply arrives, the hook appends another message to the
//    store with `{ id, role: "assistant", text }` and resets `isTyping`.
//    React renders again and, because the role is "assistant", the message is
//    shown as a white, left-aligned bubble.
//
// 5. Summary: prompt ➜ dispatchAction ➜ store update ➜ render (user bubble),
//    then agent reply ➜ store update ➜ render (assistant bubble). No direct
//    DOM manipulation is needed; React state changes handle everything.
// ---

export function ChatApp({ config }: ChatAppProps) {
  console.log("[ChatApp] Received config:", config);
  if (!config || !config.id) {
    return (
      <div className="text-red-500">Invalid or missing chat app config.</div>
    );
  }
  console.log("[ChatApp] Using 3-component architecture");

  // State for agent configuration including prompt
  const [agentConfig, setAgentConfig] = useState<{
    agentId: string;
    initialAgentName: string;
    prompt?: string;
  }>({
    agentId: config.agentId,
    initialAgentName: config.name,
  });

  // Always call the hook (React rules), but handle loading state
  const { chatState, dispatchAction } = useSimpleChat(
    config.id, // chatId as first parameter
    agentConfig,
  );

  // Simple debug to track messages
  console.log(`[ChatApp] Messages count: ${chatState?.messages?.length || 0}`);

  const [agents, setAgents] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      isActive?: boolean;
    }>
  >([
    {
      id: config.agentId,
      name: config.agentId,
      isActive: true,
    },
  ]);

  useEffect(() => {
    // Fetch agent info for better naming and prompt
    Effect.runPromise(
      Effect.gen(function* () {
        const agentService = yield* AgentService;
        const agent = yield* agentService.getById(config.agentId);
        return agent;
      }).pipe(Effect.provide(serviceLayer)),
    ).then((agent) => {
      if (agent) {
        // Update agent config with prompt
        setAgentConfig({
          agentId: agent.id,
          initialAgentName: agent.initialAgentName,
          prompt: agent.prompt,
        });

        setAgents([
          {
            id: agent.id,
            name: agent.initialAgentName,
            isActive: true,
          },
        ]);
      }
    });
  }, [config.agentId]);

  const handleSendMessage = (text: string, files?: File[]) => {
    console.log("[ChatApp] Sending message:", { text, files });
    dispatchAction({
      _tag: "sendMessage",
      text: text,
    });
  };

  const handleAgentChange = (agentId: string) => {
    console.log("[ChatApp] Agent changed:", agentId);
    // TODO: Implement agent switching
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--color-chat-background)",
        color: "var(--color-chat-foreground)",
      }}
    >
      {/* Header Bar */}
      <HeaderBar
        title={config.name}
        isSelected={true}
        statusInfo={{
          agentStatus: {
            state: chatState.isTyping
              ? "thinking"
              : chatState.isRendering
                ? "paused"
                : "idle",
            details: `${chatState.messages.length} messages`,
          },
        }}
      />

      {/* Chat Area */}
      <ChatArea
        messages={chatState.messages}
        isTyping={chatState.isTyping}
        isRendering={chatState.isRendering}
        className="flex-1"
      />

      {/* User Area */}
      <UserArea
        onSendMessage={handleSendMessage}
        agents={agents}
        selectedAgent={config.agentId}
        onSelectedAgentChange={handleAgentChange}
        currentAttachments={[]}
        onRemoveAttachment={() => {}}
        onAddAttachments={() => {}}
        disabled={chatState.status === "error"}
      />
    </div>
  );
}
