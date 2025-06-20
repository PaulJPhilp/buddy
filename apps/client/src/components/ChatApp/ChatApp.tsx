"use client";

import { AppService } from "@/services/app";
import { ChatService } from "@/services/chat";
import { ChatBridge } from "@/services/chat-bridge";
import { ConfigService } from "@/services/config";
import { MdxService } from "@/services/mdx";
import { ToolbarService } from "@/services/toolbar";
import { WebSocketService } from "@/services/websocket";
import type { Message } from "@/types/chat";
import { ChatAppConfig } from "@/types/global";

import {
  useChatLayout,
  useChatService,
  useChatState,
  useServiceLayer,
} from "@/hooks";
import { debugLog } from "@/utils/debugLogger";
import { Effect } from "effect";
import { ExternalLink, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ChatAppShell } from "./ChatAppShell";

export interface ChatAppProps {
  config: ChatAppConfig;
}

// ---
// How ChatApp renders a single turn (Pure Effect Service Pattern)
// 1. User types a prompt in the bottom <input> or clicks the "Send" button.
//    Both handlers call handleSendMessage() which runs an Effect program
//    that calls chatService.sendMessage(text, files).
//
// 2. The Effect program immediately updates the chat state via the ChatService,
//    then calls setChatState() to update React state. Because React is
//    subscribed to that state, the component re-renders right away.
//    ➜ Result: a blue, right-aligned bubble appears in the "Messages Area".
//
// 3. The ChatService starts an Effect that contacts the agent. While waiting it sets
//    `isTyping = true`. When that flag is true, ChatApp shows the
//    three-dot typing indicator just below the last message.
//
// 4. Once the agent's reply arrives, the ChatService appends another message to its
//    internal state and the React component updates via setChatState().
//    React renders again and, because the role is "assistant", the message is
//    shown as a white, left-aligned bubble.
//
// 5. Summary: prompt ➜ handleSendMessage ➜ Effect program ➜ ChatService ➜ setChatState ➜ render.
//    All business logic lives in Effect services, React only handles UI state.
// ---

export function ChatApp({ config }: ChatAppProps) {
  if (!config || !config.id) {
    return (
      <div className="text-red-500">Invalid or missing chat app config.</div>
    );
  }

  // Layout preferences (e.g., panel expansion)
  const { isExpanded, expand, compact } = useChatLayout(config.id);

  const [statusLocal, setStatusLocal] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  // Add file attachment state
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Add current agent state
  const [currentAgentId, setCurrentAgentId] = useState<string>(config.agentId);

  // Build the Effect Layer once per `config.id`
  const { layer, runWithServices } = useServiceLayer([config.id]);

  // Resolve ChatService from the layer
  const chatService = useChatService(layer);

  // Dev-time visibility: log each time we (re)resolve the service.
  debugLog("ChatApp:chatService", chatService);

  // Initialize chat service ONCE per config.id
  useEffect(() => {
    if (!chatService) {
      return;
    }

    let isMounted = true;
    setStatusLocal("connecting");

    const program = Effect.gen(function* () {
      yield* chatService.initialize(config.id);
      const state = yield* chatService.getState();
      if (isMounted) {
        // Convert MessageApi[] to Message[] format
        const messages: Message[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          role: msg.sender,
          timestamp: msg.timestamp,
          attachments: msg.attachments,
          metadata: msg.metadata,
        }));
        setStatusLocal("connected");
      }
    });

    runWithServices(program).catch((error) => {
      console.error("[ChatApp] Initialization error:", error);
      setStatusLocal("error");
    });

    return () => {
      isMounted = false;
    };
  }, [chatService, runWithServices, config.id]);

  // Send message using the connected chatService
  const handleSendMessage = useCallback(
    (text: string, files?: File[]) => {
      if (!chatService) {
        console.error(
          "[ChatApp] Cannot send message: chatService not available",
        );
        return;
      }

      if (statusLocal !== "connected") {
        console.error(
          "[ChatApp] Cannot send message: not connected (status:",
          statusLocal,
          ")",
        );
        return;
      }

      // Use the chatService instance directly without re-providing services
      Effect.runPromise(
        chatService.sendMessage(text, files).pipe(
          Effect.flatMap(() => chatService.getState()),
          Effect.tap((state) => {
            // Convert MessageApi[] to Message[] format
            const messages: Message[] = state.messages.map((msg) => ({
              id: msg.id,
              text: msg.text,
              role: msg.sender,
              timestamp: msg.timestamp,
              attachments: msg.attachments,
              metadata: msg.metadata,
            }));
            setStatusLocal("connected");
          }),
        ),
      ).catch((error) => {
        console.error("[ChatApp] Send message error:", error);
        setStatusLocal("error");
      });
    },
    [chatService, statusLocal],
  );

  // Clear chat using the connected chatService
  const handleClearChat = useCallback(() => {
    if (!chatService) {
      return;
    }
    Effect.runPromise(chatService.clearHistory()).catch(() => {
      /* silent */
    });
  }, [chatService]);

  const handleExpand = useCallback(() => {
    expand();
  }, [expand]);

  const handleCompact = useCallback(() => {
    compact();
  }, [compact]);

  const handleClose = useCallback(() => {
    // Dispatch remove chat app event
    window.dispatchEvent(
      new CustomEvent("buddy:removeChatApp", { detail: config.id }),
    );
  }, [config.id]);

  // Implement agent switching
  const handleAgentChange = useCallback(
    (agentId: string) => {
      if (!chatService || agentId === currentAgentId) {
        return;
      }

      console.log(
        `[ChatApp] Switching agent from ${currentAgentId} to ${agentId}`,
      );
      setStatusLocal("connecting");

      const previousAgentId = currentAgentId;
      setCurrentAgentId(agentId);

      // Use switchAgent method
      const program = Effect.gen(function* () {
        yield* chatService.switchAgent(agentId);
        const state = yield* chatService.getState();
        console.log(`[ChatApp] Agent switched successfully to ${agentId}`);
        setStatusLocal("connected");
      });

      runWithServices(program).catch((error) => {
        console.error(`[ChatApp] Agent switch error:`, error);
        setStatusLocal("error");
        // Revert to previous agent on error
        setCurrentAgentId(previousAgentId);
      });
    },
    [chatService, currentAgentId, runWithServices],
  );

  // File attachment handlers
  const handleAddAttachments = useCallback((newFiles: File[]) => {
    console.log(
      "[ChatApp] Adding attachments:",
      newFiles.map((f) => f.name),
    );
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveAttachment = useCallback((fileToRemove: File) => {
    console.log("[ChatApp] Removing attachment:", fileToRemove.name);
    setAttachedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  // Settings handler
  const handleSettings = useCallback(() => {
    console.log("[ChatApp] Opening settings for chat:", config.id);
    // Dispatch settings event for workspace to handle
    window.dispatchEvent(
      new CustomEvent("buddy:openChatSettings", {
        detail: {
          chatId: config.id,
          agentId: currentAgentId,
          config: config,
        },
      }),
    );
  }, [config, currentAgentId]);

  // Removed manual polling thanks to reactive stateStream

  const chatState = useChatState(chatService);

  const agentsList = [
    {
      id: config.agentId,
      name: config.agentId,
      isActive: currentAgentId === config.agentId,
    },
    // Add more available agents
    {
      id: "business-agent",
      name: "Business Assistant",
      isActive: currentAgentId === "business-agent",
    },
    {
      id: "social-agent",
      name: "Social Assistant",
      isActive: currentAgentId === "social-agent",
    },
  ];

  const ready = chatService !== null && statusLocal === "connected";

  return (
    <ChatAppShell
      config={config}
      chatState={chatState}
      status={statusLocal}
      isExpanded={isExpanded}
      onExpand={handleExpand}
      onCompact={handleCompact}
      onClose={handleClose}
      onClear={handleClearChat}
      onSend={handleSendMessage}
      onSettings={handleSettings}
      agents={agentsList}
      selectedAgentId={currentAgentId}
      onSelectedAgentChange={handleAgentChange}
      attachedFiles={attachedFiles}
      onAddAttachments={handleAddAttachments}
      onRemoveAttachment={handleRemoveAttachment}
      inputDisabled={!ready}
    />
  );
}
