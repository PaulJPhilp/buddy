import { useMachine } from "@xstate/react";
import { useCallback, useEffect, useMemo } from "react";
import { fromPromise } from "xstate";
import { createChatMachine } from "../machines/chatMachine";
import type { ProtocolMessage } from "../types/chat.types";

interface UseChatMachineProps {
  initialMessages?: ProtocolMessage[];
  onSendMessage?: (content: string) => Promise<ProtocolMessage>;
  onMessageReceived?: (message: ProtocolMessage) => void;
}

export const useChatMachine = ({
  initialMessages = [],
  onSendMessage,
  onMessageReceived,
}: UseChatMachineProps = {}) => {
  const [state, send] = useMachine(
    createChatMachine({
      messages: initialMessages,
    }).provide({
      actors: {
        sendMessage: fromPromise(async ({ input, self }) => {
          // In XState v5, we need to access the event differently
          // The event that triggered this actor is passed through the machine
          const snapshot = self.getSnapshot();
          // We need to handle the case where we don't have the event info
          const content = input?.content;
          if (!content) {
            throw new Error("No content provided for sendMessage actor");
          }

          if (onSendMessage) {
            return onSendMessage(content);
          }

          // Default implementation if no handler is provided
          return new Promise<ProtocolMessage>((resolve) => {
            setTimeout(() => {
              resolve({
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: `Echo: ${content}`,
                timestamp: new Date().toISOString(),
                metadata: {},
              });
            }, 500);
          });
        }),
      },
      actions: {
        onMessageSent: ({ event }) => {
          // Add null check for event and ensure it has the correct type
          if (!event || event.type !== "xstate.done.actor.sendMessage") return;
          // Check if output exists before using it
          if (!event.output) return;

          const message = event.output as ProtocolMessage;
          if (onMessageReceived) {
            onMessageReceived(message);
          }
        },
      },
    }),
  );

  const sendMessage = useCallback(
    (content: string) => {
      send({ type: "SEND_MESSAGE", content });
    },
    [send],
  );

  const receiveMessage = useCallback(
    (message: ProtocolMessage) => {
      send({ type: "MESSAGE_RECEIVED", message });
    },
    [send],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      send({ type: "SET_TYPING", isTyping });
    },
    [send],
  );

  const clearError = useCallback(() => {
    send({ type: "CLEAR_ERROR" });
  }, [send]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!state.context.error) return;

    const timer = setTimeout(() => {
      clearError();
    }, 5000);

    return () => clearTimeout(timer);
  }, [state.context.error, clearError]);

  // Convert state.value to a string to avoid infinite recursion
  // This is crucial for XState v5 compatibility
  const status = useMemo(() => {
    if (typeof state.value === "string") {
      return state.value;
    }
    return JSON.stringify(state.value);
  }, [state.value]);

  // Memoize each context value individually to prevent unnecessary re-renders
  const messages = useMemo(
    () => state.context.messages,
    [state.context.messages],
  );
  const error = useMemo(() => state.context.error, [state.context.error]);
  const isTyping = useMemo(
    () => state.context.isTyping,
    [state.context.isTyping],
  );

  // Return a memoized object with all values
  return useMemo(
    () => ({
      messages,
      error,
      isTyping,
      status,
      sendMessage,
      receiveMessage,
      setTyping,
      clearError,
    }),
    [
      messages,
      error,
      isTyping,
      status,
      sendMessage,
      receiveMessage,
      setTyping,
      clearError,
    ],
  );
};
