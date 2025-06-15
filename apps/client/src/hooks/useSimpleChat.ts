/**
 * @file Simple Chat Hook - Replaces the over-engineered chat-instance system
 * @module hooks/useSimpleChat
 */

import { createUserMessage } from "@/services/chat/utils";
import { MdxService } from "@/services/mdx";
import type { Message } from "@/types/chat";
import type { ChatAgentConfig } from "@/types/config";
import { Effect } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatState {
  readonly chatId: string;
  readonly messages: ReadonlyArray<Message>;
  readonly status:
    | "initializing"
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";
  readonly agentName: string;
  readonly isTyping: boolean;
  readonly isRendering: boolean;
  readonly error?: string;
}

export interface ChatAction {
  readonly _tag: "sendMessage";
  readonly text: string;
  readonly attachments?: Array<{ name: string }>;
}

export function useSimpleChat(
  chatId: string,
  agentConfig: ChatAgentConfig,
): {
  chatState: ChatState;
  dispatchAction: (action: ChatAction) => void;
} {
  const [chatState, setChatState] = useState<ChatState>({
    chatId,
    messages: [],
    status: "initializing",
    agentName: agentConfig.name || "Assistant",
    isTyping: false,
    isRendering: false,
  });

  const dispatchAction = useCallback((action: ChatAction) => {
    console.log("[useSimpleChat] Processing action:", action);

    switch (action._tag) {
      case "sendMessage": {
        // Create and add user message immediately
        const userMessage = createUserMessage(action.text, action.attachments);

        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, userMessage],
        }));

        // TODO: Send to agent and handle response
        // For now, just simulate a simple response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            text: `You said: "${action.text}"`,
            role: "assistant",
            timestamp: Date.now(),
          };

          setChatState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
          }));
        }, 1000);
        break;
      }
    }
  }, []);

  return {
    chatState,
    dispatchAction,
  };
}
