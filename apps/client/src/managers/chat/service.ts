import { AgentService } from "@services/agentkit";
import { ChatService } from "@services/chat";
import { ChatBridge } from "@services/chatbridge";
import { ConfigService } from "@services/config";
import { Effect, Layer, Ref } from "effect";
import type { ChatManagerApi } from "./api";
import {
  ChatManagerAgentError,
  ChatManagerConversationError,
  ChatManagerInitializationError,
  ChatManagerMessageError,
  ChatManagerOperationError,
  ChatManagerSearchError,
  ChatManagerStateError,
  ChatManagerValidationError,
} from "./errors";
import type {
  AgentId,
  ChatManagerConfig,
  ChatManagerState,
  ChatOperation,
  ConversationFilter,
  ConversationId,
  ConversationState,
  MessageFilter,
  MessageId,
  MessageState,
  SearchOptions,
} from "./types";
import { CHAT_MANAGER_CONSTANTS } from "./types";

export class ChatManager extends Effect.Service<ChatManagerApi>()(
  "ChatManager",
  {
    scoped: Effect.gen(function* () {
      // Create config object (let TypeScript infer the type)
      const config = {
        id: "chat-manager",
        name: "ChatManager",
        autoStart: false,
        autoCleanup: true,
        debugMode: false,
        maxOperations: 1000,
        maxConversations: CHAT_MANAGER_CONSTANTS.MAX_CONVERSATIONS,
        maxMessagesPerConversation:
          CHAT_MANAGER_CONSTANTS.MAX_MESSAGES_PER_CONVERSATION,
        autoArchiveAfterDays: CHAT_MANAGER_CONSTANTS.AUTO_ARCHIVE_AFTER_DAYS,
        enableSearch: true,
        searchIndexSize: CHAT_MANAGER_CONSTANTS.SEARCH_INDEX_SIZE,
        messageRetentionDays: CHAT_MANAGER_CONSTANTS.MESSAGE_RETENTION_DAYS,
        enableMessageHistory: true,
        maxMessageHistorySize: CHAT_MANAGER_CONSTANTS.MAX_MESSAGE_HISTORY_SIZE,
      } as const;

      // Initialize chat manager state without CoreManager dependency
      const initialState: ChatManagerState = {
        isInitialized: false,
        isRunning: false,
        isLoading: false,
        lastUpdated: Date.now(),
        operationCount: 0,
        conversations: {},
        activeConversationId: null,
        messageIndex: {},
        conversationsByAgent: {},
        searchIndex: {},
        operationHistory: [],
        currentOperation: null,
        config,
        stats: {
          totalConversations: 0,
          totalMessages: 0,
          activeConversations: 0,
          archivedConversations: 0,
          lastActivity: null,
        },
      };

      const stateRef = yield* Ref.make(initialState);

      // Helper Functions
      const generateId = (): string => {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      };

      const validateConversationId = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.conversations[conversationId]) {
            return yield* Effect.fail(
              new ChatManagerConversationError({
                message: "Conversation not found",
                conversationId,
                operation: "validateConversationId",
              })
            );
          }
        });

      const validateMessageId = (messageId: MessageId) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          if (!state.messageIndex[messageId]) {
            return yield* Effect.fail(
              new ChatManagerMessageError({
                message: "Message not found",
                messageId,
                operation: "validateMessageId",
              })
            );
          }
        });

      const updateStats = (state: ChatManagerState): ChatManagerState => {
        const conversations = Object.values(state.conversations);
        const activeConversations = conversations.filter(
          (c) => c.status === "active"
        ).length;
        const archivedConversations = conversations.filter(
          (c) => c.isArchived
        ).length;
        const totalMessages = conversations.reduce(
          (sum, c) => sum + c.messageCount,
          0
        );
        const lastActivity = conversations.reduce((latest, c) => {
          return !latest || c.lastActivity > latest ? c.lastActivity : latest;
        }, null as Date | null);

        return {
          ...state,
          stats: {
            totalConversations: conversations.length,
            totalMessages,
            activeConversations,
            archivedConversations,
            lastActivity,
          },
        };
      };

      const recordOperation = (operation: ChatOperation) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => {
            const history = [...state.operationHistory, operation];
            const trimmedHistory = history.slice(
              -CHAT_MANAGER_CONSTANTS.OPERATION_HISTORY_LIMIT
            );
            return updateStats({
              ...state,
              operationHistory: trimmedHistory,
              currentOperation: operation,
              lastUpdated: Date.now(),
            });
          });
        });

      const updateSearchIndex = (conversation: ConversationState) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) => {
            const searchTerms = [
              conversation.title,
              ...conversation.messages.map((m) => m.content),
              ...(conversation.tags || []),
            ];

            const newIndex = { ...state.searchIndex };

            // Add conversation to search index
            for (const term of searchTerms) {
              const words = term.toLowerCase().split(/\s+/);
              for (const word of words) {
                if (word.length > 2) {
                  const existing = newIndex[word] || [];
                  if (!existing.includes(conversation.id)) {
                    newIndex[word] = [...existing, conversation.id];
                  }
                }
              }
            }

            return { ...state, searchIndex: newIndex };
          });
        });

      // State Management
      const getState = () =>
        Effect.gen(function* () {
          return yield* Ref.get(stateRef);
        });

      const setState = (updates: Partial<ChatManagerState>) =>
        Effect.gen(function* () {
          yield* Ref.update(stateRef, (state) =>
            updateStats({
              ...state,
              ...updates,
              lastUpdated: Date.now(),
            })
          );
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerStateError({
                message: "Failed to update state",
                operation: "setState",
                cause,
              })
          )
        );

      const resetState = () =>
        Effect.gen(function* () {
          yield* Ref.set(stateRef, initialState);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerStateError({
                message: "Failed to reset state",
                operation: "resetState",
                cause,
              })
          )
        );

      // Conversation Management
      const startConversation = (agentId: AgentId, initialMessage?: string) =>
        Effect.gen(function* () {
          const conversationId = generateId();
          const now = new Date();
          const nowTimestamp = Date.now();

          const conversation: ConversationState = {
            id: conversationId,
            title: CHAT_MANAGER_CONSTANTS.DEFAULT_CONVERSATION_TITLE,
            status: "active",
            agentId,
            createdAt: now,
            updatedAt: now,
            lastActivity: now,
            messageCount: 0,
            messages: [],
            metadata: {},
            tags: [],
            isArchived: false,
          };

          yield* Ref.update(stateRef, (state) => {
            const agentConversations =
              state.conversationsByAgent[agentId] || [];
            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [conversationId]: conversation,
              },
              conversationsByAgent: {
                ...state.conversationsByAgent,
                [agentId]: [...agentConversations, conversationId],
              },
              activeConversationId: conversationId,
              lastUpdated: nowTimestamp,
            });
          });

          yield* updateSearchIndex(conversation);

          yield* recordOperation({
            type: "start_conversation",
            timestamp: now,
            conversationId,
            agentId,
            parameters: { initialMessage },
          });

          // Send initial message if provided
          if (initialMessage) {
            yield* sendMessage(conversationId, initialMessage);
          }

          return conversationId;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to start conversation",
                operation: "startConversation",
                cause,
              })
          )
        );

      const endConversation = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const now = new Date();
          const nowTimestamp = Date.now();

          yield* Ref.update(stateRef, (state) => {
            const conversation = state.conversations[conversationId];
            const updatedConversation = {
              ...conversation,
              status: "ended" as const,
              updatedAt: now,
            };

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [conversationId]: updatedConversation,
              },
              activeConversationId:
                state.activeConversationId === conversationId
                  ? null
                  : state.activeConversationId,
              lastUpdated: nowTimestamp,
            });
          });

          yield* recordOperation({
            type: "end_conversation",
            timestamp: now,
            conversationId,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to end conversation",
                conversationId,
                operation: "endConversation",
                cause,
              })
          )
        );

      const getConversation = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          return state.conversations[conversationId];
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get conversation",
                conversationId,
                operation: "getConversation",
                cause,
              })
          )
        );

      const getAllConversations = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return Object.values(state.conversations);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get all conversations",
                operation: "getAllConversations",
                cause,
              })
          )
        );

      const getActiveConversation = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.activeConversationId
            ? state.conversations[state.activeConversationId] || null
            : null;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get active conversation",
                operation: "getActiveConversation",
                cause,
              })
          )
        );

      const setActiveConversation = (conversationId: ConversationId | null) =>
        Effect.gen(function* () {
          if (conversationId) {
            yield* validateConversationId(conversationId);
          }

          yield* Ref.update(stateRef, (state) => ({
            ...state,
            activeConversationId: conversationId,
            lastUpdated: Date.now(),
          }));
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to set active conversation",
                conversationId: conversationId || undefined,
                operation: "setActiveConversation",
                cause,
              })
          )
        );

      // Message Management
      const sendMessage = (conversationId: ConversationId, content: string) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const messageId = generateId();
          const now = new Date();
          const nowTimestamp = Date.now();

          const message: MessageState = {
            id: messageId,
            conversationId,
            role: "user",
            content,
            status: "sent",
            timestamp: now,
            metadata: {},
            isEdited: false,
            editHistory: [],
          };

          let updatedConversation: ConversationState;

          yield* Ref.update(stateRef, (state) => {
            const conversation = state.conversations[conversationId];
            updatedConversation = {
              ...conversation,
              messages: [...conversation.messages, message],
              messageCount: conversation.messageCount + 1,
              lastActivity: now,
              updatedAt: now,
            };

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [conversationId]: updatedConversation,
              },
              messageIndex: {
                ...state.messageIndex,
                [messageId]: message,
              },
              lastUpdated: nowTimestamp,
            });
          });

          // Update search index with the new message
          yield* updateSearchIndex(updatedConversation);

          yield* recordOperation({
            type: "send_message",
            timestamp: now,
            conversationId,
            messageId,
            parameters: { content },
          });

          return messageId;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerMessageError({
                message: "Failed to send message",
                conversationId,
                operation: "sendMessage",
                cause,
              })
          )
        );

      const getMessages = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          return state.conversations[conversationId].messages;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerMessageError({
                message: "Failed to get messages",
                conversationId,
                operation: "getMessages",
                cause,
              })
          )
        );

      const getMessage = (messageId: MessageId) =>
        Effect.gen(function* () {
          yield* validateMessageId(messageId);
          const state = yield* Ref.get(stateRef);
          return state.messageIndex[messageId];
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerMessageError({
                message: "Failed to get message",
                messageId,
                operation: "getMessage",
                cause,
              })
          )
        );

      const updateMessage = (
        messageId: MessageId,
        updates: Partial<MessageState>
      ) =>
        Effect.gen(function* () {
          yield* validateMessageId(messageId);
          const now = new Date();
          const nowTimestamp = Date.now();

          let updatedConversation: ConversationState;

          yield* Ref.update(stateRef, (state) => {
            const message = state.messageIndex[messageId];
            const updatedMessage = {
              ...message,
              ...updates,
              timestamp: now,
            };

            const conversation = state.conversations[message.conversationId];
            const updatedMessages = conversation.messages.map((m) =>
              m.id === messageId ? updatedMessage : m
            );
            updatedConversation = {
              ...conversation,
              messages: updatedMessages,
              lastActivity: now,
              updatedAt: now,
            };

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [message.conversationId]: updatedConversation,
              },
              messageIndex: {
                ...state.messageIndex,
                [messageId]: updatedMessage,
              },
              lastUpdated: nowTimestamp,
            });
          });

          // Update search index with the modified message
          yield* updateSearchIndex(updatedConversation);

          yield* recordOperation({
            type: "edit_message",
            timestamp: now,
            messageId,
            parameters: updates,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerMessageError({
                message: "Failed to update message",
                messageId,
                operation: "updateMessage",
                cause,
              })
          )
        );

      const deleteMessage = (messageId: MessageId) =>
        Effect.gen(function* () {
          yield* validateMessageId(messageId);
          const now = new Date();
          const nowTimestamp = Date.now();

          let updatedConversation: ConversationState;

          yield* Ref.update(stateRef, (state) => {
            const message = state.messageIndex[messageId];
            const conversation = state.conversations[message.conversationId];
            const updatedMessages = conversation.messages.filter(
              (m) => m.id !== messageId
            );
            updatedConversation = {
              ...conversation,
              messages: updatedMessages,
              messageCount: conversation.messageCount - 1,
              lastActivity: now,
              updatedAt: now,
            };

            const { [messageId]: _, ...remainingMessages } = state.messageIndex;

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [message.conversationId]: updatedConversation,
              },
              messageIndex: remainingMessages,
              lastUpdated: nowTimestamp,
            });
          });

          // Update search index after deleting the message
          yield* updateSearchIndex(updatedConversation);

          yield* recordOperation({
            type: "delete_message",
            timestamp: now,
            messageId,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerMessageError({
                message: "Failed to delete message",
                messageId,
                operation: "deleteMessage",
                cause,
              })
          )
        );

      // Chat Operations
      const executeOperation = (operation: ChatOperation) =>
        Effect.gen(function* () {
          yield* recordOperation(operation);
          return operation.result;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                message: "Failed to execute operation",
                operation: operation.type,
                cause,
              })
          )
        );

      const getLastOperation = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.currentOperation;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                message: "Failed to get last operation",
                operation: "getLastOperation",
                cause,
              })
          )
        );

      const isOperationInProgress = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.currentOperation !== null;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerOperationError({
                message: "Failed to check operation status",
                operation: "isOperationInProgress",
                cause,
              })
          )
        );

      // Agent Management
      const setConversationAgent = (
        conversationId: ConversationId,
        agentId: AgentId
      ) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const now = new Date();
          const nowTimestamp = Date.now();

          yield* Ref.update(stateRef, (state) => {
            const conversation = state.conversations[conversationId];
            const oldAgentId = conversation.agentId;
            const updatedConversation = {
              ...conversation,
              agentId,
              updatedAt: now,
            };

            // Update agent conversation mapping
            const newAgentConversations =
              state.conversationsByAgent[agentId] || [];
            const updatedAgentMapping = {
              ...state.conversationsByAgent,
              [agentId]: newAgentConversations.includes(conversationId)
                ? newAgentConversations
                : [...newAgentConversations, conversationId],
            };

            // Remove from old agent if needed
            if (oldAgentId && oldAgentId !== agentId) {
              const oldAgentConversations =
                state.conversationsByAgent[oldAgentId] || [];
              updatedAgentMapping[oldAgentId] = oldAgentConversations.filter(
                (id) => id !== conversationId
              );
            }

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [conversationId]: updatedConversation,
              },
              conversationsByAgent: updatedAgentMapping,
              lastUpdated: nowTimestamp,
            });
          });

          yield* recordOperation({
            type: "set_agent",
            timestamp: now,
            conversationId,
            agentId,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerAgentError({
                message: "Failed to set conversation agent",
                conversationId,
                agentId,
                operation: "setConversationAgent",
                cause,
              })
          )
        );

      const getConversationAgent = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          return state.conversations[conversationId].agentId;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerAgentError({
                message: "Failed to get conversation agent",
                conversationId,
                operation: "getConversationAgent",
                cause,
              })
          )
        );

      // Conversation History
      const getConversationHistory = (
        conversationId: ConversationId,
        limit?: number
      ) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          const messages = state.conversations[conversationId].messages;
          return limit ? messages.slice(-limit) : messages;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get conversation history",
                conversationId,
                operation: "getConversationHistory",
                cause,
              })
          )
        );

      const clearConversationHistory = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const now = new Date();
          const nowTimestamp = Date.now();

          let updatedConversation: ConversationState;

          yield* Ref.update(stateRef, (state) => {
            const conversation = state.conversations[conversationId];
            updatedConversation = {
              ...conversation,
              messages: [],
              messageCount: 0,
              lastActivity: now,
              updatedAt: now,
            };

            // Remove messages from index
            const messageIds = conversation.messages.map((m) => m.id);
            const updatedMessageIndex = { ...state.messageIndex };
            for (const id of messageIds) {
              delete updatedMessageIndex[id];
            }

            return updateStats({
              ...state,
              conversations: {
                ...state.conversations,
                [conversationId]: updatedConversation,
              },
              messageIndex: updatedMessageIndex,
              lastUpdated: nowTimestamp,
            });
          });

          // Update search index after clearing messages
          yield* updateSearchIndex(updatedConversation);

          yield* recordOperation({
            type: "clear_history",
            timestamp: now,
            conversationId,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to clear conversation history",
                conversationId,
                operation: "clearConversationHistory",
                cause,
              })
          )
        );

      const exportConversation = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          const conversation = state.conversations[conversationId];

          const exportData = {
            id: conversation.id,
            title: conversation.title,
            status: conversation.status,
            agentId: conversation.agentId,
            createdAt: conversation.createdAt.toISOString(),
            updatedAt: conversation.updatedAt.toISOString(),
            messages: conversation.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp.toISOString(),
              agentId: m.agentId,
            })),
          };

          yield* recordOperation({
            type: "export_conversation",
            timestamp: new Date(),
            conversationId,
          });

          return JSON.stringify(exportData, null, 2);
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to export conversation",
                conversationId,
                operation: "exportConversation",
                cause,
              })
          )
        );

      // Conversation Search
      const searchConversations = (query: string) =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          const searchTerms = query.toLowerCase().split(/\s+/);
          const matchingConversationIds = new Set<ConversationId>();

          for (const term of searchTerms) {
            const conversationIds = state.searchIndex[term] || [];
            for (const id of conversationIds) {
              matchingConversationIds.add(id);
            }
          }

          const results = Array.from(matchingConversationIds)
            .map((id) => state.conversations[id])
            .filter(Boolean)
            .sort(
              (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
            );

          yield* recordOperation({
            type: "search_conversations",
            timestamp: new Date(),
            parameters: { query },
            result: results.length,
          });

          return results;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerSearchError({
                message: "Failed to search conversations",
                query,
                operation: "searchConversations",
                cause,
              })
          )
        );

      const searchMessages = (conversationId: ConversationId, query: string) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          const conversation = state.conversations[conversationId];
          const searchTerms = query.toLowerCase().split(/\s+/);

          const matchingMessages = conversation.messages.filter((message) => {
            const messageText = message.content.toLowerCase();
            return searchTerms.every((term) => messageText.includes(term));
          });

          yield* recordOperation({
            type: "search_messages",
            timestamp: new Date(),
            conversationId,
            parameters: { query },
            result: matchingMessages.length,
          });

          return matchingMessages;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerSearchError({
                message: "Failed to search messages",
                query,
                operation: "searchMessages",
                cause,
              })
          )
        );

      // Conversation Statistics
      const getConversationStats = (conversationId: ConversationId) =>
        Effect.gen(function* () {
          yield* validateConversationId(conversationId);
          const state = yield* Ref.get(stateRef);
          const conversation = state.conversations[conversationId];

          return {
            messageCount: conversation.messageCount,
            lastActivity: conversation.lastActivity,
          };
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get conversation stats",
                conversationId,
                operation: "getConversationStats",
                cause,
              })
          )
        );

      const getAllConversationStats = () =>
        Effect.gen(function* () {
          const state = yield* Ref.get(stateRef);
          return state.stats;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChatManagerConversationError({
                message: "Failed to get all conversation stats",
                operation: "getAllConversationStats",
                cause,
              })
          )
        );

      return {
        getState,
        setState,
        resetState,
        startConversation,
        endConversation,
        getConversation,
        getAllConversations,
        getActiveConversation,
        setActiveConversation,
        sendMessage,
        getMessages,
        getMessage,
        updateMessage,
        deleteMessage,
        executeOperation,
        getLastOperation,
        isOperationInProgress,
        setConversationAgent,
        getConversationAgent,
        getConversationHistory,
        clearConversationHistory,
        exportConversation,
        searchConversations,
        searchMessages,
        getConversationStats,
        getAllConversationStats,
      } satisfies ChatManagerApi;
    }),
    dependencies: [],
  }
) {}
