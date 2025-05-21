import { AgentRuntimeService } from "@/services/agent-runtime/AgentRuntimeService"; // Mock might not need full runtime
import { Effect, Ref } from "effect";
import type {
  ChatHistoryPage,
  ChatState,
  ChatStateApi,
  FileAttachment,
  Message,
  MessageApi,
  MessageValidation,
} from "./types";

// A simple counter for generating unique IDs for mock messages
let mockMessageCounter = 0;

export class MockChatService extends Effect.Service<ChatStateApi>()(
  "MockChatService",
  {
    effect: Effect.gen(function* () {
      // Mock state using Ref
      const mockStateRef = yield* Ref.make<ChatState>({
        id: "mock-chat",
        messages: [],
        isTyping: false,
        metadata: {
          messageCount: 0,
          totalAttachments: 0,
        },
      });

      const service: ChatStateApi = {
        get state() {
          return Effect.runSync(Ref.get(mockStateRef));
        },

        getState: () => Effect.map(Ref.get(mockStateRef), (state) => state),

        setState: (newState: ChatState) =>
          Effect.map(Ref.set(mockStateRef, newState), () => newState),

        sendMessage: (message: MessageApi) =>
          Effect.gen(function* () {
            const currentState = yield* Ref.get(mockStateRef);
            const processedAttachments = message.attachments || [];

            const userMessage: Message = {
              id: `mock-msg-user-${Date.now()}-${mockMessageCounter++}`,
              text: message.text,
              role: "user",
              timestamp: Date.now(),
              attachments: processedAttachments,
              metadata: message.metadata,
            };

            // Simulate assistant response
            const assistantMessage: Message = {
              id: `mock-msg-assistant-${Date.now()}-${mockMessageCounter++}`,
              text: `Mock response to: "${message.text}"`,
              role: "assistant",
              timestamp: Date.now(),
            };

            const newMessages = [
              ...currentState.messages,
              userMessage,
              assistantMessage,
            ];

            yield* Ref.update(mockStateRef, (state) => ({
              ...state,
              messages: newMessages,
              isTyping: false,
              metadata: {
                ...state.metadata,
                messageCount: newMessages.length,
                lastMessageAt: Date.now(),
                totalAttachments:
                  (state.metadata?.totalAttachments || 0) +
                  processedAttachments.length,
              },
            }));
            yield* Effect.logInfo(
              `MockChatService: sendMessage called with text: ${message.text}`,
            );
          }) as Effect.Effect<void, Error, never>,

        setTyping: (isTyping: boolean) =>
          Effect.map(
            Ref.modify(mockStateRef, (state) => {
              const newState = { ...state, isTyping };
              return [newState, newState];
            }),
            (state) => state,
          ),

        validateMessage: (text: string): MessageValidation => ({
          isValid: text.length > 0 && text.length <= 2000, // Basic mock validation
          errors:
            text.length > 0 && text.length <= 2000
              ? []
              : ["Message length must be between 1 and 2000 characters"],
        }),

        loadMoreHistory: () =>
          Effect.gen(function* () {
            const currentState = yield* Ref.get(mockStateRef);
            return {
              messages: currentState.messages,
              hasMore: false,
            };
          }) as Effect.Effect<ChatHistoryPage, Error, never>,

        clearHistory: () =>
          Effect.gen(function* () {
            yield* Effect.logInfo("MockChatService: clearHistory called");
            yield* Ref.update(mockStateRef, (state) => ({
              ...state,
              messages: [],
              metadata: {
                messageCount: 0,
                lastMessageAt: undefined,
                totalAttachments: 0,
              },
            }));
          }) as Effect.Effect<void, Error, never>,
      };
      return service;
    }),
    // MockChatService might not need the full AgentRuntimeService,
    // or it could use a mock version of it if necessary.
    dependencies: [AgentRuntimeService.Default],
  },
) {}
