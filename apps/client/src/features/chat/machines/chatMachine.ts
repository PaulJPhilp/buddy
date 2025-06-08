import { assign, createMachine } from "xstate";
import type { ProtocolMessage } from "../types/chat.types";

export interface ChatContext {
  messages: ProtocolMessage[];
  error: Error | null;
  lastMessageId?: string;
  isTyping: boolean;
}

type ChatEvent =
  | { type: "SEND_MESSAGE"; content: string }
  | { type: "MESSAGE_RECEIVED"; message: ProtocolMessage }
  | { type: "MESSAGE_SENT"; message: ProtocolMessage }
  | { type: "SET_TYPING"; isTyping: boolean }
  | { type: "ERROR"; error: Error }
  | { type: "CLEAR_ERROR" };

export const createChatMachine = (
  initialContext: Partial<ChatContext> = {},
) => {
  return createMachine(
    {
      id: "chat",
      initial: "idle",
      context: {
        messages: [],
        error: null,
        isTyping: false,
        ...initialContext,
      },
      states: {
        idle: {
          on: {
            SEND_MESSAGE: {
              target: "sending",
              actions: [
                assign({
                  messages: ({ context, event }) => {
                    if (event.type !== "SEND_MESSAGE") return context.messages;
                    const newMessage: ProtocolMessage = {
                      id: `user-${Date.now()}`,
                      role: "user" as const,
                      content: event.content,
                      timestamp: new Date().toISOString(),
                      metadata: {},
                      type: "USER_MESSAGE",
                      isComplete: true,
                    };
                    return [...context.messages, newMessage];
                  },
                  isTyping: () => true,
                }),
              ],
            },
            MESSAGE_RECEIVED: {
              actions: [
                assign({
                  messages: ({ context, event }) => {
                    if (event.type !== "MESSAGE_RECEIVED")
                      return context.messages;
                    return [...context.messages, event.message];
                  },
                  lastMessageId: ({ event }) => {
                    if (event.type !== "MESSAGE_RECEIVED") return undefined;
                    return event.message.id;
                  },
                  isTyping: () => false,
                }),
              ],
            },
            SET_TYPING: {
              actions: [
                assign({
                  isTyping: ({ event }) => {
                    if (event.type !== "SET_TYPING") return false;
                    return event.isTyping;
                  },
                }),
              ],
            },
          },
        },
        sending: {
          invoke: {
            src: "sendMessage",
            onDone: {
              target: "idle",
              actions: ["onMessageSent"],
            },
            onError: {
              target: "error",
              actions: [
                assign({
                  error: ({ event }) => {
                    if (!("data" in event)) return null;
                    return event.data as Error;
                  },
                  isTyping: () => false,
                }),
              ],
            },
          },
        },
        error: {
          on: {
            CLEAR_ERROR: {
              target: "idle",
              actions: [
                assign({
                  error: () => null,
                  isTyping: () => false,
                }),
              ],
            },
            SEND_MESSAGE: {
              target: "sending",
              actions: [
                assign({
                  error: () => null,
                  messages: ({ context, event }) => {
                    if (event.type !== "SEND_MESSAGE") return context.messages;
                    return [
                      ...context.messages,
                      {
                        id: `user-${Date.now()}`,
                        role: "user" as const,
                        content: event.content,
                        timestamp: new Date().toISOString(),
                        metadata: {},
                        type: "USER_MESSAGE",
                        isComplete: true,
                      },
                    ];
                  },
                  isTyping: () => true,
                }),
              ],
            },
          },
        },
      },
    },
    {
      actions: {
        // Add proper type checking and null handling for events
        onMessageSent: assign(({ event }) => {
          // Make sure event exists and has output property
          if (!event || !("output" in event) || !event.output) {
            return { isTyping: false };
          }

          return {
            lastMessageId: event.output?.id,
            isTyping: false,
          };
        }),
      },
    },
  );
};
